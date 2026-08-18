import bcrypt from 'bcrypt';
import { AppError } from '../../middlewares/errorHandler';
import { parsearFechaNacimiento } from '../../shared/fechas';
import { firmarToken } from '../../shared/jwt';
import { registrarAuditoria } from '../../shared/logAuditoria';
import { estaBloqueado, limpiarIntentos, registrarFallo } from '../../shared/rateLimit';
import { ESTADO_USUARIO, ROL_API, rolApiADb, rolesDbAApi } from '../../shared/roles';
import { r2Habilitado, subirImagenPerfil, type ArchivoSubida } from '../../shared/r2';
import type { LoginBody, RegistroBody, RespuestaAuth } from './auth.dto';
import type { PerfilGoogle } from './auth.google';
import type { UsuarioConRoles } from './auth.repository';
import * as authRepo from './auth.repository';

const BCRYPT_COST = 10;
const EMAIL_SISTEMA = 'sistema@pethood.internal';

function nombresDeRol(usuario: UsuarioConRoles): string[] {
  return usuario.roles
    .filter((vinculo) => vinculo.fechaBaja === null)
    .map((vinculo) => vinculo.rol.nombre);
}

function aRespuesta(usuario: UsuarioConRoles): RespuestaAuth {
  const rolesApi = rolesDbAApi(nombresDeRol(usuario));
  return {
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      roles: rolesApi,
      imagenUrl: usuario.imagenUrl,
    },
    token: firmarToken({ usuarioId: usuario.id, email: usuario.email, roles: rolesApi }),
  };
}

function asegurarPuedeIngresar(usuario: UsuarioConRoles): void {
  if (usuario.email === EMAIL_SISTEMA) {
    throw new AppError(
      'CREDENCIALES_INVALIDAS',
      'El correo o contraseña ingresados son incorrectos.',
      401,
    );
  }

  if (usuario.estado.nombre === ESTADO_USUARIO.SUSPENDIDO) {
    throw new AppError(
      'USUARIO_SUSPENDIDO',
      'Tu cuenta está suspendida. Escribinos a soporte para más información.',
      403,
    );
  }

  if (usuario.estado.nombre === ESTADO_USUARIO.INACTIVO) {
    throw new AppError(
      'CREDENCIALES_INVALIDAS',
      'El correo o contraseña ingresados son incorrectos.',
      401,
    );
  }
}

async function exigirCatalogos(rolApi: string) {
  const estado = await authRepo.buscarEstadoPorNombre(ESTADO_USUARIO.ACTIVO);
  const rol = await authRepo.buscarRolPorNombre(rolApiADb(rolApi));

  if (!estado || !rol) {
    throw new AppError(
      'ERROR_INTERNO',
      'Faltan catálogos de roles o estados. Corré el seed de la base.',
      500,
    );
  }

  return { estado, rol };
}

export async function registrar(
  body: RegistroBody,
  archivo?: ArchivoSubida,
): Promise<RespuestaAuth> {
  if (body.rol === ROL_API.MIEMBRO_REFUGIO) {
    throw new AppError(
      'VALIDACION',
      'El registro como refugio todavía no está disponible en esta versión.',
      400,
    );
  }

  const existente = await authRepo.buscarPorEmail(body.email);
  if (existente) {
    throw new AppError('EMAIL_DUPLICADO', 'Ya existe una cuenta con ese correo.', 409);
  }

  const { estado, rol } = await exigirCatalogos(body.rol);
  const fechaNacimiento = parsearFechaNacimiento(body.fechaNacimiento);
  const hash = await bcrypt.hash(body.password, BCRYPT_COST);
  const imagenUrl = archivo && r2Habilitado() ? await subirImagenPerfil(archivo) : undefined;

  const usuario = await authRepo.crearUsuarioConRol(
    {
      nombre: body.nombre,
      apellido: body.apellido,
      email: body.email,
      contrasena: hash,
      telefono: body.telefono,
      dni: body.dni,
      fechaNacimiento,
      imagenUrl,
      verificado: false,
      estadoId: estado.id,
    },
    rol.id,
  );

  await registrarAuditoria({
    usuarioId: usuario.id,
    accion: 'REGISTRO',
    entidad: 'Usuario',
    entidadId: usuario.id,
    detalle: `rol=${body.rol}`,
  });

  return aRespuesta(usuario);
}

export async function login(body: LoginBody): Promise<RespuestaAuth> {
  if (estaBloqueado(body.email)) {
    throw new AppError(
      'DEMASIADOS_INTENTOS',
      'Demasiados intentos fallidos. Esperá unos minutos e intentalo de nuevo.',
      429,
    );
  }

  const usuario = await authRepo.buscarPorEmail(body.email);
  if (!usuario || !usuario.contrasena) {
    registrarFallo(body.email);
    throw new AppError(
      'CREDENCIALES_INVALIDAS',
      'El correo o contraseña ingresados son incorrectos.',
      401,
    );
  }

  const ok = await bcrypt.compare(body.password, usuario.contrasena);
  if (!ok) {
    registrarFallo(body.email);
    throw new AppError(
      'CREDENCIALES_INVALIDAS',
      'El correo o contraseña ingresados son incorrectos.',
      401,
    );
  }

  asegurarPuedeIngresar(usuario);
  limpiarIntentos(body.email);

  return aRespuesta(usuario);
}

export async function loginConGoogle(perfil: PerfilGoogle): Promise<RespuestaAuth> {
  const porGoogle = await authRepo.buscarPorGoogleId(perfil.googleId);
  if (porGoogle) {
    asegurarPuedeIngresar(porGoogle);
    return aRespuesta(porGoogle);
  }

  const porEmail = await authRepo.buscarPorEmail(perfil.email);
  if (porEmail) {
    asegurarPuedeIngresar(porEmail);
    const vinculado = await authRepo.vincularGoogleId(
      porEmail.id,
      perfil.googleId,
      perfil.imagenUrl,
    );
    await registrarAuditoria({
      usuarioId: vinculado.id,
      accion: 'VINCULAR_GOOGLE',
      entidad: 'Usuario',
      entidadId: vinculado.id,
    });
    return aRespuesta(vinculado);
  }

  const { estado, rol } = await exigirCatalogos(ROL_API.ADOPTANTE);
  const usuario = await authRepo.crearUsuarioConRol(
    {
      nombre: perfil.nombre,
      apellido: perfil.apellido,
      email: perfil.email,
      googleId: perfil.googleId,
      imagenUrl: perfil.imagenUrl,
      verificado: true,
      estadoId: estado.id,
    },
    rol.id,
  );

  await registrarAuditoria({
    usuarioId: usuario.id,
    accion: 'REGISTRO_GOOGLE',
    entidad: 'Usuario',
    entidadId: usuario.id,
  });

  return aRespuesta(usuario);
}

export async function perfilPropio(usuarioId: number): Promise<RespuestaAuth['usuario']> {
  const usuario = await authRepo.buscarPorId(usuarioId);
  if (!usuario) {
    throw new AppError('NO_AUTENTICADO', 'No encontramos tu sesión.', 401);
  }
  return aRespuesta(usuario).usuario;
}
