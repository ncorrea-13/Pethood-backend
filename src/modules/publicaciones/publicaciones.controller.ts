import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middlewares/errorHandler';
import { crearPublicacionSchema } from './publicaciones.dto';
import * as service from './publicaciones.service';

/**
 * El formulario llega como multipart, así que la validación se hace acá: primero tiene
 * que correr multer para que el body esté parseado.
 */
export async function crear(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const resultado = crearPublicacionSchema.safeParse(req.body);

    if (!resultado.success) {
      const primero = resultado.error.issues[0];
      throw new AppError('VALIDACION', primero?.message ?? 'Datos inválidos', 400);
    }

    const publicacion = await service.crearPublicacion(resultado.data, {
      usuarioId: req.usuario!.usuarioId,
      archivos: Array.isArray(req.files) ? req.files : [],
    });

    res.status(201).json(publicacion);
  } catch (err) {
    next(err);
  }
}
