import { Router } from 'express';
import { autenticar } from '../../middlewares/auth';
import { validarBody } from '../../middlewares/validate';
import * as controller from './auth.controller';
import { loginSchema } from './auth.dto';

export const authRouter = Router();

authRouter.post('/login', validarBody(loginSchema), controller.login);
authRouter.get('/me', autenticar, controller.me);
