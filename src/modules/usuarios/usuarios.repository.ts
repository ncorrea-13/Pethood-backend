import { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { datosModificacion } from '../../shared/auditoria';
import { AppError } from '../../middlewares/errorHandler';

const includePerfil = {
  estado: true,
  roles: { include: { rol: true } },
  _count: {
    select: {
      mascotas: { where: { fechaBaja: null } },
      // El filtro por `mascota` no es opcional: tiene que dar el mismo número que
      // `GET /favoritos`, que descarta las mascotas dadas de baja. Sin él, al eliminarse
      // una mascota guardada el perfil muestra "5" y GUI-12 lista 4.
      favoritos: { where: { fechaBaja: null, mascota: { fechaBaja: null } } },
    },
  },
} as const;

export type UsuarioPerfil = Prisma.UsuarioGetPayload<{ include: typeof includePerfil }>;

export interface DatosActualizarPerfil {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  ubicacion: string;
  imagenUrl?: string;
}

function mapearErrorUnico(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    const target = error.meta?.target;
    const campos = Array.isArray(target) ? target.join(',') : String(target ?? '');
    if (campos.includes('email')) {
      throw new AppError('EMAIL_DUPLICADO', 'El correo ingresado ya está en uso.', 409);
    }
  }
  throw error;
}

export async function buscarPerfil(usuarioId: number): Promise<UsuarioPerfil | null> {
  return prisma.usuario.findFirst({
    where: { id: usuarioId, fechaBaja: null },
    include: includePerfil,
  });
}

export async function buscarPorEmail(email: string): Promise<{ id: number } | null> {
  return prisma.usuario.findFirst({
    where: { email, fechaBaja: null },
    select: { id: true },
  });
}

export async function promedioValoracion(usuarioId: number): Promise<number | null> {
  const resultado = await prisma.resena.aggregate({
    where: { usuarioReportadoId: usuarioId, fechaBaja: null },
    _avg: { puntuacion: true },
  });
  return resultado._avg.puntuacion;
}

export async function actualizarPerfil(
  usuarioId: number,
  datos: DatosActualizarPerfil,
): Promise<UsuarioPerfil> {
  try {
    return await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        nombre: datos.nombre,
        apellido: datos.apellido,
        email: datos.email,
        telefono: datos.telefono,
        ubicacion: datos.ubicacion,
        ...(datos.imagenUrl ? { imagenUrl: datos.imagenUrl } : {}),
        ...datosModificacion(usuarioId),
      },
      include: includePerfil,
    });
  } catch (error) {
    mapearErrorUnico(error);
  }
}

export async function actualizarContrasena(usuarioId: number, hash: string): Promise<void> {
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: {
      contrasena: hash,
      ...datosModificacion(usuarioId),
    },
  });
}

export async function buscarHashContrasena(
  usuarioId: number,
): Promise<{ id: number; contrasena: string | null } | null> {
  return prisma.usuario.findFirst({
    where: { id: usuarioId, fechaBaja: null },
    select: { id: true, contrasena: true },
  });
}
