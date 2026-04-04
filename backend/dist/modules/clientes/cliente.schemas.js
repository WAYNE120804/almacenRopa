"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseClientePayload = parseClientePayload;
exports.parseClienteVentaPayload = parseClienteVentaPayload;
exports.parseClienteVentaPagoPayload = parseClienteVentaPagoPayload;
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
function parseRequiredPositiveNumber(value, fieldName) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
        throw new app_error_1.AppError(`El campo "${fieldName}" debe ser un numero mayor a 0.`);
    }
    return Number(numericValue.toFixed(2));
}
function parseOptionalDate(value, fieldName) {
    if (value === undefined || value === null || value === '') {
        return undefined;
    }
    const rawValue = String(value).trim();
    const dateOnlyMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
        const [, year, month, day] = dateOnlyMatch;
        const now = new Date();
        const date = new Date(Number(year), Number(month) - 1, Number(day), now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
        if (Number.isNaN(date.getTime())) {
            throw new app_error_1.AppError(`El campo "${fieldName}" debe ser una fecha valida.`);
        }
        return date;
    }
    const date = new Date(rawValue);
    if (Number.isNaN(date.getTime())) {
        throw new app_error_1.AppError(`El campo "${fieldName}" debe ser una fecha valida.`);
    }
    return date;
}
function parseMetodoPago(value) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new app_error_1.AppError('El campo "metodoPago" es obligatorio.');
    }
    const metodoPago = value.trim().toUpperCase();
    if (!['EFECTIVO', 'NEQUI', 'DAVIPLATA', 'TRANSFERENCIA', 'WOMPI'].includes(metodoPago)) {
        throw new app_error_1.AppError('El metodo de pago no es valido.');
    }
    return metodoPago;
}
function parseClientePayload(input) {
    return {
        nombre: parseRequiredString(input.nombre, 'nombre'),
        email: parseOptionalString(input.email),
        telefono: parseOptionalString(input.telefono),
        documento: parseOptionalString(input.documento),
    };
}
function parseClienteVentaPayload(input) {
    const rifaVendedorId = parseRequiredString(input.rifaVendedorId, 'rifaVendedorId');
    if (!Array.isArray(input.boletaIds) || input.boletaIds.length === 0) {
        throw new app_error_1.AppError('Debes enviar al menos una boleta para asignar al cliente.');
    }
    const boletaIds = input.boletaIds
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean);
    if (!boletaIds.length) {
        throw new app_error_1.AppError('Debes enviar al menos una boleta valida para asignar al cliente.');
    }
    return {
        rifaVendedorId,
        boletaIds: [...new Set(boletaIds)],
    };
}
function parseClienteVentaPagoPayload(input) {
    return {
        subCajaId: parseRequiredString(input.subCajaId, 'subCajaId'),
        monto: parseRequiredPositiveNumber(input.monto, 'monto'),
        fecha: parseOptionalDate(input.fecha, 'fecha'),
        descripcion: parseOptionalString(input.descripcion),
        metodoPago: parseMetodoPago(input.metodoPago),
    };
}
