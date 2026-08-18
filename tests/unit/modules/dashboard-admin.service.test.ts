import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as repo from '../../../src/modules/dashboard-admin/dashboard-admin.repository';
import * as service from '../../../src/modules/dashboard-admin/dashboard-admin.service';

vi.mock('../../../src/modules/dashboard-admin/dashboard-admin.repository');

const ROLES = [
  { id: 1, nombre: 'Administrador' },
  { id: 2, nombre: 'Refugio' },
  { id: 3, nombre: 'Adoptante' },
];

const ESTADOS_MASCOTA = [
  { id: 1, nombre: 'Disponible' },
  { id: 2, nombre: 'En_Tratamiento' },
  { id: 3, nombre: 'Adoptado' },
  { id: 4, nombre: 'Fallecido' },
  { id: 5, nombre: 'En_Transito' },
];

const ESTADOS_SOLICITUD = [
  { id: 1, nombre: 'Pendiente' },
  { id: 2, nombre: 'En_Revision' },
  { id: 3, nombre: 'Aprobada' },
  { id: 4, nombre: 'Rechazada' },
  { id: 5, nombre: 'Cancelada' },
];

function conteo(_all: number) {
  return { _count: { _all } };
}

beforeEach(() => {
  vi.resetAllMocks();

  vi.mocked(repo.listarRoles).mockResolvedValue(ROLES as never);
  vi.mocked(repo.listarEstadosMascota).mockResolvedValue(ESTADOS_MASCOTA as never);
  vi.mocked(repo.listarEstadosSolicitud).mockResolvedValue(ESTADOS_SOLICITUD as never);

  vi.mocked(repo.contarUsuariosPorRol).mockResolvedValue([
    { rolId: 2, ...conteo(1) },
    { rolId: 3, ...conteo(1) },
  ] as never);
  vi.mocked(repo.contarUsuariosActivos).mockResolvedValue(3);
  vi.mocked(repo.contarRefugios).mockResolvedValue(1);
  vi.mocked(repo.contarRefugiosVerificados).mockResolvedValue(1);
  vi.mocked(repo.contarMascotasPorEstado).mockResolvedValue([
    { estadoMascotaId: 1, ...conteo(2) },
    { estadoMascotaId: 2, ...conteo(1) },
    { estadoMascotaId: 3, ...conteo(1) },
    { estadoMascotaId: 4, ...conteo(1) },
    { estadoMascotaId: 5, ...conteo(1) },
  ] as never);
  vi.mocked(repo.contarPublicacionesActivas).mockResolvedValue(5);
  vi.mocked(repo.contarSolicitudesPorEstado).mockResolvedValue([
    { estadoSolicitudId: 1, ...conteo(1) },
    { estadoSolicitudId: 3, ...conteo(1) },
    { estadoSolicitudId: 4, ...conteo(1) },
    { estadoSolicitudId: 5, ...conteo(1) },
  ] as never); // En_Revision (id 2) sin filas — debe quedar en 0
  vi.mocked(repo.contarCampaniasActivas).mockResolvedValue(1);
  vi.mocked(repo.sumarMontoDonadoDeclarado).mockResolvedValue(95000);
});

describe('obtenerDashboard — usuarios y refugios', () => {
  it('completa con 0 los roles sin usuarios asignados (Administrador)', async () => {
    const dashboard = await service.obtenerDashboard();

    expect(dashboard.usuarios.porRol).toEqual({ Administrador: 0, Refugio: 1, Adoptante: 1 });
    expect(dashboard.usuarios.total).toBe(3);
  });

  it('reporta refugios verificados sobre el total', async () => {
    const dashboard = await service.obtenerDashboard();

    expect(dashboard.refugios).toEqual({ total: 1, verificados: 1 });
  });
});

describe('obtenerDashboard — mascotas', () => {
  it('el total es la suma de todos los estados', async () => {
    const dashboard = await service.obtenerDashboard();

    expect(dashboard.mascotas.total).toBe(6);
    expect(dashboard.mascotas.porEstado).toEqual({
      Disponible: 2,
      En_Tratamiento: 1,
      Adoptado: 1,
      Fallecido: 1,
      En_Transito: 1,
    });
  });
});

describe('obtenerDashboard — solicitudes', () => {
  it('completa con 0 un estado sin solicitudes (En_Revision)', async () => {
    const dashboard = await service.obtenerDashboard();

    expect(dashboard.solicitudes.porEstado).toEqual({
      Pendiente: 1,
      En_Revision: 0,
      Aprobada: 1,
      Rechazada: 1,
      Cancelada: 1,
    });
  });
});

describe('obtenerDashboard — campañas y donaciones', () => {
  it('expone el monto donado declarado (no confirmado — ver spec 009 §3)', async () => {
    const dashboard = await service.obtenerDashboard();

    expect(dashboard.campanias).toEqual({ activas: 1, montoDonadoDeclarado: 95000 });
  });

  it('sin donaciones el monto declarado es 0, no null ni NaN', async () => {
    vi.mocked(repo.sumarMontoDonadoDeclarado).mockResolvedValue(0);

    const dashboard = await service.obtenerDashboard();

    expect(dashboard.campanias.montoDonadoDeclarado).toBe(0);
  });
});

describe('obtenerDashboard — publicaciones', () => {
  it('reporta las publicaciones activas', async () => {
    const dashboard = await service.obtenerDashboard();

    expect(dashboard.publicaciones).toEqual({ activas: 5 });
  });
});
