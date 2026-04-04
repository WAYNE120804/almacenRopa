import { createAuthToken } from '../../lib/auth-token';
import { AppError } from '../../lib/app-error';
import { verifyPassword } from '../../lib/password';
import { Prisma, RolUsuario } from '../../lib/prisma-client';
import { getPrisma } from '../../lib/prisma';
import { getOrCreateBoletaPublicLink, releaseBoletaFromCliente } from '../boletas/boleta.service';
import {
  createPagoForClienteVenta,
  createVentaForCliente,
  createCliente,
  getClienteById,
} from '../clientes/cliente.service';
import type {
  BotClienteEstadoQuery,
  BotClientePayload,
  BotDisponiblesQuery,
  BotLoginPayload,
  BotVentaLinkOpenPayload,
  BotVentaLinkPayload,
  BotVentaPagoPayload,
  BotVentaReservaPayload,
  BotVentaSeguimientoPayload,
} from './bot.schemas';
import { normalizeLoginIdentifier } from '../auth/auth.utils';
import { resolveVendorAccessScope } from '../auth/auth.scope';

const BOT_VENDOR_NAME = 'BOT';
const BOT_RESERVATION_TTL_MINUTES = 30;

const botScopeInclude = {
  vendedorScopes: {
    select: {
      vendedorId: true,
      rifaVendedorId: true,
      rifaVendedor: {
        select: {
          id: true,
          rifaId: true,
          rifa: {
            select: {
              id: true,
              nombre: true,
              precioBoleta: true,
              numeroCifras: true,
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
} satisfies Prisma.UsuarioInclude;

function prismaClient() {
  const prisma = getPrisma();

  if (!prisma) {
    throw new AppError('DATABASE_URL no esta configurado en el backend.', 500);
  }

  return prisma;
}

function isBotRelationName(value?: string | null) {
  return String(value || '').trim().toUpperCase() === BOT_VENDOR_NAME;
}

async function listBotRelationsForUser(authUser?: Express.Request['authUser']) {
  if (!authUser) {
    throw new AppError('Debes iniciar sesion para acceder a la API del bot.', 401, {
      errorCode: 'AUTH_REQUIRED',
    });
  }

  const scope = await resolveVendorAccessScope(authUser);

  if (!scope.restricted || scope.rifaVendedorIds.length === 0) {
    throw new AppError('Tu usuario no tiene alcance de supervisor BOT.', 403, {
      errorCode: 'BOT_SCOPE_REQUIRED',
    });
  }

  const relations = await prismaClient().rifaVendedor.findMany({
    where: {
      id: {
        in: scope.rifaVendedorIds,
      },
      vendedor: {
        nombre: BOT_VENDOR_NAME,
      },
    },
    select: {
      id: true,
      rifaId: true,
      rifa: {
        select: {
          id: true,
          nombre: true,
          precioBoleta: true,
          numeroCifras: true,
          estado: true,
        },
      },
      vendedor: {
        select: {
          id: true,
          nombre: true,
        },
      },
      _count: {
        select: {
          boletas: true,
          ventas: true,
        },
      },
    },
    orderBy: {
      rifa: {
        nombre: 'asc',
      },
    },
  });

  if (!relations.length) {
    throw new AppError('Tu usuario no tiene relaciones BOT asignadas.', 403, {
      errorCode: 'BOT_SCOPE_REQUIRED',
    });
  }

  return relations;
}

async function getBotRelationByRifaId(rifaId: string, authUser?: Express.Request['authUser']) {
  const relations = await listBotRelationsForUser(authUser);
  const relation = relations.find((item) => item.rifaId === rifaId);

  if (!relation) {
    throw new AppError('Tu usuario no tiene canal BOT asignado para esa rifa.', 403, {
      errorCode: 'BOT_SCOPE_FORBIDDEN',
    });
  }

  return relation;
}

async function upsertBotCliente(payload: BotClientePayload, authUser?: Express.Request['authUser']) {
  const prisma = prismaClient();
  const matchers = [
    ...(payload.documento ? [{ documento: payload.documento }] : []),
    ...(payload.email ? [{ email: payload.email }] : []),
    ...(payload.telefono ? [{ telefono: payload.telefono }] : []),
  ];

  const existing =
    matchers.length > 0
      ? await prisma.cliente.findFirst({
          where: {
            OR: matchers,
          },
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true,
            documento: true,
          },
        })
      : null;

  if (!existing) {
    return createCliente(payload, authUser);
  }

  return prisma.cliente.update({
    where: {
      id: existing.id,
    },
    data: {
      nombre: payload.nombre,
      email: payload.email,
      telefono: payload.telefono,
      documento: payload.documento,
    },
    select: {
      id: true,
      nombre: true,
      email: true,
      telefono: true,
      documento: true,
    },
  });
}

function buildBotVentaInclude() {
  return {
    cliente: {
      select: {
        id: true,
        nombre: true,
        documento: true,
        telefono: true,
        email: true,
      },
    },
    rifa: {
      select: {
        id: true,
        nombre: true,
        precioBoleta: true,
        numeroCifras: true,
      },
    },
    rifaVendedor: {
      select: {
        id: true,
        vendedor: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
            documento: true,
          },
        },
      },
    },
    boletas: {
      select: {
        id: true,
        numero: true,
        estado: true,
        publicToken: true,
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
      },
      orderBy: {
        fecha: 'desc',
      },
    },
  } satisfies Prisma.VentaInclude;
}

async function serializeVentaForBot(
  venta: Prisma.VentaGetPayload<{ include: ReturnType<typeof buildBotVentaInclude> }>,
  authUser?: Express.Request['authUser']
) {
  const boletas = await Promise.all(
    venta.boletas.map(async (boleta) => {
      const link = await getOrCreateBoletaPublicLink(boleta.id, authUser);

      return {
        id: boleta.id,
        numero: boleta.numero,
        estado: boleta.estado,
        publicToken: link.token,
        publicPath: link.path,
      };
    })
  );

  return {
    id: venta.id,
    estado: venta.estado,
    total: Number(venta.total || 0),
    saldoPendiente: Number(venta.saldoPendiente || 0),
    canalOrigen: venta.canalOrigen,
    referenciaExterna: venta.referenciaExterna,
    sesionExternaId: venta.sesionExternaId,
    createdAt: venta.createdAt,
    updatedAt: venta.updatedAt,
    cliente: venta.cliente,
    rifa: venta.rifa,
    rifaVendedor: venta.rifaVendedor,
    boletas,
    pagos: venta.pagos.map((pago) => ({
      id: pago.id,
      monto: Number(pago.monto || 0),
      fecha: pago.fecha,
      metodoPago: pago.metodoPago,
      descripcion: pago.descripcion,
      recibo: pago.recibo,
    })),
  };
}

async function getVentaBotById(ventaId: string, authUser?: Express.Request['authUser']) {
  const relations = await listBotRelationsForUser(authUser);
  const relationIds = relations.map((item) => item.id);
  const venta = await prismaClient().venta.findFirst({
    where: {
      id: ventaId,
      rifaVendedorId: {
        in: relationIds,
      },
      rifaVendedor: {
        vendedor: {
          nombre: BOT_VENDOR_NAME,
        },
      },
    },
    include: buildBotVentaInclude(),
  });

  if (!venta) {
    throw new AppError('La venta BOT no existe o no pertenece a tu alcance.', 404);
  }

  return venta;
}

export async function loginBotSupervisor(payload: BotLoginPayload) {
  const usuario = await prismaClient().usuario.findUnique({
    where: {
      email: normalizeLoginIdentifier(payload.identifier),
    },
    include: botScopeInclude,
  });

  if (!usuario || !verifyPassword(payload.password, usuario.password)) {
    throw new AppError('Credenciales BOT incorrectas.', 401, {
      errorCode: 'INVALID_CREDENTIALS',
    });
  }

  if (!usuario.activo) {
    throw new AppError('Tu usuario BOT esta inactivo.', 403, {
      errorCode: 'USER_DISABLED',
    });
  }

  if (usuario.rol !== RolUsuario.VENDEDOR) {
    throw new AppError('La API del bot solo permite usuarios operativos con alcance BOT.', 403, {
      errorCode: 'BOT_ROLE_REQUIRED',
    });
  }

  const botScopes = (usuario.vendedorScopes || [])
    .map((scope) => scope.rifaVendedor)
    .filter((scope) => scope && isBotRelationName(scope.vendedor?.nombre));

  if (!botScopes.length) {
    throw new AppError('El usuario no tiene scopes BOT asignados.', 403, {
      errorCode: 'BOT_SCOPE_REQUIRED',
    });
  }

  return {
    token: createAuthToken({
      sub: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    }),
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      botScopes: botScopes.map((scope) => ({
        rifaVendedorId: scope!.id,
        rifaId: scope!.rifaId,
        rifaNombre: scope!.rifa?.nombre || null,
        vendedorNombre: scope!.vendedor?.nombre || null,
      })),
    },
  };
}

export async function listBotRelations(authUser?: Express.Request['authUser']) {
  const relations = await listBotRelationsForUser(authUser);

  return relations.map((relation) => ({
    id: relation.id,
    rifaId: relation.rifaId,
    rifa: relation.rifa,
    vendedor: relation.vendedor,
    counts: {
      boletas: relation._count.boletas,
      ventas: relation._count.ventas,
    },
  }));
}

export async function listBotAvailableBoletas(
  query: BotDisponiblesQuery,
  authUser?: Express.Request['authUser']
) {
  const relation = await getBotRelationByRifaId(query.rifaId, authUser);
  const boletas = await prismaClient().boleta.findMany({
    where: {
      rifaId: query.rifaId,
      rifaVendedorId: relation.id,
      estado: 'ASIGNADA',
      clienteId: null,
      ventaId: null,
      ...(query.numero
        ? {
            numero: {
              contains: query.numero,
            },
          }
        : {}),
    },
    select: {
      id: true,
      numero: true,
      precio: true,
      updatedAt: true,
    },
    orderBy: {
      numero: 'asc',
    },
    take: query.limit,
  });

  return {
    relation: {
      id: relation.id,
      rifaId: relation.rifaId,
      rifaNombre: relation.rifa.nombre,
      vendedorNombre: relation.vendedor.nombre,
    },
    total: boletas.length,
    items: boletas.map((boleta) => ({
      id: boleta.id,
      numero: boleta.numero,
      precio: Number(boleta.precio || 0),
      updatedAt: boleta.updatedAt,
    })),
  };
}

export async function upsertBotClienteRecord(
  payload: BotClientePayload,
  authUser?: Express.Request['authUser']
) {
  return upsertBotCliente(payload, authUser);
}

export async function getBotClienteEstado(
  query: BotClienteEstadoQuery,
  authUser?: Express.Request['authUser']
) {
  const relations = await listBotRelationsForUser(authUser);
  const relationIds = relations.map((item) => item.id);
  const normalizedSearch = query.search.trim();

  const cliente = await prismaClient().cliente.findFirst({
    where: {
      OR: [
        { documento: normalizedSearch },
        { telefono: normalizedSearch },
        { email: normalizedSearch.toLowerCase() },
        { nombre: { contains: normalizedSearch, mode: 'insensitive' } },
      ],
      ventas: {
        some: {
          rifaVendedorId: {
            in: relationIds,
          },
        },
      },
    },
    select: {
      id: true,
      nombre: true,
      documento: true,
      telefono: true,
      email: true,
      ventas: {
        where: {
          rifaVendedorId: {
            in: relationIds,
          },
        },
        include: buildBotVentaInclude(),
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });

  if (!cliente) {
    throw new AppError('No existe un cliente BOT con ese criterio dentro de tu alcance.', 404);
  }

  return {
    id: cliente.id,
    nombre: cliente.nombre,
    documento: cliente.documento,
    telefono: cliente.telefono,
    email: cliente.email,
    ventas: await Promise.all(
      cliente.ventas.map((venta) => serializeVentaForBot(venta, authUser))
    ),
  };
}

export async function createBotVentaReserva(
  payload: BotVentaReservaPayload,
  authUser?: Express.Request['authUser']
) {
  const relation = await getBotRelationByRifaId(payload.rifaId, authUser);
  const cliente = await upsertBotCliente(payload.cliente, authUser);
  const updatedCliente = await createVentaForCliente(
    cliente.id,
    {
      rifaVendedorId: relation.id,
      boletaIds: payload.boletaIds,
      canalOrigen: 'BOT',
      referenciaExterna: payload.referenciaExterna,
      sesionExternaId: payload.sesionExternaId,
    },
    authUser
  );

  const venta = updatedCliente.ventas.find(
    (item) =>
      item.rifaVendedor?.id === relation.id &&
      item.boletas.length === payload.boletaIds.length &&
      payload.boletaIds.every((boletaId) => item.boletas.some((boleta) => boleta.id === boletaId))
  );

  if (!venta) {
    throw new AppError('La reserva BOT se creo, pero no se pudo reconstruir su detalle.', 500);
  }

  const reservadaHasta = new Date(Date.now() + BOT_RESERVATION_TTL_MINUTES * 60 * 1000);

  await prismaClient().boleta.updateMany({
    where: {
      ventaId: venta.id,
      estado: 'RESERVADA',
    },
    data: {
      reservadaHasta,
    },
  });

  return serializeVentaForBot(await getVentaBotById(venta.id, authUser), authUser);
}

export async function getBotVenta(ventaId: string, authUser?: Express.Request['authUser']) {
  return serializeVentaForBot(await getVentaBotById(ventaId, authUser), authUser);
}

export async function registerBotVentaPago(
  ventaId: string,
  payload: BotVentaPagoPayload,
  authUser?: Express.Request['authUser']
) {
  const venta = await getVentaBotById(ventaId, authUser);
  await createPagoForClienteVenta(venta.cliente.id, ventaId, payload, authUser);
  return serializeVentaForBot(await getVentaBotById(ventaId, authUser), authUser);
}

export async function releaseBotBoleta(
  boletaId: string,
  authUser?: Express.Request['authUser']
) {
  const boleta = await releaseBoletaFromCliente(boletaId, authUser);

  return {
    id: boleta.id,
    numero: boleta.numero,
    estado: boleta.estado,
    clienteId: boleta.cliente?.id || null,
    ventaId: boleta.venta?.id || null,
  };
}

export async function getBotCliente(clienteId: string, authUser?: Express.Request['authUser']) {
  return getClienteById(clienteId, authUser);
}

export async function markBotVentaLinkSent(
  ventaId: string,
  payload: BotVentaLinkPayload,
  authUser?: Express.Request['authUser']
) {
  await getVentaBotById(ventaId, authUser);

  await prismaClient().venta.update({
    where: { id: ventaId },
    data: {
      linkPagoUrl: payload.linkPagoUrl,
      linkPagoEnviadoAt: payload.enviadoAt || new Date(),
    },
  });

  return serializeVentaForBot(await getVentaBotById(ventaId, authUser), authUser);
}

export async function markBotVentaLinkOpened(
  ventaId: string,
  payload: BotVentaLinkOpenPayload,
  authUser?: Express.Request['authUser']
) {
  await getVentaBotById(ventaId, authUser);

  await prismaClient().venta.update({
    where: { id: ventaId },
    data: {
      linkPagoAbiertoAt: payload.abiertoAt || new Date(),
    },
  });

  return serializeVentaForBot(await getVentaBotById(ventaId, authUser), authUser);
}

export async function updateBotVentaSeguimiento(
  ventaId: string,
  payload: BotVentaSeguimientoPayload,
  authUser?: Express.Request['authUser']
) {
  await getVentaBotById(ventaId, authUser);

  await prismaClient().venta.update({
    where: { id: ventaId },
    data: {
      requiereSeguimientoHumano: payload.requiereSeguimientoHumano,
      seguimientoMotivo: payload.requiereSeguimientoHumano
        ? payload.seguimientoMotivo
        : null,
    },
  });

  return serializeVentaForBot(await getVentaBotById(ventaId, authUser), authUser);
}
