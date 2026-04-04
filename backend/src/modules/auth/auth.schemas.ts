import { RolUsuario } from '../../lib/prisma-client';
import { AppError } from '../../lib/app-error';

type LoginInput = {
  email?: unknown;
  identificador?: unknown;
  password?: unknown;
};

type UsuarioInput = {
  nombre?: unknown;
  email?: unknown;
  password?: unknown;
  rol?: unknown;
  vendedorIds?: unknown;
  rifaVendedorIds?: unknown;
};

export type LoginPayload = {
  identifier: string;
  password: string;
};

export type UsuarioPayload = {
  nombre: string;
  email: string;
  password: string;
  rol: RolUsuario;
  vendedorIds: string[];
  rifaVendedorIds: string[];
};

export type UsuarioScopesPayload = {
  vendedorIds: string[];
  rifaVendedorIds: string[];
};

function parseRequiredString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(`El campo "${fieldName}" es obligatorio.`);
  }

  return value.trim();
}

function parseIdentifier(value: unknown, fieldName: string) {
  return parseRequiredString(value, fieldName);
}

function parsePassword(value: unknown) {
  const password = parseRequiredString(value, 'password');

  if (password.length < 8) {
    throw new AppError('La contrasena debe tener minimo 8 caracteres.');
  }

  return password;
}

function parseRol(value: unknown) {
  if (typeof value !== 'string' || !(value in RolUsuario)) {
    throw new AppError('El rol seleccionado no es valido.');
  }

  return value as RolUsuario;
}

function parseIdList(value: unknown, fieldName: string) {
  if (typeof value === 'undefined' || value === null || value === '') {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new AppError(`El campo "${fieldName}" debe ser una lista valida.`);
  }

  const values = value
    .map((item) => {
      if (typeof item !== 'string' || item.trim().length === 0) {
        throw new AppError(`El campo "${fieldName}" contiene un identificador invalido.`);
      }

      return item.trim();
    });

  return [...new Set(values)];
}

export function parseLoginPayload(input: LoginInput): LoginPayload {
  return {
    identifier: parseIdentifier(input.identificador ?? input.email, 'identificador'),
    password: parseRequiredString(input.password, 'password'),
  };
}

export function parseUsuarioPayload(input: UsuarioInput): UsuarioPayload {
  return {
    nombre: parseRequiredString(input.nombre, 'nombre'),
    email: parseIdentifier(input.email, 'email'),
    password: parsePassword(input.password),
    rol: parseRol(input.rol),
    vendedorIds: parseIdList(input.vendedorIds, 'vendedorIds'),
    rifaVendedorIds: parseIdList(input.rifaVendedorIds, 'rifaVendedorIds'),
  };
}

export function parseUsuarioScopesPayload(
  input: Pick<UsuarioInput, 'vendedorIds' | 'rifaVendedorIds'>
): UsuarioScopesPayload {
  return {
    vendedorIds: parseIdList(input.vendedorIds, 'vendedorIds'),
    rifaVendedorIds: parseIdList(input.rifaVendedorIds, 'rifaVendedorIds'),
  };
}
