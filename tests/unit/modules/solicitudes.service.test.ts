import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../src/middlewares/errorHandler';
import * as logAuditoria from '../../../src/shared/logAuditoria';
import * as repo from '../../../src/modules/solicitudes/solicitudes.repository';
import * as service from '../../../src/modules/solicitudes/solicitudes.service';

vi.mock('../../../src/modules/solicitudes/solicitudes.repository');
vi.mock('../../../src/shared/logAuditoria');

const REFUGIO_ID = 1;
const OTRO_REFUGIO_ID = 2;
const MIEMBRO_REFUGIO = 5;
const OTRO_MIEMBRO_MISMO_REFUGIO = 6;
const ADOPTANTE_PUBLICADOR = 20;
const OTRO_ADOPTANTE = 21;
const SOLICITANTE = 7;
const SOLICITUD = 12;

const FECHA_ALTA = new Date('2026-08-20T12:00:00.000Z');
const FECHA_RESPUESTA = new Date('2026-09-02T18:00:00.000Z');

function estado(id: number, nombre: string) {
  return { id, nombre };
}

/** Fila de Solicitud_Estado tal como la devuelve Prisma, más nueva primero. */
function historialFila(estadoObj: { id: number; nombre: string }, fechaAlta: Date) {
  return { estadoSolicitud: estadoObj, fechaAlta };
}

/** `usuario` tal como lo devuelve `buscarUsuarioConRefugio`. */
function usuario(id: number, refugioId: number | null) {
  return { id, refugioId, fechaBaja: null };
}

/**
 * Solicitud con detalle tal como la devuelve `buscarConDetalle`/`resolverSiPendiente`.
 * `mascotaRefugioId` null = mascota publicada por un adoptante particular
 * (`mascotaUsuarioId` es quien la publicó); no nulo = mascota de un refugio.
 */
function solicitudConDetalle(opciones: {
  mascotaRefugioId?: number | null;
  mascotaUsuarioId?: number;
  historial: { estado: { id: number; nombre: string }; fecha: Date }[];
  comentario?: string | null;
  fechaRespuesta?: Date | null;
}) {
  const {
    mascotaRefugioId = REFUGIO_ID,
    mascotaUsuarioId = MIEMBRO_REFUGIO,
    historial,
    comentario = null,
    fechaRespuesta = null,
  } = opciones;

  return {
    id: SOLICITUD,
    publicacionId: 40,
    motivacion: 'Tengo patio grande y experiencia con la raza.',
    comentario,
    fechaAlta: FECHA_ALTA,
    fechaRespuesta,
    publicacion: {
      mascota: {
        id: 8,
        nombre: 'Toby',
        imagenUrl: '/img/toby.jpg',
        refugioId: mascotaRefugioId,
        usuarioId: mascotaUsuarioId,
      },
    },
    usuario: { id: SOLICITANTE, nombre: 'Ana', apellido: 'Pérez' },
    tipoSolicitud: { nombre: 'Adopcion' },
    historicoEstados: historial.map((h) => historialFila(h.estado, h.fecha)),
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(repo.buscarUsuarioConRefugio).mockResolvedValue(
    usuario(MIEMBRO_REFUGIO, REFUGIO_ID) as never,
  );
});

describe('resolución del actor (compartida por las tres operaciones)', () => {
  it('rechaza un usuario que no existe', async () => {
    vi.mocked(repo.buscarUsuarioConRefugio).mockResolvedValue(null as never);

    await expect(
      service.listarRecibidas(MIEMBRO_REFUGIO, { limite: 20, desplazamiento: 0 }),
    ).rejects.toMatchObject({ codigo: 'NO_ENCONTRADO', httpStatus: 404 });
  });

  it('no exige refugio: un adoptante sin refugioId es un actor válido (mascota personal)', async () => {
    vi.mocked(repo.buscarUsuarioConRefugio).mockResolvedValue(
      usuario(ADOPTANTE_PUBLICADOR, null) as never,
    );
    vi.mocked(repo.listarDelActor).mockResolvedValue([] as never);

    await expect(
      service.listarRecibidas(ADOPTANTE_PUBLICADOR, { limite: 20, desplazamiento: 0 }),
    ).resolves.toEqual({ total: 0, solicitudes: [] });
    expect(repo.listarDelActor).toHaveBeenCalledWith({ id: ADOPTANTE_PUBLICADOR, refugioId: null });
  });
});

describe('listarRecibidas', () => {
  it('devuelve las solicitudes del actor con su estado vigente', async () => {
    vi.mocked(repo.listarDelActor).mockResolvedValue([
      solicitudConDetalle({ historial: [{ estado: estado(1, 'Pendiente'), fecha: FECHA_ALTA }] }),
    ] as never);

    const { total, solicitudes } = await service.listarRecibidas(MIEMBRO_REFUGIO, {
      limite: 20,
      desplazamiento: 0,
    });

    expect(total).toBe(1);
    expect(solicitudes[0]).toMatchObject({
      id: SOLICITUD,
      estado: { id: 1, nombre: 'Pendiente' },
      mascota: { id: 8, nombre: 'Toby' },
      solicitante: { id: SOLICITANTE, nombre: 'Ana', apellido: 'Pérez' },
    });
    expect(repo.listarDelActor).toHaveBeenCalledWith({
      id: MIEMBRO_REFUGIO,
      refugioId: REFUGIO_ID,
    });
  });

  it('filtra por estado, contando solo lo que matchea', async () => {
    vi.mocked(repo.listarDelActor).mockResolvedValue([
      solicitudConDetalle({ historial: [{ estado: estado(1, 'Pendiente'), fecha: FECHA_ALTA }] }),
      solicitudConDetalle({
        historial: [{ estado: estado(3, 'Aprobada'), fecha: FECHA_RESPUESTA }],
      }),
    ] as never);

    const { total, solicitudes } = await service.listarRecibidas(MIEMBRO_REFUGIO, {
      estado: 'Pendiente',
      limite: 20,
      desplazamiento: 0,
    });

    expect(total).toBe(1);
    expect(solicitudes).toHaveLength(1);
    expect(solicitudes[0]!.estado.nombre).toBe('Pendiente');
  });

  it('pagina con limite/desplazamiento sobre el total filtrado', async () => {
    vi.mocked(repo.listarDelActor).mockResolvedValue(
      Array.from({ length: 3 }, () =>
        solicitudConDetalle({ historial: [{ estado: estado(1, 'Pendiente'), fecha: FECHA_ALTA }] }),
      ).map((s, i) => ({ ...s, id: i + 1 })) as never,
    );

    const { total, solicitudes } = await service.listarRecibidas(MIEMBRO_REFUGIO, {
      limite: 1,
      desplazamiento: 1,
    });

    expect(total).toBe(3);
    expect(solicitudes).toHaveLength(1);
    expect(solicitudes[0]!.id).toBe(2);
  });
});

describe('obtenerDetalle', () => {
  it('devuelve el historial completo, más reciente primero', async () => {
    vi.mocked(repo.buscarConDetalle).mockResolvedValue(
      solicitudConDetalle({
        comentario: 'Bienvenido a la familia',
        fechaRespuesta: FECHA_RESPUESTA,
        historial: [
          { estado: estado(3, 'Aprobada'), fecha: FECHA_RESPUESTA },
          { estado: estado(1, 'Pendiente'), fecha: FECHA_ALTA },
        ],
      }) as never,
    );

    const detalle = await service.obtenerDetalle(SOLICITUD, MIEMBRO_REFUGIO);

    expect(detalle.estado.nombre).toBe('Aprobada');
    expect(detalle.historial).toEqual([
      { id: 3, nombre: 'Aprobada', fecha: FECHA_RESPUESTA.toISOString() },
      { id: 1, nombre: 'Pendiente', fecha: FECHA_ALTA.toISOString() },
    ]);
  });

  it('rechaza una solicitud que no existe', async () => {
    vi.mocked(repo.buscarConDetalle).mockResolvedValue(null as never);

    await expect(service.obtenerDetalle(SOLICITUD, MIEMBRO_REFUGIO)).rejects.toMatchObject({
      codigo: 'NO_ENCONTRADO',
      httpStatus: 404,
    });
  });

  it('un miembro de OTRO refugio no puede ver la solicitud (404, no distingue de "no existe")', async () => {
    vi.mocked(repo.buscarConDetalle).mockResolvedValue(
      solicitudConDetalle({
        mascotaRefugioId: OTRO_REFUGIO_ID,
        historial: [{ estado: estado(1, 'Pendiente'), fecha: FECHA_ALTA }],
      }) as never,
    );

    await expect(service.obtenerDetalle(SOLICITUD, MIEMBRO_REFUGIO)).rejects.toMatchObject({
      codigo: 'NO_ENCONTRADO',
      httpStatus: 404,
    });
  });

  it('cualquier miembro del MISMO refugio puede ver la solicitud, no solo quien cargó la mascota', async () => {
    vi.mocked(repo.buscarUsuarioConRefugio).mockResolvedValue(
      usuario(OTRO_MIEMBRO_MISMO_REFUGIO, REFUGIO_ID) as never,
    );
    vi.mocked(repo.buscarConDetalle).mockResolvedValue(
      // La mascota la cargó MIEMBRO_REFUGIO, no OTRO_MIEMBRO_MISMO_REFUGIO.
      solicitudConDetalle({
        mascotaUsuarioId: MIEMBRO_REFUGIO,
        historial: [{ estado: estado(1, 'Pendiente'), fecha: FECHA_ALTA }],
      }) as never,
    );

    await expect(
      service.obtenerDetalle(SOLICITUD, OTRO_MIEMBRO_MISMO_REFUGIO),
    ).resolves.toMatchObject({ id: SOLICITUD });
  });

  it('un adoptante particular puede ver la solicitud de la mascota que él mismo publicó', async () => {
    vi.mocked(repo.buscarUsuarioConRefugio).mockResolvedValue(
      usuario(ADOPTANTE_PUBLICADOR, null) as never,
    );
    vi.mocked(repo.buscarConDetalle).mockResolvedValue(
      solicitudConDetalle({
        mascotaRefugioId: null,
        mascotaUsuarioId: ADOPTANTE_PUBLICADOR,
        historial: [{ estado: estado(1, 'Pendiente'), fecha: FECHA_ALTA }],
      }) as never,
    );

    await expect(service.obtenerDetalle(SOLICITUD, ADOPTANTE_PUBLICADOR)).resolves.toMatchObject({
      id: SOLICITUD,
    });
  });

  it('un adoptante NO puede ver la solicitud de la mascota de OTRO adoptante (404)', async () => {
    vi.mocked(repo.buscarUsuarioConRefugio).mockResolvedValue(
      usuario(OTRO_ADOPTANTE, null) as never,
    );
    vi.mocked(repo.buscarConDetalle).mockResolvedValue(
      solicitudConDetalle({
        mascotaRefugioId: null,
        mascotaUsuarioId: ADOPTANTE_PUBLICADOR,
        historial: [{ estado: estado(1, 'Pendiente'), fecha: FECHA_ALTA }],
      }) as never,
    );

    await expect(service.obtenerDetalle(SOLICITUD, OTRO_ADOPTANTE)).rejects.toMatchObject({
      codigo: 'NO_ENCONTRADO',
      httpStatus: 404,
    });
  });
});

describe('resolverSolicitud', () => {
  beforeEach(() => {
    vi.mocked(repo.buscarConDetalle).mockResolvedValue(
      solicitudConDetalle({
        historial: [{ estado: estado(1, 'Pendiente'), fecha: FECHA_ALTA }],
      }) as never,
    );
    vi.mocked(repo.buscarEstadoSolicitudPorNombre).mockResolvedValue(
      estado(3, 'Aprobada') as never,
    );
    vi.mocked(repo.resolverSiPendiente).mockResolvedValue(
      solicitudConDetalle({
        comentario: 'Bienvenido a la familia',
        fechaRespuesta: FECHA_RESPUESTA,
        historial: [
          { estado: estado(3, 'Aprobada'), fecha: FECHA_RESPUESTA },
          { estado: estado(1, 'Pendiente'), fecha: FECHA_ALTA },
        ],
      }) as never,
    );
  });

  it('acepta una solicitud pendiente', async () => {
    const resultado = await service.resolverSolicitud(
      SOLICITUD,
      { estado: 'Aprobada', comentario: 'Bienvenido a la familia' },
      MIEMBRO_REFUGIO,
    );

    expect(resultado.estado.nombre).toBe('Aprobada');
    expect(repo.resolverSiPendiente).toHaveBeenCalledWith(
      SOLICITUD,
      3,
      'Bienvenido a la familia',
      MIEMBRO_REFUGIO,
    );
  });

  it('un adoptante particular puede resolver la solicitud de su propia mascota publicada', async () => {
    vi.mocked(repo.buscarUsuarioConRefugio).mockResolvedValue(
      usuario(ADOPTANTE_PUBLICADOR, null) as never,
    );
    vi.mocked(repo.buscarConDetalle).mockResolvedValue(
      solicitudConDetalle({
        mascotaRefugioId: null,
        mascotaUsuarioId: ADOPTANTE_PUBLICADOR,
        historial: [{ estado: estado(1, 'Pendiente'), fecha: FECHA_ALTA }],
      }) as never,
    );

    await expect(
      service.resolverSolicitud(
        SOLICITUD,
        { estado: 'Aprobada', comentario: null },
        ADOPTANTE_PUBLICADOR,
      ),
    ).resolves.toMatchObject({ estado: { nombre: 'Aprobada' } });
  });

  it('rechaza resolver una solicitud que ya no está pendiente (chequeo previo, sin llegar a la DB)', async () => {
    vi.mocked(repo.buscarConDetalle).mockResolvedValue(
      solicitudConDetalle({
        historial: [{ estado: estado(3, 'Aprobada'), fecha: FECHA_RESPUESTA }],
      }) as never,
    );

    await expect(
      service.resolverSolicitud(
        SOLICITUD,
        { estado: 'Rechazada', comentario: null },
        MIEMBRO_REFUGIO,
      ),
    ).rejects.toMatchObject({ codigo: 'SOLICITUD_YA_RESUELTA', httpStatus: 409 });
    expect(repo.resolverSiPendiente).not.toHaveBeenCalled();
  });

  it('dos PATCH concurrentes: el que pierde la carrera atómica recibe 409, no pisa el histórico', async () => {
    // El chequeo previo la ve "Pendiente", pero para cuando la transacción Serializable
    // corre, el otro PATCH ya ganó — resolverSiPendiente devuelve null.
    vi.mocked(repo.resolverSiPendiente).mockResolvedValue(null as never);

    await expect(
      service.resolverSolicitud(
        SOLICITUD,
        { estado: 'Aprobada', comentario: null },
        MIEMBRO_REFUGIO,
      ),
    ).rejects.toMatchObject({ codigo: 'SOLICITUD_YA_RESUELTA', httpStatus: 409 });
  });

  it('un miembro de OTRO refugio no puede resolverla (404)', async () => {
    vi.mocked(repo.buscarConDetalle).mockResolvedValue(
      solicitudConDetalle({
        mascotaRefugioId: OTRO_REFUGIO_ID,
        historial: [{ estado: estado(1, 'Pendiente'), fecha: FECHA_ALTA }],
      }) as never,
    );

    await expect(
      service.resolverSolicitud(
        SOLICITUD,
        { estado: 'Aprobada', comentario: null },
        MIEMBRO_REFUGIO,
      ),
    ).rejects.toMatchObject({ codigo: 'NO_ENCONTRADO', httpStatus: 404 });
    expect(repo.resolverSiPendiente).not.toHaveBeenCalled();
  });

  it('un adoptante no puede resolver la solicitud de la mascota de OTRO adoptante (404)', async () => {
    vi.mocked(repo.buscarUsuarioConRefugio).mockResolvedValue(
      usuario(OTRO_ADOPTANTE, null) as never,
    );
    vi.mocked(repo.buscarConDetalle).mockResolvedValue(
      solicitudConDetalle({
        mascotaRefugioId: null,
        mascotaUsuarioId: ADOPTANTE_PUBLICADOR,
        historial: [{ estado: estado(1, 'Pendiente'), fecha: FECHA_ALTA }],
      }) as never,
    );

    await expect(
      service.resolverSolicitud(
        SOLICITUD,
        { estado: 'Aprobada', comentario: null },
        OTRO_ADOPTANTE,
      ),
    ).rejects.toMatchObject({ codigo: 'NO_ENCONTRADO', httpStatus: 404 });
    expect(repo.resolverSiPendiente).not.toHaveBeenCalled();
  });

  it('revienta con un error interno si el catálogo no tiene el estado destino', async () => {
    vi.mocked(repo.buscarEstadoSolicitudPorNombre).mockResolvedValue(null as never);

    await expect(
      service.resolverSolicitud(
        SOLICITUD,
        { estado: 'Aprobada', comentario: null },
        MIEMBRO_REFUGIO,
      ),
    ).rejects.toMatchObject({ codigo: 'ERROR_INTERNO', httpStatus: 500 });
  });

  it('registra la auditoría con el estado anterior y el nuevo', async () => {
    await service.resolverSolicitud(
      SOLICITUD,
      { estado: 'Aprobada', comentario: null },
      MIEMBRO_REFUGIO,
    );

    expect(logAuditoria.registrarAuditoria).toHaveBeenCalledWith({
      usuarioId: MIEMBRO_REFUGIO,
      accion: 'APROBAR',
      entidad: 'Solicitud',
      entidadId: SOLICITUD,
      detalle: 'Pendiente -> Aprobada',
    });
  });

  it('no registra auditoría si pierde la carrera atómica', async () => {
    vi.mocked(repo.resolverSiPendiente).mockResolvedValue(null as never);

    await expect(
      service.resolverSolicitud(
        SOLICITUD,
        { estado: 'Aprobada', comentario: null },
        MIEMBRO_REFUGIO,
      ),
    ).rejects.toMatchObject({ codigo: 'SOLICITUD_YA_RESUELTA' });
    expect(logAuditoria.registrarAuditoria).not.toHaveBeenCalled();
  });

  it('los errores son AppError, así el errorHandler los traduce al formato de la API', async () => {
    vi.mocked(repo.buscarConDetalle).mockResolvedValue(null as never);

    await expect(
      service.resolverSolicitud(
        SOLICITUD,
        { estado: 'Aprobada', comentario: null },
        MIEMBRO_REFUGIO,
      ),
    ).rejects.toBeInstanceOf(AppError);
  });
});
