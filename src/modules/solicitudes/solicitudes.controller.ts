import type { NextFunction, Request, Response } from 'express';
import type { z } from 'zod';
import { AppError } from '../../middlewares/errorHandler';
import {
  filtrosRecibidasSchema,
  idSolicitudSchema,
  resolverSolicitudSchema,
} from './solicitudes.dto';
import * as service from './solicitudes.service';

/** Traduce el primer issue de Zod al formato de error de la API (igual que mascotas.controller.ts). */
function parsearOFallar<T extends z.ZodTypeAny>(schema: T, datos: unknown): z.infer<T> {
  const resultado = schema.safeParse(datos);

  if (!resultado.success) {
    const primero = resultado.error.issues[0];
    throw new AppError('VALIDACION', primero?.message ?? 'Datos inválidos', 400);
  }

  return resultado.data;
}

function idDeRuta(req: Request): number {
  return parsearOFallar(idSolicitudSchema, req.params.id);
}

/** HU-7.5 (listado). */
export async function listarRecibidas(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const filtros = parsearOFallar(filtrosRecibidasSchema, req.query);
    res.json(await service.listarRecibidas(req.usuario!.usuarioId, filtros));
  } catch (err) {
    next(err);
  }
}

/** HU-7.5 (detalle + historial). */
export async function obtenerDetalle(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.json(await service.obtenerDetalle(idDeRuta(req), req.usuario!.usuarioId));
  } catch (err) {
    next(err);
  }
}

/** HU-7.4: el refugio acepta o rechaza. */
export async function resolver(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const datos = parsearOFallar(resolverSolicitudSchema, req.body);
    res.json(await service.resolverSolicitud(idDeRuta(req), datos, req.usuario!.usuarioId));
  } catch (err) {
    next(err);
  }
}
