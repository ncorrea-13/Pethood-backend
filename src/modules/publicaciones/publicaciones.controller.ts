import type { NextFunction, Request, Response } from 'express';
import type { CrearPublicacionDto } from './publicaciones.dto';
import * as service from './publicaciones.service';

export async function crear(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const datos = req.body as CrearPublicacionDto;
    res.status(201).json(await service.crearPublicacion(datos, req.usuario!.usuarioId));
  } catch (err) {
    next(err);
  }
}
