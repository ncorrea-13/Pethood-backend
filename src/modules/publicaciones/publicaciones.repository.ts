import { prisma } from '../../shared/prisma';
import { datosAlta } from '../../shared/auditoria';

export interface DatosNuevaPublicacion {
  titulo: string;
  descripcion: string;
  ubicacion: string;
  requisitos: string[];
  imagenUrl: string | null;
  mascotaId: number;
  usuarioId: number;
}

export function crear(datos: DatosNuevaPublicacion, usuarioAlta: number) {
  return prisma.publicacion.create({
    data: { ...datos, ...datosAlta(usuarioAlta) },
  });
}

/** Mascota activa con su estado vigente, para validar que se pueda publicar. */
export function buscarMascota(mascotaId: number) {
  return prisma.mascota.findFirst({
    where: { id: mascotaId, fechaBaja: null },
    include: {
      historicoEstados: {
        where: { fechaBaja: null },
        include: { estadoMascota: true },
        orderBy: { fechaAlta: 'desc' },
        take: 1,
      },
    },
  });
}

export function contarActivasDeUsuario(usuarioId: number) {
  return prisma.publicacion.count({ where: { usuarioId, fechaBaja: null } });
}

export function buscarActivaDeMascota(mascotaId: number) {
  return prisma.publicacion.findFirst({ where: { mascotaId, fechaBaja: null } });
}

export function buscarUsuario(usuarioId: number) {
  return prisma.usuario.findFirst({ where: { id: usuarioId, fechaBaja: null } });
}
