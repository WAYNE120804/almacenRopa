"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllClienteRecibos = getAllClienteRecibos;
exports.getClienteRecibo = getClienteRecibo;
exports.getClienteReciboPublico = getClienteReciboPublico;
const cliente_service_1 = require("../clientes/cliente.service");
function getStringParam(value) {
    return Array.isArray(value) ? value[0] : value || '';
}
async function getAllClienteRecibos(req, res, next) {
    try {
        res.json(await (0, cliente_service_1.listPagoClienteRecibos)(req.authUser));
    }
    catch (error) {
        next(error);
    }
}
async function getClienteRecibo(req, res, next) {
    try {
        res.json(await (0, cliente_service_1.getPagoClienteReciboById)(getStringParam(req.params.id), req.authUser));
    }
    catch (error) {
        next(error);
    }
}
async function getClienteReciboPublico(req, res, next) {
    try {
        res.json(await (0, cliente_service_1.getPagoClienteReciboByCodigo)(getStringParam(req.params.codigo)));
    }
    catch (error) {
        next(error);
    }
}
