/**
 * Helpers de auditoría transversal (CLAUDE.md, regla 1 / MODELO_DATOS.md).
 *
 * Prisma no tiene mixins ni hooks de ciclo de vida entre modelos, así que cada
 * repository arma sus objetos de auditoría llamando a estas funciones y los
 * spreadea en el `create`/`update` de Prisma. No son FK reales a Usuario
 * (columnas Int planas) para no explotar el grafo de relaciones del schema.
 */

/** Id reservado para el usuario "SISTEMA" sembrado en prisma/seed.ts (primera fila = id 1). */
export const USUARIO_SISTEMA_ID = 1;

export function datosAlta(usuarioId: number) {
  return {
    usuarioAlta: usuarioId,
    fechaAlta: new Date(),
  };
}

export function datosModificacion(usuarioId: number) {
  return {
    usuarioModificacion: usuarioId,
    fechaModificacion: new Date(),
  };
}

export function datosBaja(usuarioId: number) {
  return {
    usuarioBaja: usuarioId,
    fechaBaja: new Date(),
  };
}
