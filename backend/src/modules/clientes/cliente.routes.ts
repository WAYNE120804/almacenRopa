import { Router } from 'express';
import { RolUsuario } from '../../lib/prisma-client';
import { requireRole } from '../../middlewares/auth';

import {
  getAllClientes,
  getCliente,
  postClienteVentaPago,
  postCliente,
  postClienteVenta,
  putCliente,
} from './cliente.controller';

export const clienteRouter = Router();

clienteRouter.get('/', getAllClientes);
clienteRouter.get('/:id', getCliente);
clienteRouter.post('/', requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO, RolUsuario.VENDEDOR), postCliente);
clienteRouter.put('/:id', requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO, RolUsuario.VENDEDOR), putCliente);
clienteRouter.post(
  '/:id/ventas',
  requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO, RolUsuario.VENDEDOR),
  postClienteVenta
);
clienteRouter.post(
  '/:id/ventas/:ventaId/pagos',
  requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO, RolUsuario.VENDEDOR),
  postClienteVentaPago
);
