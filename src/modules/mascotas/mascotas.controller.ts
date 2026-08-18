import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../middlewares/errorHandler';
import { crearMascotaSchema } from './mascotas.dto';
import * as service from './mascotas.service';

const ROL_REFUGIO = 'Refugio';

/**
 * El formulario llega como multipart, así que el body no pasa por validarBody: primero
 * hay que dejar que multer lo parsee. La validación se hace acá, ya con el `actor`
 * puesto desde el token para que el cliente no pueda elegirlo.
 */
export async function crear(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const roles = req.usuario?.roles ?? [];
    const actor = roles.includes(ROL_REFUGIO) ? 'REFUGIO' : 'ADOPTANTE';

    const resultado = crearMascotaSchema.safeParse({ ...req.body, actor });

    if (!resultado.success) {
      const primero = resultado.error.issues[0];
      throw new AppError('VALIDACION', primero?.message ?? 'Datos inválidos', 400);
    }

    const mascota = await service.crearMascota(resultado.data, {
      usuarioId: req.usuario!.usuarioId,
      archivo: req.file,
    });

    res.status(201).json(mascota);
  } catch (err) {
    next(err);
  }
}

export async function listarMias(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await service.listarMisMascotas(req.usuario!.usuarioId));
  } catch (err) {
    next(err);
  }
}
