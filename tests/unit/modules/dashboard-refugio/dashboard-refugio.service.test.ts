import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../../src/middlewares/errorHandler';

vi.mock('../../../../src/modules/dashboard-refugio/dashboard-refugio.repository', () => ({
  buscarUsuarioConRefugio: vi.fn(),
  buscarRefugio: vi.fn(),
  contarMascotasEnRefugio: vi.fn(),
  listarEstadosSolicitud: vi.fn(),
  contarSolicitudesPorEstado: vi.fn(),
  contarSolicitudesCreadas: vi.fn(),
  listarDonaciones: vi.fn(),
  sumarObjetivoCampaniasActivas: vi.fn(),
  paginaSolicitudesParaExport: vi.fn(),
}));

import * as repo from '../../../../src/modules/dashboard-refugio/dashboard-refugio.repository';
import { obtenerDashboard } from '../../../../src/modules/dashboard-refugio/dashboard-refugio.service';

const mockedRepo = vi.mocked(repo);

const ESTADOS_SOLICITUD = [
  { id: 1, nombre: 'Pendiente' },
  { id: 2, nombre: 'En_Revision' },
  { id: 3, nombre: 'Aprobada' },
  { id: 4, nombre: 'Rechazada' },
  { id: 5, nombre: 'Cancelada' },
];

const PERIODO = { desde: '2026-03', hasta: '2026-08' };

beforeEach(() => {
  vi.clearAllMocks();
  mockedRepo.buscarUsuarioConRefugio.mockResolvedValue({
    id: 10,
    refugioId: 1,
  } as never);
  mockedRepo.buscarRefugio.mockResolvedValue({
    id: 1,
    nombre: 'Refugio Patitas',
    direccion: 'Av. Siempre Viva 123',
  } as never);
  mockedRepo.contarMascotasEnRefugio.mockResolvedValue(0);
  mockedRepo.listarEstadosSolicitud.mockResolvedValue(ESTADOS_SOLICITUD as never);
  mockedRepo.contarSolicitudesPorEstado.mockResolvedValue([] as never);
  mockedRepo.contarSolicitudesCreadas.mockResolvedValue(0);
  mockedRepo.listarDonaciones.mockResolvedValue([] as never);
  mockedRepo.sumarObjetivoCampaniasActivas.mockResolvedValue(0);
});

describe('obtenerDashboard', () => {
  it('lanza SIN_REFUGIO si el usuario no tiene refugio asignado', async () => {
    mockedRepo.buscarUsuarioConRefugio.mockResolvedValue({ id: 10, refugioId: null } as never);

    await expect(obtenerDashboard(10, PERIODO)).rejects.toMatchObject({
      codigo: 'SIN_REFUGIO',
    } satisfies Partial<AppError>);
  });

  it('lanza NO_ENCONTRADO si el usuario no existe', async () => {
    mockedRepo.buscarUsuarioConRefugio.mockResolvedValue(null);

    await expect(obtenerDashboard(10, PERIODO)).rejects.toMatchObject({
      codigo: 'NO_ENCONTRADO',
    } satisfies Partial<AppError>);
  });

  it('usa direccion del refugio como localidad y arma kpis en 0 sin datos', async () => {
    const dashboard = await obtenerDashboard(10, PERIODO);

    expect(dashboard.refugio).toEqual({
      nombre: 'Refugio Patitas',
      localidad: 'Av. Siempre Viva 123',
    });
    expect(dashboard.kpis).toEqual({
      animalesAdoptados: 0,
      solicitudesCreadas: 0,
      animalesEnRefugio: 0,
      montoDonado: 0,
      objetivoDonaciones: 0,
    });
  });

  it('calcula animalesAdoptados desde solicitudesPorEstado (estado Aprobada)', async () => {
    mockedRepo.contarSolicitudesPorEstado.mockResolvedValue([
      { estadoSolicitudId: 3, _count: { _all: 4 } },
      { estadoSolicitudId: 1, _count: { _all: 1 } },
    ] as never);

    const dashboard = await obtenerDashboard(10, PERIODO);

    expect(dashboard.kpis.animalesAdoptados).toBe(4);
    const aprobada = dashboard.solicitudesPorEstado.find((s) => s.estado === 'Aprobada');
    expect(aprobada).toEqual({ estado: 'Aprobada', cantidad: 4, porcentaje: 80 });
  });

  it('agrupa donaciones por mes calendario dentro del período, con objetivo constante', async () => {
    mockedRepo.sumarObjetivoCampaniasActivas.mockResolvedValue(60000);
    mockedRepo.listarDonaciones.mockResolvedValue([
      { fechaAlta: new Date(2026, 2, 10), monto: 5000 },
      { fechaAlta: new Date(2026, 2, 20), monto: 3000 },
      { fechaAlta: new Date(2026, 7, 1), monto: 7000 },
    ] as never);

    const dashboard = await obtenerDashboard(10, PERIODO);

    expect(dashboard.donacionesPorMes).toHaveLength(6);
    expect(dashboard.donacionesPorMes[0]).toEqual({
      mes: 'Mar 2026',
      monto: 8000,
      objetivo: 60000,
    });
    expect(dashboard.donacionesPorMes[5]).toEqual({
      mes: 'Ago 2026',
      monto: 7000,
      objetivo: 60000,
    });
    expect(dashboard.kpis.montoDonado).toBe(15000);
    expect(dashboard.kpis.objetivoDonaciones).toBe(60000);
  });
});
