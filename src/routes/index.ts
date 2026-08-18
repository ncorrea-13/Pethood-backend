import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { usuariosRouter } from '../modules/usuarios/usuarios.routes';
import { catalogosRouter } from '../modules/catalogos/catalogos.routes';
import { mascotasRouter } from '../modules/mascotas/mascotas.routes';
import { publicacionesRouter } from '../modules/publicaciones/publicaciones.routes';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ ok: true, servicio: 'pethood-api', fecha: new Date().toISOString() });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/usuarios', usuariosRouter);

// Módulos (descomentar a medida que se implementan las specs):
// apiRouter.use('/mascotas', mascotasRouter);    // spec 002
// apiRouter.use('/publicaciones', pubRouter);    // spec 002
apiRouter.use('/mascotas', mascotasRouter);
apiRouter.use('/publicaciones', publicacionesRouter);
apiRouter.use('/', catalogosRouter);

// Módulos (descomentar a medida que se implementan las specs):
// apiRouter.use('/usuarios', usuariosRouter);    // spec 001
// apiRouter.use('/solicitudes', solicitudesRouter); // spec 003
