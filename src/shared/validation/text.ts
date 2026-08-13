/** Validación de texto reutilizable. Funciones puras, sin dependencias. */

export type ResultadoTexto = { valido: true; valor: string } | { valido: false; error: string };

/** Un solo mensaje para "muy corto" y "muy largo", no dos distintos. */
export function mensajeLongitud(etiqueta: string, min: number, max: number): string {
  return `${etiqueta} debe tener entre ${min} y ${max} caracteres`;
}

/** Texto con trim previo: un valor de solo espacios queda vacío y falla por `min`. */
export function validarTexto(
  valor: unknown,
  opciones: { min?: number; max: number; etiqueta: string; obligatorio?: boolean },
): ResultadoTexto {
  const { min = 0, max, etiqueta, obligatorio = true } = opciones;

  if (typeof valor !== 'string') {
    return obligatorio
      ? { valido: false, error: `${etiqueta} es obligatorio` }
      : { valido: true, valor: '' };
  }

  const recortado = valor.trim();

  if (!recortado && !obligatorio) return { valido: true, valor: '' };

  // Un texto de solo espacios queda vacío y se reporta como longitud inválida, no como
  // campo sin completar: para quien lo escribió, el campo tenía contenido.
  if (!recortado && min === 0) return { valido: false, error: `${etiqueta} es obligatorio` };

  if (recortado.length < min || recortado.length > max) {
    return { valido: false, error: mensajeLongitud(etiqueta, min, max) };
  }

  return { valido: true, valor: recortado };
}
