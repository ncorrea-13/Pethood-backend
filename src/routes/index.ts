import { Router } from 'express';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ ok: true, servicio: 'pethood-api', fecha: new Date().toISOString() });
});

// Módulos (descomentar a medida que se implementan las specs):
// apiRouter.use('/auth', authRouter);            // spec 001
// apiRouter.use('/usuarios', usuariosRouter);    // spec 001
// apiRouter.use('/mascotas', mascotasRouter);    // spec 002
// apiRouter.use('/publicaciones', pubRouter);    // spec 002
// apiRouter.use('/solicitudes', solicitudesRouter); // spec 003
