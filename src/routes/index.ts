import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { catalogosRouter } from '../modules/catalogos/catalogos.routes';
import { mascotasRouter } from '../modules/mascotas/mascotas.routes';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ ok: true, servicio: 'pethood-api', fecha: new Date().toISOString() });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/mascotas', mascotasRouter);
apiRouter.use('/', catalogosRouter);

// Módulos (descomentar a medida que se implementan las specs):
// apiRouter.use('/usuarios', usuariosRouter);    // spec 001
// apiRouter.use('/publicaciones', pubRouter);    // spec 002
// apiRouter.use('/solicitudes', solicitudesRouter); // spec 003
