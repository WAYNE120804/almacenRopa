"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBotLoginPayload = parseBotLoginPayload;
exports.parseBotDisponiblesQuery = parseBotDisponiblesQuery;
exports.parseBotClienteEstadoQuery = parseBotClienteEstadoQuery;
exports.parseBotClientePayload = parseBotClientePayload;
exports.parseBotVentaReservaPayload = parseBotVentaReservaPayload;
exports.parseBotVentaPagoPayload = parseBotVentaPagoPayload;
exports.parseBotVentaLinkPayload = parseBotVentaLinkPayload;
exports.parseBotVentaLinkOpenPayload = parseBotVentaLinkOpenPayload;
exports.parseBotVentaSeguimientoPayload = parseBotVentaSeguimientoPayload;
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
function parseOptionalSearchString(value) {
    if (typeof value !== 'string') {
        return undefined;
    }
    const normalized = value.trim();
    return normalized.length ? normalized : undefined;
}
function parsePositiveInteger(value, fieldName, fallback) {
    if (value === undefined || value === null || value === '') {
        return fallback;
    }
    const numericValue = Number(value);
    if (!Number.isInteger(numericValue) || numericValue <= 0) {
        throw new app_error_1.AppError(`El campo "${fieldName}" debe ser un entero mayor a 0.`);
    }
    return numericValue;
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
function parseBotLoginPayload(input) {
    return {
        identifier: parseRequiredString(input.identifier, 'identifier'),
        password: parseRequiredString(input.password, 'password'),
    };
}
function parseBotDisponiblesQuery(input) {
    return {
        rifaId: parseRequiredString(input.rifaId, 'rifaId'),
        numero: parseOptionalSearchString(input.numero),
        limit: Math.min(parsePositiveInteger(input.limit, 'limit', 50), 200),
    };
}
function parseBotClienteEstadoQuery(input) {
    return {
        search: parseRequiredString(input.search, 'search'),
    };
}
function parseBotClientePayload(input) {
    return {
        nombre: parseRequiredString(input.nombre, 'nombre'),
        email: parseOptionalString(input.email),
        telefono: parseOptionalString(input.telefono),
        documento: parseOptionalString(input.documento),
    };
}
function parseBotVentaReservaPayload(input) {
    if (!Array.isArray(input.boletaIds) || input.boletaIds.length === 0) {
        throw new app_error_1.AppError('Debes enviar al menos una boleta para reservar.');
    }
    const boletaIds = input.boletaIds
        .map((value) => (typeof value === 'string' ? value.trim() : ''))
        .filter(Boolean);
    if (!boletaIds.length) {
        throw new app_error_1.AppError('Debes enviar al menos una boleta valida para reservar.');
    }
    if (!input.cliente || typeof input.cliente !== 'object') {
        throw new app_error_1.AppError('Debes enviar los datos del cliente para la reserva.');
    }
    return {
        rifaId: parseRequiredString(input.rifaId, 'rifaId'),
        boletaIds: [...new Set(boletaIds)],
        cliente: parseBotClientePayload(input.cliente),
        referenciaExterna: parseOptionalString(input.referenciaExterna),
        sesionExternaId: parseOptionalString(input.sesionExternaId),
    };
}
function parseBotVentaPagoPayload(input) {
    return {
        subCajaId: parseRequiredString(input.subCajaId, 'subCajaId'),
        monto: parseRequiredPositiveNumber(input.monto, 'monto'),
        fecha: parseOptionalDate(input.fecha, 'fecha'),
        descripcion: parseOptionalString(input.descripcion) || undefined,
        metodoPago: parseMetodoPago(input.metodoPago),
    };
}
function parseBotVentaLinkPayload(input) {
    return {
        linkPagoUrl: parseRequiredString(input.linkPagoUrl, 'linkPagoUrl'),
        enviadoAt: parseOptionalDate(input.enviadoAt, 'enviadoAt'),
    };
}
function parseBotVentaLinkOpenPayload(input) {
    return {
        abiertoAt: parseOptionalDate(input.abiertoAt, 'abiertoAt'),
    };
}
function parseBotVentaSeguimientoPayload(input) {
    return {
        requiereSeguimientoHumano: Boolean(input.requiereSeguimientoHumano),
        seguimientoMotivo: parseOptionalString(input.seguimientoMotivo),
    };
}
