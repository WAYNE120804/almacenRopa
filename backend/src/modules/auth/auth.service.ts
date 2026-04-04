import { env } from '../../config/env';
import { createAuthToken } from '../../lib/auth-token';
import { AppError } from '../../lib/app-error';
import { hashPassword, verifyPassword } from '../../lib/password';
import { RolUsuario } from '../../lib/prisma-client';
import { getPrisma } from '../../lib/prisma';
import type { LoginPayload, UsuarioPayload } from './auth.schemas';
import { normalizeLoginIdentifier, serializeUserScopes } from './auth.utils';

function prismaClient() {
  const prisma = getPrisma();

  if (!prisma) {
    throw new AppError('DATABASE_URL no esta configurado en el backend.', 500);
  }

  return prisma;
}

function serializeUser(usuario: {
  id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  vendedorScopes?: Array<{
    vendedorId: string | null;
    rifaVendedorId: string | null;
    vendedor?: {
      id: string;
      nombre: string;
    } | null;
    rifaVendedor?: {
      id: string;
      rifa?: {
        id: string;
        nombre: string;
      } | null;
      vendedor?: {
        id: string;
        nombre: string;
      } | null;
    } | null;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}) {
  const serializedScopes = serializeUserScopes(usuario.vendedorScopes);

  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    activo: usuario.activo,
    scopes: {
      ...serializedScopes,
      items: (usuario.vendedorScopes || []).map((scope) => ({
        vendedorId: scope.vendedorId,
        rifaVendedorId: scope.rifaVendedorId,
        vendedorNombre:
          scope.rifaVendedor?.vendedor?.nombre || scope.vendedor?.nombre || null,
        rifaNombre: scope.rifaVendedor?.rifa?.nombre || null,
      })),
    },
    createdAt: usuario.createdAt,
    updatedAt: usuario.updatedAt,
  };
}

async function validateUsuarioScopes(payload: {
  vendedorIds: string[];
  rifaVendedorIds: string[];
}) {
  const prisma = prismaClient();

  if (payload.vendedorIds.length > 0) {
    const count = await prisma.vendedor.count({
      where: {
        id: {
          in: payload.vendedorIds,
        },
      },
    });

    if (count !== payload.vendedorIds.length) {
      throw new AppError('Uno o varios vendedores del scope no existen.', 404);
    }
  }

  if (payload.rifaVendedorIds.length > 0) {
    const count = await prisma.rifaVendedor.count({
      where: {
        id: {
          in: payload.rifaVendedorIds,
        },
      },
    });

    if (count !== payload.rifaVendedorIds.length) {
      throw new AppError('Una o varias relaciones rifa-vendedor del scope no existen.', 404);
    }
  }
}

export async function ensureBootstrapAdmin() {
  const prisma = prismaClient();
  const usersCount = await prisma.usuario.count();

  if (usersCount > 0) {
    return;
  }

  await prisma.usuario.create({
    data: {
      nombre: env.bootstrapAdminName,
      email: normalizeLoginIdentifier(env.bootstrapAdminEmail),
      password: hashPassword(env.bootstrapAdminPassword),
      rol: RolUsuario.ADMIN,
      activo: true,
    },
  });
}

export async function loginUsuario(payload: LoginPayload) {
  const prisma = prismaClient();
  const usuario = await prisma.usuario.findUnique({
    where: { email: normalizeLoginIdentifier(payload.identifier) },
    include: {
      vendedorScopes: {
        select: {
          vendedorId: true,
          rifaVendedorId: true,
          vendedor: {
            select: {
              id: true,
              nombre: true,
            },
          },
          rifaVendedor: {
            select: {
              id: true,
              rifa: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
              vendedor: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!usuario || !verifyPassword(payload.password, usuario.password)) {
    throw new AppError('Documento, correo o contrasena incorrectos.', 401, {
      errorCode: 'INVALID_CREDENTIALS',
    });
  }

  if (!usuario.activo) {
    throw new AppError('Tu usuario esta inactivo.', 403, {
      errorCode: 'USER_DISABLED',
    });
  }

  return {
    token: createAuthToken({
      sub: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    }),
    usuario: serializeUser(usuario),
  };
}

export async function getAuthProfile(userId: string) {
  const usuario = await prismaClient().usuario.findUnique({
    where: { id: userId },
    include: {
      vendedorScopes: {
        select: {
          vendedorId: true,
          rifaVendedorId: true,
          vendedor: {
            select: {
              id: true,
              nombre: true,
            },
          },
          rifaVendedor: {
            select: {
              id: true,
              rifa: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
              vendedor: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!usuario) {
    throw new AppError('Usuario no encontrado.', 404);
  }

  return serializeUser(usuario);
}

export async function listUsuarios() {
  const usuarios = await prismaClient().usuario.findMany({
    include: {
      vendedorScopes: {
        select: {
          vendedorId: true,
          rifaVendedorId: true,
          vendedor: {
            select: {
              id: true,
              nombre: true,
            },
          },
          rifaVendedor: {
            select: {
              id: true,
              rifa: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
              vendedor: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ activo: 'desc' }, { nombre: 'asc' }],
  });

  return usuarios.map(serializeUser);
}

export async function createUsuario(payload: UsuarioPayload) {
  const prisma = prismaClient();
  const existing = await prisma.usuario.findUnique({
    where: { email: normalizeLoginIdentifier(payload.email) },
    select: { id: true },
  });

  if (existing) {
    throw new AppError('Ya existe un usuario con ese identificador.', 409, {
      errorCode: 'EMAIL_IN_USE',
    });
  }

  await validateUsuarioScopes(payload);

  const usuario = await prisma.usuario.create({
    data: {
      nombre: payload.nombre,
      email: normalizeLoginIdentifier(payload.email),
      password: hashPassword(payload.password),
      rol: payload.rol,
      activo: true,
      vendedorScopes: {
        create: [
          ...payload.vendedorIds.map((vendedorId) => ({
            vendedorId,
          })),
          ...payload.rifaVendedorIds.map((rifaVendedorId) => ({
            rifaVendedorId,
          })),
        ],
      },
    },
    include: {
      vendedorScopes: {
        select: {
          vendedorId: true,
          rifaVendedorId: true,
          vendedor: {
            select: {
              id: true,
              nombre: true,
            },
          },
          rifaVendedor: {
            select: {
              id: true,
              rifa: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
              vendedor: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return serializeUser(usuario);
}

export async function toggleUsuarioActivo(id: string, activo: boolean) {
  const prisma = prismaClient();
  const usuario = await prisma.usuario.findUnique({
    where: { id },
  });

  if (!usuario) {
    throw new AppError('Usuario no encontrado.', 404);
  }

  const totalAdminsActivos = await prisma.usuario.count({
    where: {
      rol: RolUsuario.ADMIN,
      activo: true,
    },
  });

  if (usuario.rol === RolUsuario.ADMIN && usuario.activo && !activo && totalAdminsActivos <= 1) {
    throw new AppError('No puedes desactivar el ultimo administrador activo.', 409, {
      errorCode: 'LAST_ADMIN',
    });
  }

  const updated = await prisma.usuario.update({
    where: { id },
    data: { activo },
    include: {
      vendedorScopes: {
        select: {
          vendedorId: true,
          rifaVendedorId: true,
          vendedor: {
            select: {
              id: true,
              nombre: true,
            },
          },
          rifaVendedor: {
            select: {
              id: true,
              rifa: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
              vendedor: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return serializeUser(updated);
}

export async function updateUsuarioScopes(
  id: string,
  payload: {
    vendedorIds: string[];
    rifaVendedorIds: string[];
  }
) {
  const prisma = prismaClient();
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: {
      id: true,
      rol: true,
    },
  });

  if (!usuario) {
    throw new AppError('Usuario no encontrado.', 404);
  }

  await validateUsuarioScopes(payload);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.usuarioVendedorScope.deleteMany({
      where: {
        usuarioId: id,
      },
    });

    return tx.usuario.update({
      where: { id },
      data: {
        vendedorScopes: {
          create: [
            ...payload.vendedorIds.map((vendedorId) => ({
              vendedorId,
            })),
            ...payload.rifaVendedorIds.map((rifaVendedorId) => ({
              rifaVendedorId,
            })),
          ],
        },
      },
      include: {
        vendedorScopes: {
          select: {
            vendedorId: true,
            rifaVendedorId: true,
            vendedor: {
              select: {
                id: true,
                nombre: true,
              },
            },
            rifaVendedor: {
              select: {
                id: true,
                rifa: {
                  select: {
                    id: true,
                    nombre: true,
                  },
                },
                vendedor: {
                  select: {
                    id: true,
                    nombre: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  });

  return serializeUser(updated);
}
