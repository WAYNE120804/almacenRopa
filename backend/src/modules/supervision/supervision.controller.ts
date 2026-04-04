import type { NextFunction, Request, Response } from 'express';

import { getSpecialChannelDashboard } from './supervision.service';

export async function getSpecialChannelsDashboard(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(await getSpecialChannelDashboard(req.authUser));
  } catch (error) {
    next(error);
  }
}
