"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSpecialChannelDashboard = getSpecialChannelDashboard;
const app_error_1 = require("../../lib/app-error");
const prisma_client_1 = require("../../lib/prisma-client");
const prisma_1 = require("../../lib/prisma");
const auth_scope_1 = require("../auth/auth.scope");
const SPECIAL_CHANNEL_NAMES = new Set(['BOT', 'PAGINA WEB']);
function prismaClient() {
    const prisma = (0, prisma_1.getPrisma)();
    if (!prisma) {
        throw new app_error_1.AppError('DATABASE_URL no esta configurado en el backend.', 500);
    }
    return prisma;
}
async function listSpecialRelationsForUser(authUser) {
    if (!authUser) {
        throw new app_error_1.AppError('Debes iniciar sesion para acceder a esta ruta.', 401, {
            errorCode: 'AUTH_REQUIRED',
        });
    }
    const scope = await (0, auth_scope_1.resolveVendorAccessScope)(authUser);
    if (!scope.restricted || scope.rifaVendedorIds.length === 0) {
        throw new app_error_1.AppError('Tu usuario no tiene alcance sobre canales especiales.', 403, {
            errorCode: 'SPECIAL_SCOPE_REQUIRED',
        });
    }
    const relations = await prismaClient().rifaVendedor.findMany({
        where: {
            id: {
                in: scope.rifaVendedorIds,
            },
        },
        select: {
            id: true,
            rifaId: true,
            vendedorId: true,
            vendedor: {
                select: {
                    id: true,
                    nombre: true,
                },
            },
            rifa: {
                select: {
                    id: true,
                    nombre: true,
                },
            },
        },
    });
    const specialRelations = relations.filter((item) => SPECIAL_CHANNEL_NAMES.has(String(item.vendedor?.nombre || '').trim().toUpperCase()));
    if (!specialRelations.length) {
        throw new app_error_1.AppError('Este usuario no tiene canales BOT o PAGINA WEB en su alcance.', 403, {
            errorCode: 'SPECIAL_SCOPE_REQUIRED',
        });
    }
    return specialRelations;
}
function getTodayRange() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
}
async function getSpecialChannelDashboard(authUser) {
    const prisma = prismaClient();
    const relations = await listSpecialRelationsForUser(authUser);
    const relationIds = relations.map((item) => item.id);
    const { start, end } = getTodayRange();
    const now = new Date();
    const [clientesNuevosHoy, ventasPendientes, pagosParciales, reservasActivas, reservasVencidas, linksEnviados, linksAbiertos, pagosConfirmadosHoy, seguimientoHumano, pagosHoyRows, reservasVencidasRows, ventasSeguimientoRows, linksRows, relationSalesSummary,] = await Promise.all([
        prisma.cliente.count({
            where: {
                createdAt: {
                    gte: start,
                    lt: end,
                },
                ventas: {
                    some: {
                        rifaVendedorId: {
                            in: relationIds,
                        },
                    },
                },
            },
        }),
        prisma.venta.count({
            where: {
                rifaVendedorId: {
                    in: relationIds,
                },
                saldoPendiente: {
                    gt: 0,
                },
                estado: {
                    in: [prisma_client_1.EstadoVenta.PENDIENTE, prisma_client_1.EstadoVenta.ABONANDO],
                },
            },
        }),
        prisma.venta.count({
            where: {
                rifaVendedorId: {
                    in: relationIds,
                },
                estado: prisma_client_1.EstadoVenta.ABONANDO,
            },
        }),
        prisma.boleta.count({
            where: {
                rifaVendedorId: {
                    in: relationIds,
                },
                estado: 'RESERVADA',
                OR: [
                    {
                        reservadaHasta: null,
                    },
                    {
                        reservadaHasta: {
                            gte: now,
                        },
                    },
                ],
            },
        }),
        prisma.boleta.count({
            where: {
                rifaVendedorId: {
                    in: relationIds,
                },
                estado: 'RESERVADA',
                reservadaHasta: {
                    lt: now,
                },
            },
        }),
        prisma.venta.count({
            where: {
                rifaVendedorId: {
                    in: relationIds,
                },
                linkPagoEnviadoAt: {
                    not: null,
                },
            },
        }),
        prisma.venta.count({
            where: {
                rifaVendedorId: {
                    in: relationIds,
                },
                linkPagoAbiertoAt: {
                    not: null,
                },
            },
        }),
        prisma.pagoCliente.count({
            where: {
                estado: 'CONFIRMADO',
                fecha: {
                    gte: start,
                    lt: end,
                },
                venta: {
                    rifaVendedorId: {
                        in: relationIds,
                    },
                },
            },
        }),
        prisma.venta.count({
            where: {
                rifaVendedorId: {
                    in: relationIds,
                },
                OR: [
                    {
                        requiereSeguimientoHumano: true,
                    },
                    {
                        boletas: {
                            some: {
                                estado: 'RESERVADA',
                                reservadaHasta: {
                                    lt: now,
                                },
                            },
                        },
                    },
                ],
            },
        }),
        prisma.pagoCliente.findMany({
            where: {
                estado: 'CONFIRMADO',
                fecha: {
                    gte: start,
                    lt: end,
                },
                venta: {
                    rifaVendedorId: {
                        in: relationIds,
                    },
                },
            },
            select: {
                id: true,
                monto: true,
                fecha: true,
                metodoPago: true,
                venta: {
                    select: {
                        id: true,
                        cliente: {
                            select: {
                                nombre: true,
                                telefono: true,
                            },
                        },
                        rifa: {
                            select: {
                                nombre: true,
                            },
                        },
                        rifaVendedor: {
                            select: {
                                vendedor: {
                                    select: {
                                        nombre: true,
                                    },
                                },
                            },
                        },
                        boletas: {
                            select: {
                                numero: true,
                            },
                            orderBy: {
                                numero: 'asc',
                            },
                        },
                    },
                },
            },
            orderBy: {
                fecha: 'desc',
            },
            take: 10,
        }),
        prisma.boleta.findMany({
            where: {
                rifaVendedorId: {
                    in: relationIds,
                },
                estado: 'RESERVADA',
                reservadaHasta: {
                    lt: now,
                },
            },
            select: {
                id: true,
                numero: true,
                reservadaHasta: true,
                cliente: {
                    select: {
                        nombre: true,
                        telefono: true,
                    },
                },
                venta: {
                    select: {
                        id: true,
                        createdAt: true,
                        saldoPendiente: true,
                    },
                },
                rifa: {
                    select: {
                        nombre: true,
                    },
                },
                rifaVendedor: {
                    select: {
                        vendedor: {
                            select: {
                                nombre: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                reservadaHasta: 'asc',
            },
            take: 12,
        }),
        prisma.venta.findMany({
            where: {
                rifaVendedorId: {
                    in: relationIds,
                },
                OR: [
                    {
                        requiereSeguimientoHumano: true,
                    },
                    {
                        boletas: {
                            some: {
                                estado: 'RESERVADA',
                                reservadaHasta: {
                                    lt: now,
                                },
                            },
                        },
                    },
                ],
            },
            select: {
                id: true,
                createdAt: true,
                estado: true,
                saldoPendiente: true,
                seguimientoMotivo: true,
                requiereSeguimientoHumano: true,
                cliente: {
                    select: {
                        nombre: true,
                        telefono: true,
                    },
                },
                rifa: {
                    select: {
                        nombre: true,
                    },
                },
                rifaVendedor: {
                    select: {
                        vendedor: {
                            select: {
                                nombre: true,
                            },
                        },
                    },
                },
                boletas: {
                    select: {
                        numero: true,
                        estado: true,
                        reservadaHasta: true,
                    },
                    orderBy: {
                        numero: 'asc',
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
            take: 12,
        }),
        prisma.venta.findMany({
            where: {
                rifaVendedorId: {
                    in: relationIds,
                },
                linkPagoEnviadoAt: {
                    not: null,
                },
            },
            select: {
                id: true,
                estado: true,
                saldoPendiente: true,
                linkPagoUrl: true,
                linkPagoEnviadoAt: true,
                linkPagoAbiertoAt: true,
                cliente: {
                    select: {
                        nombre: true,
                        telefono: true,
                    },
                },
                rifa: {
                    select: {
                        nombre: true,
                    },
                },
                rifaVendedor: {
                    select: {
                        vendedor: {
                            select: {
                                nombre: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                linkPagoEnviadoAt: 'desc',
            },
            take: 10,
        }),
        prisma.venta.groupBy({
            by: ['rifaVendedorId'],
            where: {
                rifaVendedorId: {
                    in: relationIds,
                },
            },
            _count: {
                _all: true,
            },
            _sum: {
                total: true,
                saldoPendiente: true,
            },
        }),
    ]);
    const relationSummaryMap = new Map(relationSalesSummary.map((item) => [item.rifaVendedorId, item]));
    return {
        channels: relations.map((relation) => {
            const totals = relationSummaryMap.get(relation.id);
            return {
                id: relation.id,
                rifaId: relation.rifaId,
                rifaNombre: relation.rifa.nombre,
                canalNombre: relation.vendedor.nombre,
                ventas: totals?._count._all || 0,
                totalVendido: Number(totals?._sum.total || 0),
                saldoPendiente: Number(totals?._sum.saldoPendiente || 0),
            };
        }),
        metrics: {
            clientesNuevosHoy,
            ventasPendientes,
            pagosParciales,
            reservasActivas,
            reservasVencidas,
            linksEnviados,
            linksAbiertos,
            pagosConfirmadosHoy,
            seguimientoHumano,
        },
        pagosConfirmadosHoy: pagosHoyRows.map((item) => ({
            id: item.id,
            monto: Number(item.monto || 0),
            fecha: item.fecha,
            metodoPago: item.metodoPago,
            clienteNombre: item.venta.cliente.nombre,
            clienteTelefono: item.venta.cliente.telefono,
            rifaNombre: item.venta.rifa.nombre,
            canalNombre: item.venta.rifaVendedor?.vendedor?.nombre || 'SIN CANAL',
            boletas: item.venta.boletas.map((boleta) => boleta.numero),
        })),
        reservasVencidas: reservasVencidasRows.map((item) => ({
            id: item.id,
            numero: item.numero,
            reservadaHasta: item.reservadaHasta,
            clienteNombre: item.cliente?.nombre || 'Sin cliente',
            clienteTelefono: item.cliente?.telefono || null,
            rifaNombre: item.rifa.nombre,
            canalNombre: item.rifaVendedor?.vendedor?.nombre || 'SIN CANAL',
            ventaId: item.venta?.id || null,
            saldoPendiente: Number(item.venta?.saldoPendiente || 0),
            createdAt: item.venta?.createdAt || null,
        })),
        seguimientoHumano: ventasSeguimientoRows.map((item) => ({
            id: item.id,
            estado: item.estado,
            saldoPendiente: Number(item.saldoPendiente || 0),
            createdAt: item.createdAt,
            clienteNombre: item.cliente.nombre,
            clienteTelefono: item.cliente.telefono,
            rifaNombre: item.rifa.nombre,
            canalNombre: item.rifaVendedor?.vendedor?.nombre || 'SIN CANAL',
            seguimientoMotivo: item.seguimientoMotivo,
            requiereSeguimientoHumano: item.requiereSeguimientoHumano,
            boletas: item.boletas.map((boleta) => ({
                numero: boleta.numero,
                estado: boleta.estado,
                reservadaHasta: boleta.reservadaHasta,
            })),
        })),
        linksPago: linksRows.map((item) => ({
            id: item.id,
            estado: item.estado,
            saldoPendiente: Number(item.saldoPendiente || 0),
            clienteNombre: item.cliente.nombre,
            clienteTelefono: item.cliente.telefono,
            rifaNombre: item.rifa.nombre,
            canalNombre: item.rifaVendedor?.vendedor?.nombre || 'SIN CANAL',
            linkPagoUrl: item.linkPagoUrl,
            linkPagoEnviadoAt: item.linkPagoEnviadoAt,
            linkPagoAbiertoAt: item.linkPagoAbiertoAt,
        })),
    };
}
