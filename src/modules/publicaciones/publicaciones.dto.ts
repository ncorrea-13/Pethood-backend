import { z } from 'zod';
import { LIMITES } from '../../shared/validation/limits';
import { idSchema, textoSchema } from '../../shared/validation/schemas';
import { validarTexto } from '../../shared/validation/text';

/** Etiquetas libres, cada una con su propio límite. Se descartan las vacías. */
const requisitosSchema = z
  .array(z.string())
  .default([])
  .superRefine((valores, ctx) => {
    for (const valor of valores) {
      const resultado = validarTexto(valor, {
        max: LIMITES.publicacion.requisito.max,
        etiqueta: 'Cada requisito',
        obligatorio: false,
      });

      if (!resultado.valido) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: resultado.error });
        return;
      }
    }
  })
  .transform((valores) => valores.map((valor) => valor.trim()).filter(Boolean));

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
  requisitos: requisitosSchema,
});

export type CrearPublicacionDto = z.infer<typeof crearPublicacionSchema>;

export interface PublicacionCreadaDto {
  id: number;
  titulo: string;
  descripcion: string | null;
  ubicacion: string | null;
  requisitos: string[];
  mascotaId: number;
  usuarioId: number;
}
