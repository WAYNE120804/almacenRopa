"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLoginPayload = parseLoginPayload;
exports.parseUsuarioPayload = parseUsuarioPayload;
exports.parseUsuarioScopesPayload = parseUsuarioScopesPayload;
const prisma_client_1 = require("../../lib/prisma-client");
const app_error_1 = require("../../lib/app-error");
function parseRequiredString(value, fieldName) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new app_error_1.AppError(`El campo "${fieldName}" es obligatorio.`);
    }
    return value.trim();
}
function parseIdentifier(value, fieldName) {
    return parseRequiredString(value, fieldName);
}
function parsePassword(value) {
    const password = parseRequiredString(value, 'password');
    if (password.length < 8) {
        throw new app_error_1.AppError('La contrasena debe tener minimo 8 caracteres.');
    }
    return password;
}
function parseRol(value) {
    if (typeof value !== 'string' || !(value in prisma_client_1.RolUsuario)) {
        throw new app_error_1.AppError('El rol seleccionado no es valido.');
    }
    return value;
}
function parseIdList(value, fieldName) {
    if (typeof value === 'undefined' || value === null || value === '') {
        return [];
    }
    if (!Array.isArray(value)) {
        throw new app_error_1.AppError(`El campo "${fieldName}" debe ser una lista valida.`);
    }
    const values = value
        .map((item) => {
        if (typeof item !== 'string' || item.trim().length === 0) {
            throw new app_error_1.AppError(`El campo "${fieldName}" contiene un identificador invalido.`);
        }
        return item.trim();
    });
    return [...new Set(values)];
}
function parseLoginPayload(input) {
    return {
        identifier: parseIdentifier(input.identificador ?? input.email, 'identificador'),
        password: parseRequiredString(input.password, 'password'),
    };
}
function parseUsuarioPayload(input) {
    return {
        nombre: parseRequiredString(input.nombre, 'nombre'),
        email: parseIdentifier(input.email, 'email'),
        password: parsePassword(input.password),
        rol: parseRol(input.rol),
        vendedorIds: parseIdList(input.vendedorIds, 'vendedorIds'),
        rifaVendedorIds: parseIdList(input.rifaVendedorIds, 'rifaVendedorIds'),
    };
}
function parseUsuarioScopesPayload(input) {
    return {
        vendedorIds: parseIdList(input.vendedorIds, 'vendedorIds'),
        rifaVendedorIds: parseIdList(input.rifaVendedorIds, 'rifaVendedorIds'),
    };
}
