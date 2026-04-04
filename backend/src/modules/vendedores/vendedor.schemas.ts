import { AppError } from '../../lib/app-error';

type VendedorInput = {
  nombre?: unknown;
  telefono?: unknown;
  documento?: unknown;
  direccion?: unknown;
};

type VendedorAccessInput = {
  nombre?: unknown;
  email?: unknown;
  password?: unknown;
};

export type VendedorPayload = {
  nombre: string;
  telefono: string | null;
  documento: string | null;
  direccion: string | null;
};

export type VendedorAccessPayload = {
  nombre: string;
  email: string;
  password: string;
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

export function parseVendedorPayload(input: VendedorInput): VendedorPayload {
  return {
    nombre: parseRequiredString(input.nombre, 'nombre'),
    telefono: parseOptionalString(input.telefono),
    documento: parseOptionalString(input.documento),
    direccion: parseOptionalString(input.direccion),
  };
}

export function parseVendedorAccessPayload(
  input: VendedorAccessInput
): VendedorAccessPayload {
  const password = parseRequiredString(input.password, 'password');

  if (password.length < 8) {
    throw new AppError('La contrasena debe tener minimo 8 caracteres.');
  }

  return {
    nombre: parseRequiredString(input.nombre, 'nombre'),
    email: parseRequiredString(input.email, 'email'),
    password,
  };
}
