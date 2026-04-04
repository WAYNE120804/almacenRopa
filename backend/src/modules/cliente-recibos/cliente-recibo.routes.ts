import { Router } from 'express';

import {
  getAllClienteRecibos,
  getClienteRecibo,
  getClienteReciboPublico,
} from './cliente-recibo.controller';

export const clienteReciboRouter = Router();

clienteReciboRouter.get('/codigo/:codigo', getClienteReciboPublico);
clienteReciboRouter.get('/', getAllClienteRecibos);
clienteReciboRouter.get('/:id', getClienteRecibo);
