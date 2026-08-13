import { describe, expect, it } from 'vitest';
import { mensajeLongitud, validarTexto } from '../../../../src/shared/validation/text';

const nombre = { min: 2, max: 25, etiqueta: 'El nombre' };

describe('validarTexto', () => {
  it('recorta los espacios de los extremos', () => {
    expect(validarTexto('  Fido  ', nombre)).toEqual({ valido: true, valor: 'Fido' });
  });

  it('rechaza un texto de un solo carácter con el mensaje de longitud', () => {
    expect(validarTexto('F', nombre)).toEqual({
      valido: false,
      error: 'El nombre debe tener entre 2 y 25 caracteres',
    });
  });

  it('un texto de solo espacios falla por longitud, no como campo vacío', () => {
    // Para quien lo escribió el campo tenía contenido: el mensaje debe hablar de longitud.
    expect(validarTexto('     ', nombre)).toEqual({
      valido: false,
      error: 'El nombre debe tener entre 2 y 25 caracteres',
    });
  });

  it('rechaza un texto que supera el máximo', () => {
    expect(validarTexto('a'.repeat(26), nombre).valido).toBe(false);
  });

  it('acepta exactamente el mínimo y el máximo', () => {
    expect(validarTexto('ab', nombre).valido).toBe(true);
    expect(validarTexto('a'.repeat(25), nombre).valido).toBe(true);
  });

  it('cuenta la longitud después del trim, no antes', () => {
    expect(validarTexto(`  ${'a'.repeat(25)}  `, nombre).valido).toBe(true);
  });

  it('rechaza un valor ausente como campo obligatorio', () => {
    expect(validarTexto(undefined, nombre)).toEqual({
      valido: false,
      error: 'El nombre es obligatorio',
    });
  });

  it('acepta vacío cuando el campo es opcional', () => {
    expect(validarTexto('   ', { max: 50, etiqueta: 'La nota', obligatorio: false })).toEqual({
      valido: true,
      valor: '',
    });
  });
});

describe('mensajeLongitud', () => {
  it('arma un único mensaje para mínimo y máximo', () => {
    expect(mensajeLongitud('El nombre', 2, 25)).toBe(
      'El nombre debe tener entre 2 y 25 caracteres',
    );
  });
});
