import { Router } from 'express';
import { RolUsuario } from '../../lib/prisma-client';
import { requireRole } from '../../middlewares/auth';

import {
  getAllBoletas,
  getBoleta,
  getPublicBoletaFicha,
  getPublicBoletas,
  postBoletaPublicLink,
  postReleaseBoletaCliente,
  putBoleta,
} from './boleta.controller';

export const boletaRouter = Router();

boletaRouter.get('/', getAllBoletas);
boletaRouter.get('/publicas', getPublicBoletas);
boletaRouter.get('/publicas/ficha/:token', getPublicBoletaFicha);
boletaRouter.get('/:id', getBoleta);
boletaRouter.post('/:id/public-link', requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO, RolUsuario.VENDEDOR), postBoletaPublicLink);
boletaRouter.post('/:id/liberar-cliente', requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO, RolUsuario.VENDEDOR), postReleaseBoletaCliente);
boletaRouter.put('/:id', requireRole(RolUsuario.ADMIN, RolUsuario.CAJERO), putBoleta);
