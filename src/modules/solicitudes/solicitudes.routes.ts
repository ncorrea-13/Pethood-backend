import { Router } from 'express';
import { autenticar } from '../../middlewares/auth';
import * as controller from './solicitudes.controller';

export const solicitudesRouter = Router();

// Las tres rutas son del lado de quien PUBLICÓ la mascota (HU-7.4/7.5) — refugio o
// adoptante particular, no un rol fijo (ver solicitudes.service.ts). Crear solicitud
// (HU-7.1) y el historial del solicitante (HU-7.3) son otra HU, todavía sin ruta.
solicitudesRouter.get('/recibidas', autenticar, controller.listarRecibidas);

solicitudesRouter.get('/:id', autenticar, controller.obtenerDetalle);

solicitudesRouter.patch('/:id/estado', autenticar, controller.resolver);
