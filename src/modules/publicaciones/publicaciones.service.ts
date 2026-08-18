import { AppError } from '../../middlewares/errorHandler';
import { registrarAuditoria } from '../../shared/logAuditoria';
import { borrarImagenes, guardarImagenes } from '../../shared/storage';
import { ESTADOS_QUE_HABILITAN_PUBLICACION } from '../catalogos/catalogos.service';
import type { CrearPublicacionDto, PublicacionCreadaDto } from './publicaciones.dto';
import * as repo from './publicaciones.repository';

const SUBCARPETA_FOTOS = 'publicaciones';

/** Tope anti-spam de publicaciones simultáneas para un adoptante particular. */
const MAXIMO_ACTIVAS_POR_ADOPTANTE = 5;

export interface ContextoCreacion {
  usuarioId: number;
  /** En el orden en que se subieron: la primera es la portada. */
  archivos: { buffer: Buffer; mimetype: string }[];
}

export async function crearPublicacion(
  datos: CrearPublicacionDto,
  contexto: ContextoCreacion,
): Promise<PublicacionCreadaDto> {
  const { usuarioId, archivos } = contexto;
  const usuario = await repo.buscarUsuario(usuarioId);

  if (!usuario) throw new AppError('NO_ENCONTRADO', 'El usuario no existe', 404);
  if (!usuario.verificado) {
    throw new AppError(
      'USUARIO_NO_VERIFICADO',
      'Necesitás verificar tu cuenta para poder publicar',
      403,
    );
  }

  const mascota = await repo.buscarMascota(datos.mascotaId);

  if (!mascota) throw new AppError('NO_ENCONTRADO', 'La mascota no existe', 404);
  if (mascota.usuarioId !== usuarioId) {
    throw new AppError('NO_AUTORIZADO', 'Esa mascota no es tuya', 403);
  }

  const estado = mascota.historicoEstados[0]?.estadoMascota;
  if (!estado || !ESTADOS_QUE_HABILITAN_PUBLICACION.includes(estado.nombre)) {
    throw new AppError(
      'ESTADO_NO_PUBLICABLE',
      'Con el estado actual de la mascota no se puede publicar en adopción',
      409,
    );
  }

  if (await repo.buscarActivaDeMascota(datos.mascotaId)) {
    throw new AppError('YA_PUBLICADA', 'Esa mascota ya tiene una publicación activa', 409);
  }

  // La quota aplica al adoptante particular, no al refugio.
  if (!usuario.refugioId) {
    const activas = await repo.contarActivasDeUsuario(usuarioId);

    if (activas >= MAXIMO_ACTIVAS_POR_ADOPTANTE) {
      throw new AppError(
        'LIMITE_DE_PUBLICACIONES',
        `Llegaste al máximo de ${MAXIMO_ACTIVAS_POR_ADOPTANTE} publicaciones activas`,
        409,
      );
    }
  }

  // Sin fotos propias se reutiliza la de la mascota, que ya es obligatoria en el alta.
  const imagenes =
    archivos.length > 0
      ? await guardarImagenes(archivos, SUBCARPETA_FOTOS)
      : [mascota.imagenUrl].filter((url): url is string => Boolean(url));

  let publicacion;
  try {
    publicacion = await repo.crear(
      {
        // El formulario no pide título: se toma el nombre de la mascota.
        titulo: mascota.nombre ?? 'Mascota en adopción',
        descripcion: datos.descripcion,
        ubicacion: datos.ubicacion,
        requisitos: datos.requisitos,
        personalidad: datos.personalidad,
        desparasitado: datos.desparasitado,
        vacunas: datos.vacunas,
        imagenes,
        mascotaId: mascota.id,
        usuarioId,
      },
      usuarioId,
    );
  } catch (err) {
    // No dejar fotos huérfanas si la escritura en base falló. Las de la mascota no se
    // tocan: son de otra entidad y siguen en uso.
    if (archivos.length > 0) await borrarImagenes(imagenes);
    throw err;
  }

  await registrarAuditoria({
    usuarioId,
    accion: 'CREAR',
    entidad: 'Publicacion',
    entidadId: publicacion.id,
    detalle: `mascota=${mascota.id}`,
  });

  return {
    id: publicacion.id,
    titulo: publicacion.titulo,
    descripcion: publicacion.descripcion,
    ubicacion: publicacion.ubicacion,
    requisitos: publicacion.requisitos,
    personalidad: publicacion.personalidad,
    desparasitado: publicacion.desparasitado,
    vacunas: publicacion.vacunas,
    imagenes: publicacion.imagenes,
    mascotaId: publicacion.mascotaId,
    usuarioId: publicacion.usuarioId,
  };
}

export { MAXIMO_ACTIVAS_POR_ADOPTANTE };
