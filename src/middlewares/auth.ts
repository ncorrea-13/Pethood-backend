import type { NextFunction, Request, Response } from 'express';
import { AppError } from './errorHandler';
import { verificarToken } from '../shared/jwt';

/** Middleware de autenticación: exige Authorization: Bearer <token> y cuelga el payload en req.usuario. */
export function autenticar(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;

  if (!token) {
    next(new AppError('NO_AUTENTICADO', 'Falta el token de autenticación', 401));
    return;
  }

  try {
    req.usuario = verificarToken(token);
    next();
  } catch {
    next(new AppError('NO_AUTENTICADO', 'Token inválido o expirado', 401));
  }
}
