import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../src/middlewares/errorHandler';
import * as repo from '../../../src/modules/mascotas/mascotas.repository';
import * as service from '../../../src/modules/mascotas/mascotas.service';
import { borrarImagen, guardarImagen } from '../../../src/shared/storage';
import type { CrearMascotaDto } from '../../../src/modules/mascotas/mascotas.dto';

vi.mock('../../../src/modules/mascotas/mascotas.repository');
vi.mock('../../../src/shared/storage');
vi.mock('../../../src/shared/logAuditoria');

const ESTADOS = {
  Disponible: { id: 1, nombre: 'Disponible' },
  En_Tratamiento: { id: 2, nombre: 'En_Tratamiento' },
  Adoptado: { id: 3, nombre: 'Adoptado' },
  En_Transito: { id: 5, nombre: 'En_Transito' },
} as const;

const ARCHIVO = { buffer: Buffer.from('foto'), mimetype: 'image/jpeg' };

const DATOS_ADOPTANTE: CrearMascotaDto = {
  actor: 'ADOPTANTE',
  destino: 'ADOPCION',
  nombre: 'Fido',
  fechaNacimiento: new Date(2022, 2, 15),
  genero: 'MACHO',
  peso: 12.5,
  tamanio: 'MEDIANO',
  especieId: 1,
  razaId: 2,
};

/** Arma lo que devolvería el repository tras crear, con el estado pedido. */
function mascotaCreada(estado: { id: number; nombre: string }, refugioId: number | null = null) {
  return {
    id: 10,
    nombre: 'Fido',
    fechaNacimiento: new Date(2022, 2, 15),
    genero: 'MACHO',
    peso: 12.5,
    tamanio: 'MEDIANO',
    imagenUrl: '/api/v1/archivos/mascotas/x.jpg',
    refugioId,
    usuarioId: 2,
    raza: { id: 2, nombre: 'Labrador', especie: { id: 1, nombre: 'Perro' } },
    historicoEstados: [{ estadoMascota: estado }],
  };
}

beforeEach(() => {
  vi.resetAllMocks();

  vi.mocked(repo.buscarUsuario).mockResolvedValue({
    id: 2,
    verificado: true,
    refugioId: null,
  } as never);
  vi.mocked(repo.buscarRaza).mockResolvedValue({
    id: 2,
    especieId: 1,
    nombre: 'Labrador',
  } as never);
  vi.mocked(guardarImagen).mockResolvedValue('/api/v1/archivos/mascotas/x.jpg');
});

describe('crearMascota — foto', () => {
  it('rechaza el alta si no vino una foto', async () => {
    await expect(service.crearMascota(DATOS_ADOPTANTE, { usuarioId: 2 })).rejects.toMatchObject({
      codigo: 'FOTO_REQUERIDA',
      mensaje: 'Debe agregar al menos una foto de la mascota',
    });
  });

  it('no guarda la imagen si la validación falla antes', async () => {
    await service.crearMascota(DATOS_ADOPTANTE, { usuarioId: 2 }).catch(() => undefined);

    expect(guardarImagen).not.toHaveBeenCalled();
  });

  it('borra la imagen si la escritura en base falla', async () => {
    vi.mocked(repo.buscarEstadoMascotaPorNombre).mockResolvedValue(ESTADOS.Disponible as never);
    vi.mocked(repo.crearConEstado).mockRejectedValue(new Error('base caída'));

    await expect(
      service.crearMascota(DATOS_ADOPTANTE, { usuarioId: 2, archivo: ARCHIVO }),
    ).rejects.toThrow('base caída');

    expect(borrarImagen).toHaveBeenCalledWith('/api/v1/archivos/mascotas/x.jpg');
  });
});

describe('crearMascota — usuario', () => {
  it('rechaza a un usuario sin verificar', async () => {
    vi.mocked(repo.buscarUsuario).mockResolvedValue({ id: 2, verificado: false } as never);

    await expect(
      service.crearMascota(DATOS_ADOPTANTE, { usuarioId: 2, archivo: ARCHIVO }),
    ).rejects.toMatchObject({ codigo: 'USUARIO_NO_VERIFICADO' });
  });

  it('rechaza a un usuario inexistente', async () => {
    vi.mocked(repo.buscarUsuario).mockResolvedValue(null as never);

    await expect(
      service.crearMascota(DATOS_ADOPTANTE, { usuarioId: 99, archivo: ARCHIVO }),
    ).rejects.toBeInstanceOf(AppError);
  });
});

describe('crearMascota — especie y raza', () => {
  it('rechaza una raza que no pertenece a la especie elegida', async () => {
    vi.mocked(repo.buscarRaza).mockResolvedValue({ id: 2, especieId: 9 } as never);

    await expect(
      service.crearMascota(DATOS_ADOPTANTE, { usuarioId: 2, archivo: ARCHIVO }),
    ).rejects.toMatchObject({ mensaje: 'La raza no corresponde a la especie elegida' });
  });

  it('rechaza una raza inexistente', async () => {
    vi.mocked(repo.buscarRaza).mockResolvedValue(null as never);

    await expect(
      service.crearMascota(DATOS_ADOPTANTE, { usuarioId: 2, archivo: ARCHIVO }),
    ).rejects.toMatchObject({ codigo: 'NO_ENCONTRADO' });
  });
});

describe('crearMascota — estado inicial del adoptante', () => {
  it('una mascota ofrecida en adopción nace Disponible y permite publicar', async () => {
    vi.mocked(repo.buscarEstadoMascotaPorNombre).mockResolvedValue(ESTADOS.Disponible as never);
    vi.mocked(repo.crearConEstado).mockResolvedValue(mascotaCreada(ESTADOS.Disponible) as never);

    const creada = await service.crearMascota(DATOS_ADOPTANTE, {
      usuarioId: 2,
      archivo: ARCHIVO,
    });

    expect(repo.buscarEstadoMascotaPorNombre).toHaveBeenCalledWith('Disponible');
    expect(creada.habilitaPublicacion).toBe(true);
  });

  it('una mascota propia nace Adoptado y no permite publicar', async () => {
    vi.mocked(repo.buscarEstadoMascotaPorNombre).mockResolvedValue(ESTADOS.Adoptado as never);
    vi.mocked(repo.crearConEstado).mockResolvedValue(mascotaCreada(ESTADOS.Adoptado) as never);

    const creada = await service.crearMascota(
      { ...DATOS_ADOPTANTE, destino: 'PROPIA' },
      { usuarioId: 2, archivo: ARCHIVO },
    );

    expect(repo.buscarEstadoMascotaPorNombre).toHaveBeenCalledWith('Adoptado');
    expect(creada.habilitaPublicacion).toBe(false);
  });

  it('un adoptante no queda asociado a ningún refugio', async () => {
    vi.mocked(repo.buscarEstadoMascotaPorNombre).mockResolvedValue(ESTADOS.Disponible as never);
    vi.mocked(repo.crearConEstado).mockResolvedValue(mascotaCreada(ESTADOS.Disponible) as never);

    await service.crearMascota(DATOS_ADOPTANTE, { usuarioId: 2, archivo: ARCHIVO });

    expect(vi.mocked(repo.crearConEstado).mock.calls[0]![0].refugioId).toBeNull();
  });
});

describe('crearMascota — estado elegido por el refugio', () => {
  const datosRefugio: CrearMascotaDto = {
    actor: 'REFUGIO',
    estadoMascotaId: 2,
    nombre: 'Rocky',
    fechaNacimiento: new Date(2021, 5, 10),
    genero: 'MACHO',
    peso: 25.7,
    tamanio: 'GRANDE',
    especieId: 1,
    razaId: 2,
  };

  beforeEach(() => {
    vi.mocked(repo.buscarUsuario).mockResolvedValue({
      id: 3,
      verificado: true,
      refugioId: 1,
    } as never);
  });

  it('En tratamiento no habilita la publicación', async () => {
    vi.mocked(repo.buscarEstadoMascota).mockResolvedValue(ESTADOS.En_Tratamiento as never);
    vi.mocked(repo.crearConEstado).mockResolvedValue(
      mascotaCreada(ESTADOS.En_Tratamiento, 1) as never,
    );

    const creada = await service.crearMascota(datosRefugio, { usuarioId: 3, archivo: ARCHIVO });

    expect(creada.habilitaPublicacion).toBe(false);
  });

  it('En tránsito sí habilita la publicación', async () => {
    vi.mocked(repo.buscarEstadoMascota).mockResolvedValue(ESTADOS.En_Transito as never);
    vi.mocked(repo.crearConEstado).mockResolvedValue(
      mascotaCreada(ESTADOS.En_Transito, 1) as never,
    );

    const creada = await service.crearMascota(
      { ...datosRefugio, estadoMascotaId: 5 },
      { usuarioId: 3, archivo: ARCHIVO },
    );

    expect(creada.habilitaPublicacion).toBe(true);
  });

  it('rechaza un estado que no es un punto de partida válido', async () => {
    vi.mocked(repo.buscarEstadoMascota).mockResolvedValue(ESTADOS.Adoptado as never);

    await expect(
      service.crearMascota(
        { ...datosRefugio, estadoMascotaId: 3 },
        { usuarioId: 3, archivo: ARCHIVO },
      ),
    ).rejects.toMatchObject({ mensaje: 'Ese estado no es válido al crear una mascota' });
  });

  it('la mascota queda asociada al refugio del usuario', async () => {
    vi.mocked(repo.buscarEstadoMascota).mockResolvedValue(ESTADOS.En_Tratamiento as never);
    vi.mocked(repo.crearConEstado).mockResolvedValue(
      mascotaCreada(ESTADOS.En_Tratamiento, 1) as never,
    );

    await service.crearMascota(datosRefugio, { usuarioId: 3, archivo: ARCHIVO });

    expect(vi.mocked(repo.crearConEstado).mock.calls[0]![0].refugioId).toBe(1);
  });

  it('rechaza a un usuario de rol refugio que no tiene refugio asociado', async () => {
    vi.mocked(repo.buscarUsuario).mockResolvedValue({
      id: 3,
      verificado: true,
      refugioId: null,
    } as never);
    vi.mocked(repo.buscarEstadoMascota).mockResolvedValue(ESTADOS.En_Tratamiento as never);

    await expect(
      service.crearMascota(datosRefugio, { usuarioId: 3, archivo: ARCHIVO }),
    ).rejects.toMatchObject({ codigo: 'SIN_REFUGIO' });
  });
});
