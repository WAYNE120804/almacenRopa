"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBoletaListFilters = parseBoletaListFilters;
exports.parseUpdateBoletaPayload = parseUpdateBoletaPayload;
exports.parsePublicBoletaListFilters = parsePublicBoletaListFilters;
const prisma_client_1 = require("../../lib/prisma-client");
const app_error_1 = require("../../lib/app-error");
function parseOptionalString(value) {
    if (typeof value !== 'string') {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
function parseEstado(value) {
    const stringValue = parseOptionalString(value);
    if (!stringValue) {
        return undefined;
    }
    if (stringValue === 'ABONANDO') {
        return stringValue;
    }
    if (!(stringValue in prisma_client_1.EstadoBoleta)) {
        throw new app_error_1.AppError('El estado de la boleta no es valido.');
    }
    return stringValue;
}
function parseEstadoBoleta(value) {
    const estado = parseEstado(value);
    if (estado === 'ABONANDO') {
        throw new app_error_1.AppError('El estado de la boleta no es valido para esta operacion.');
    }
    return estado;
}
function parseOptionalBoolean(value) {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value !== 'string') {
        return undefined;
    }
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
        return undefined;
    }
    if (normalized === 'true') {
        return true;
    }
    if (normalized === 'false') {
        return false;
    }
    throw new app_error_1.AppError('El filtro "juega" no es valido.', 400);
}
function parsePositiveInteger(value, fieldName, fallback, max) {
    if (value === undefined || value === null || value === '') {
        return fallback;
    }
    const numberValue = Number(value);
    if (!Number.isInteger(numberValue) || numberValue <= 0) {
        throw new app_error_1.AppError(`El campo "${fieldName}" debe ser un entero positivo.`, 400);
    }
    if (max && numberValue > max) {
        return max;
    }
    return numberValue;
}
function parseBoletaListFilters(input) {
    return {
        rifaId: parseOptionalString(input.rifaId),
        rifaVendedorId: parseOptionalString(input.rifaVendedorId),
        estado: parseEstado(input.estado),
        numero: parseOptionalString(input.numero),
        vendedorNombre: parseOptionalString(input.vendedorNombre),
        juega: parseOptionalBoolean(input.juega),
        page: parsePositiveInteger(input.page, 'page', 1),
        pageSize: parsePositiveInteger(input.pageSize, 'pageSize', 200, 200),
    };
}
function parseUpdateBoletaPayload(input) {
    const estado = parseEstadoBoleta(input.estado);
    if (!estado) {
        throw new app_error_1.AppError('El campo "estado" es obligatorio.');
    }
    const rifaVendedorId = typeof input.rifaVendedorId === 'string' && input.rifaVendedorId.trim().length > 0
        ? input.rifaVendedorId.trim()
        : null;
    const juega = parseOptionalBoolean(input.juega);
    return {
        estado,
        rifaVendedorId,
        juega,
    };
}
function parsePublicBoletaListFilters(input) {
    const rifaId = parseOptionalString(input.rifaId);
    if (!rifaId) {
        throw new app_error_1.AppError('El filtro "rifaId" es obligatorio.', 400);
    }
    return {
        rifaId,
    };
}
