"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isVendorUser = isVendorUser;
exports.resolveVendorAccessScope = resolveVendorAccessScope;
exports.assertVendorCanAccessRifaVendedor = assertVendorCanAccessRifaVendedor;
exports.assertVendorCanAccessRifa = assertVendorCanAccessRifa;
const app_error_1 = require("../../lib/app-error");
const prisma_client_1 = require("../../lib/prisma-client");
const prisma_1 = require("../../lib/prisma");
function prismaClient() {
    const prisma = (0, prisma_1.getPrisma)();
    if (!prisma) {
        throw new app_error_1.AppError('DATABASE_URL no esta configurado en el backend.', 500);
    }
    return prisma;
}
function isVendorUser(user) {
    return user?.rol === prisma_client_1.RolUsuario.VENDEDOR;
}
async function resolveVendorAccessScope(user) {
    if (!isVendorUser(user)) {
        return {
            restricted: false,
            rifaVendedorIds: [],
            vendedorIds: [],
            rifaIds: [],
            vendedorNombres: [],
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
            ...new Set(relations.map((item) => item.vendedor?.nombre).filter(Boolean)),
        ],
    };
}
async function assertVendorCanAccessRifaVendedor(user, rifaVendedorId) {
    const scope = await resolveVendorAccessScope(user);
    if (scope.restricted && !scope.rifaVendedorIds.includes(rifaVendedorId)) {
        throw new app_error_1.AppError('No tienes acceso a esa relacion rifa-vendedor.', 403, {
            errorCode: 'SCOPE_FORBIDDEN',
        });
    }
    return scope;
}
async function assertVendorCanAccessRifa(user, rifaId) {
    const scope = await resolveVendorAccessScope(user);
    if (scope.restricted && !scope.rifaIds.includes(rifaId)) {
        throw new app_error_1.AppError('No tienes acceso a esa rifa.', 403, {
            errorCode: 'SCOPE_FORBIDDEN',
        });
    }
    return scope;
}
