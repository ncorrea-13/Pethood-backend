import { z } from 'zod';
import { LIMITES } from '../../shared/validation/limits';
import { idSchema, textoOpcionalSchema, textoSchema } from '../../shared/validation/schemas';
import { validarTexto } from '../../shared/validation/text';

/** Hasta 5 fotos por publicación; el orden recibido es el orden de la galería. */
export const MAXIMO_IMAGENES = 5;

/**
 * En multipart un campo repetido llega como array, pero con un único valor llega como
 * string suelto. Se normaliza siempre a array.
 */
function listaSchema(maximoPorItem: number, etiqueta: string) {
  return z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((valor) => {
      if (valor === undefined) return [];
      return Array.isArray(valor) ? valor : [valor];
    })
    .superRefine((valores, ctx) => {
      for (const valor of valores) {
        const resultado = validarTexto(valor, {
          max: maximoPorItem,
          etiqueta,
          obligatorio: false,
        });

        if (!resultado.valido) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: resultado.error });
          return;
        }
      }
    })
    .transform((valores) => valores.map((valor) => valor.trim()).filter(Boolean));
}

const booleanoSchema = z
  .union([z.boolean(), z.string()])
  .optional()
  .transform((valor) => valor === true || valor === 'true');

export const crearPublicacionSchema = z.object({
  mascotaId: idSchema('La mascota'),
  descripcion: textoSchema({
    max: LIMITES.publicacion.descripcion.max,
    etiqueta: 'La descripción',
  }),
  ubicacion: textoSchema({
    max: LIMITES.publicacion.ubicacion.max,
    etiqueta: 'La ubicación',
  }),
  requisitos: listaSchema(LIMITES.publicacion.requisito.max, 'Cada requisito'),
  personalidad: listaSchema(LIMITES.publicacion.personalidad.max, 'Cada rasgo'),
  desparasitado: booleanoSchema,
  vacunas: textoOpcionalSchema({
    max: LIMITES.publicacion.vacunas.max,
    etiqueta: 'Las vacunas',
  }),
});

export type CrearPublicacionDto = z.infer<typeof crearPublicacionSchema>;

export interface PublicacionCreadaDto {
  id: number;
  titulo: string;
  descripcion: string | null;
  ubicacion: string | null;
  requisitos: string[];
  personalidad: string[];
  desparasitado: boolean;
  vacunas: string | null;
  imagenes: string[];
  mascotaId: number;
  usuarioId: number;
}
