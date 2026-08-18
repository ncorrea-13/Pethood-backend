import { describe, expect, it } from 'vitest';
import { escaparCampoCsv, filaCsv } from '../../../src/shared/csv';

describe('escaparCampoCsv', () => {
  it('deja pasar un texto simple sin comillas', () => {
    expect(escaparCampoCsv('Firulais')).toBe('Firulais');
  });

  it('entrecomilla un campo con coma', () => {
    expect(escaparCampoCsv('Mendoza, Argentina')).toBe('"Mendoza, Argentina"');
  });

  it('escapa comillas dobles duplicándolas', () => {
    expect(escaparCampoCsv('Dijo "hola"')).toBe('"Dijo ""hola"""');
  });

  it('entrecomilla un campo con salto de línea', () => {
    expect(escaparCampoCsv('línea 1\nlínea 2')).toBe('"línea 1\nlínea 2"');
  });

  it('null y undefined quedan como campo vacío, no como texto "null"', () => {
    expect(escaparCampoCsv(null)).toBe('');
    expect(escaparCampoCsv(undefined)).toBe('');
  });

  it('serializa Date como ISO', () => {
    const fecha = new Date('2026-08-18T10:00:00.000Z');
    expect(escaparCampoCsv(fecha)).toBe('2026-08-18T10:00:00.000Z');
  });
});

describe('filaCsv', () => {
  it('une los campos con coma y termina en salto de línea', () => {
    expect(filaCsv([1, 'Firulais', true])).toBe('1,Firulais,true\n');
  });
});
