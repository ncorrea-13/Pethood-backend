import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/prisma';
import { datosAlta, datosBaja, datosModificacion } from '../../shared/auditoria';

/** Lo que necesitan tanto el resumen como el detalle de una solicitud. */
const RELACIONES_SOLICITUD = {
  publicacion: { include: { mascota: true } },
  usuario: true,
  tipoSolicitud: true,
} as const;

function historicoCompleto() {
  return {
    where: { fechaBaja: null },
    include: { estadoSolicitud: true },
    orderBy: { fechaAlta: 'desc' as const },
  };
}

export function buscarUsuarioConRefugio(usuarioId: number) {
  return prisma.usuario.findFirst({ where: { id: usuarioId, fechaBaja: null } });
}

export function buscarEstadoSolicitudPorNombre(nombre: string) {
  return prisma.estadoSolicitud.findFirst({ where: { nombre, fechaBaja: null } });
}

/** Solicitud con el historial de estados completo: sirve tanto para el detalle (HU-7.5) como para resolverla (HU-7.4). */
export function buscarConDetalle(solicitudId: number) {
  return prisma.solicitud.findFirst({
    where: { id: solicitudId, fechaBaja: null },
    include: { ...RELACIONES_SOLICITUD, historicoEstados: historicoCompleto() },
  });
}

/**
 * Solicitudes que el actor puede gestionar: las de mascotas de SU refugio (cualquier
 * miembro, sin importar quién la cargó — mismo criterio que
 * `mascotas.repository.listarPorAmbito`) más las de sus propias mascotas personales
 * (un adoptante particular también puede publicar una mascota propia en adopción,
 * `mascotas.dto.ts` DESTINOS). El filtro por nombre de estado y la paginación se
 * resuelven en el service.
 */
export function listarDelActor(actor: { id: number; refugioId: number | null }) {
  const filtroMascota = actor.refugioId
    ? { OR: [{ refugioId: actor.refugioId }, { usuarioId: actor.id }] }
    : { usuarioId: actor.id };

  return prisma.solicitud.findMany({
    where: { fechaBaja: null, publicacion: { mascota: { ...filtroMascota, fechaBaja: null } } },
    include: { ...RELACIONES_SOLICITUD, historicoEstados: historicoCompleto() },
    orderBy: { fechaAlta: 'desc' },
  });
}

/**
 * Resuelve la solicitud SI Y SOLO SI sigue "Pendiente" en el momento de la escritura,
 * atómicamente: aislamiento Serializable para que dos PATCH concurrentes sobre la misma
 * solicitud no puedan pisarse (uno gana, el otro recibe `null` y el service lo traduce a
 * `409 SOLICITUD_YA_RESUELTA` en vez de dejar el histórico inconsistente).
 *
 * Devuelve `null` en vez de tirar un error de Prisma: quien pierde la carrera no rompió
 * nada, solo llegó tarde — es el mismo caso que "ya estaba resuelta" que valida el service
 * antes de llamar acá, así que ambos caminos terminan en el mismo 409.
 */
export async function resolverSiPendiente(
  solicitudId: number,
  estadoSolicitudId: number,
  comentario: string | null,
  usuarioId: number,
) {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const vigente = await tx.solicitudEstado.findFirst({
          where: { solicitudId, fechaBaja: null },
          orderBy: { fechaAlta: 'desc' },
          include: { estadoSolicitud: true },
        });

        if (vigente?.estadoSolicitud.nombre !== 'Pendiente') {
          return null;
        }

        await tx.solicitud.update({
          where: { id: solicitudId },
          data: { comentario, fechaRespuesta: new Date(), ...datosModificacion(usuarioId) },
        });

        await tx.solicitudEstado.create({
          data: { solicitudId, estadoSolicitudId, ...datosAlta(usuarioId) },
        });

        return tx.solicitud.findFirstOrThrow({
          where: { id: solicitudId },
          include: { ...RELACIONES_SOLICITUD, historicoEstados: historicoCompleto() },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (err) {
    // P2034 = conflicto de serialización: el otro PATCH concurrente confirmó primero.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034') {
      return null;
    }
    throw err;
  }
}

/**
 * Todas las solicitudes vivas sin respuesta, con el tipo (para `secuenciaDias`) y el
 * estado vigente. `fechaRespuesta: null` es un filtro de performance, no la fuente de
 * verdad: quien decide si sigue "Pendiente" es el service, mirando `historicoEstados[0]`
 * — así una solicitud "En_Revision" (tampoco tiene respuesta todavía) no se cuela.
 * Usado por el cron de HU-7.6.
 */
export function listarSinRespuesta() {
  return prisma.solicitud.findMany({
    where: { fechaBaja: null, fechaRespuesta: null },
    include: {
      tipoSolicitud: true,
      historicoEstados: {
        where: { fechaBaja: null },
        include: { estadoSolicitud: true },
        orderBy: { fechaAlta: 'desc' },
        take: 1,
      },
    },
  });
}

/**
 * Cancelación automática de HU-7.6: baja lógica de la solicitud + nuevo estado
 * "Cancelada" en el histórico, SI Y SOLO SI sigue "Pendiente" al momento de escribir
 * (mismo aislamiento Serializable que `resolverSiPendiente`, para no cancelar algo que un
 * refugio acaba de aceptar/rechazar un instante antes de que corra el cron).
 */
export async function cancelarSiPendiente(
  solicitudId: number,
  estadoCanceladaId: number,
  usuarioId: number,
): Promise<boolean> {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const vigente = await tx.solicitudEstado.findFirst({
          where: { solicitudId, fechaBaja: null },
          orderBy: { fechaAlta: 'desc' },
          include: { estadoSolicitud: true },
        });

        if (vigente?.estadoSolicitud.nombre !== 'Pendiente') {
          return false;
        }

        await tx.solicitud.update({
          where: { id: solicitudId },
          data: datosBaja(usuarioId),
        });

        await tx.solicitudEstado.create({
          data: { solicitudId, estadoSolicitudId: estadoCanceladaId, ...datosAlta(usuarioId) },
        });

        return true;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034') {
      return false;
    }
    throw err;
  }
}
