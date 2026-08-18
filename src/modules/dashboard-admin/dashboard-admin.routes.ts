import { Router } from 'express';
import { autenticar } from '../../middlewares/auth';
import { requiereRol } from '../../middlewares/roles';
import * as controller from './dashboard-admin.controller';

export const dashboardAdminRouter = Router();

dashboardAdminRouter.get(
  '/dashboard',
  autenticar,
  requiereRol('Administrador'),
  controller.obtener,
);

dashboardAdminRouter.get(
  '/dashboard/exportar/:entidad',
  autenticar,
  requiereRol('Administrador'),
  controller.exportar,
);
