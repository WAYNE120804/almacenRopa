import { AppError } from '../../lib/app-error';
import { RolUsuario } from '../../lib/prisma-client';
import { getPrisma } from '../../lib/prisma';

type AuthenticatedUser = Express.Request['authUser'];

function prismaClient() {
  const prisma = getPrisma();

  if (!prisma) {
    throw new AppError('DATABASE_URL no esta configurado en el backend.', 500);
  }

  return prisma;
}

export function isVendorUser(user?: AuthenticatedUser | null) {
  return user?.rol === RolUsuario.VENDEDOR;
}

export async function resolveVendorAccessScope(user?: AuthenticatedUser | null) {
  if (!isVendorUser(user)) {
    return {
      restricted: false,
      rifaVendedorIds: [] as string[],
      vendedorIds: [] as string[],
      rifaIds: [] as string[],
      vendedorNombres: [] as string[],
    };
  }

  const directRifaVendedorIds = [...new Set(user?.scopes.rifaVendedorIds || [])];
  const directVendedorIds = [...new Set(user?.scopes.vendedorIds || [])];

  if (directRifaVendedorIds.length === 0 && directVendedorIds.length === 0) {
    return {
      restricted: true,
      rifaVendedorIds: [],
      vendedorIds: [],
      rifaIds: [],
      vendedorNombres: [],
    };
  }

  const relations = await prismaClient().rifaVendedor.findMany({
    where: {
      OR: [
        ...(directRifaVendedorIds.length > 0 ? [{ id: { in: directRifaVendedorIds } }] : []),
        ...(directVendedorIds.length > 0 ? [{ vendedorId: { in: directVendedorIds } }] : []),
      ],
    },
    select: {
      id: true,
      vendedorId: true,
      rifaId: true,
      vendedor: {
        select: {
          nombre: true,
        },
      },
    },
  });

  return {
    restricted: true,
    rifaVendedorIds: [...new Set(relations.map((item) => item.id))],
    vendedorIds: [...new Set(relations.map((item) => item.vendedorId))],
    rifaIds: [...new Set(relations.map((item) => item.rifaId))],
    vendedorNombres: [
      ...new Set(relations.map((item) => item.vendedor?.nombre).filter(Boolean) as string[]),
    ],
  };
}

export async function assertVendorCanAccessRifaVendedor(
  user: AuthenticatedUser | undefined,
  rifaVendedorId: string
) {
  const scope = await resolveVendorAccessScope(user);

  if (scope.restricted && !scope.rifaVendedorIds.includes(rifaVendedorId)) {
    throw new AppError('No tienes acceso a esa relacion rifa-vendedor.', 403, {
      errorCode: 'SCOPE_FORBIDDEN',
    });
  }

  return scope;
}

export async function assertVendorCanAccessRifa(
  user: AuthenticatedUser | undefined,
  rifaId: string
) {
  const scope = await resolveVendorAccessScope(user);

  if (scope.restricted && !scope.rifaIds.includes(rifaId)) {
    throw new AppError('No tienes acceso a esa rifa.', 403, {
      errorCode: 'SCOPE_FORBIDDEN',
    });
  }

  return scope;
}
