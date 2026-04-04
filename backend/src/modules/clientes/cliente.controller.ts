import type { NextFunction, Request, Response } from 'express';

import {
  createCliente,
  createPagoForClienteVenta,
  createVentaForCliente,
  getClienteById,
  listClientes,
  updateCliente,
} from './cliente.service';
import {
  parseClientePayload,
  parseClienteVentaPagoPayload,
  parseClienteVentaPayload,
} from './cliente.schemas';

function getIdParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || '';
}

export async function getAllClientes(req: Request, res: Response, next: NextFunction) {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : '';
    res.json(await listClientes(req.authUser, { search }));
  } catch (error) {
    next(error);
  }
}

export async function getCliente(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getClienteById(getIdParam(req.params.id), req.authUser));
  } catch (error) {
    next(error);
  }
}

export async function postCliente(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = parseClientePayload(req.body);
    const cliente = await createCliente(payload, req.authUser);
    res.status(201).json(cliente);
  } catch (error) {
    next(error);
  }
}

export async function putCliente(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = parseClientePayload(req.body);
    const cliente = await updateCliente(getIdParam(req.params.id), payload, req.authUser);
    res.json(cliente);
  } catch (error) {
    next(error);
  }
}

export async function postClienteVenta(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = parseClienteVentaPayload(req.body);
    const cliente = await createVentaForCliente(
      getIdParam(req.params.id),
      payload,
      req.authUser
    );
    res.status(201).json(cliente);
  } catch (error) {
    next(error);
  }
}

export async function postClienteVentaPago(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = parseClienteVentaPagoPayload(req.body);
    const recibo = await createPagoForClienteVenta(
      getIdParam(req.params.id),
      getIdParam(req.params.ventaId),
      payload,
      req.authUser
    );
    res.status(201).json(recibo);
  } catch (error) {
    next(error);
  }
}
