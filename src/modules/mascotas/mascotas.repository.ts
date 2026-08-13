import type { GeneroMascota, TamanioMascota } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { datosAlta } from '../../shared/auditoria';

export interface DatosNuevaMascota {
  nombre: string;
  fechaNacimiento: Date;
  genero: GeneroMascota;
  peso: number;
  tamanio: TamanioMascota;
  imagenUrl: string;
  razaId: number;
  refugioId: number | null;
  usuarioId: number;
  estadoMascotaId: number;
}

/** Mascota + su primera fila de Mascota_Estado en una sola transacción. */
export function crearConEstado(datos: DatosNuevaMascota, usuarioAlta: number) {
  const { estadoMascotaId, ...mascota } = datos;

  return prisma.mascota.create({
    data: {
      ...mascota,
      ...datosAlta(usuarioAlta),
      historicoEstados: {
        create: { estadoMascotaId, ...datosAlta(usuarioAlta) },
      },
    },
    include: {
      raza: { include: { especie: true } },
      historicoEstados: { include: { estadoMascota: true } },
    },
  });
}

/** Raza vigente con su especie, para validar que la combinación elegida exista. */
export function buscarRaza(razaId: number) {
  return prisma.raza.findFirst({
    where: { id: razaId, fechaBaja: null },
    include: { especie: true },
  });
}

export function buscarEstadoMascota(estadoMascotaId: number) {
  return prisma.estadoMascota.findFirst({ where: { id: estadoMascotaId, fechaBaja: null } });
}

export function buscarEstadoMascotaPorNombre(nombre: string) {
  return prisma.estadoMascota.findFirst({ where: { nombre, fechaBaja: null } });
}

export function buscarUsuario(usuarioId: number) {
  return prisma.usuario.findFirst({ where: { id: usuarioId, fechaBaja: null } });
}

/** Mascotas activas de un usuario, con su estado vigente. */
export function listarPorUsuario(usuarioId: number) {
  return prisma.mascota.findMany({
    where: { usuarioId, fechaBaja: null },
    include: {
      raza: { include: { especie: true } },
      historicoEstados: {
        where: { fechaBaja: null },
        include: { estadoMascota: true },
        orderBy: { fechaAlta: 'desc' },
        take: 1,
      },
    },
    orderBy: { fechaAlta: 'desc' },
  });
}
