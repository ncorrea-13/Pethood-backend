import { Router } from 'express';
import { autenticar } from '../../middlewares/auth';
import * as controller from './chats.controller';

export const chatsRouter = Router();

// HU-5.1: listado de GUI-08 / GUI-31, ordenado por fecha del último mensaje descendente.
//
// Sin `validar(...)`: el endpoint no recibe body ni query params. Cuando HU-5.3 sume la
// búsqueda por nombre de contacto, el schema se compone en chats.dto.ts y se engancha acá.
//
// Sin middleware de roles a propósito: cualquier usuario autenticado puede ver SUS
// conversaciones, y quién participa de cada sala lo define UsuarioChat, no el rol.
chatsRouter.get('/', autenticar, controller.listar);
