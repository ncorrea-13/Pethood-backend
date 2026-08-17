import { z } from 'zod';
import { ROL_API } from '../../shared/roles';

const nombrePersona = z
  .string()
  .trim()
  .min(1, 'Este campo es obligatorio. Completalo para poder continuar.')
  .max(50, 'El nombre es demasiado largo.')
  .regex(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/, 'El nombre solo puede tener letras.');

export const registroBodySchema = z.object({
  nombre: nombrePersona,
  apellido: nombrePersona,
  email: z
    .string()
    .trim()
    .email('El correo no es válido. Asegurate de incluir el "@" y un dominio correcto.')
    .transform((valor) => valor.toLowerCase()),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
  fechaNacimiento: z
    .string()
    .trim()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'La fecha de nacimiento debe tener el formato DD/MM/AAAA.'),
  telefono: z
    .string()
    .trim()
    .min(1, 'El teléfono es obligatorio. Completalo para poder continuar.')
    .transform((valor) => {
      const conMas = valor.startsWith('+');
      const digitos = valor.replace(/\D/g, '');
      return conMas ? `+${digitos}` : digitos;
    })
    .refine((valor) => {
      const digitos = valor.replace(/\D/g, '');
      return digitos.length >= 8 && digitos.length <= 15 && /^\+?\d+$/.test(valor);
    }, 'Ingresá un teléfono válido.'),
  dni: z
    .string()
    .trim()
    .regex(/^\d{7,8}$/, 'El DNI debe tener 7 u 8 dígitos numéricos.')
    .optional(),
  rol: z.enum([ROL_API.ADOPTANTE, ROL_API.MIEMBRO_REFUGIO]).default(ROL_API.ADOPTANTE),
});

export type RegistroBody = z.infer<typeof registroBodySchema>;

export const loginBodySchema = z.object({
  email: z
    .string()
    .trim()
    .email('El correo no es válido. Asegurate de incluir el "@" y un dominio correcto.')
    .transform((valor) => valor.toLowerCase()),
  password: z.string().min(1, 'La contraseña es obligatoria.'),
});

export type LoginBody = z.infer<typeof loginBodySchema>;

export const googleIdTokenBodySchema = z.object({
  idToken: z.string().min(1, 'Falta el token de Google.'),
});

export type GoogleIdTokenBody = z.infer<typeof googleIdTokenBodySchema>;

export const usuarioPublicoSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  apellido: z.string(),
  email: z.string(),
  roles: z.array(z.string()),
  imagenUrl: z.string().nullable(),
});

export const respuestaAuthSchema = z.object({
  usuario: usuarioPublicoSchema,
  token: z.string(),
});

export type RespuestaAuth = z.infer<typeof respuestaAuthSchema>;
