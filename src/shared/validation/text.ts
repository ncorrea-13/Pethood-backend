/** Validación de texto reutilizable. Funciones puras, sin dependencias. */

export type ResultadoTexto = { valido: true; valor: string } | { valido: false; error: string };

/** Concuerda en género con el artículo de la etiqueta ("La ubicación" → obligatoria). */
export function mensajeObligatorio(etiqueta: string): string {
  const femenino = /^(La|Las)\s/.test(etiqueta.trim());
  return `${etiqueta} es ${femenino ? 'obligatoria' : 'obligatorio'}`;
}

/** Un solo mensaje para "muy corto" y "muy largo", no dos distintos. */
export function mensajeLongitud(etiqueta: string, min: number, max: number): string {
  // Sin un mínimo real, hablar de un rango que arranca en cero confunde.
  if (min <= 1) return `${etiqueta} no puede superar los ${max} caracteres`;
  return `${etiqueta} debe tener entre ${min} y ${max} caracteres`;
}

/**
 * Texto con trim previo. Un valor de solo espacios queda vacío; si el campo exige un
 * mínimo de 2 o más, se reporta como longitud inválida y no como campo sin completar,
 * porque para quien lo escribió el campo tenía contenido.
 */
export function validarTexto(
  valor: unknown,
  opciones: { min?: number; max: number; etiqueta: string; obligatorio?: boolean },
): ResultadoTexto {
  const { min = 0, max, etiqueta, obligatorio = true } = opciones;
  const recortado = typeof valor === 'string' ? valor.trim() : '';

  if (!recortado) {
    if (!obligatorio) return { valido: true, valor: '' };
    if (min >= 2) return { valido: false, error: mensajeLongitud(etiqueta, min, max) };
    return { valido: false, error: mensajeObligatorio(etiqueta) };
  }

  if (recortado.length < min || recortado.length > max) {
    return { valido: false, error: mensajeLongitud(etiqueta, min, max) };
  }

  return { valido: true, valor: recortado };
}
