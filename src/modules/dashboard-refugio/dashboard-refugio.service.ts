import { AppError } from '../../middlewares/errorHandler';
import { finDeMes, inicioDeMes, parsearMesISO } from '../../shared/validation/dates';
import type { PeriodoDashboardInput } from './dashboard-refugio.dto';
import * as repo from './dashboard-refugio.repository';

const MESES_ES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const;

export interface DashboardRefugioDto {
  refugio: { nombre: string; localidad: string };
  periodo: { desde: string; hasta: string };
  kpis: {
    animalesAdoptados: number;
    solicitudesCreadas: number;
    animalesEnRefugio: number;
    montoDonado: number;
    objetivoDonaciones: number;
  };
  solicitudesPorEstado: { estado: string; cantidad: number; porcentaje: number }[];
  donacionesPorMes: { mes: string; monto: number; objetivo: number }[];
}

/** Precondición compartida con mascotas.service.ts: solo un usuario Refugio con refugioId puede operar. */
async function exigirRefugioDeUsuario(usuarioId: number) {
  const usuario = await repo.buscarUsuarioConRefugio(usuarioId);

  if (!usuario) {
    throw new AppError('NO_ENCONTRADO', 'El usuario no existe', 404);
  }
  if (!usuario.refugioId) {
    throw new AppError('SIN_REFUGIO', 'Tu usuario no está asociado a ningún refugio', 403);
  }

  const refugio = await repo.buscarRefugio(usuario.refugioId);
  if (!refugio) {
    throw new AppError('NO_ENCONTRADO', 'El refugio no existe', 404);
  }

  return refugio;
}

function rangoDelPeriodo(periodo: PeriodoDashboardInput): { desde: Date; hasta: Date } {
  const desde = parsearMesISO(periodo.desde)!;
  const hasta = parsearMesISO(periodo.hasta)!;

  return {
    desde: inicioDeMes(desde.anio, desde.mes),
    hasta: finDeMes(hasta.anio, hasta.mes),
  };
}

/** Un elemento por mes calendario entre desde y hasta (inclusive), en orden cronológico. */
function clavesDeMeses(periodo: PeriodoDashboardInput): { clave: string; etiqueta: string }[] {
  const desde = parsearMesISO(periodo.desde)!;
  const hasta = parsearMesISO(periodo.hasta)!;
  const claves: { clave: string; etiqueta: string }[] = [];

  let anio = desde.anio;
  let mes = desde.mes;
  while (anio < hasta.anio || (anio === hasta.anio && mes <= hasta.mes)) {
    claves.push({ clave: `${anio}-${mes}`, etiqueta: `${MESES_ES[mes - 1]} ${anio}` });
    mes += 1;
    if (mes > 12) {
      mes = 1;
      anio += 1;
    }
  }

  return claves;
}

function aSolicitudesPorEstado(
  estados: { id: number; nombre: string }[],
  conteos: { estadoSolicitudId: number; _count: { _all: number } }[],
) {
  const total = conteos.reduce((acc, c) => acc + c._count._all, 0);
  const porId = new Map(conteos.map((c) => [c.estadoSolicitudId, c._count._all]));

  return estados.map(({ id, nombre }) => {
    const cantidad = porId.get(id) ?? 0;
    return {
      estado: nombre,
      cantidad,
      porcentaje: total === 0 ? 0 : Math.round((cantidad / total) * 1000) / 10,
    };
  });
}

function aDonacionesPorMes(
  periodo: PeriodoDashboardInput,
  donaciones: { fechaAlta: Date; monto: unknown }[],
  objetivo: number,
): { mes: string; monto: number; objetivo: number }[] {
  const montoPorClave = new Map<string, number>();
  for (const { fechaAlta, monto } of donaciones) {
    const clave = `${fechaAlta.getFullYear()}-${fechaAlta.getMonth() + 1}`;
    montoPorClave.set(clave, (montoPorClave.get(clave) ?? 0) + Number(monto));
  }

  return clavesDeMeses(periodo).map(({ clave, etiqueta }) => ({
    mes: etiqueta,
    monto: montoPorClave.get(clave) ?? 0,
    objetivo,
  }));
}

export async function obtenerDashboard(
  usuarioId: number,
  periodo: PeriodoDashboardInput,
): Promise<DashboardRefugioDto> {
  const refugio = await exigirRefugioDeUsuario(usuarioId);
  const { desde, hasta } = rangoDelPeriodo(periodo);

  const [
    animalesEnRefugio,
    estadosSolicitud,
    solicitudesPorEstado,
    solicitudesCreadas,
    donaciones,
    objetivoDonaciones,
  ] = await Promise.all([
    repo.contarMascotasEnRefugio(refugio.id),
    repo.listarEstadosSolicitud(),
    repo.contarSolicitudesPorEstado(refugio.id, desde, hasta),
    repo.contarSolicitudesCreadas(refugio.id, desde, hasta),
    repo.listarDonaciones(refugio.id, desde, hasta),
    repo.sumarObjetivoCampaniasActivas(refugio.id),
  ]);

  const solicitudesPorEstadoConPorcentaje = aSolicitudesPorEstado(
    estadosSolicitud,
    solicitudesPorEstado,
  );
  const animalesAdoptados =
    solicitudesPorEstadoConPorcentaje.find((s) => s.estado === 'Aprobada')?.cantidad ?? 0;
  const montoDonado = donaciones.reduce((acc, d) => acc + Number(d.monto), 0);

  return {
    refugio: { nombre: refugio.nombre, localidad: refugio.direccion },
    periodo: { desde: periodo.desde, hasta: periodo.hasta },
    kpis: {
      animalesAdoptados,
      solicitudesCreadas,
      animalesEnRefugio,
      montoDonado,
      objetivoDonaciones,
    },
    solicitudesPorEstado: solicitudesPorEstadoConPorcentaje,
    donacionesPorMes: aDonacionesPorMes(periodo, donaciones, objetivoDonaciones),
  };
}

// ─────────────── EXPORT CSV ───────────────

const FILAS_POR_PAGINA = 500;
const HEADERS_EXPORT_SOLICITUDES = ['id', 'mascota', 'tipoSolicitud', 'estado', 'fechaAlta'];

async function* filasSolicitudes(refugioId: number, desde: Date, hasta: Date) {
  let cursorId: number | undefined;
  for (;;) {
    const pagina = await repo.paginaSolicitudesParaExport(
      refugioId,
      desde,
      hasta,
      cursorId,
      FILAS_POR_PAGINA,
    );
    if (pagina.length === 0) return;
    for (const s of pagina) {
      yield [
        s.id,
        s.publicacion.mascota.nombre,
        s.tipoSolicitud.nombre,
        s.historicoEstados[0]?.estadoSolicitud.nombre ?? '',
        s.fechaAlta,
      ];
    }
    cursorId = pagina[pagina.length - 1]!.id;
    if (pagina.length < FILAS_POR_PAGINA) return;
  }
}

/**
 * Resuelve permisos y período ANTES de que el controller empiece a escribir la respuesta CSV
 * (una vez que res.write() corrió no se puede volver a un 403/400 JSON) — mismo motivo por el
 * que dashboard-admin valida la entidad antes de setear headers.
 */
export async function prepararExportSolicitudes(usuarioId: number, periodo: PeriodoDashboardInput) {
  const refugio = await exigirRefugioDeUsuario(usuarioId);
  const { desde, hasta } = rangoDelPeriodo(periodo);

  return {
    headers: HEADERS_EXPORT_SOLICITUDES,
    filas: () => filasSolicitudes(refugio.id, desde, hasta),
  };
}
