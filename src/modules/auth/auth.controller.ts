import type { NextFunction, Request, Response } from 'express';
import type { LoginDto } from './auth.dto';
import * as service from './auth.service';

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, contrasena } = req.body as LoginDto;
    res.json(await service.login(email, contrasena));
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await service.obtenerPerfil(req.usuario!.usuarioId));
  } catch (err) {
    next(err);
  }
}
