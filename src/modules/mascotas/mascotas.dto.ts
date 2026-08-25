/**
 * Entrada y salida del alta de mascotas. Las reglas genéricas (trim, longitudes, fechas,
 * decimales) salen de `shared/validation`; acá solo se compone lo propio de Mascota.
 */
import { z } from 'zod';
import { LIMITES } from '../../shared/validation/limits';
import {
  decimalSchema,
  fechaPasadaSchema,
  idSchema,
  textoOpcionalSchema,
  textoSchema,
} from '../../shared/validation/schemas';

export const TAMANIOS = ['PEQUENO', 'MEDIANO', 'GRANDE'] as const;
export const GENEROS = ['MACHO', 'HEMBRA'] as const;

/** Un adoptante indica si registra una mascota propia o si la ofrece en adopción. */
export const DESTINOS = ['PROPIA', 'ADOPCION'] as const;

/** Llega como texto desde un form multipart: 'true'/'false' además de booleano. */
const booleanoSchema = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((valor) => valor === true || valor === 'true');

/** Campos que piden por igual el formulario del adoptante y el del refugio. */
const camposBase = {
  nombre: textoSchema({ ...LIMITES.mascota.nombre, etiqueta: 'El nombre' }),
  fechaNacimiento: fechaPasadaSchema('La fecha de nacimiento'),
  genero: z.enum(GENEROS, { required_error: 'El sexo es obligatorio' }),
  peso: decimalSchema({ ...LIMITES.mascota.peso, etiqueta: 'El peso' }),
  tamanio: z.enum(TAMANIOS, { required_error: 'El tamaño es obligatorio' }),
  especieId: idSchema('La especie'),
  razaId: idSchema('La raza'),
  castrado: booleanoSchema,
  descripcion: textoOpcionalSchema({
    max: LIMITES.mascota.descripcion.max,
    etiqueta: 'La descripción',
  }),
};

/**
 * Un schema por actor. El adoptante elige destino y el refugio elige estado — nunca
 * ambos, así un adoptante no puede fijarse un estado a mano. El `actor` lo setea el
 * controller desde el token, nunca el cliente.
 */
export const crearMascotaSchema = z.discriminatedUnion('actor', [
  z.object({
    actor: z.literal('ADOPTANTE'),
    destino: z.enum(DESTINOS, {
      required_error: 'Indicá si es tu mascota o si es para adopción',
    }),
    ...camposBase,
  }),
  z.object({
    actor: z.literal('REFUGIO'),
    estadoMascotaId: idSchema('El estado'),
    ...camposBase,
  }),
]);

export type CrearMascotaDto = z.infer<typeof crearMascotaSchema>;

/**
 * En la edición un campo ausente significa "no lo toques", así que `castrado` no puede
 * usar `booleanoSchema`: ese colapsa `undefined` a `false` y apagaría la castración sin
 * que nadie la haya tocado.
 */
const booleanoOpcionalSchema = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((valor) => (valor === undefined ? undefined : valor === true || valor === 'true'));

/**
 * Edición parcial (HU-6.2): todos los campos son opcionales y solo se escriben los que
 * llegaron. El estado queda deliberadamente afuera — HU-6.2 habla del perfil y no hay
 * reglas de transición documentadas, así que cambiarlo es otra HU.
 */
export const editarMascotaSchema = z
  .object({
    nombre: textoSchema({ ...LIMITES.mascota.nombre, etiqueta: 'El nombre' }).optional(),
    fechaNacimiento: fechaPasadaSchema('La fecha de nacimiento').optional(),
    genero: z.enum(GENEROS, { errorMap: () => ({ message: 'El sexo no es válido' }) }).optional(),
    peso: decimalSchema({ ...LIMITES.mascota.peso, etiqueta: 'El peso' }).optional(),
    tamanio: z
      .enum(TAMANIOS, { errorMap: () => ({ message: 'El tamaño no es válido' }) })
      .optional(),
    especieId: idSchema('La especie').optional(),
    razaId: idSchema('La raza').optional(),
    castrado: booleanoOpcionalSchema,
    descripcion: textoOpcionalSchema({
      max: LIMITES.mascota.descripcion.max,
      etiqueta: 'La descripción',
    }).optional(),
  })
  // La raza solo se valida contra su especie, así que una sin la otra no se puede resolver.
  .refine((datos) => (datos.razaId === undefined) === (datos.especieId === undefined), {
    message: 'Para cambiar la raza tenés que indicar también la especie',
  });

export type EditarMascotaDto = z.infer<typeof editarMascotaSchema>;

export interface MascotaCreadaDto {
  id: number;
  nombre: string | null;
  fechaNacimiento: string | null;
  genero: string;
  peso: number | null;
  tamanio: string | null;
  castrado: boolean;
  descripcion: string | null;
  imagenUrl: string | null;
  especie: { id: number; nombre: string };
  raza: { id: number; nombre: string };
  estado: { id: number; nombre: string };
  refugioId: number | null;
  usuarioId: number;
  /** Si el estado actual permite ofrecer la mascota en adopción. */
  habilitaPublicacion: boolean;
}
