import { Prisma } from '../../lib/prisma-client';
import { AppError } from '../../lib/app-error';
import { getPrisma } from '../../lib/prisma';
import { assertVendorCanAccessRifaVendedor, resolveVendorAccessScope } from '../auth/auth.scope';
import type {
  ClientePayload,
  ClienteVentaPagoPayload,
  ClienteVentaPayload,
} from './cliente.schemas';

function prismaClient() {
  const prisma = getPrisma();

  if (!prisma) {
    throw new AppError('DATABASE_URL no esta configurado en el backend.', 500);
  }

  return prisma;
}

const pagoClienteInclude = {
  usuario: {
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
    },
  },
  subCaja: {
    select: {
      id: true,
      nombre: true,
      caja: {
        select: {
          id: true,
          nombre: true,
        },
      },
    },
  },
  recibo: true,
} satisfies Prisma.PagoClienteInclude;

const pagoClienteReciboInclude = {
  pagoCliente: {
    include: {
      ...pagoClienteInclude,
      venta: {
        include: {
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
                  direccion: true,
                },
              },
            },
          },
          boletas: {
            select: {
              id: true,
              numero: true,
              precio: true,
              estado: true,
            },
            orderBy: {
              numero: 'asc',
            },
          },
        },
      },
    },
  },
} satisfies Prisma.PagoClienteReciboInclude;

function normalizeSegment(value: string) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 8);
}

function extractRifaSegment(rifaNombre: string) {
  const words = String(rifaNombre || '')
    .toUpperCase()
    .replace(/[^A-Z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) {
    return 'CLIENTE';
  }

  if (words.length === 1) {
    return normalizeSegment(words[0]);
  }

  return normalizeSegment(words.map((word) => word.charAt(0)).join('') || words[0]);
}

function extractDocumentoSegment(documento?: string | null) {
  const digits = String(documento || '').replace(/\D+/g, '');
  return (digits.slice(-4) || '0000').padStart(4, '0');
}

function extractValorSegment(valor: number) {
  return String(Math.round(valor)).padStart(4, '0');
}

function buildClientePagoCodigoUnico(input: {
  rifaNombre: string;
  documento?: string | null;
  consecutivo: number;
  valor: number;
}) {
  const rifaSegment = extractRifaSegment(input.rifaNombre);
  const documentoSegment = extractDocumentoSegment(input.documento);
  const consecutivoSegment = String(input.consecutivo).padStart(6, '0');
  const valorSegment = extractValorSegment(input.valor);

  return `CLI-${rifaSegment}-${documentoSegment}-${consecutivoSegment}-${valorSegment}`;
}

function buildClienteInclude(
  scope: Awaited<ReturnType<typeof resolveVendorAccessScope>>
) {
  return {
    createdByUsuario: {
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
      },
    },
    ventas: {
      ...(scope.restricted
        ? {
            where: {
              rifaVendedorId: {
                in: scope.rifaVendedorIds.length ? scope.rifaVendedorIds : [''],
              },
            },
          }
        : {}),
      select: {
        id: true,
        estado: true,
        total: true,
        saldoPendiente: true,
        createdAt: true,
        rifa: {
          select: {
            id: true,
            nombre: true,
          },
        },
        rifaVendedor: {
          select: {
            id: true,
            vendedor: {
              select: {
                id: true,
                nombre: true,
              },
            },
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
        pagos: {
          include: pagoClienteInclude,
          orderBy: {
            fecha: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    },
    boletas: {
      ...(scope.restricted
        ? {
            where: {
              rifaVendedorId: {
                in: scope.rifaVendedorIds.length ? scope.rifaVendedorIds : [''],
              },
            },
          }
        : {}),
      select: {
        id: true,
        numero: true,
        estado: true,
        rifa: {
          select: {
            id: true,
            nombre: true,
          },
        },
        rifaVendedor: {
          select: {
            id: true,
            vendedor: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
      },
      orderBy: {
        numero: 'asc',
      },
    },
    _count: {
      select: {
        ventas: true,
        boletas: true,
      },
    },
  } satisfies Prisma.ClienteInclude;
}

function getClienteWhereForScope(
  authUser: Express.Request['authUser'],
  scope: Awaited<ReturnType<typeof resolveVendorAccessScope>>,
  search?: string
): Prisma.ClienteWhereInput {
  const normalizedSearch = search?.trim();
  const clauses: Prisma.ClienteWhereInput[] = [];

  if (scope.restricted) {
    clauses.push({
      OR: [
        { createdByUsuarioId: authUser?.id || '' },
        {
          ventas: {
            some: {
              rifaVendedorId: {
                in: scope.rifaVendedorIds.length ? scope.rifaVendedorIds : [''],
              },
            },
          },
        },
        {
          boletas: {
            some: {
              rifaVendedorId: {
                in: scope.rifaVendedorIds.length ? scope.rifaVendedorIds : [''],
              },
            },
          },
        },
      ],
    });
  }

  if (normalizedSearch) {
    clauses.push({
      OR: [
        {
          nombre: {
            contains: normalizedSearch,
            mode: 'insensitive',
          },
        },
        {
          documento: {
            contains: normalizedSearch,
            mode: 'insensitive',
          },
        },
        {
          telefono: {
            contains: normalizedSearch,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: normalizedSearch,
            mode: 'insensitive',
          },
        },
      ],
    });
  }

  if (!clauses.length) {
    return {};
  }

  return {
    AND: clauses,
  };
}

export async function listClientes(
  authUser?: Express.Request['authUser'],
  filters?: {
    search?: string;
  }
) {
  const scope = await resolveVendorAccessScope(authUser);

  return prismaClient().cliente.findMany({
    where: getClienteWhereForScope(authUser, scope, filters?.search),
    include: buildClienteInclude(scope),
    orderBy: {
      nombre: 'asc',
    },
  });
}

export async function getClienteById(
  id: string,
  authUser?: Express.Request['authUser']
) {
  const scope = await resolveVendorAccessScope(authUser);
  const cliente = await prismaClient().cliente.findFirst({
    where: {
      id,
      ...getClienteWhereForScope(authUser, scope),
    },
    include: buildClienteInclude(scope),
  });

  if (!cliente) {
    throw new AppError('Cliente no encontrado.', 404);
  }

  return cliente;
}

export async function createCliente(
  payload: ClientePayload,
  authUser?: Express.Request['authUser']
) {
  return prismaClient().cliente.create({
    data: {
      ...payload,
      createdByUsuarioId: authUser?.id,
    },
    include: buildClienteInclude(await resolveVendorAccessScope(authUser)),
  });
}

export async function updateCliente(
  id: string,
  payload: ClientePayload,
  authUser?: Express.Request['authUser']
) {
  await getClienteById(id, authUser);

  return prismaClient().cliente.update({
    where: { id },
    data: payload,
    include: buildClienteInclude(await resolveVendorAccessScope(authUser)),
  });
}

export async function createVentaForCliente(
  clienteId: string,
  payload: ClienteVentaPayload,
  authUser?: Express.Request['authUser']
) {
  const prisma = prismaClient();
  await getClienteById(clienteId, authUser);
  await assertVendorCanAccessRifaVendedor(authUser, payload.rifaVendedorId);

  return prisma.$transaction(async (tx) => {
    const relation = await tx.rifaVendedor.findUnique({
      where: { id: payload.rifaVendedorId },
      include: {
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
    });

    if (!relation) {
      throw new AppError('La relacion rifa-vendedor no existe.', 404);
    }

    const boletas = await tx.boleta.findMany({
      where: {
        id: {
          in: payload.boletaIds,
        },
        rifaVendedorId: payload.rifaVendedorId,
      },
      select: {
        id: true,
        numero: true,
        precio: true,
        estado: true,
        clienteId: true,
        ventaId: true,
      },
      orderBy: {
        numero: 'asc',
      },
    });

    if (boletas.length !== payload.boletaIds.length) {
      throw new AppError(
        'Una o varias boletas no pertenecen a la relacion seleccionada.',
        409
      );
    }

    const notAssignable = boletas.find(
      (item) => item.estado !== 'ASIGNADA' || item.clienteId || item.ventaId
    );

    if (notAssignable) {
      throw new AppError(
        `La boleta ${notAssignable.numero} no esta disponible para asignarla a un cliente.`,
        409
      );
    }

    const total = boletas.reduce(
      (sum, item) => sum.plus(item.precio),
      new Prisma.Decimal(0)
    );

    const venta = await tx.venta.create({
      data: {
        clienteId,
        rifaId: relation.rifaId,
        rifaVendedorId: payload.rifaVendedorId,
        canalOrigen: payload.canalOrigen || null,
        referenciaExterna: payload.referenciaExterna || null,
        sesionExternaId: payload.sesionExternaId || null,
        estado: 'PENDIENTE',
        total,
        saldoPendiente: total,
      },
      select: {
        id: true,
      },
    });

    await tx.boleta.updateMany({
      where: {
        id: {
          in: boletas.map((item) => item.id),
        },
      },
      data: {
        clienteId,
        ventaId: venta.id,
        estado: 'RESERVADA',
        reservadaHasta: null,
        juega: false,
      },
    });

    return tx.cliente.findUniqueOrThrow({
      where: { id: clienteId },
      include: buildClienteInclude(await resolveVendorAccessScope(authUser)),
    });
  });
}

export async function createPagoForClienteVenta(
  clienteId: string,
  ventaId: string,
  payload: ClienteVentaPagoPayload,
  authUser?: Express.Request['authUser']
) {
  const prisma = prismaClient();
  await getClienteById(clienteId, authUser);

  return prisma.$transaction(async (tx) => {
    const venta = await tx.venta.findUnique({
      where: { id: ventaId },
      include: {
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
            vendedorId: true,
            vendedor: {
              select: {
                id: true,
                nombre: true,
                telefono: true,
                documento: true,
                direccion: true,
              },
            },
          },
        },
        boletas: {
          select: {
            id: true,
            numero: true,
            estado: true,
            precio: true,
          },
        },
      },
    });

    if (!venta || venta.clienteId !== clienteId) {
      throw new AppError('La venta del cliente no existe.', 404);
    }

    if (!venta.rifaVendedorId || !venta.rifaVendedor?.id) {
      throw new AppError(
        'La venta no tiene relacion rifa-vendedor asociada para registrar pagos operativos.',
        409
      );
    }

    await assertVendorCanAccessRifaVendedor(authUser, venta.rifaVendedorId);

    const saldoPendiente = Number(venta.saldoPendiente || 0);

    if (saldoPendiente <= 0) {
      throw new AppError('La venta ya se encuentra completamente pagada.', 409);
    }

    if (payload.monto > saldoPendiente) {
      throw new AppError(
        `El pago no puede ser mayor al saldo pendiente de la venta (${saldoPendiente}).`,
        409
      );
    }

    const subCaja = await tx.subCaja.findUnique({
      where: { id: payload.subCajaId },
      include: {
        caja: {
          select: {
            id: true,
            rifaId: true,
            nombre: true,
          },
        },
      },
    });

    if (!subCaja) {
      throw new AppError('La subcaja seleccionada no existe.', 404);
    }

    if (subCaja.caja.rifaId !== venta.rifaId) {
      throw new AppError('La subcaja seleccionada no pertenece a la rifa de la venta.', 409);
    }

    const fecha = payload.fecha || new Date();
    const monto = Number(payload.monto.toFixed(2));
    const saldoDespues = Number((saldoPendiente - monto).toFixed(2));
    const estadoVenta = saldoDespues <= 0 ? 'PAGADA' : 'ABONANDO';
    const estadoBoleta = saldoDespues <= 0 ? 'PAGADA' : 'VENDIDA';
    const ultimoRecibo = await tx.pagoClienteRecibo.findFirst({
      select: {
        consecutivo: true,
      },
      orderBy: {
        consecutivo: 'desc',
      },
    });
    const consecutivo = (ultimoRecibo?.consecutivo || 0) + 1;

    const pago = await tx.pagoCliente.create({
      data: {
        ventaId,
        monto,
        fecha,
        metodoPago: payload.metodoPago,
        estado: 'CONFIRMADO',
        descripcion: payload.descripcion,
        subCajaId: payload.subCajaId,
        usuarioId: authUser?.id,
      },
      include: pagoClienteInclude,
    });

    await tx.venta.update({
      where: { id: ventaId },
      data: {
        estado: estadoVenta,
        saldoPendiente: saldoDespues,
      },
    });

    await tx.boleta.updateMany({
      where: {
        ventaId,
      },
      data: {
        estado: estadoBoleta,
        juega: estadoBoleta === 'PAGADA',
        reservadaHasta: null,
      },
    });

    await Promise.all([
      tx.caja.update({
        where: { id: subCaja.caja.id },
        data: {
          saldo: {
            increment: monto,
          },
        },
      }),
      tx.subCaja.update({
        where: { id: payload.subCajaId },
        data: {
          saldo: {
            increment: monto,
          },
        },
      }),
    ]);

    await tx.movimientoCaja.create({
      data: {
        tipo: 'INGRESO',
        valor: monto,
        descripcion:
          payload.descripcion ||
          `Pago de cliente ${venta.cliente.nombre} sobre ${venta.rifa.nombre}`,
        fecha,
        cajaId: subCaja.caja.id,
        subCajaId: payload.subCajaId,
        rifaId: venta.rifaId,
        vendedorId: venta.rifaVendedor.vendedorId,
        clienteId: venta.clienteId,
        ventaId,
        pagoClienteId: pago.id,
        usuarioId: authUser?.id,
      },
    });

    return tx.pagoClienteRecibo.create({
      data: {
        pagoClienteId: pago.id,
        consecutivo,
        codigoUnico: buildClientePagoCodigoUnico({
          rifaNombre: venta.rifa.nombre,
          documento: venta.cliente.documento,
          consecutivo,
          valor: monto,
        }),
        fecha,
      },
      include: pagoClienteReciboInclude,
    });
  });
}

export async function listPagoClienteRecibos(
  authUser?: Express.Request['authUser']
) {
  const scope = await resolveVendorAccessScope(authUser);

  return prismaClient().pagoClienteRecibo.findMany({
    where: scope.restricted
      ? {
          pagoCliente: {
            venta: {
              rifaVendedorId: {
                in: scope.rifaVendedorIds.length ? scope.rifaVendedorIds : [''],
              },
            },
          },
        }
      : {},
    include: pagoClienteReciboInclude,
    orderBy: {
      fecha: 'desc',
    },
  });
}

export async function getPagoClienteReciboById(
  id: string,
  authUser?: Express.Request['authUser']
) {
  const recibo = await prismaClient().pagoClienteRecibo.findUnique({
    where: { id },
    include: pagoClienteReciboInclude,
  });

  if (!recibo) {
    throw new AppError('El recibo del cliente no existe.', 404);
  }

  if (recibo.pagoCliente.venta.rifaVendedor?.id) {
    await assertVendorCanAccessRifaVendedor(authUser, recibo.pagoCliente.venta.rifaVendedor.id);
  }

  return recibo;
}

export async function getPagoClienteReciboByCodigo(codigo: string) {
  const recibo = await prismaClient().pagoClienteRecibo.findUnique({
    where: { codigoUnico: codigo },
    include: pagoClienteReciboInclude,
  });

  if (!recibo) {
    throw new AppError('No existe un recibo de cliente con ese codigo.', 404);
  }

  return recibo;
}
