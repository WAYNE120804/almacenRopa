import { Prisma } from '../../lib/prisma-client';

import { AppError } from '../../lib/app-error';
import { getPrisma } from '../../lib/prisma';
import { assertVendorCanAccessRifa, resolveVendorAccessScope } from '../auth/auth.scope';
import type { RifaPayload } from './rifa.schemas';

const rifaListSelect = {
  id: true,
  nombre: true,
  loteriaNombre: true,
  numeroCifras: true,
  fechaInicio: true,
  fechaFin: true,
  precioBoleta: true,
  estado: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      vendedores: true,
      boletas: true,
      premios: true,
    },
  },
} as Prisma.RifaSelect;

const rifaDetailInclude = {
  vendedores: {
    select: {
      id: true,
      comisionPct: true,
      precioCasa: true,
      saldoActual: true,
      vendedor: {
        select: {
          id: true,
          nombre: true,
          telefono: true,
          documento: true,
        },
      },
    },
    orderBy: {
      vendedor: {
        nombre: 'asc',
      },
    },
  },
  cajas: {
    select: {
      id: true,
      nombre: true,
      saldo: true,
    },
    orderBy: {
      nombre: 'asc',
    },
  },
  premios: {
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      imagenesJson: true,
      tipo: true,
      mostrarValor: true,
      valor: true,
      fecha: true,
      _count: {
        select: {
          boletas: true,
        },
      },
    },
    orderBy: [{ fecha: 'asc' }, { nombre: 'asc' }],
  },
  _count: {
    select: {
      vendedores: true,
      boletas: true,
      premios: true,
      gastos: true,
      ventas: true,
    },
  },
} as Prisma.RifaInclude;

function prismaClient() {
  const prisma = getPrisma();

  if (!prisma) {
    throw new AppError('DATABASE_URL no esta configurado en el backend.', 500);
  }

  return prisma;
}

function buildBoletas(rifaId: string, numeroCifras: number, precioBoleta: number) {
  const total = 10 ** numeroCifras;
  const boletas = [];

  for (let index = 0; index < total; index += 1) {
    boletas.push({
      rifaId,
      numero: String(index).padStart(numeroCifras, '0'),
      precio: precioBoleta,
    });
  }

  return boletas;
}

export async function listRifas(authUser?: Express.Request['authUser']) {
  const scope = await resolveVendorAccessScope(authUser);

  return prismaClient().rifa.findMany({
    where: {
      ...(scope.restricted ? { id: { in: scope.rifaIds } } : {}),
    },
    select: rifaListSelect,
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function listPublicRifas() {
  return prismaClient().rifa.findMany({
    where: {
      estado: 'ACTIVA',
    },
    select: rifaListSelect,
    orderBy: {
      fechaFin: 'asc',
    },
  });
}

export async function getRifaById(id: string, authUser?: Express.Request['authUser']) {
  await assertVendorCanAccessRifa(authUser, id);
  const rifa = await prismaClient().rifa.findUnique({
    where: { id },
    include: rifaDetailInclude,
  });

  if (!rifa) {
    throw new AppError('Rifa no encontrada.', 404);
  }

  return rifa;
}

export async function getRifaCierreVendedores(
  id: string,
  authUser?: Express.Request['authUser']
) {
  await assertVendorCanAccessRifa(authUser, id);

  const rifa = await prismaClient().rifa.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      precioBoleta: true,
    },
  });

  if (!rifa) {
    throw new AppError('Rifa no encontrada.', 404);
  }

  const relaciones = await prismaClient().rifaVendedor.findMany({
    where: { rifaId: id },
    include: {
      vendedor: {
        select: {
          id: true,
          nombre: true,
          documento: true,
          telefono: true,
          direccion: true,
        },
      },
      asignaciones: {
        select: {
          id: true,
          cantidad: true,
          fecha: true,
          detalle: {
            select: {
              id: true,
            },
          },
        },
      },
      devoluciones: {
        select: {
          id: true,
          destino: true,
          fecha: true,
          detalle: {
            select: {
              id: true,
            },
          },
        },
      },
      abonos: {
        where: {
          estado: 'CONFIRMADO',
          anuladoAt: null,
        },
        select: {
          id: true,
          valor: true,
          fecha: true,
          descripcion: true,
          metodoPago: true,
          estado: true,
          saldoAnterior: true,
          saldoDespues: true,
          boletasActuales: true,
          usuario: {
            select: {
              id: true,
              nombre: true,
              email: true,
            },
          },
          subCaja: {
            select: {
              id: true,
              nombre: true,
            },
          },
          recibo: {
            select: {
              id: true,
              consecutivo: true,
              codigoUnico: true,
            },
          },
        },
        orderBy: {
          fecha: 'asc',
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
    orderBy: {
      vendedor: {
        nombre: 'asc',
      },
    },
  });

  return relaciones.map((relacion) => {
    const totalBoletas = relacion.asignaciones.reduce(
      (sum, asignacion) => sum + (asignacion.detalle.length || asignacion.cantidad || 0),
      0
    );
    const devolucion = relacion.devoluciones.reduce(
      (sum, devolucionItem) => sum + devolucionItem.detalle.length,
      0
    );
    const boletasActuales = Math.max(0, totalBoletas - devolucion);
    const precioCasa = Number(relacion.precioCasa || 0);
    const deudaTotal = Number((boletasActuales * precioCasa).toFixed(2));
    const totalAbonos = Number(
      relacion.abonos
        .reduce((sum, abono) => sum + Number(abono.valor || 0), 0)
        .toFixed(2)
    );
    const deudaActual = Number((deudaTotal - totalAbonos).toFixed(2));

    return {
      rifa: {
        id: rifa.id,
        nombre: rifa.nombre,
        precioBoleta: Number(rifa.precioBoleta || 0),
      },
      rifaVendedorId: relacion.id,
      vendedorId: relacion.vendedorId,
      vendedor: relacion.vendedor,
      vendedorNombre: relacion.vendedor?.nombre || 'Sin vendedor',
      comisionPct: Number(relacion.comisionPct || 0),
      precioCasa,
      totalBoletas,
      devolucion,
      boletasActuales,
      boletasActualesSistema: relacion.boletas.length,
      deudaTotal,
      totalAbonos,
      deudaActual,
      boletas: relacion.boletas.map((boleta) => ({
        id: boleta.id,
        numero: boleta.numero,
        estado: boleta.estado,
      })),
      abonos: relacion.abonos.map((abono, index) => ({
        id: abono.id,
        numero: index + 1,
        valor: Number(abono.valor || 0),
        fecha: abono.fecha,
        descripcion: abono.descripcion,
        metodoPago: abono.metodoPago,
        estado: abono.estado,
        saldoAnterior: Number(abono.saldoAnterior || 0),
        saldoDespues: Number(abono.saldoDespues || 0),
        boletasActuales: abono.boletasActuales,
        usuario: abono.usuario,
        subCaja: abono.subCaja,
        recibo: abono.recibo,
      })),
      asignaciones: relacion.asignaciones.map((asignacion) => ({
        id: asignacion.id,
        fecha: asignacion.fecha,
        cantidad: asignacion.detalle.length || asignacion.cantidad,
      })),
      devoluciones: relacion.devoluciones.map((devolucionItem) => ({
        id: devolucionItem.id,
        fecha: devolucionItem.fecha,
        destino: devolucionItem.destino,
        cantidad: devolucionItem.detalle.length,
      })),
    };
  });
}

export async function createRifa(payload: RifaPayload) {
  const prisma = prismaClient();

  return prisma.$transaction(async (tx) => {
    const rifa = await tx.rifa.create({
      data: payload,
      include: rifaDetailInclude,
    });

    const boletas = buildBoletas(
      rifa.id,
      payload.numeroCifras,
      payload.precioBoleta
    );

    await tx.boleta.createMany({
      data: boletas,
    });

    await tx.caja.create({
      data: {
        nombre: 'Caja principal',
        saldo: 0,
        rifaId: rifa.id,
      },
    });

    return tx.rifa.findUniqueOrThrow({
      where: { id: rifa.id },
      include: rifaDetailInclude,
    });
  });
}

export async function updateRifa(id: string, payload: RifaPayload) {
  const existing = await getRifaById(id);

  if (
    existing.numeroCifras !== payload.numeroCifras &&
    existing._count.boletas > 0
  ) {
    throw new AppError(
      'No se puede cambiar el numero de cifras porque la rifa ya tiene boletas generadas.',
      409
    );
  }

  return prismaClient().rifa.update({
    where: { id },
    data: payload,
    include: rifaDetailInclude,
  });
}

export async function deleteRifa(id: string) {
  const prisma = prismaClient();
  const rifa = await getRifaById(id);

  if (rifa._count.boletas > 0 || rifa._count.vendedores > 0 || rifa._count.ventas > 0) {
    throw new AppError(
      'La rifa no se puede eliminar porque ya tiene boletas, vendedores o ventas asociadas.',
      409
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.caja.deleteMany({
      where: { rifaId: id },
    });

    await tx.rifa.delete({
      where: { id },
    });
  });
}
