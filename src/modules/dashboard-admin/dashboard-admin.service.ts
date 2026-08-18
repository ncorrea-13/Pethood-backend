import * as repo from './dashboard-admin.repository';

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

const VENTANA_MESES = 6;

export interface DashboardAdminDto {
  kpis: {
    usuariosActivos: number;
    mascotasRegistradas: number;
    refugiosVerificados: number;
    publicacionesActivas: number;
    adopcionesConcretadas: number;
    campaniasActivas: number;
    montoDonadoDeclarado: number;
    reportesPendientes: number;
  };
  usuariosPorRol: Record<string, number>;
  mascotasPorEstado: Record<string, number>;
  solicitudesPorEstado: { estado: string; cantidad: number; porcentaje: number }[];
  publicacionesPorMes: { mes: string; publicaciones: number; adopciones: number }[];
}

/** Junta un catálogo con su groupBy de conteos, en un Record nombre → cantidad (0 si no hubo filas). */
function aConteoPorNombre<C extends { _count: { _all: number } }>(
  catalogo: { id: number; nombre: string }[],
  conteos: C[],
  idDeConteo: (conteo: C) => number,
): Record<string, number> {
  const porId = new Map(conteos.map((c) => [idDeConteo(c), c._count._all]));

  return Object.fromEntries(catalogo.map((item) => [item.nombre, porId.get(item.id) ?? 0]));
}

function aSolicitudesPorEstado(
  estados: { id: number; nombre: string }[],
  conteos: { estadoSolicitudId: number; _count: { _all: number } }[],
) {
  const total = conteos.reduce((acc, c) => acc + c._count._all, 0);
  const porNombre = aConteoPorNombre(estados, conteos, (c) => c.estadoSolicitudId);

  return estados.map(({ nombre }) => ({
    estado: nombre,
    cantidad: porNombre[nombre]!,
    porcentaje: total === 0 ? 0 : Math.round((porNombre[nombre]! / total) * 1000) / 10,
  }));
}

/** Últimos VENTANA_MESES meses (incluye el actual), en orden cronológico, con 0 donde no hay filas. */
function aSerieMensual(
  publicaciones: { fechaAlta: Date }[],
  adopciones: { fechaAlta: Date }[],
): { mes: string; publicaciones: number; adopciones: number }[] {
  const ahora = new Date();
  const claves: string[] = [];
  const etiquetas = new Map<string, string>();

  for (let i = VENTANA_MESES - 1; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const clave = `${d.getFullYear()}-${d.getMonth()}`;
    claves.push(clave);
    etiquetas.set(clave, MESES_ES[d.getMonth()]!);
  }

  const contarPorClave = (fechas: { fechaAlta: Date }[]) => {
    const conteo = new Map<string, number>();
    for (const { fechaAlta } of fechas) {
      const clave = `${fechaAlta.getFullYear()}-${fechaAlta.getMonth()}`;
      conteo.set(clave, (conteo.get(clave) ?? 0) + 1);
    }
    return conteo;
  };

  const publicacionesPorClave = contarPorClave(publicaciones);
  const adopcionesPorClave = contarPorClave(adopciones);

  return claves.map((clave) => ({
    mes: etiquetas.get(clave)!,
    publicaciones: publicacionesPorClave.get(clave) ?? 0,
    adopciones: adopcionesPorClave.get(clave) ?? 0,
  }));
}

export async function obtenerDashboard(): Promise<DashboardAdminDto> {
  const [
    roles,
    usuariosPorRol,
    usuariosActivos,
    refugiosVerificados,
    estadosMascota,
    mascotasPorEstado,
    publicacionesActivas,
    estadosSolicitud,
    solicitudesPorEstado,
    campaniasActivas,
    montoDonadoDeclarado,
    reportesPendientes,
    fechasPublicaciones,
    fechasAdopciones,
  ] = await Promise.all([
    repo.listarRoles(),
    repo.contarUsuariosPorRol(),
    repo.contarUsuariosActivos(),
    repo.contarRefugiosVerificados(),
    repo.listarEstadosMascota(),
    repo.contarMascotasPorEstado(),
    repo.contarPublicacionesActivas(),
    repo.listarEstadosSolicitud(),
    repo.contarSolicitudesPorEstado(),
    repo.contarCampaniasActivas(),
    repo.sumarMontoDonadoDeclarado(),
    repo.contarReportesPendientes(),
    repo.listarFechasPublicacionesActivas(),
    repo.listarFechasSolicitudesAprobadas(),
  ]);

  const solicitudesPorEstadoConPorcentaje = aSolicitudesPorEstado(
    estadosSolicitud,
    solicitudesPorEstado,
  );
  const adopcionesConcretadas =
    solicitudesPorEstadoConPorcentaje.find((s) => s.estado === 'Aprobada')?.cantidad ?? 0;

  return {
    kpis: {
      usuariosActivos,
      mascotasRegistradas: mascotasPorEstado.reduce((acc, c) => acc + c._count._all, 0),
      refugiosVerificados,
      publicacionesActivas,
      adopcionesConcretadas,
      campaniasActivas,
      montoDonadoDeclarado,
      reportesPendientes,
    },
    usuariosPorRol: aConteoPorNombre(roles, usuariosPorRol, (c) => c.rolId),
    mascotasPorEstado: aConteoPorNombre(
      estadosMascota,
      mascotasPorEstado,
      (c) => c.estadoMascotaId,
    ),
    solicitudesPorEstado: solicitudesPorEstadoConPorcentaje,
    publicacionesPorMes: aSerieMensual(fechasPublicaciones, fechasAdopciones),
  };
}
