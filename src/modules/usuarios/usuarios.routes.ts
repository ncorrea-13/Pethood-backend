import { Router } from 'express';
import { autenticar } from '../../middlewares/auth';
import * as authController from '../auth/auth.controller';

export const usuariosRouter = Router();

usuariosRouter.get('/me', autenticar, authController.me);
