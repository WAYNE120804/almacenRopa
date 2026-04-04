import type { NextFunction, Request, Response } from 'express';

import {
  createVendedor,
  deleteVendedor,
  getVendedorById,
  listVendedores,
  upsertVendedorAccess,
  updateVendedor,
} from './vendedor.service';
import { parseVendedorAccessPayload, parseVendedorPayload } from './vendedor.schemas';

function getIdParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || '';
}

export async function getAllVendedores(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(await listVendedores(req.authUser));
  } catch (error) {
    next(error);
  }
}

export async function getVendedor(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(await getVendedorById(getIdParam(req.params.id), req.authUser));
  } catch (error) {
    next(error);
  }
}

export async function postVendedor(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = parseVendedorPayload(req.body);
    const vendedor = await createVendedor(payload);
    res.status(201).json(vendedor);
  } catch (error) {
    next(error);
  }
}

export async function putVendedor(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = parseVendedorPayload(req.body);
    const vendedor = await updateVendedor(getIdParam(req.params.id), payload);
    res.json(vendedor);
  } catch (error) {
    next(error);
  }
}

export async function removeVendedor(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await deleteVendedor(getIdParam(req.params.id));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function putVendedorAccess(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = parseVendedorAccessPayload(req.body);
    const data = await upsertVendedorAccess(getIdParam(req.params.id), payload);
    res.json(data);
  } catch (error) {
    next(error);
  }
}
