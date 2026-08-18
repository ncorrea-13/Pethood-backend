import * as repo from './dashboard-admin.repository';

export interface DashboardAdminDto {
  usuarios: { total: number; porRol: Record<string, number> };
  refugios: { total: number; verificados: number };
  mascotas: { total: number; porEstado: Record<string, number> };
  publicaciones: { activas: number };
  solicitudes: { porEstado: Record<string, number> };
  campanias: { activas: number; montoDonadoDeclarado: number };
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

export async function obtenerDashboard(): Promise<DashboardAdminDto> {
  const [
    roles,
    usuariosPorRol,
    totalUsuarios,
    totalRefugios,
    refugiosVerificados,
    estadosMascota,
    mascotasPorEstado,
    publicacionesActivas,
    estadosSolicitud,
    solicitudesPorEstado,
    campaniasActivas,
    montoDonadoDeclarado,
  ] = await Promise.all([
    repo.listarRoles(),
    repo.contarUsuariosPorRol(),
    repo.contarUsuariosActivos(),
    repo.contarRefugios(),
    repo.contarRefugiosVerificados(),
    repo.listarEstadosMascota(),
    repo.contarMascotasPorEstado(),
    repo.contarPublicacionesActivas(),
    repo.listarEstadosSolicitud(),
    repo.contarSolicitudesPorEstado(),
    repo.contarCampaniasActivas(),
    repo.sumarMontoDonadoDeclarado(),
  ]);

  return {
    usuarios: {
      total: totalUsuarios,
      porRol: aConteoPorNombre(roles, usuariosPorRol, (c) => c.rolId),
    },
    refugios: { total: totalRefugios, verificados: refugiosVerificados },
    mascotas: {
      total: mascotasPorEstado.reduce((acc, c) => acc + c._count._all, 0),
      porEstado: aConteoPorNombre(estadosMascota, mascotasPorEstado, (c) => c.estadoMascotaId),
    },
    publicaciones: { activas: publicacionesActivas },
    solicitudes: {
      porEstado: aConteoPorNombre(
        estadosSolicitud,
        solicitudesPorEstado,
        (c) => c.estadoSolicitudId,
      ),
    },
    campanias: { activas: campaniasActivas, montoDonadoDeclarado },
  };
}
