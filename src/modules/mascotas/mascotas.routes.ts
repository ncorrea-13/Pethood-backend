import { Router } from 'express';
import { autenticar } from '../../middlewares/auth';
import { comprimirImagen } from '../../middlewares/comprimirImagen';
import { uploadImagen } from '../../middlewares/uploadImagen';
import * as controller from './mascotas.controller';

export const mascotasRouter = Router();

mascotasRouter.get('/mias', autenticar, controller.listarMias);

// La imagen se comprime antes de que el controller la persista.
mascotasRouter.post('/', autenticar, uploadImagen('foto'), comprimirImagen, controller.crear);
