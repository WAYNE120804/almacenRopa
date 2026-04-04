"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBoletas = listBoletas;
exports.listPublicBoletas = listPublicBoletas;
exports.getBoletaById = getBoletaById;
exports.getOrCreateBoletaPublicLink = getOrCreateBoletaPublicLink;
exports.getPublicBoletaFichaByToken = getPublicBoletaFichaByToken;
exports.updateBoleta = updateBoleta;
exports.releaseBoletaFromCliente = releaseBoletaFromCliente;
const node_crypto_1 = __importDefault(require("node:crypto"));
const prisma_client_1 = require("../../lib/prisma-client");
const app_error_1 = require("../../lib/app-error");
const prisma_1 = require("../../lib/prisma");
const auth_scope_1 = require("../auth/auth.scope");
const checkout_publico_service_1 = require("../checkout-publico/checkout-publico.service");
const boletaInclude = {
    rifa: {
        select: {
            id: true,
            nombre: true,
            numeroCifras: true,
            precioBoleta: true,
            estado: true,
        },
    },
    rifaVendedor: {
        select: {
            id: true,
            comisionPct: true,
            precioCasa: true,
            vendedor: {
                select: {
                    id: true,
                    nombre: true,
                    documento: true,
                    telefono: true,
                    direccion: true,
                },
            },
        },
    },
    cliente: {
        select: {
            id: true,
            nombre: true,
            documento: true,
            telefono: true,
            email: true,
        },
    },
    venta: {
        select: {
            id: true,
            estado: true,
            total: true,
            saldoPendiente: true,
            createdAt: true,
            pagos: {
                where: {
                    estado: 'CONFIRMADO',
                },
                select: {
                    id: true,
                    monto: true,
                    fecha: true,
                    metodoPago: true,
                    descripcion: true,
                    recibo: {
                        select: {
                            id: true,
                            consecutivo: true,
                            codigoUnico: true,
                        },
                    },
                    usuario: {
                        select: {
                            id: true,
                            nombre: true,
                        },
                    },
                },
                orderBy: {
                    fecha: 'desc',
                },
            },
            cliente: {
                select: {
                    id: true,
                    nombre: true,
                    documento: true,
                    telefono: true,
                },
            },
            boletas: {
                select: {
                    id: true,
                    numero: true,
                    estado: true,
                },
                orderBy: {
                    numero: 'asc',
                },
            },
        },
    },
};
function prismaClient() {
    const prisma = (0, prisma_1.getPrisma)();
    if (!prisma) {
        throw new app_error_1.AppError('DATABASE_URL no esta configurado en el backend.', 500);
    }
    return prisma;
}
function buildPublicToken() {
    return node_crypto_1.default.randomBytes(24).toString('hex');
}
function maskDocument(value) {
    if (!value) {
        return null;
    }
    const trimmed = value.trim();
    if (trimmed.length <= 4) {
        return trimmed;
    }
    return `${trimmed.slice(0, 2)}${'*'.repeat(Math.max(0, trimmed.length - 4))}${trimmed.slice(-2)}`;
}
function maskPhone(value) {
    if (!value) {
        return null;
    }
    const digits = value.replace(/\s+/g, '');
    if (digits.length <= 4) {
        return digits;
    }
    return `${digits.slice(0, 3)}${'*'.repeat(Math.max(0, digits.length - 5))}${digits.slice(-2)}`;
}
function getPublicVisualState(boleta) {
    if (boleta.estado === prisma_client_1.EstadoBoleta.PAGADA) {
        return 'PAGADA';
    }
    const saldoPendiente = Number(boleta.venta?.saldoPendiente || 0);
    if (boleta.venta?.estado === prisma_client_1.EstadoVenta.ABONANDO ||
        (boleta.estado === prisma_client_1.EstadoBoleta.VENDIDA && saldoPendiente > 0)) {
        return 'ABONANDO';
    }
    if (boleta.estado === prisma_client_1.EstadoBoleta.VENDIDA && saldoPendiente <= 0) {
        return 'PAGADA';
    }
    return boleta.estado;
}
async function ensureBoletaPublicToken(id) {
    const prisma = prismaClient();
    const current = await prisma.boleta.findUnique({
        where: { id },
        select: {
            id: true,
            publicToken: true,
        },
    });
    if (!current) {
        throw new app_error_1.AppError('La boleta no existe.', 404);
    }
    if (current.publicToken) {
        return current.publicToken;
    }
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const token = buildPublicToken();
        try {
            const updated = await prisma.boleta.update({
                where: { id },
                data: {
                    publicToken: token,
                },
                select: {
                    publicToken: true,
                },
            });
            return updated.publicToken;
        }
        catch (error) {
            if (error instanceof prisma_client_1.Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2002') {
                continue;
            }
            throw error;
        }
    }
    throw new app_error_1.AppError('No se pudo generar el token publico de la boleta.', 500);
}
async function listBoletas(filters, authUser) {
    const vendedorNombre = filters.vendedorNombre?.trim();
    const scope = await (0, auth_scope_1.resolveVendorAccessScope)(authUser);
    return prismaClient().boleta.findMany({
        where: {
            ...(scope.restricted
                ? {
                    OR: [
                        {
                            rifaVendedorId: {
                                in: scope.rifaVendedorIds.length > 0 ? scope.rifaVendedorIds : [''],
                            },
                        },
                        ...(scope.vendedorNombres.length > 0
                            ? [
                                {
                                    devueltaPorVendedorNombre: {
                                        in: scope.vendedorNombres,
                                    },
                                },
                            ]
                            : []),
                    ],
                }
                : {}),
            ...(filters.rifaId ? { rifaId: filters.rifaId } : {}),
            ...(filters.rifaVendedorId ? { rifaVendedorId: filters.rifaVendedorId } : {}),
            ...(filters.estado ? { estado: filters.estado } : {}),
            ...(filters.numero ? { numero: { contains: filters.numero } } : {}),
            ...(typeof filters.juega === 'boolean' ? { juega: filters.juega } : {}),
            ...(vendedorNombre
                ? {
                    OR: [
                        {
                            rifaVendedor: {
                                vendedor: {
                                    nombre: {
                                        contains: vendedorNombre,
                                        mode: 'insensitive',
                                    },
                                },
                            },
                        },
                        {
                            devueltaPorVendedorNombre: {
                                contains: vendedorNombre,
                                mode: 'insensitive',
                            },
                        },
                    ],
                }
                : {}),
        },
        include: boletaInclude,
        orderBy: [{ numero: 'asc' }],
    });
}
async function listPublicBoletas(filters) {
    await (0, checkout_publico_service_1.releaseExpiredPublicReservations)();
    const prisma = prismaClient();
    const relation = await prisma.rifaVendedor.findFirst({
        where: {
            rifaId: filters.rifaId,
            vendedor: {
                nombre: 'PAGINA WEB',
            },
        },
        select: {
            id: true,
            vendedor: {
                select: {
                    id: true,
                    nombre: true,
                },
            },
        },
    });
    if (!relation) {
        return {
            relation: null,
            boletas: [],
        };
    }
    const boletas = await prisma.boleta.findMany({
        where: {
            rifaId: filters.rifaId,
            rifaVendedorId: relation.id,
            estado: {
                in: [
                    prisma_client_1.EstadoBoleta.ASIGNADA,
                    prisma_client_1.EstadoBoleta.RESERVADA,
                    prisma_client_1.EstadoBoleta.VENDIDA,
                    prisma_client_1.EstadoBoleta.PAGADA,
                ],
            },
        },
        select: {
            id: true,
            numero: true,
            estado: true,
            reservadaHasta: true,
            precio: true,
        },
        orderBy: [{ numero: 'asc' }],
    });
    return {
        relation,
        boletas,
    };
}
async function getBoletaById(id, authUser) {
    const boleta = await prismaClient().boleta.findUnique({
        where: { id },
        include: boletaInclude,
    });
    if (!boleta) {
        throw new app_error_1.AppError('La boleta no existe.', 404);
    }
    const scope = await (0, auth_scope_1.resolveVendorAccessScope)(authUser);
    if (scope.restricted) {
        const allowedByRelation = !!boleta.rifaVendedorId && scope.rifaVendedorIds.includes(boleta.rifaVendedorId);
        const allowedByReturnName = !!boleta.devueltaPorVendedorNombre &&
            scope.vendedorNombres.includes(boleta.devueltaPorVendedorNombre);
        if (!allowedByRelation && !allowedByReturnName) {
            throw new app_error_1.AppError('No tienes acceso a esta boleta.', 403, {
                errorCode: 'SCOPE_FORBIDDEN',
            });
        }
    }
    return boleta;
}
async function getOrCreateBoletaPublicLink(id, authUser) {
    const boleta = await getBoletaById(id, authUser);
    const token = await ensureBoletaPublicToken(boleta.id);
    return {
        token,
        path: `/publico/boletas/${token}`,
    };
}
async function getPublicBoletaFichaByToken(token) {
    const normalizedToken = token.trim();
    if (!normalizedToken) {
        throw new app_error_1.AppError('El token publico de la boleta es obligatorio.', 400);
    }
    const boleta = await prismaClient().boleta.findFirst({
        where: {
            publicToken: normalizedToken,
        },
        include: {
            rifa: {
                select: {
                    id: true,
                    nombre: true,
                    numeroCifras: true,
                    fechaFin: true,
                    precioBoleta: true,
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
            cliente: {
                select: {
                    nombre: true,
                    documento: true,
                    telefono: true,
                },
            },
            venta: {
                select: {
                    estado: true,
                    total: true,
                    saldoPendiente: true,
                    boletas: {
                        select: {
                            numero: true,
                        },
                        orderBy: {
                            numero: 'asc',
                        },
                    },
                    pagos: {
                        where: {
                            estado: 'CONFIRMADO',
                        },
                        select: {
                            monto: true,
                            fecha: true,
                            metodoPago: true,
                            descripcion: true,
                        },
                        orderBy: {
                            fecha: 'desc',
                        },
                    },
                },
            },
        },
    });
    if (!boleta) {
        throw new app_error_1.AppError('La ficha publica de la boleta no existe o ya no esta disponible.', 404);
    }
    const total = Number(boleta.venta?.total || boleta.precio || 0);
    const saldoPendiente = Number(boleta.venta?.saldoPendiente || 0);
    const totalAbonado = Math.max(0, total - saldoPendiente);
    const visualState = getPublicVisualState(boleta);
    return {
        token: normalizedToken,
        boleta: {
            numero: boleta.numero,
            estado: visualState,
            total,
            totalAbonado,
            saldoPendiente,
            juega: boleta.juega,
        },
        rifa: {
            id: boleta.rifa.id,
            nombre: boleta.rifa.nombre,
            numeroCifras: boleta.rifa.numeroCifras,
            fechaFin: boleta.rifa.fechaFin,
            precioBoleta: Number(boleta.rifa.precioBoleta || 0),
        },
        cliente: boleta.cliente
            ? {
                nombre: boleta.cliente.nombre,
                documento: maskDocument(boleta.cliente.documento),
                telefono: maskPhone(boleta.cliente.telefono),
            }
            : null,
        vendedor: boleta.rifaVendedor?.vendedor?.nombre || 'Canal no definido',
        historialPagos: (boleta.venta?.pagos || []).map((pago) => ({
            monto: Number(pago.monto || 0),
            fecha: pago.fecha,
            metodoPago: pago.metodoPago,
            descripcion: pago.descripcion || null,
        })),
        boletasRelacionadas: (boleta.venta?.boletas || []).map((item) => item.numero),
    };
}
async function updateBoleta(id, payload) {
    const prisma = prismaClient();
    const boleta = await getBoletaById(id);
    const hasClientOwnership = Boolean(boleta.clienteId || boleta.ventaId);
    const isCustomerState = ['RESERVADA', 'VENDIDA', 'PAGADA'].includes(boleta.estado);
    const isChangingRelation = payload.rifaVendedorId !== boleta.rifaVendedorId;
    const isClearingRelation = payload.estado === prisma_client_1.EstadoBoleta.DISPONIBLE || payload.rifaVendedorId === null;
    if ((hasClientOwnership || isCustomerState) && (isChangingRelation || isClearingRelation)) {
        throw new app_error_1.AppError('No puedes quitar ni cambiar el vendedor de una boleta que ya esta reservada, abonando o pagada por un cliente.', 409);
    }
    if (payload.estado === prisma_client_1.EstadoBoleta.DISPONIBLE) {
        return prisma.$transaction(async (tx) => {
            await tx.boletaPremio.deleteMany({
                where: {
                    boletaId: id,
                },
            });
            return tx.boleta.update({
                where: { id },
                data: {
                    estado: prisma_client_1.EstadoBoleta.DISPONIBLE,
                    rifaVendedorId: null,
                    juega: false,
                    devueltaPorVendedorNombre: null,
                    devueltaObservacion: null,
                },
                include: boletaInclude,
            });
        });
    }
    if (payload.estado === prisma_client_1.EstadoBoleta.ASIGNADA && !payload.rifaVendedorId) {
        throw new app_error_1.AppError('Para marcar una boleta como asignada debes seleccionar un vendedor.', 409);
    }
    if (payload.rifaVendedorId) {
        const relation = await prisma.rifaVendedor.findUnique({
            where: { id: payload.rifaVendedorId },
            select: {
                id: true,
                rifaId: true,
            },
        });
        if (!relation) {
            throw new app_error_1.AppError('La relacion rifa-vendedor seleccionada no existe.', 404);
        }
        if (relation.rifaId !== boleta.rifaId) {
            throw new app_error_1.AppError('La boleta solo se puede asignar a vendedores vinculados a la misma rifa.', 409);
        }
    }
    const requiresClearPremios = payload.estado === prisma_client_1.EstadoBoleta.DEVUELTA ||
        payload.estado === prisma_client_1.EstadoBoleta.ANULADA ||
        payload.rifaVendedorId !== boleta.rifaVendedorId;
    return prisma.$transaction(async (tx) => {
        if (requiresClearPremios) {
            await tx.boletaPremio.deleteMany({
                where: {
                    boletaId: id,
                },
            });
        }
        return tx.boleta.update({
            where: { id },
            data: {
                estado: payload.estado,
                rifaVendedorId: payload.rifaVendedorId,
                juega: typeof payload.juega === 'boolean'
                    ? payload.juega
                    : payload.estado === prisma_client_1.EstadoBoleta.PAGADA
                        ? true
                        : boleta.juega,
                ...(requiresClearPremios
                    ? {
                        juega: typeof payload.juega === 'boolean'
                            ? payload.juega
                            : payload.estado === prisma_client_1.EstadoBoleta.PAGADA
                                ? true
                                : boleta.juega,
                    }
                    : {}),
                ...(payload.estado !== prisma_client_1.EstadoBoleta.DEVUELTA
                    ? {
                        devueltaPorVendedorNombre: null,
                        devueltaObservacion: null,
                    }
                    : {}),
            },
            include: boletaInclude,
        });
    });
}
async function releaseBoletaFromCliente(id, authUser) {
    const prisma = prismaClient();
    const boleta = await getBoletaById(id, authUser);
    if (!boleta.ventaId || !boleta.clienteId) {
        throw new app_error_1.AppError('La boleta no esta vinculada a un cliente.', 409);
    }
    if (boleta.estado === prisma_client_1.EstadoBoleta.PAGADA) {
        throw new app_error_1.AppError('No puedes quitar una boleta ya pagada del cliente.', 409);
    }
    return prisma.$transaction(async (tx) => {
        const venta = await tx.venta.findUnique({
            where: { id: boleta.ventaId },
            include: {
                boletas: {
                    select: {
                        id: true,
                        precio: true,
                    },
                },
                pagos: {
                    where: {
                        estado: 'CONFIRMADO',
                    },
                    select: {
                        id: true,
                        monto: true,
                    },
                },
            },
        });
        if (!venta) {
            throw new app_error_1.AppError('La venta asociada a la boleta no existe.', 404);
        }
        const remainingBoletas = venta.boletas.filter((item) => item.id !== boleta.id);
        const nuevoTotal = remainingBoletas.reduce((sum, item) => sum.plus(item.precio), new prisma_client_1.Prisma.Decimal(0));
        const totalAbonado = venta.pagos.reduce((sum, item) => sum.plus(item.monto), new prisma_client_1.Prisma.Decimal(0));
        const nuevoSaldoRaw = Number(nuevoTotal.minus(totalAbonado).toFixed(2));
        const nuevoSaldo = new prisma_client_1.Prisma.Decimal(Math.max(0, nuevoSaldoRaw));
        const nuevoEstado = nuevoTotal.lte(0)
            ? prisma_client_1.EstadoVenta.CANCELADA
            : nuevoSaldo.lte(0)
                ? prisma_client_1.EstadoVenta.PAGADA
                : totalAbonado.gt(0)
                    ? prisma_client_1.EstadoVenta.ABONANDO
                    : prisma_client_1.EstadoVenta.PENDIENTE;
        await tx.boleta.update({
            where: { id: boleta.id },
            data: {
                estado: prisma_client_1.EstadoBoleta.ASIGNADA,
                clienteId: null,
                ventaId: null,
                reservadaHasta: null,
                juega: false,
            },
        });
        if (!remainingBoletas.length) {
            await tx.venta.update({
                where: { id: venta.id },
                data: {
                    estado: nuevoEstado,
                    total: nuevoTotal,
                    saldoPendiente: nuevoSaldo,
                },
            });
        }
        else {
            const estadoBoletasRestantes = nuevoEstado === prisma_client_1.EstadoVenta.PAGADA ? prisma_client_1.EstadoBoleta.PAGADA : totalAbonado.gt(0) ? prisma_client_1.EstadoBoleta.VENDIDA : prisma_client_1.EstadoBoleta.RESERVADA;
            await tx.venta.update({
                where: { id: venta.id },
                data: {
                    estado: nuevoEstado,
                    total: nuevoTotal,
                    saldoPendiente: nuevoSaldo,
                },
            });
            await tx.boleta.updateMany({
                where: {
                    id: {
                        in: remainingBoletas.map((item) => item.id),
                    },
                },
                data: {
                    estado: estadoBoletasRestantes,
                    juega: estadoBoletasRestantes === prisma_client_1.EstadoBoleta.PAGADA,
                },
            });
        }
        return tx.boleta.findUniqueOrThrow({
            where: { id: boleta.id },
            include: boletaInclude,
        });
    });
}
