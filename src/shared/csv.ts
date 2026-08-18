/**
 * Serialización CSV mínima (RFC 4180 básico: comillas si el campo tiene coma, comilla o
 * salto de línea). Transversal a cualquier export masivo (CLAUDE.md regla #12) — no vive
 * en un módulo particular porque más de uno la va a necesitar.
 */
export function escaparCampoCsv(valor: unknown): string {
  if (valor === null || valor === undefined) return '';

  const texto = valor instanceof Date ? valor.toISOString() : String(valor);

  if (/[",\n]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

export function filaCsv(campos: unknown[]): string {
  return campos.map(escaparCampoCsv).join(',') + '\n';
}
