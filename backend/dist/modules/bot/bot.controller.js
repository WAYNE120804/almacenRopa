"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postBotLogin = postBotLogin;
exports.getBotRelations = getBotRelations;
exports.getBotAvailableBoletas = getBotAvailableBoletas;
exports.postBotCliente = postBotCliente;
exports.getBotClienteStatus = getBotClienteStatus;
exports.getBotClienteDetail = getBotClienteDetail;
exports.postBotVentaReserva = postBotVentaReserva;
exports.getBotVentaDetail = getBotVentaDetail;
exports.postBotVentaPago = postBotVentaPago;
exports.postBotReleaseBoleta = postBotReleaseBoleta;
exports.postBotVentaLinkSent = postBotVentaLinkSent;
exports.postBotVentaLinkOpened = postBotVentaLinkOpened;
exports.patchBotVentaSeguimiento = patchBotVentaSeguimiento;
const bot_service_1 = require("./bot.service");
const bot_schemas_1 = require("./bot.schemas");
function getIdParam(value) {
    return Array.isArray(value) ? value[0] : value || '';
}
async function postBotLogin(req, res, next) {
    try {
        res.json(await (0, bot_service_1.loginBotSupervisor)((0, bot_schemas_1.parseBotLoginPayload)(req.body || {})));
    }
    catch (error) {
        next(error);
    }
}
async function getBotRelations(req, res, next) {
    try {
        res.json(await (0, bot_service_1.listBotRelations)(req.authUser));
    }
    catch (error) {
        next(error);
    }
}
async function getBotAvailableBoletas(req, res, next) {
    try {
        res.json(await (0, bot_service_1.listBotAvailableBoletas)((0, bot_schemas_1.parseBotDisponiblesQuery)(req.query), req.authUser));
    }
    catch (error) {
        next(error);
    }
}
async function postBotCliente(req, res, next) {
    try {
        res.status(201).json(await (0, bot_service_1.upsertBotClienteRecord)((0, bot_schemas_1.parseBotClientePayload)(req.body || {}), req.authUser));
    }
    catch (error) {
        next(error);
    }
}
async function getBotClienteStatus(req, res, next) {
    try {
        res.json(await (0, bot_service_1.getBotClienteEstado)((0, bot_schemas_1.parseBotClienteEstadoQuery)(req.query), req.authUser));
    }
    catch (error) {
        next(error);
    }
}
async function getBotClienteDetail(req, res, next) {
    try {
        res.json(await (0, bot_service_1.getBotCliente)(getIdParam(req.params.id), req.authUser));
    }
    catch (error) {
        next(error);
    }
}
async function postBotVentaReserva(req, res, next) {
    try {
        res.status(201).json(await (0, bot_service_1.createBotVentaReserva)((0, bot_schemas_1.parseBotVentaReservaPayload)(req.body || {}), req.authUser));
    }
    catch (error) {
        next(error);
    }
}
async function getBotVentaDetail(req, res, next) {
    try {
        res.json(await (0, bot_service_1.getBotVenta)(getIdParam(req.params.ventaId), req.authUser));
    }
    catch (error) {
        next(error);
    }
}
async function postBotVentaPago(req, res, next) {
    try {
        res.json(await (0, bot_service_1.registerBotVentaPago)(getIdParam(req.params.ventaId), (0, bot_schemas_1.parseBotVentaPagoPayload)(req.body || {}), req.authUser));
    }
    catch (error) {
        next(error);
    }
}
async function postBotReleaseBoleta(req, res, next) {
    try {
        res.json(await (0, bot_service_1.releaseBotBoleta)(getIdParam(req.params.boletaId), req.authUser));
    }
    catch (error) {
        next(error);
    }
}
async function postBotVentaLinkSent(req, res, next) {
    try {
        res.json(await (0, bot_service_1.markBotVentaLinkSent)(getIdParam(req.params.ventaId), (0, bot_schemas_1.parseBotVentaLinkPayload)(req.body || {}), req.authUser));
    }
    catch (error) {
        next(error);
    }
}
async function postBotVentaLinkOpened(req, res, next) {
    try {
        res.json(await (0, bot_service_1.markBotVentaLinkOpened)(getIdParam(req.params.ventaId), (0, bot_schemas_1.parseBotVentaLinkOpenPayload)(req.body || {}), req.authUser));
    }
    catch (error) {
        next(error);
    }
}
async function patchBotVentaSeguimiento(req, res, next) {
    try {
        res.json(await (0, bot_service_1.updateBotVentaSeguimiento)(getIdParam(req.params.ventaId), (0, bot_schemas_1.parseBotVentaSeguimientoPayload)(req.body || {}), req.authUser));
    }
    catch (error) {
        next(error);
    }
}
