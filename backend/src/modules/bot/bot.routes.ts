import { Router } from 'express';

import { authenticateRequest } from '../../middlewares/auth';
import {
  getBotAvailableBoletas,
  getBotClienteDetail,
  getBotClienteStatus,
  getBotRelations,
  getBotVentaDetail,
  patchBotVentaSeguimiento,
  postBotCliente,
  postBotLogin,
  postBotReleaseBoleta,
  postBotVentaLinkOpened,
  postBotVentaLinkSent,
  postBotVentaPago,
  postBotVentaReserva,
} from './bot.controller';

export const botRouter = Router();

botRouter.post('/auth/login', postBotLogin);

botRouter.use(authenticateRequest);
botRouter.get('/relaciones', getBotRelations);
botRouter.get('/boletas/disponibles', getBotAvailableBoletas);
botRouter.post('/clientes', postBotCliente);
botRouter.get('/clientes/estado', getBotClienteStatus);
botRouter.get('/clientes/:id', getBotClienteDetail);
botRouter.post('/ventas/reservar', postBotVentaReserva);
botRouter.get('/ventas/:ventaId', getBotVentaDetail);
botRouter.post('/ventas/:ventaId/link-pago', postBotVentaLinkSent);
botRouter.post('/ventas/:ventaId/link-pago/abierto', postBotVentaLinkOpened);
botRouter.patch('/ventas/:ventaId/seguimiento', patchBotVentaSeguimiento);
botRouter.post('/ventas/:ventaId/pagos/manuales', postBotVentaPago);
botRouter.post('/boletas/:boletaId/liberar-cliente', postBotReleaseBoleta);
