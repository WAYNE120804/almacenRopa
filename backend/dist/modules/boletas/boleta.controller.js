"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllBoletas = getAllBoletas;
exports.getPublicBoletas = getPublicBoletas;
exports.getPublicBoletaFicha = getPublicBoletaFicha;
exports.getBoleta = getBoleta;
exports.putBoleta = putBoleta;
exports.postReleaseBoletaCliente = postReleaseBoletaCliente;
exports.postBoletaPublicLink = postBoletaPublicLink;
const boleta_service_1 = require("./boleta.service");
const boleta_schemas_1 = require("./boleta.schemas");
function getIdParam(value) {
    return Array.isArray(value) ? value[0] : value || '';
}
async function getAllBoletas(req, res, next) {
    try {
        const filters = (0, boleta_schemas_1.parseBoletaListFilters)(req.query);
        res.json(await (0, boleta_service_1.listBoletas)(filters, req.authUser));
    }
    catch (error) {
        next(error);
    }
}
async function getPublicBoletas(req, res, next) {
    try {
        const filters = (0, boleta_schemas_1.parsePublicBoletaListFilters)(req.query);
        res.json(await (0, boleta_service_1.listPublicBoletas)(filters));
    }
    catch (error) {
        next(error);
    }
}
async function getPublicBoletaFicha(req, res, next) {
    try {
        res.json(await (0, boleta_service_1.getPublicBoletaFichaByToken)(getIdParam(req.params.token)));
    }
    catch (error) {
        next(error);
    }
}
async function getBoleta(req, res, next) {
    try {
        res.json(await (0, boleta_service_1.getBoletaById)(getIdParam(req.params.id), req.authUser));
    }
    catch (error) {
        next(error);
    }
}
async function putBoleta(req, res, next) {
    try {
        const payload = (0, boleta_schemas_1.parseUpdateBoletaPayload)(req.body);
        res.json(await (0, boleta_service_1.updateBoleta)(getIdParam(req.params.id), payload));
    }
    catch (error) {
        next(error);
    }
}
async function postReleaseBoletaCliente(req, res, next) {
    try {
        res.json(await (0, boleta_service_1.releaseBoletaFromCliente)(getIdParam(req.params.id), req.authUser));
    }
    catch (error) {
        next(error);
    }
}
async function postBoletaPublicLink(req, res, next) {
    try {
        res.json(await (0, boleta_service_1.getOrCreateBoletaPublicLink)(getIdParam(req.params.id), req.authUser));
    }
    catch (error) {
        next(error);
    }
}
