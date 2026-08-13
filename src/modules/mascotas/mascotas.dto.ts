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
  textoSchema,
} from '../../shared/validation/schemas';

export const TAMANIOS = ['PEQUENO', 'MEDIANO', 'GRANDE'] as const;
export const GENEROS = ['MACHO', 'HEMBRA'] as const;

/** Un adoptante indica si registra una mascota propia o si la ofrece en adopción. */
export const DESTINOS = ['PROPIA', 'ADOPCION'] as const;

/** Campos que piden por igual el formulario del adoptante y el del refugio. */
const camposBase = {
  nombre: textoSchema({ ...LIMITES.mascota.nombre, etiqueta: 'El nombre' }),
  fechaNacimiento: fechaPasadaSchema('La fecha de nacimiento'),
  genero: z.enum(GENEROS, { required_error: 'El sexo es obligatorio' }),
  peso: decimalSchema({ ...LIMITES.mascota.peso, etiqueta: 'El peso' }),
  tamanio: z.enum(TAMANIOS, { required_error: 'El tamaño es obligatorio' }),
  especieId: idSchema('La especie'),
  razaId: idSchema('La raza'),
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

export interface MascotaCreadaDto {
  id: number;
  nombre: string | null;
  fechaNacimiento: string | null;
  genero: string;
  peso: number | null;
  tamanio: string | null;
  imagenUrl: string | null;
  especie: { id: number; nombre: string };
  raza: { id: number; nombre: string };
  estado: { id: number; nombre: string };
  refugioId: number | null;
  usuarioId: number;
  /** Si el estado actual permite ofrecer la mascota en adopción. */
  habilitaPublicacion: boolean;
}
