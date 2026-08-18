/**
 * ⚠️ MÓDULO PROVISIONAL — alcance recortado a propósito.
 *
 * El módulo de autenticación definitivo (registro, recuperación de contraseña, edición de
 * perfil) está a cargo de otro integrante. Acá vive solo lo mínimo para poder abrir sesión
 * y saber quién es el usuario. Cuando llegue el definitivo, este se reemplaza entero: no
 * construir nada nuevo encima.
 */
import bcrypt from 'bcrypt';
import { AppError } from '../../middlewares/errorHandler';
import { firmarToken } from '../../shared/jwt';
import type { UsuarioAutenticadoDto } from './auth.dto';
import * as repo from './auth.repository';

type UsuarioConRoles = NonNullable<Awaited<ReturnType<typeof repo.buscarPorId>>>;

function aDto(usuario: UsuarioConRoles): UsuarioAutenticadoDto {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    email: usuario.email,
    verificado: usuario.verificado,
    refugioId: usuario.refugioId,
    roles: usuario.roles.map((rolUsuario) => rolUsuario.rol.nombre),
  };
}

export async function login(
  email: string,
  contrasena: string,
): Promise<{ token: string; usuario: UsuarioAutenticadoDto }> {
  const usuario = await repo.buscarPorEmail(email);

  // Mensaje genérico a propósito: no revelar cuál de los dos datos falló
  // (REQUISITOS.md §7.3 / spec 001).
  const credencialesInvalidas = new AppError(
    'CREDENCIALES_INVALIDAS',
    'El correo o contraseña ingresados son incorrectos',
    401,
  );

  if (!usuario) throw credencialesInvalidas;

  const coincide = await bcrypt.compare(contrasena, usuario.contrasena);
  if (!coincide) throw credencialesInvalidas;

  const dto = aDto(usuario);
  const token = firmarToken({ usuarioId: dto.id, roles: dto.roles });

  return { token, usuario: dto };
}

export async function obtenerPerfil(usuarioId: number): Promise<UsuarioAutenticadoDto> {
  const usuario = await repo.buscarPorId(usuarioId);
  if (!usuario) {
    throw new AppError('NO_ENCONTRADO', 'El usuario no existe', 404);
  }

  return aDto(usuario);
}
