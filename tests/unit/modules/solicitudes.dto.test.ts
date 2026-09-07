import { describe, expect, it } from 'vitest';
import {
  filtrosRecibidasSchema,
  idSolicitudSchema,
  resolverSolicitudSchema,
} from '../../../src/modules/solicitudes/solicitudes.dto';

function primerErrorResolver(entrada: unknown): string | undefined {
  const resultado = resolverSolicitudSchema.safeParse(entrada);
  return resultado.success ? undefined : resultado.error.issues[0]?.message;
}

describe('resolverSolicitudSchema', () => {
  it('acepta Aprobada sin comentario', () => {
    const resultado = resolverSolicitudSchema.safeParse({ estado: 'Aprobada' });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data).toEqual({ estado: 'Aprobada', comentario: null });
    }
  });

  it('acepta Rechazada con comentario', () => {
    const resultado = resolverSolicitudSchema.safeParse({
      estado: 'Rechazada',
      comentario: 'No cumple los requisitos',
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.comentario).toBe('No cumple los requisitos');
    }
  });

  it('un comentario vacío se guarda como null (igual que mascotas.dto.ts)', () => {
    const resultado = resolverSolicitudSchema.safeParse({ estado: 'Aprobada', comentario: '' });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.comentario).toBeNull();
    }
  });

  it('rechaza un estado que no sea Aprobada/Rechazada (nunca "Pendiente" ni "Cancelada" a mano)', () => {
    expect(primerErrorResolver({ estado: 'Pendiente' })).toBeDefined();
    expect(primerErrorResolver({ estado: 'Cancelada' })).toBeDefined();
    expect(primerErrorResolver({ estado: 'algo-inventado' })).toBeDefined();
  });

  it('rechaza sin estado', () => {
    expect(primerErrorResolver({})).toBe('El estado es obligatorio');
  });

  it('rechaza un comentario más largo que el límite', () => {
    const comentario = 'a'.repeat(501);
    expect(primerErrorResolver({ estado: 'Aprobada', comentario })).toBeDefined();
  });

  it('acepta un comentario justo en el límite (500)', () => {
    const comentario = 'a'.repeat(500);
    expect(primerErrorResolver({ estado: 'Aprobada', comentario })).toBeUndefined();
  });
});

describe('filtrosRecibidasSchema', () => {
  it('valores por defecto sin query params', () => {
    const resultado = filtrosRecibidasSchema.parse({});
    expect(resultado).toEqual({ limite: 20, desplazamiento: 0 });
  });

  it('coerciona limite/desplazamiento desde query string', () => {
    const resultado = filtrosRecibidasSchema.parse({ limite: '5', desplazamiento: '10' });
    expect(resultado).toEqual({ limite: 5, desplazamiento: 10 });
  });

  it('acepta un estado válido del catálogo', () => {
    const resultado = filtrosRecibidasSchema.parse({ estado: 'Aprobada' });
    expect(resultado.estado).toBe('Aprobada');
  });

  it('rechaza un estado que no está en el catálogo', () => {
    expect(() => filtrosRecibidasSchema.parse({ estado: 'no-existe' })).toThrow();
  });

  it('rechaza limite por encima del máximo (50)', () => {
    expect(() => filtrosRecibidasSchema.parse({ limite: '51' })).toThrow();
  });

  it('rechaza desplazamiento negativo', () => {
    expect(() => filtrosRecibidasSchema.parse({ desplazamiento: '-1' })).toThrow();
  });
});

describe('idSolicitudSchema', () => {
  it('coerciona el id que llega como string desde la URL', () => {
    expect(idSolicitudSchema.parse('12')).toBe(12);
  });

  it('rechaza un id no numérico', () => {
    expect(() => idSolicitudSchema.parse('abc')).toThrow();
  });

  it('rechaza un id negativo o cero', () => {
    expect(() => idSolicitudSchema.parse('0')).toThrow();
    expect(() => idSolicitudSchema.parse('-1')).toThrow();
  });
});
