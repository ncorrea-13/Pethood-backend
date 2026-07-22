import type { NextFunction, Request, Response } from 'express';
import { AppError } from './errorHandler';

/** Middleware RBAC: requiere que autenticar() haya corrido antes en la cadena. */
export function requiereRol(...rolesPermitidos: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const roles = req.usuario?.roles ?? [];
    const autorizado = roles.some((rol) => rolesPermitidos.includes(rol));

    if (!autorizado) {
      next(new AppError('ROL_NO_AUTORIZADO', 'No tenés permisos para esta acción', 403));
      return;
    }

    next();
  };
}
