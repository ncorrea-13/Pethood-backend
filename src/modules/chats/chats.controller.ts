import type { NextFunction, Request, Response } from 'express';
import * as service from './chats.service';

/**
 * HU-5.1. Devuelve el total además del listado, para el badge de la pestaña Chat.
 *
 * No recibe nada: el único dato de entrada es quién pregunta, y sale del token. Un usuario
 * sin conversaciones recibe 200 con la lista vacía — el empty state es un estado normal de
 * la pantalla, no un error.
 */
export async function listar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await service.listarConversaciones(req.usuario!.usuarioId));
  } catch (err) {
    next(err);
  }
}
