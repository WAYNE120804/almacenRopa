import { AppError } from '../../lib/app-error';

type ClienteInput = {
  nombre?: unknown;
  email?: unknown;
  telefono?: unknown;
  documento?: unknown;
};

type ClienteVentaInput = {
  rifaVendedorId?: unknown;
  boletaIds?: unknown;
};

type ClienteVentaPagoInput = {
  subCajaId?: unknown;
  monto?: unknown;
  fecha?: unknown;
  descripcion?: unknown;
  metodoPago?: unknown;
};

export type ClientePayload = {
  nombre: string;
  email: string | null;
  telefono: string | null;
  documento: string | null;
};

export type ClienteVentaPayload = {
  rifaVendedorId: string;
  boletaIds: string[];
  canalOrigen?: string | null;
  referenciaExterna?: string | null;
  sesionExternaId?: string | null;
};

export type ClienteVentaPagoPayload = {
  subCajaId: string;
  monto: number;
  fecha?: Date;
  descripcion?: string;
  metodoPago: 'EFECTIVO' | 'NEQUI' | 'DAVIPLATA' | 'TRANSFERENCIA' | 'WOMPI';
};

function parseRequiredString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(`El campo "${fieldName}" es obligatorio.`);
  }

  return value.trim();
}

function parseOptionalString(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new AppError('Los campos opcionales deben ser texto.');
  }

  const normalized = value.trim();
  return normalized.length ? normalized : null;
}

function parseRequiredPositiveNumber(value: unknown, fieldName: string) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    throw new AppError(`El campo "${fieldName}" debe ser un numero mayor a 0.`);
  }

  return Number(numericValue.toFixed(2));
}

function parseOptionalDate(value: unknown, fieldName: string) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const rawValue = String(value).trim();
  const dateOnlyMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    const now = new Date();
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds(),
      now.getMilliseconds()
    );

    if (Number.isNaN(date.getTime())) {
      throw new AppError(`El campo "${fieldName}" debe ser una fecha valida.`);
    }

    return date;
  }

  const date = new Date(rawValue);

  if (Number.isNaN(date.getTime())) {
    throw new AppError(`El campo "${fieldName}" debe ser una fecha valida.`);
  }

  return date;
}

function parseMetodoPago(value: unknown): ClienteVentaPagoPayload['metodoPago'] {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError('El campo "metodoPago" es obligatorio.');
  }

  const metodoPago = value.trim().toUpperCase() as ClienteVentaPagoPayload['metodoPago'];

  if (!['EFECTIVO', 'NEQUI', 'DAVIPLATA', 'TRANSFERENCIA', 'WOMPI'].includes(metodoPago)) {
    throw new AppError('El metodo de pago no es valido.');
  }

  return metodoPago;
}

export function parseClientePayload(input: ClienteInput): ClientePayload {
  return {
    nombre: parseRequiredString(input.nombre, 'nombre'),
    email: parseOptionalString(input.email),
    telefono: parseOptionalString(input.telefono),
    documento: parseOptionalString(input.documento),
  };
}

export function parseClienteVentaPayload(input: ClienteVentaInput): ClienteVentaPayload {
  const rifaVendedorId = parseRequiredString(input.rifaVendedorId, 'rifaVendedorId');

  if (!Array.isArray(input.boletaIds) || input.boletaIds.length === 0) {
    throw new AppError('Debes enviar al menos una boleta para asignar al cliente.');
  }

  const boletaIds = input.boletaIds
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean);

  if (!boletaIds.length) {
    throw new AppError('Debes enviar al menos una boleta valida para asignar al cliente.');
  }

  return {
    rifaVendedorId,
    boletaIds: [...new Set(boletaIds)],
  };
}

export function parseClienteVentaPagoPayload(
  input: ClienteVentaPagoInput
): ClienteVentaPagoPayload {
  return {
    subCajaId: parseRequiredString(input.subCajaId, 'subCajaId'),
    monto: parseRequiredPositiveNumber(input.monto, 'monto'),
    fecha: parseOptionalDate(input.fecha, 'fecha'),
    descripcion: parseOptionalString(input.descripcion),
    metodoPago: parseMetodoPago(input.metodoPago),
  };
}
