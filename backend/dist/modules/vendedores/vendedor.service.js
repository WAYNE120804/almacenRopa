"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listVendedores = listVendedores;
exports.getVendedorById = getVendedorById;
exports.createVendedor = createVendedor;
exports.updateVendedor = updateVendedor;
exports.deleteVendedor = deleteVendedor;
exports.upsertVendedorAccess = upsertVendedorAccess;
const app_error_1 = require("../../lib/app-error");
const password_1 = require("../../lib/password");
const prisma_1 = require("../../lib/prisma");
const prisma_client_1 = require("../../lib/prisma-client");
const auth_scope_1 = require("../auth/auth.scope");
const auth_utils_1 = require("../auth/auth.utils");
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
};
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
};
function isPaginaWebVendedor(nombre) {
    return nombre.trim().toUpperCase() === 'PAGINA WEB';
}
function validateAutomaticAccessData(payload) {
    if (isPaginaWebVendedor(payload.nombre)) {
        return;
    }
    if (!payload.documento) {
        throw new app_error_1.AppError('Para crear acceso automatico del vendedor debes registrar el documento.', 400);
    }
    if (!payload.telefono) {
        throw new app_error_1.AppError('Para crear acceso automatico del vendedor debes registrar el telefono.', 400);
    }
}
function prismaClient() {
    const prisma = (0, prisma_1.getPrisma)();
    if (!prisma) {
        throw new app_error_1.AppError('DATABASE_URL no esta configurado en el backend.', 500);
    }
    return prisma;
}
async function listVendedores(authUser) {
    const scope = await (0, auth_scope_1.resolveVendorAccessScope)(authUser);
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
async function getVendedorById(id, authUser) {
    const scope = await (0, auth_scope_1.resolveVendorAccessScope)(authUser);
    const vendedor = await prismaClient().vendedor.findUnique({
        where: { id },
        include: vendedorDetailInclude,
    });
    if (!vendedor) {
        throw new app_error_1.AppError('Vendedor no encontrado.', 404);
    }
    if (scope.restricted && !scope.vendedorIds.includes(id)) {
        throw new app_error_1.AppError('No tienes acceso a este vendedor.', 403, {
            errorCode: 'SCOPE_FORBIDDEN',
        });
    }
    return vendedor;
}
async function createVendedor(payload) {
    validateAutomaticAccessData(payload);
    const prisma = prismaClient();
    return prisma.$transaction(async (tx) => {
        const vendedor = await tx.vendedor.create({
            data: payload,
        });
        if (!isPaginaWebVendedor(payload.nombre)) {
            const loginIdentifier = (0, auth_utils_1.normalizeLoginIdentifier)(payload.documento);
            const existingUsuario = await tx.usuario.findUnique({
                where: { email: loginIdentifier },
                select: { id: true },
            });
            if (existingUsuario) {
                throw new app_error_1.AppError('Ya existe un usuario con ese documento. No se pudo crear el acceso automatico del vendedor.', 409);
            }
            const usuario = await tx.usuario.create({
                data: {
                    nombre: payload.nombre,
                    email: loginIdentifier,
                    password: (0, password_1.hashPassword)(payload.telefono),
                    rol: prisma_client_1.RolUsuario.VENDEDOR,
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
async function updateVendedor(id, payload) {
    await getVendedorById(id);
    return prismaClient().vendedor.update({
        where: { id },
        data: payload,
        include: vendedorDetailInclude,
    });
}
async function deleteVendedor(id) {
    const prisma = prismaClient();
    const vendedor = await getVendedorById(id);
    if (vendedor._count.rifas > 0 ||
        vendedor._count.movimientos > 0 ||
        vendedor._count.usuarioScopes > 0) {
        throw new app_error_1.AppError('El vendedor no se puede eliminar porque ya tiene rifas, movimientos o accesos asociados.', 409);
    }
    await prisma.vendedor.delete({
        where: { id },
    });
}
async function upsertVendedorAccess(id, payload) {
    const prisma = prismaClient();
    const vendedor = await getVendedorById(id);
    if (isPaginaWebVendedor(vendedor.nombre)) {
        throw new app_error_1.AppError('PAGINA WEB es un canal especial. Su acceso debe administrarse desde Usuarios.', 409);
    }
    const normalizedEmail = (0, auth_utils_1.normalizeLoginIdentifier)(payload.email);
    const primaryScopedUser = vendedor.usuarioScopes.find((scope) => scope.usuario?.id && !scope.rifaVendedor?.id)?.usuario;
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
        throw new app_error_1.AppError('Ya existe otro usuario con ese identificador.', 409);
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
                    password: (0, password_1.hashPassword)(payload.password),
                    rol: prisma_client_1.RolUsuario.VENDEDOR,
                    activo: true,
                },
            })
            : await tx.usuario.create({
                data: {
                    nombre: payload.nombre,
                    email: normalizedEmail,
                    password: (0, password_1.hashPassword)(payload.password),
                    rol: prisma_client_1.RolUsuario.VENDEDOR,
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
