import { Router } from 'express';
import { authRouter } from '../modules/auth/auth.routes';
import { usuariosRouter } from '../modules/usuarios/usuarios.routes';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ ok: true, servicio: 'pethood-api', fecha: new Date().toISOString() });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/usuarios', usuariosRouter);

// Módulos (descomentar a medida que se implementan las specs):
// apiRouter.use('/mascotas', mascotasRouter);    // spec 002
// apiRouter.use('/publicaciones', pubRouter);    // spec 002
// apiRouter.use('/solicitudes', solicitudesRouter); // spec 003
