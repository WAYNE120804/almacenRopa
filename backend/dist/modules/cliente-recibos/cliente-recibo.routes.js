"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clienteReciboRouter = void 0;
const express_1 = require("express");
const cliente_recibo_controller_1 = require("./cliente-recibo.controller");
exports.clienteReciboRouter = (0, express_1.Router)();
exports.clienteReciboRouter.get('/codigo/:codigo', cliente_recibo_controller_1.getClienteReciboPublico);
exports.clienteReciboRouter.get('/', cliente_recibo_controller_1.getAllClienteRecibos);
exports.clienteReciboRouter.get('/:id', cliente_recibo_controller_1.getClienteRecibo);
