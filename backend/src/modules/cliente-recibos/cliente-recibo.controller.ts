import type { NextFunction, Request, Response } from 'express';

import {
  getPagoClienteReciboByCodigo,
  getPagoClienteReciboById,
  listPagoClienteRecibos,
} from '../clientes/cliente.service';

function getStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || '';
}

export async function getAllClienteRecibos(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(await listPagoClienteRecibos(req.authUser));
  } catch (error) {
    next(error);
  }
}

export async function getClienteRecibo(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(await getPagoClienteReciboById(getStringParam(req.params.id), req.authUser));
  } catch (error) {
    next(error);
  }
}

export async function getClienteReciboPublico(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(await getPagoClienteReciboByCodigo(getStringParam(req.params.codigo)));
  } catch (error) {
    next(error);
  }
}
