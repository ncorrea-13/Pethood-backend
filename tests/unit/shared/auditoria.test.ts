import { describe, expect, it } from 'vitest';
import { datosAlta, datosBaja, datosModificacion } from '../../../src/shared/auditoria';

describe('helpers de auditoría', () => {
  it('datosAlta arma usuarioAlta/fechaAlta con el id recibido', () => {
    const resultado = datosAlta(7);

    expect(resultado.usuarioAlta).toBe(7);
    expect(resultado.fechaAlta).toBeInstanceOf(Date);
  });

  it('datosModificacion arma usuarioModificacion/fechaModificacion con el id recibido', () => {
    const resultado = datosModificacion(3);

    expect(resultado.usuarioModificacion).toBe(3);
    expect(resultado.fechaModificacion).toBeInstanceOf(Date);
  });

  it('datosBaja arma usuarioBaja/fechaBaja con el id recibido', () => {
    const resultado = datosBaja(1);

    expect(resultado.usuarioBaja).toBe(1);
    expect(resultado.fechaBaja).toBeInstanceOf(Date);
  });
});
