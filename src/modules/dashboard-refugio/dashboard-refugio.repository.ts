import { prisma } from '../../shared/prisma';

/** Vigente = fila sin fechaBaja. Mismo criterio que dashboard-admin.repository.ts. */

export function buscarUsuarioConRefugio(usuarioId: number) {
  return prisma.usuario.findFirst({ where: { id: usuarioId, fechaBaja: null } });
}

export function buscarRefugio(refugioId: number) {
  return prisma.refugio.findFirst({ where: { id: refugioId, fechaBaja: null } });
}

/** "En el refugio" = estado vigente Disponible/En_Tratamiento/En_Transito (no Adoptado/Fallecido). */
export function contarMascotasEnRefugio(refugioId: number) {
  return prisma.mascotaEstado.count({
    where: {
      fechaBaja: null,
      estadoMascota: {
        nombre: { in: ['Disponible', 'En_Tratamiento', 'En_Transito'] },
      },
      mascota: { refugioId, fechaBaja: null },
    },
  });
}

export function listarEstadosSolicitud() {
  return prisma.estadoSolicitud.findMany({ where: { fechaBaja: null } });
}

/** Estado vigente de Solicitud = última Solicitud_Estado sin baja, con fechaAlta en el período. */
export function contarSolicitudesPorEstado(refugioId: number, desde: Date, hasta: Date) {
  return prisma.solicitudEstado.groupBy({
    by: ['estadoSolicitudId'],
    where: {
      fechaBaja: null,
      fechaAlta: { gte: desde, lte: hasta },
      solicitud: { publicacion: { mascota: { refugioId, fechaBaja: null } } },
    },
    _count: { _all: true },
  });
}

export function contarSolicitudesCreadas(refugioId: number, desde: Date, hasta: Date) {
  return prisma.solicitud.count({
    where: {
      fechaBaja: null,
      fechaAlta: { gte: desde, lte: hasta },
      publicacion: { mascota: { refugioId, fechaBaja: null } },
    },
  });
}

/** Solo fecha y monto: el bucketing por mes se hace en el service, igual que dashboard-admin. */
export function listarDonaciones(refugioId: number, desde: Date, hasta: Date) {
  return prisma.donacion.findMany({
    where: {
      fechaBaja: null,
      fechaAlta: { gte: desde, lte: hasta },
      campania: { refugioId, fechaBaja: null },
    },
    select: { fechaAlta: true, monto: true },
  });
}

export async function sumarObjetivoCampaniasActivas(refugioId: number): Promise<number> {
  const resultado = await prisma.campania.aggregate({
    where: { refugioId, fechaBaja: null, estadoCampania: { nombre: 'Activa' } },
    _sum: { objetivo: true },
  });

  return resultado._sum.objetivo ? Number(resultado._sum.objetivo) : 0;
}

// ─────────────── EXPORT CSV ───────────────
// Paginado por cursor (id > último visto), igual criterio que dashboard-admin.repository.ts.

export function paginaSolicitudesParaExport(
  refugioId: number,
  desde: Date,
  hasta: Date,
  cursorId: number | undefined,
  take: number,
) {
  return prisma.solicitud.findMany({
    where: {
      fechaBaja: null,
      fechaAlta: { gte: desde, lte: hasta },
      publicacion: { mascota: { refugioId, fechaBaja: null } },
      ...(cursorId ? { id: { gt: cursorId } } : {}),
    },
    orderBy: { id: 'asc' },
    take,
    include: {
      tipoSolicitud: true,
      publicacion: { include: { mascota: true } },
      historicoEstados: {
        where: { fechaBaja: null },
        include: { estadoSolicitud: true },
        orderBy: { fechaAlta: 'desc' },
        take: 1,
      },
    },
  });
}
