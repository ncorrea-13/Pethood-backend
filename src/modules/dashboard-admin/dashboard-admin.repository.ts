import { prisma } from '../../shared/prisma';

/** Vigente = fila sin fechaBaja. Usuario/Refugio/Publicacion tienen estado directo o baja lógica propia. */

export function contarUsuariosPorRol() {
  return prisma.rolUsuario.groupBy({
    by: ['rolId'],
    where: { fechaBaja: null },
    _count: { _all: true },
  });
}

export function listarRoles() {
  return prisma.rol.findMany({ where: { fechaBaja: null } });
}

export function contarUsuariosActivos() {
  return prisma.usuario.count({ where: { fechaBaja: null } });
}

export function contarRefugiosVerificados() {
  return prisma.refugio.count({ where: { fechaBaja: null, verificado: true } });
}

/** Estado vigente de Mascota = última fila de Mascota_Estado sin baja (histórico N:1). */
export function contarMascotasPorEstado() {
  return prisma.mascotaEstado.groupBy({
    by: ['estadoMascotaId'],
    where: { fechaBaja: null },
    _count: { _all: true },
  });
}

export function listarEstadosMascota() {
  return prisma.estadoMascota.findMany({ where: { fechaBaja: null } });
}

export function contarPublicacionesActivas() {
  return prisma.publicacion.count({ where: { fechaBaja: null } });
}

/** Igual patrón que Mascota: estado vigente de Solicitud = última Solicitud_Estado sin baja. */
export function contarSolicitudesPorEstado() {
  return prisma.solicitudEstado.groupBy({
    by: ['estadoSolicitudId'],
    where: { fechaBaja: null },
    _count: { _all: true },
  });
}

export function listarEstadosSolicitud() {
  return prisma.estadoSolicitud.findMany({ where: { fechaBaja: null } });
}

export function contarCampaniasActivas() {
  return prisma.campania.count({
    where: { fechaBaja: null, estadoCampania: { nombre: 'Activa' } },
  });
}

/** "Declarado": ver spec 009 §3 — Donacion no tiene campo de confirmación en el schema actual. */
export async function sumarMontoDonadoDeclarado(): Promise<number> {
  const resultado = await prisma.donacion.aggregate({
    where: { fechaBaja: null },
    _sum: { monto: true },
  });

  return resultado._sum.monto ? Number(resultado._sum.monto) : 0;
}

/**
 * "Pendiente" = sin resolver todavía, no hay noción de prioridad/criticidad en el modelo
 * (Reporte_Problema solo tiene motivo/respuesta/resuelto — ver ambigüedad #2 en REQUISITOS.md
 * §10, la entidad ni siquiera tiene FK a Usuario dibujada). Consulta de solo lectura desde acá,
 * no se crea un módulo de moderación propio (spec 008, futuro).
 */
export function contarReportesPendientes() {
  return prisma.reporteProblema.count({ where: { fechaBaja: null, resuelto: false } });
}

/** Solo la fecha: el bucketing por mes se hace en el service (volumen chico, no justifica $queryRaw). */
export function listarFechasPublicacionesActivas() {
  return prisma.publicacion.findMany({
    where: { fechaBaja: null },
    select: { fechaAlta: true },
  });
}

export function listarFechasSolicitudesAprobadas() {
  return prisma.solicitudEstado.findMany({
    where: { fechaBaja: null, estadoSolicitud: { nombre: 'Aprobada' } },
    select: { fechaAlta: true },
  });
}
