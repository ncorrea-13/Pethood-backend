import { prisma } from '../../shared/prisma';

/** Usuario activo (no dado de baja) con sus roles vigentes, buscado por email. */
export function buscarPorEmail(email: string) {
  return prisma.usuario.findFirst({
    where: { email, fechaBaja: null },
    include: { roles: { where: { fechaBaja: null }, include: { rol: true } } },
  });
}

/** Idem por id — usado por GET /auth/me, que ya tiene el id desde el token. */
export function buscarPorId(id: number) {
  return prisma.usuario.findFirst({
    where: { id, fechaBaja: null },
    include: { roles: { where: { fechaBaja: null }, include: { rol: true } } },
  });
}
