import type { NextFunction, Request, Response } from 'express';

import {
  getBoletaById,
  getOrCreateBoletaPublicLink,
  getPublicBoletaFichaByToken,
  listBoletas,
  listPublicBoletas,
  releaseBoletaFromCliente,
  updateBoleta,
} from './boleta.service';
import {
  parseBoletaListFilters,
  parsePublicBoletaListFilters,
  parseUpdateBoletaPayload,
} from './boleta.schemas';

function getIdParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || '';
}

export async function getAllBoletas(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const filters = parseBoletaListFilters(req.query);
    res.json(await listBoletas(filters, req.authUser));
  } catch (error) {
    next(error);
  }
}

export async function getPublicBoletas(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const filters = parsePublicBoletaListFilters(req.query);
    res.json(await listPublicBoletas(filters));
  } catch (error) {
    next(error);
  }
}

export async function getPublicBoletaFicha(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(await getPublicBoletaFichaByToken(getIdParam(req.params.token)));
  } catch (error) {
    next(error);
  }
}

export async function getBoleta(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(await getBoletaById(getIdParam(req.params.id), req.authUser));
  } catch (error) {
    next(error);
  }
}

export async function putBoleta(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = parseUpdateBoletaPayload(req.body);
    res.json(await updateBoleta(getIdParam(req.params.id), payload));
  } catch (error) {
    next(error);
  }
}

export async function postReleaseBoletaCliente(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(await releaseBoletaFromCliente(getIdParam(req.params.id), req.authUser));
  } catch (error) {
    next(error);
  }
}

export async function postBoletaPublicLink(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(await getOrCreateBoletaPublicLink(getIdParam(req.params.id), req.authUser));
  } catch (error) {
    next(error);
  }
}
