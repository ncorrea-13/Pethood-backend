import { Router } from 'express';
import { autenticar } from '../../middlewares/auth';
import { validarBody } from '../../middlewares/validate';
import * as controller from './publicaciones.controller';
import { crearPublicacionSchema } from './publicaciones.dto';

export const publicacionesRouter = Router();

publicacionesRouter.post('/', autenticar, validarBody(crearPublicacionSchema), controller.crear);
