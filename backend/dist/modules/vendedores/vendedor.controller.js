"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllVendedores = getAllVendedores;
exports.getVendedor = getVendedor;
exports.postVendedor = postVendedor;
exports.putVendedor = putVendedor;
exports.removeVendedor = removeVendedor;
exports.putVendedorAccess = putVendedorAccess;
const vendedor_service_1 = require("./vendedor.service");
const vendedor_schemas_1 = require("./vendedor.schemas");
function getIdParam(value) {
    return Array.isArray(value) ? value[0] : value || '';
}
async function getAllVendedores(req, res, next) {
    try {
        res.json(await (0, vendedor_service_1.listVendedores)(req.authUser));
    }
    catch (error) {
        next(error);
    }
}
async function getVendedor(req, res, next) {
    try {
        res.json(await (0, vendedor_service_1.getVendedorById)(getIdParam(req.params.id), req.authUser));
    }
    catch (error) {
        next(error);
    }
}
async function postVendedor(req, res, next) {
    try {
        const payload = (0, vendedor_schemas_1.parseVendedorPayload)(req.body);
        const vendedor = await (0, vendedor_service_1.createVendedor)(payload);
        res.status(201).json(vendedor);
    }
    catch (error) {
        next(error);
    }
}
async function putVendedor(req, res, next) {
    try {
        const payload = (0, vendedor_schemas_1.parseVendedorPayload)(req.body);
        const vendedor = await (0, vendedor_service_1.updateVendedor)(getIdParam(req.params.id), payload);
        res.json(vendedor);
    }
    catch (error) {
        next(error);
    }
}
async function removeVendedor(req, res, next) {
    try {
        await (0, vendedor_service_1.deleteVendedor)(getIdParam(req.params.id));
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
}
async function putVendedorAccess(req, res, next) {
    try {
        const payload = (0, vendedor_schemas_1.parseVendedorAccessPayload)(req.body);
        const data = await (0, vendedor_service_1.upsertVendedorAccess)(getIdParam(req.params.id), payload);
        res.json(data);
    }
    catch (error) {
        next(error);
    }
}
