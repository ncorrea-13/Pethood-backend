import { prisma } from '../../shared/prisma';
import { datosAlta } from '../../shared/auditoria';

export interface DatosNuevaPublicacion {
  titulo: string;
  descripcion: string;
  ubicacion: string;
  requisitos: string[];
  personalidad: string[];
  desparasitado: boolean;
  vacunas: string | null;
  /** En orden: la primera es la portada. */
  imagenes: string[];
  mascotaId: number;
  usuarioId: number;
}

export function crear(datos: DatosNuevaPublicacion, usuarioAlta: number) {
  const { imagenes, ...resto } = datos;

  return prisma.publicacion.create({
    // imagenUrl se mantiene con la portada, para lo que ya lee ese campo.
    data: { ...resto, imagenes, imagenUrl: imagenes[0] ?? null, ...datosAlta(usuarioAlta) },
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
