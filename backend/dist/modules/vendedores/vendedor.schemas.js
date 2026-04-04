"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseVendedorPayload = parseVendedorPayload;
exports.parseVendedorAccessPayload = parseVendedorAccessPayload;
const app_error_1 = require("../../lib/app-error");
function parseRequiredString(value, fieldName) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new app_error_1.AppError(`El campo "${fieldName}" es obligatorio.`);
    }
    return value.trim();
}
function parseOptionalString(value) {
    if (value === undefined || value === null) {
        return null;
    }
    if (typeof value !== 'string') {
        throw new app_error_1.AppError('Los campos opcionales deben ser texto.');
    }
    const normalized = value.trim();
    return normalized.length ? normalized : null;
}
function parseVendedorPayload(input) {
    return {
        nombre: parseRequiredString(input.nombre, 'nombre'),
        telefono: parseOptionalString(input.telefono),
        documento: parseOptionalString(input.documento),
        direccion: parseOptionalString(input.direccion),
    };
}
function parseVendedorAccessPayload(input) {
    const password = parseRequiredString(input.password, 'password');
    if (password.length < 8) {
        throw new app_error_1.AppError('La contrasena debe tener minimo 8 caracteres.');
    }
    return {
        nombre: parseRequiredString(input.nombre, 'nombre'),
        email: parseRequiredString(input.email, 'email'),
        password,
    };
}
