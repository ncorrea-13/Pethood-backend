import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface PayloadToken {
  usuarioId: number;
  roles: string[];
}

export function firmarToken(payload: PayloadToken): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verificarToken(token: string): PayloadToken {
  return jwt.verify(token, env.JWT_SECRET) as PayloadToken;
}

/**
 * "Refresh" en un esquema stateless (CONSTITUTION.md §4: sin sesiones server-side):
 * re-firma el mismo payload con una expiración nueva. No hay tabla de refresh-tokens.
 */
export function refrescarToken(token: string): string {
  const { usuarioId, roles } = verificarToken(token);
  return firmarToken({ usuarioId, roles });
}
