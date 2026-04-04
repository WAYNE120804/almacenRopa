import { AppError } from '../../lib/app-error';
import type { ClientePayload, ClienteVentaPagoPayload } from '../clientes/cliente.schemas';

type BotLoginInput = {
  identifier?: unknown;
  password?: unknown;
};

type BotDisponiblesQueryInput = {
  rifaId?: unknown;
  numero?: unknown;
  limit?: unknown;
};

type BotClienteEstadoQueryInput = {
  search?: unknown;
};

type BotClientePayloadInput = {
  nombre?: unknown;
  email?: unknown;
  telefono?: unknown;
  documento?: unknown;
};

type BotVentaReservaInput = {
  rifaId?: unknown;
  boletaIds?: unknown;
  cliente?: unknown;
  referenciaExterna?: unknown;
  sesionExternaId?: unknown;
};

type BotVentaPagoInput = {
  subCajaId?: unknown;
  monto?: unknown;
  fecha?: unknown;
  descripcion?: unknown;
  metodoPago?: unknown;
};

type BotVentaLinkPayloadInput = {
  linkPagoUrl?: unknown;
  enviadoAt?: unknown;
};

type BotVentaLinkOpenPayloadInput = {
  abiertoAt?: unknown;
};

type BotVentaSeguimientoPayloadInput = {
  requiereSeguimientoHumano?: unknown;
  seguimientoMotivo?: unknown;
};

export type BotLoginPayload = {
  identifier: string;
  password: string;
};

export type BotDisponiblesQuery = {
  rifaId: string;
  numero?: string;
  limit: number;
};

export type BotClienteEstadoQuery = {
  search: string;
};

export type BotClientePayload = ClientePayload;

export type BotVentaReservaPayload = {
  rifaId: string;
  boletaIds: string[];
  cliente: BotClientePayload;
  referenciaExterna?: string | null;
  sesionExternaId?: string | null;
};

export type BotVentaPagoPayload = ClienteVentaPagoPayload;

export type BotVentaLinkPayload = {
  linkPagoUrl: string;
  enviadoAt?: Date;
};

export type BotVentaLinkOpenPayload = {
  abiertoAt?: Date;
};

export type BotVentaSeguimientoPayload = {
  requiereSeguimientoHumano: boolean;
  seguimientoMotivo: string | null;
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

function parseOptionalSearchString(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length ? normalized : undefined;
}

function parsePositiveInteger(value: unknown, fieldName: string, fallback: number) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const numericValue = Number(value);

  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    throw new AppError(`El campo "${fieldName}" debe ser un entero mayor a 0.`);
  }

  return numericValue;
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

function parseMetodoPago(value: unknown): BotVentaPagoPayload['metodoPago'] {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError('El campo "metodoPago" es obligatorio.');
  }

  const metodoPago = value.trim().toUpperCase() as BotVentaPagoPayload['metodoPago'];

  if (!['EFECTIVO', 'NEQUI', 'DAVIPLATA', 'TRANSFERENCIA', 'WOMPI'].includes(metodoPago)) {
    throw new AppError('El metodo de pago no es valido.');
  }

  return metodoPago;
}

export function parseBotLoginPayload(input: BotLoginInput): BotLoginPayload {
  return {
    identifier: parseRequiredString(input.identifier, 'identifier'),
    password: parseRequiredString(input.password, 'password'),
  };
}

export function parseBotDisponiblesQuery(input: BotDisponiblesQueryInput): BotDisponiblesQuery {
  return {
    rifaId: parseRequiredString(input.rifaId, 'rifaId'),
    numero: parseOptionalSearchString(input.numero),
    limit: Math.min(parsePositiveInteger(input.limit, 'limit', 50), 200),
  };
}

export function parseBotClienteEstadoQuery(
  input: BotClienteEstadoQueryInput
): BotClienteEstadoQuery {
  return {
    search: parseRequiredString(input.search, 'search'),
  };
}

export function parseBotClientePayload(input: BotClientePayloadInput): BotClientePayload {
  return {
    nombre: parseRequiredString(input.nombre, 'nombre'),
    email: parseOptionalString(input.email),
    telefono: parseOptionalString(input.telefono),
    documento: parseOptionalString(input.documento),
  };
}

export function parseBotVentaReservaPayload(
  input: BotVentaReservaInput
): BotVentaReservaPayload {
  if (!Array.isArray(input.boletaIds) || input.boletaIds.length === 0) {
    throw new AppError('Debes enviar al menos una boleta para reservar.');
  }

  const boletaIds = input.boletaIds
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean);

  if (!boletaIds.length) {
    throw new AppError('Debes enviar al menos una boleta valida para reservar.');
  }

  if (!input.cliente || typeof input.cliente !== 'object') {
    throw new AppError('Debes enviar los datos del cliente para la reserva.');
  }

  return {
    rifaId: parseRequiredString(input.rifaId, 'rifaId'),
    boletaIds: [...new Set(boletaIds)],
    cliente: parseBotClientePayload(input.cliente as BotClientePayloadInput),
    referenciaExterna: parseOptionalString(input.referenciaExterna),
    sesionExternaId: parseOptionalString(input.sesionExternaId),
  };
}

export function parseBotVentaPagoPayload(input: BotVentaPagoInput): BotVentaPagoPayload {
  return {
    subCajaId: parseRequiredString(input.subCajaId, 'subCajaId'),
    monto: parseRequiredPositiveNumber(input.monto, 'monto'),
    fecha: parseOptionalDate(input.fecha, 'fecha'),
    descripcion: parseOptionalString(input.descripcion) || undefined,
    metodoPago: parseMetodoPago(input.metodoPago),
  };
}

export function parseBotVentaLinkPayload(input: BotVentaLinkPayloadInput): BotVentaLinkPayload {
  return {
    linkPagoUrl: parseRequiredString(input.linkPagoUrl, 'linkPagoUrl'),
    enviadoAt: parseOptionalDate(input.enviadoAt, 'enviadoAt'),
  };
}

export function parseBotVentaLinkOpenPayload(
  input: BotVentaLinkOpenPayloadInput
): BotVentaLinkOpenPayload {
  return {
    abiertoAt: parseOptionalDate(input.abiertoAt, 'abiertoAt'),
  };
}

export function parseBotVentaSeguimientoPayload(
  input: BotVentaSeguimientoPayloadInput
): BotVentaSeguimientoPayload {
  return {
    requiereSeguimientoHumano: Boolean(input.requiereSeguimientoHumano),
    seguimientoMotivo: parseOptionalString(input.seguimientoMotivo),
  };
}
