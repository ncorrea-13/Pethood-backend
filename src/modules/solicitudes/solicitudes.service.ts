/**
 * Solicitudes que puede gestionar quien publicó la mascota: resolverlas (HU-7.4) y
 * consultar su historial (HU-7.5). La creación (HU-7.1) y el historial del lado
 * solicitante (HU-7.3) son otra HU, todavía sin endpoint.
 *
 * "Quien publicó la mascota" no es siempre un refugio: un adoptante particular también
 * puede ofrecer una mascota propia en adopción (`mascotas.dto.ts`, actor ADOPTANTE +
 * destino ADOPCION). Por eso la autorización se resuelve por actor, no por rol:
 * - mascota de un refugio (`refugioId` no nulo) -> cualquier miembro de ESE refugio,
 *   igual criterio que `mascotas.repository.listarPorAmbito` y el dashboard de refugio.
 * - mascota personal (`refugioId` nulo) -> solo quien la publicó.
 */
import { AppError } from '../../middlewares/errorHandler';
import { registrarAuditoria } from '../../shared/logAuditoria';
import type {
  FiltrosRecibidasDto,
  ListaSolicitudesRecibidasDto,
  ResolverSolicitudDto,
  SolicitudDetalleDto,
  SolicitudResumenDto,
} from './solicitudes.dto';
import * as repo from './solicitudes.repository';

type Actor = { id: number; refugioId: number | null };
type SolicitudConDetalle = NonNullable<Awaited<ReturnType<typeof repo.buscarConDetalle>>>;
type MascotaDeSolicitud = SolicitudConDetalle['publicacion']['mascota'];

async function resolverActor(usuarioId: number): Promise<Actor> {
  const usuario = await repo.buscarUsuarioConRefugio(usuarioId);

  if (!usuario) {
    throw new AppError('NO_ENCONTRADO', 'El usuario no existe', 404);
  }

  return { id: usuario.id, refugioId: usuario.refugioId };
}

function esPropiaDelActor(mascota: MascotaDeSolicitud, actor: Actor): boolean {
  return mascota.refugioId !== null
    ? mascota.refugioId === actor.refugioId
    : mascota.usuarioId === actor.id;
}

/** La solicitud tiene que existir y ser de una mascota que el actor puede gestionar. */
async function exigirSolicitudPropia(
  solicitudId: number,
  actor: Actor,
): Promise<SolicitudConDetalle> {
  const solicitud = await repo.buscarConDetalle(solicitudId);

  if (!solicitud) {
    throw new AppError('NO_ENCONTRADO', 'La solicitud no existe', 404);
  }
  // Mismo mensaje que "no existe": no hay que revelarle a un tercero que la solicitud sí existe.
  if (!esPropiaDelActor(solicitud.publicacion.mascota, actor)) {
    throw new AppError('NO_ENCONTRADO', 'La solicitud no existe', 404);
  }

  return solicitud;
}

function aResumenDto(solicitud: SolicitudConDetalle): SolicitudResumenDto {
  // El historial viene ordenado desc: el primero es el estado vigente.
  const vigente = solicitud.historicoEstados[0]!.estadoSolicitud;

  return {
    id: solicitud.id,
    publicacionId: solicitud.publicacionId,
    mascota: {
      id: solicitud.publicacion.mascota.id,
      nombre: solicitud.publicacion.mascota.nombre,
      imagenUrl: solicitud.publicacion.mascota.imagenUrl,
    },
    solicitante: {
      id: solicitud.usuario.id,
      nombre: solicitud.usuario.nombre,
      apellido: solicitud.usuario.apellido,
    },
    tipoSolicitud: solicitud.tipoSolicitud.nombre,
    estado: { id: vigente.id, nombre: vigente.nombre },
    comentario: solicitud.comentario,
    fechaAlta: solicitud.fechaAlta.toISOString(),
    fechaRespuesta: solicitud.fechaRespuesta?.toISOString() ?? null,
  };
}

function aDetalleDto(solicitud: SolicitudConDetalle): SolicitudDetalleDto {
  return {
    ...aResumenDto(solicitud),
    motivacion: solicitud.motivacion,
    historial: solicitud.historicoEstados.map((h) => ({
      id: h.estadoSolicitud.id,
      nombre: h.estadoSolicitud.nombre,
      fecha: h.fechaAlta.toISOString(),
    })),
  };
}

export async function obtenerDetalle(
  solicitudId: number,
  usuarioId: number,
): Promise<SolicitudDetalleDto> {
  const actor = await resolverActor(usuarioId);
  const solicitud = await exigirSolicitudPropia(solicitudId, actor);

  return aDetalleDto(solicitud);
}

// ponytail: filtro por estado y paginación en memoria, no en la query — el volumen de
// solicitudes por actor es chico. Si esto escala, mover a where/skip/take en
// `repo.listarDelActor`.
export async function listarRecibidas(
  usuarioId: number,
  filtros: FiltrosRecibidasDto,
): Promise<ListaSolicitudesRecibidasDto> {
  const actor = await resolverActor(usuarioId);
  const todas = await repo.listarDelActor(actor);

  const filtradas = filtros.estado
    ? todas.filter((s) => s.historicoEstados[0]?.estadoSolicitud.nombre === filtros.estado)
    : todas;

  const pagina = filtradas.slice(filtros.desplazamiento, filtros.desplazamiento + filtros.limite);

  return { total: filtradas.length, solicitudes: pagina.map(aResumenDto) };
}

export async function resolverSolicitud(
  solicitudId: number,
  datos: ResolverSolicitudDto,
  usuarioId: number,
): Promise<SolicitudDetalleDto> {
  const actor = await resolverActor(usuarioId);
  const solicitud = await exigirSolicitudPropia(solicitudId, actor);

  const vigenteAlLeer = solicitud.historicoEstados[0]!.estadoSolicitud;
  if (vigenteAlLeer.nombre !== 'Pendiente') {
    throw new AppError('SOLICITUD_YA_RESUELTA', 'Esta solicitud ya fue resuelta', 409);
  }

  const nuevoEstado = await repo.buscarEstadoSolicitudPorNombre(datos.estado);
  if (!nuevoEstado) {
    throw new AppError('ERROR_INTERNO', `Falta el estado "${datos.estado}" en el catálogo`, 500);
  }

  // Revalida "Pendiente" atómicamente al escribir: si otro PATCH concurrente ya la
  // resolvió entre la lectura de arriba y este punto, `resolverSiPendiente` devuelve
  // `null` en vez de pisar su resultado.
  const actualizada = await repo.resolverSiPendiente(
    solicitudId,
    nuevoEstado.id,
    datos.comentario,
    usuarioId,
  );

  if (!actualizada) {
    throw new AppError('SOLICITUD_YA_RESUELTA', 'Esta solicitud ya fue resuelta', 409);
  }

  await registrarAuditoria({
    usuarioId,
    accion: datos.estado === 'Aprobada' ? 'APROBAR' : 'RECHAZAR',
    entidad: 'Solicitud',
    entidadId: solicitudId,
    detalle: `${vigenteAlLeer.nombre} -> ${datos.estado}`,
  });

  return aDetalleDto(actualizada);
}
