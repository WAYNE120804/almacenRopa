"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllClientes = getAllClientes;
exports.getCliente = getCliente;
exports.postCliente = postCliente;
exports.putCliente = putCliente;
exports.postClienteVenta = postClienteVenta;
exports.postClienteVentaPago = postClienteVentaPago;
const cliente_service_1 = require("./cliente.service");
const cliente_schemas_1 = require("./cliente.schemas");
function getIdParam(value) {
    return Array.isArray(value) ? value[0] : value || '';
}
async function getAllClientes(req, res, next) {
    try {
        const search = typeof req.query.search === 'string' ? req.query.search : '';
        res.json(await (0, cliente_service_1.listClientes)(req.authUser, { search }));
    }
    catch (error) {
        next(error);
    }
}
async function getCliente(req, res, next) {
    try {
        res.json(await (0, cliente_service_1.getClienteById)(getIdParam(req.params.id), req.authUser));
    }
    catch (error) {
        next(error);
    }
}
async function postCliente(req, res, next) {
    try {
        const payload = (0, cliente_schemas_1.parseClientePayload)(req.body);
        const cliente = await (0, cliente_service_1.createCliente)(payload, req.authUser);
        res.status(201).json(cliente);
    }
    catch (error) {
        next(error);
    }
}
async function putCliente(req, res, next) {
    try {
        const payload = (0, cliente_schemas_1.parseClientePayload)(req.body);
        const cliente = await (0, cliente_service_1.updateCliente)(getIdParam(req.params.id), payload, req.authUser);
        res.json(cliente);
    }
    catch (error) {
        next(error);
    }
}
async function postClienteVenta(req, res, next) {
    try {
        const payload = (0, cliente_schemas_1.parseClienteVentaPayload)(req.body);
        const cliente = await (0, cliente_service_1.createVentaForCliente)(getIdParam(req.params.id), payload, req.authUser);
        res.status(201).json(cliente);
    }
    catch (error) {
        next(error);
    }
}
async function postClienteVentaPago(req, res, next) {
    try {
        const payload = (0, cliente_schemas_1.parseClienteVentaPagoPayload)(req.body);
        const recibo = await (0, cliente_service_1.createPagoForClienteVenta)(getIdParam(req.params.id), getIdParam(req.params.ventaId), payload, req.authUser);
        res.status(201).json(recibo);
    }
    catch (error) {
        next(error);
    }
}
