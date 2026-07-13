import type { NextFunction, Request, Response } from 'express';

/** Error de negocio: los servicios lanzan AppError y el handler lo traduce a HTTP. */
export class AppError extends Error {
  constructor(
    public readonly codigo: string,
    public readonly mensaje: string,
    public readonly httpStatus: number = 400,
  ) {
    super(mensaje);
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.httpStatus).json({ error: { codigo: err.codigo, mensaje: err.mensaje } });
    return;
  }

  console.error('Error no controlado:', err);
  res.status(500).json({
    error: { codigo: 'ERROR_INTERNO', mensaje: 'Ocurrió un error inesperado' },
  });
}
