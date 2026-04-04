import type { NextFunction, Request, Response } from 'express';

import {
  createBotVentaReserva,
  getBotCliente,
  getBotClienteEstado,
  getBotVenta,
  listBotAvailableBoletas,
  listBotRelations,
  loginBotSupervisor,
  markBotVentaLinkOpened,
  markBotVentaLinkSent,
  registerBotVentaPago,
  releaseBotBoleta,
  updateBotVentaSeguimiento,
  upsertBotClienteRecord,
} from './bot.service';
import {
  parseBotClienteEstadoQuery,
  parseBotClientePayload,
  parseBotDisponiblesQuery,
  parseBotLoginPayload,
  parseBotVentaLinkOpenPayload,
  parseBotVentaLinkPayload,
  parseBotVentaPagoPayload,
  parseBotVentaReservaPayload,
  parseBotVentaSeguimientoPayload,
} from './bot.schemas';

function getIdParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || '';
}

export async function postBotLogin(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await loginBotSupervisor(parseBotLoginPayload(req.body || {})));
  } catch (error) {
    next(error);
  }
}

export async function getBotRelations(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await listBotRelations(req.authUser));
  } catch (error) {
    next(error);
  }
}

export async function getBotAvailableBoletas(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    res.json(await listBotAvailableBoletas(parseBotDisponiblesQuery(req.query), req.authUser));
  } catch (error) {
    next(error);
  }
}

export async function postBotCliente(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await upsertBotClienteRecord(parseBotClientePayload(req.body || {}), req.authUser));
  } catch (error) {
    next(error);
  }
}

export async function getBotClienteStatus(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getBotClienteEstado(parseBotClienteEstadoQuery(req.query), req.authUser));
  } catch (error) {
    next(error);
  }
}

export async function getBotClienteDetail(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getBotCliente(getIdParam(req.params.id), req.authUser));
  } catch (error) {
    next(error);
  }
}

export async function postBotVentaReserva(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await createBotVentaReserva(parseBotVentaReservaPayload(req.body || {}), req.authUser));
  } catch (error) {
    next(error);
  }
}

export async function getBotVentaDetail(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getBotVenta(getIdParam(req.params.ventaId), req.authUser));
  } catch (error) {
    next(error);
  }
}

export async function postBotVentaPago(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(
      await registerBotVentaPago(
        getIdParam(req.params.ventaId),
        parseBotVentaPagoPayload(req.body || {}),
        req.authUser
      )
    );
  } catch (error) {
    next(error);
  }
}

export async function postBotReleaseBoleta(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await releaseBotBoleta(getIdParam(req.params.boletaId), req.authUser));
  } catch (error) {
    next(error);
  }
}

export async function postBotVentaLinkSent(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(
      await markBotVentaLinkSent(
        getIdParam(req.params.ventaId),
        parseBotVentaLinkPayload(req.body || {}),
        req.authUser
      )
    );
  } catch (error) {
    next(error);
  }
}

export async function postBotVentaLinkOpened(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(
      await markBotVentaLinkOpened(
        getIdParam(req.params.ventaId),
        parseBotVentaLinkOpenPayload(req.body || {}),
        req.authUser
      )
    );
  } catch (error) {
    next(error);
  }
}

export async function patchBotVentaSeguimiento(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(
      await updateBotVentaSeguimiento(
        getIdParam(req.params.ventaId),
        parseBotVentaSeguimientoPayload(req.body || {}),
        req.authUser
      )
    );
  } catch (error) {
    next(error);
  }
}
