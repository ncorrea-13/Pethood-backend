import { AppError } from '../../middlewares/errorHandler';
import { registrarAuditoria } from '../../shared/logAuditoria';
import { borrarImagen, guardarImagen } from '../../shared/storage';
import { aFechaISO } from '../../shared/validation/dates';
import {
  ESTADOS_QUE_HABILITAN_PUBLICACION,
  ESTADOS_SELECCIONABLES_EN_ALTA,
} from '../catalogos/catalogos.service';
import type { CrearMascotaDto, MascotaCreadaDto } from './mascotas.dto';
import * as repo from './mascotas.repository';

const SUBCARPETA_FOTOS = 'mascotas';

/** El adoptante no elige estado: se deriva de si la mascota es propia o para adopción. */
const ESTADO_POR_DESTINO = {
  ADOPCION: 'Disponible',
  PROPIA: 'Adoptado', // ya tiene dueño, no se ofrece publicarla
} as const;

export interface ContextoCreacion {
  usuarioId: number;
  archivo?: { buffer: Buffer; mimetype: string };
}

type MascotaConRelaciones = Awaited<ReturnType<typeof repo.crearConEstado>>;

function aDto(mascota: MascotaConRelaciones): MascotaCreadaDto {
  const estado = mascota.historicoEstados[0]!.estadoMascota;

  return {
    id: mascota.id,
    nombre: mascota.nombre,
    fechaNacimiento: mascota.fechaNacimiento ? aFechaISO(mascota.fechaNacimiento) : null,
    genero: mascota.genero,
    peso: mascota.peso === null ? null : Number(mascota.peso),
    tamanio: mascota.tamanio,
    castrado: mascota.castrado,
    descripcion: mascota.descripcion,
    imagenUrl: mascota.imagenUrl,
    especie: { id: mascota.raza.especie.id, nombre: mascota.raza.especie.nombre },
    raza: { id: mascota.raza.id, nombre: mascota.raza.nombre },
    estado: { id: estado.id, nombre: estado.nombre },
    refugioId: mascota.refugioId,
    usuarioId: mascota.usuarioId,
    habilitaPublicacion: ESTADOS_QUE_HABILITAN_PUBLICACION.includes(estado.nombre),
  };
}

/** Solo un usuario con DNI y teléfono ya verificados puede dar de alta una mascota. */
async function exigirUsuarioVerificado(usuarioId: number) {
  const usuario = await repo.buscarUsuario(usuarioId);

  if (!usuario) {
    throw new AppError('NO_ENCONTRADO', 'El usuario no existe', 404);
  }
  if (!usuario.verificado) {
    throw new AppError(
      'USUARIO_NO_VERIFICADO',
      'Necesitás verificar tu cuenta para poder crear una mascota',
      403,
    );
  }

  return usuario;
}

/** La raza depende de la especie: se rechaza una combinación que no exista. */
async function resolverRaza(razaId: number, especieId: number) {
  const raza = await repo.buscarRaza(razaId);

  if (!raza) {
    throw new AppError('NO_ENCONTRADO', 'La raza no existe', 404);
  }
  if (raza.especieId !== especieId) {
    throw new AppError('VALIDACION', 'La raza no corresponde a la especie elegida', 400);
  }

  return raza;
}

async function resolverEstadoInicial(datos: CrearMascotaDto): Promise<number> {
  if (datos.actor === 'ADOPTANTE') {
    const nombre = ESTADO_POR_DESTINO[datos.destino];
    const estado = await repo.buscarEstadoMascotaPorNombre(nombre);

    if (!estado) {
      throw new AppError('ERROR_INTERNO', `Falta el estado "${nombre}" en el catálogo`, 500);
    }

    return estado.id;
  }

  // El refugio sí elige, pero solo entre los estados válidos como punto de partida.
  const estado = await repo.buscarEstadoMascota(datos.estadoMascotaId);

  if (!estado) {
    throw new AppError('NO_ENCONTRADO', 'El estado no existe', 404);
  }
  if (!ESTADOS_SELECCIONABLES_EN_ALTA.includes(estado.nombre)) {
    throw new AppError('VALIDACION', 'Ese estado no es válido al crear una mascota', 400);
  }

  return estado.id;
}

export async function crearMascota(
  datos: CrearMascotaDto,
  contexto: ContextoCreacion,
): Promise<MascotaCreadaDto> {
  // La foto es obligatoria y bloquea el guardado.
  if (!contexto.archivo) {
    throw new AppError('FOTO_REQUERIDA', 'Debe agregar al menos una foto de la mascota', 400);
  }

  const usuario = await exigirUsuarioVerificado(contexto.usuarioId);
  const raza = await resolverRaza(datos.razaId, datos.especieId);
  const estadoMascotaId = await resolverEstadoInicial(datos);

  if (datos.actor === 'REFUGIO' && !usuario.refugioId) {
    throw new AppError('SIN_REFUGIO', 'Tu usuario no está asociado a ningún refugio', 403);
  }

  const imagenUrl = await guardarImagen(contexto.archivo, SUBCARPETA_FOTOS);

  let mascota: MascotaConRelaciones;
  try {
    // La mascota queda asociada automáticamente a quien la crea.
    mascota = await repo.crearConEstado(
      {
        nombre: datos.nombre,
        fechaNacimiento: datos.fechaNacimiento,
        genero: datos.genero,
        peso: datos.peso,
        tamanio: datos.tamanio,
        castrado: datos.castrado,
        descripcion: datos.descripcion,
        imagenUrl,
        razaId: raza.id,
        refugioId: datos.actor === 'REFUGIO' ? usuario.refugioId : null,
        usuarioId: usuario.id,
        estadoMascotaId,
      },
      usuario.id,
    );
  } catch (err) {
    // No dejar la foto huérfana si la escritura en base falló.
    await borrarImagen(imagenUrl);
    throw err;
  }

  await registrarAuditoria({
    usuarioId: usuario.id,
    accion: 'CREAR',
    entidad: 'Mascota',
    entidadId: mascota.id,
    detalle: `actor=${datos.actor}`,
  });

  return aDto(mascota);
}

export async function listarMisMascotas(usuarioId: number): Promise<MascotaCreadaDto[]> {
  const mascotas = await repo.listarPorUsuario(usuarioId);

  return mascotas
    .filter((mascota) => mascota.historicoEstados.length > 0)
    .map((mascota) => aDto(mascota as MascotaConRelaciones));
}
