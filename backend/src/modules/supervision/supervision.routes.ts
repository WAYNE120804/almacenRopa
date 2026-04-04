import { Router } from 'express';

import { RolUsuario } from '../../lib/prisma-client';
import { authenticateRequest, requireRole } from '../../middlewares/auth';
import { getSpecialChannelsDashboard } from './supervision.controller';

export const supervisionRouter = Router();

supervisionRouter.use(authenticateRequest);
supervisionRouter.get(
  '/canales-especiales',
  requireRole(RolUsuario.VENDEDOR),
  getSpecialChannelsDashboard
);
