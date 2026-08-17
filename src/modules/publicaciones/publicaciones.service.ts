import { AppError } from '../../middlewares/errorHandler';
import { registrarAuditoria } from '../../shared/logAuditoria';
import { ESTADOS_QUE_HABILITAN_PUBLICACION } from '../catalogos/catalogos.service';
import type { CrearPublicacionDto, PublicacionCreadaDto } from './publicaciones.dto';
import * as repo from './publicaciones.repository';

/** Tope anti-spam de publicaciones simultáneas para un adoptante particular. */
const MAXIMO_ACTIVAS_POR_ADOPTANTE = 5;

export async function crearPublicacion(
  datos: CrearPublicacionDto,
  usuarioId: number,
): Promise<PublicacionCreadaDto> {
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

  const publicacion = await repo.crear(
    {
      // El formulario no pide título: se toma el nombre de la mascota.
      titulo: mascota.nombre ?? 'Mascota en adopción',
      descripcion: datos.descripcion,
      ubicacion: datos.ubicacion,
      requisitos: datos.requisitos,
      imagenUrl: mascota.imagenUrl,
      mascotaId: mascota.id,
      usuarioId,
    },
    usuarioId,
  );

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
    mascotaId: publicacion.mascotaId,
    usuarioId: publicacion.usuarioId,
  };
}

export { MAXIMO_ACTIVAS_POR_ADOPTANTE };
