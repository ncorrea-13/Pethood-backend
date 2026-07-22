import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { registrarAuditoria } from '../../../src/shared/logAuditoria';

const LOG_FILE = join(__dirname, '..', '..', '..', 'logs', 'auditoria.log');

describe('registrarAuditoria', () => {
  afterAll(async () => {
    await rm(LOG_FILE, { force: true });
  });

  it('appendea una línea JSON con los datos de la operación', async () => {
    await registrarAuditoria({
      usuarioId: 1,
      accion: 'TEST',
      entidad: 'Prueba',
      entidadId: 42,
      detalle: 'desde el test',
    });

    const contenido = await readFile(LOG_FILE, 'utf8');
    const lineas = contenido.trim().split('\n');
    const ultima = JSON.parse(lineas[lineas.length - 1] as string);

    expect(ultima.usuarioId).toBe(1);
    expect(ultima.accion).toBe('TEST');
    expect(ultima.entidad).toBe('Prueba');
    expect(ultima.entidadId).toBe(42);
    expect(ultima.detalle).toBe('desde el test');
    expect(typeof ultima.fecha).toBe('string');
  });
});
