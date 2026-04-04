"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureBootstrapAdmin = ensureBootstrapAdmin;
exports.loginUsuario = loginUsuario;
exports.getAuthProfile = getAuthProfile;
exports.listUsuarios = listUsuarios;
exports.createUsuario = createUsuario;
exports.toggleUsuarioActivo = toggleUsuarioActivo;
exports.updateUsuarioScopes = updateUsuarioScopes;
const env_1 = require("../../config/env");
const auth_token_1 = require("../../lib/auth-token");
const app_error_1 = require("../../lib/app-error");
const password_1 = require("../../lib/password");
const prisma_client_1 = require("../../lib/prisma-client");
const prisma_1 = require("../../lib/prisma");
const auth_utils_1 = require("./auth.utils");
function prismaClient() {
    const prisma = (0, prisma_1.getPrisma)();
    if (!prisma) {
        throw new app_error_1.AppError('DATABASE_URL no esta configurado en el backend.', 500);
    }
    return prisma;
}
function serializeUser(usuario) {
    const serializedScopes = (0, auth_utils_1.serializeUserScopes)(usuario.vendedorScopes);
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
                vendedorNombre: scope.rifaVendedor?.vendedor?.nombre || scope.vendedor?.nombre || null,
                rifaNombre: scope.rifaVendedor?.rifa?.nombre || null,
            })),
        },
        createdAt: usuario.createdAt,
        updatedAt: usuario.updatedAt,
    };
}
async function validateUsuarioScopes(payload) {
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
            throw new app_error_1.AppError('Uno o varios vendedores del scope no existen.', 404);
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
            throw new app_error_1.AppError('Una o varias relaciones rifa-vendedor del scope no existen.', 404);
        }
    }
}
async function ensureBootstrapAdmin() {
    const prisma = prismaClient();
    const usersCount = await prisma.usuario.count();
    if (usersCount > 0) {
        return;
    }
    await prisma.usuario.create({
        data: {
            nombre: env_1.env.bootstrapAdminName,
            email: (0, auth_utils_1.normalizeLoginIdentifier)(env_1.env.bootstrapAdminEmail),
            password: (0, password_1.hashPassword)(env_1.env.bootstrapAdminPassword),
            rol: prisma_client_1.RolUsuario.ADMIN,
            activo: true,
        },
    });
}
async function loginUsuario(payload) {
    const prisma = prismaClient();
    const usuario = await prisma.usuario.findUnique({
        where: { email: (0, auth_utils_1.normalizeLoginIdentifier)(payload.identifier) },
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
    if (!usuario || !(0, password_1.verifyPassword)(payload.password, usuario.password)) {
        throw new app_error_1.AppError('Documento, correo o contrasena incorrectos.', 401, {
            errorCode: 'INVALID_CREDENTIALS',
        });
    }
    if (!usuario.activo) {
        throw new app_error_1.AppError('Tu usuario esta inactivo.', 403, {
            errorCode: 'USER_DISABLED',
        });
    }
    return {
        token: (0, auth_token_1.createAuthToken)({
            sub: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
        }),
        usuario: serializeUser(usuario),
    };
}
async function getAuthProfile(userId) {
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
        throw new app_error_1.AppError('Usuario no encontrado.', 404);
    }
    return serializeUser(usuario);
}
async function listUsuarios() {
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
async function createUsuario(payload) {
    const prisma = prismaClient();
    const existing = await prisma.usuario.findUnique({
        where: { email: (0, auth_utils_1.normalizeLoginIdentifier)(payload.email) },
        select: { id: true },
    });
    if (existing) {
        throw new app_error_1.AppError('Ya existe un usuario con ese identificador.', 409, {
            errorCode: 'EMAIL_IN_USE',
        });
    }
    await validateUsuarioScopes(payload);
    const usuario = await prisma.usuario.create({
        data: {
            nombre: payload.nombre,
            email: (0, auth_utils_1.normalizeLoginIdentifier)(payload.email),
            password: (0, password_1.hashPassword)(payload.password),
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
async function toggleUsuarioActivo(id, activo) {
    const prisma = prismaClient();
    const usuario = await prisma.usuario.findUnique({
        where: { id },
    });
    if (!usuario) {
        throw new app_error_1.AppError('Usuario no encontrado.', 404);
    }
    const totalAdminsActivos = await prisma.usuario.count({
        where: {
            rol: prisma_client_1.RolUsuario.ADMIN,
            activo: true,
        },
    });
    if (usuario.rol === prisma_client_1.RolUsuario.ADMIN && usuario.activo && !activo && totalAdminsActivos <= 1) {
        throw new app_error_1.AppError('No puedes desactivar el ultimo administrador activo.', 409, {
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
async function updateUsuarioScopes(id, payload) {
    const prisma = prismaClient();
    const usuario = await prisma.usuario.findUnique({
        where: { id },
        select: {
            id: true,
            rol: true,
        },
    });
    if (!usuario) {
        throw new app_error_1.AppError('Usuario no encontrado.', 404);
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
