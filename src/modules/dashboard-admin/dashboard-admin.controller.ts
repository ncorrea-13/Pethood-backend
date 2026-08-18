import type { NextFunction, Request, Response } from 'express';
import * as service from './dashboard-admin.service';

export async function obtener(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await service.obtenerDashboard());
  } catch (err) {
    next(err);
  }
}
