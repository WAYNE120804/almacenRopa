import { Prisma } from '../../lib/prisma-client';

import { AppError } from '../../lib/app-error';
import { hashPassword } from '../../lib/password';
import { getPrisma } from '../../lib/prisma';
import { RolUsuario } from '../../lib/prisma-client';
import { resolveVendorAccessScope } from '../auth/auth.scope';
import { normalizeLoginIdentifier } from '../auth/auth.utils';
import type { VendedorPayload } from './vendedor.schemas';
import type { VendedorAccessPayload } from './vendedor.schemas';

const vendedorListSelect = {
  id: true,
  nombre: true,
  telefono: true,
  documento: true,
  direccion: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      rifas: true,
      movimientos: true,
      usuarioScopes: true,
    },
  },
} satisfies Prisma.VendedorSelect;

const vendedorDetailInclude = {
  usuarioScopes: {
    select: {
      id: true,
      createdAt: true,
      usuario: {
        select: {
          id: true,
          nombre: true,
          email: true,
          rol: true,
          activo: true,
        },
      },
      rifaVendedor: {
        select: {
          id: true,
          rifaId: true,
        },
      },
    },
    orderBy: [
      {
        rifaVendedorId: 'asc',
      },
      {
        createdAt: 'asc',
      },
    ],
  },
  rifas: {
    select: {
      id: true,
      comisionPct: true,
      precioCasa: true,
      saldoActual: true,
      rifa: {
        select: {
          id: true,
          nombre: true,
          estado: true,
        },
      },
    },
    orderBy: {
      rifa: {
        createdAt: 'desc',
      },
    },
  },
  _count: {
    select: {
      rifas: true,
      movimientos: true,
      usuarioScopes: true,
    },
  },
} satisfies Prisma.VendedorInclude;

function isPaginaWebVendedor(nombre: string) {
  return nombre.trim().toUpperCase() === 'PAGINA WEB';
}

function validateAutomaticAccessData(payload: VendedorPayload) {
  if (isPaginaWebVendedor(payload.nombre)) {
    return;
  }

  if (!payload.documento) {
    throw new AppError(
      'Para crear acceso automatico del vendedor debes registrar el documento.',
      400
    );
  }

  if (!payload.telefono) {
    throw new AppError(
      'Para crear acceso automatico del vendedor debes registrar el telefono.',
      400
    );
  }
}

function prismaClient() {
  const prisma = getPrisma();

  if (!prisma) {
    throw new AppError('DATABASE_URL no esta configurado en el backend.', 500);
  }

  return prisma;
}

export async function listVendedores(authUser?: Express.Request['authUser']) {
  const scope = await resolveVendorAccessScope(authUser);

  return prismaClient().vendedor.findMany({
    where: {
      ...(scope.restricted ? { id: { in: scope.vendedorIds } } : {}),
    },
    select: vendedorListSelect,
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function getVendedorById(id: string, authUser?: Express.Request['authUser']) {
  const scope = await resolveVendorAccessScope(authUser);
  const vendedor = await prismaClient().vendedor.findUnique({
    where: { id },
    include: vendedorDetailInclude,
  });

  if (!vendedor) {
    throw new AppError('Vendedor no encontrado.', 404);
  }

  if (scope.restricted && !scope.vendedorIds.includes(id)) {
    throw new AppError('No tienes acceso a este vendedor.', 403, {
      errorCode: 'SCOPE_FORBIDDEN',
    });
  }

  return vendedor;
}

export async function createVendedor(payload: VendedorPayload) {
  validateAutomaticAccessData(payload);
  const prisma = prismaClient();

  return prisma.$transaction(async (tx) => {
    const vendedor = await tx.vendedor.create({
      data: payload,
    });

    if (!isPaginaWebVendedor(payload.nombre)) {
      const loginIdentifier = normalizeLoginIdentifier(payload.documento!);
      const existingUsuario = await tx.usuario.findUnique({
        where: { email: loginIdentifier },
        select: { id: true },
      });

      if (existingUsuario) {
        throw new AppError(
          'Ya existe un usuario con ese documento. No se pudo crear el acceso automatico del vendedor.',
          409
        );
      }

      const usuario = await tx.usuario.create({
        data: {
          nombre: payload.nombre,
          email: loginIdentifier,
          password: hashPassword(payload.telefono!),
          rol: RolUsuario.VENDEDOR,
          activo: true,
        },
      });

      await tx.usuarioVendedorScope.create({
        data: {
          usuarioId: usuario.id,
          vendedorId: vendedor.id,
        },
      });
    }

    return tx.vendedor.findUniqueOrThrow({
      where: { id: vendedor.id },
      include: vendedorDetailInclude,
    });
  });
}

export async function updateVendedor(id: string, payload: VendedorPayload) {
  await getVendedorById(id);

  return prismaClient().vendedor.update({
    where: { id },
    data: payload,
    include: vendedorDetailInclude,
  });
}

export async function deleteVendedor(id: string) {
  const prisma = prismaClient();
  const vendedor = await getVendedorById(id);

  if (
    vendedor._count.rifas > 0 ||
    vendedor._count.movimientos > 0 ||
    vendedor._count.usuarioScopes > 0
  ) {
    throw new AppError(
      'El vendedor no se puede eliminar porque ya tiene rifas, movimientos o accesos asociados.',
      409
    );
  }

  await prisma.vendedor.delete({
    where: { id },
  });
}

export async function upsertVendedorAccess(
  id: string,
  payload: VendedorAccessPayload
) {
  const prisma = prismaClient();
  const vendedor = await getVendedorById(id);

  if (isPaginaWebVendedor(vendedor.nombre)) {
    throw new AppError(
      'PAGINA WEB es un canal especial. Su acceso debe administrarse desde Usuarios.',
      409
    );
  }

  const normalizedEmail = normalizeLoginIdentifier(payload.email);

  const primaryScopedUser = vendedor.usuarioScopes.find(
    (scope) => scope.usuario?.id && !scope.rifaVendedor?.id
  )?.usuario;
  const fallbackScopedUser = vendedor.usuarioScopes.find((scope) => scope.usuario?.id)?.usuario;
  const targetUser = primaryScopedUser || fallbackScopedUser || null;

  const conflictingUser = await prisma.usuario.findUnique({
    where: {
      email: normalizedEmail,
    },
    select: {
      id: true,
    },
  });

  if (conflictingUser && conflictingUser.id !== targetUser?.id) {
    throw new AppError(
      'Ya existe otro usuario con ese identificador.',
      409
    );
  }

  const usuario = await prisma.$transaction(async (tx) => {
    let persistedUser = targetUser
      ? await tx.usuario.update({
          where: {
            id: targetUser.id,
          },
          data: {
            nombre: payload.nombre,
            email: normalizedEmail,
            password: hashPassword(payload.password),
            rol: RolUsuario.VENDEDOR,
            activo: true,
          },
        })
      : await tx.usuario.create({
          data: {
            nombre: payload.nombre,
            email: normalizedEmail,
            password: hashPassword(payload.password),
            rol: RolUsuario.VENDEDOR,
            activo: true,
          },
        });

    const existingDirectScope = await tx.usuarioVendedorScope.findFirst({
      where: {
        usuarioId: persistedUser.id,
        vendedorId: vendedor.id,
      },
      select: {
        id: true,
      },
    });

    if (!existingDirectScope) {
      await tx.usuarioVendedorScope.create({
        data: {
          usuarioId: persistedUser.id,
          vendedorId: vendedor.id,
        },
      });
    }

    return tx.usuario.findUniqueOrThrow({
      where: {
        id: persistedUser.id,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        activo: true,
      },
    });
  });

  return {
    vendedorId: vendedor.id,
    vendedorNombre: vendedor.nombre,
    usuario,
  };
}
