/**
 * Adaptador fino entre las utilidades puras de esta carpeta y Zod. Acá no vive ninguna
 * regla: solo se envuelve lo de `dates.ts`, `numbers.ts` y `text.ts` para componerlo en
 * un `<modulo>.dto.ts`. Todo lo que llega por multipart es string, por eso cada schema
 * coerciona en vez de confiar en el tipo que mande el cliente.
 */
import { z } from 'zod';
import { validarFechaPasada } from './dates';
import { parsearDecimal } from './numbers';
import { validarTexto } from './text';

export function textoSchema(opciones: { min?: number; max: number; etiqueta: string }) {
  return z.unknown().transform((valor, ctx) => {
    const resultado = validarTexto(valor, opciones);

    if (!resultado.valido) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: resultado.error });
      return z.NEVER;
    }

    return resultado.valor;
  });
}

/** Texto que puede venir vacío. Devuelve null en ese caso, para guardarlo así en base. */
export function textoOpcionalSchema(opciones: { max: number; etiqueta: string }) {
  return z.unknown().transform((valor, ctx) => {
    const resultado = validarTexto(valor, { ...opciones, obligatorio: false });

    if (!resultado.valido) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: resultado.error });
      return z.NEVER;
    }

    return resultado.valor === '' ? null : resultado.valor;
  });
}

export function fechaPasadaSchema(etiqueta: string) {
  return z.unknown().transform((valor, ctx) => {
    const resultado = validarFechaPasada(valor as string | Date, etiqueta);

    if (!resultado.valida) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: resultado.error });
      return z.NEVER;
    }

    return resultado.fecha;
  });
}

export function decimalSchema(opciones: {
  min: number;
  max: number;
  decimales: number;
  etiqueta: string;
}) {
  return z.unknown().transform((valor, ctx) => {
    const resultado = parsearDecimal(valor as string | number, opciones);

    if (!resultado.valido) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: resultado.error });
      return z.NEVER;
    }

    return resultado.valor;
  });
}

export function idSchema(etiqueta: string) {
  return z.coerce
    .number({ required_error: `${etiqueta} es obligatorio` })
    .int(`${etiqueta} no es válido`)
    .positive(`${etiqueta} no es válido`);
}
