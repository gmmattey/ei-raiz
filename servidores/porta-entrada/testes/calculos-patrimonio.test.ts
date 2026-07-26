import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularAlocacao } from '../src/dominios/patrimonio/calculos/alocacao';
import { calcularRentabilidadePct } from '../src/dominios/patrimonio/calculos/rentabilidade';

test('rentabilidade não fabrica percentual sem base investida válida', () => {
  assert.equal(calcularRentabilidadePct(120, 100), 20);
  assert.equal(calcularRentabilidadePct(120, null), null);
  assert.equal(calcularRentabilidadePct(120, 0), null);
});

test('alocação preserva total zero sem divisão inválida', () => {
  assert.deepEqual(calcularAlocacao([
    { classe: 'acao', subclasse: null, valorBrl: 0 },
    { classe: 'fundo', subclasse: null, valorBrl: 0 },
  ]).map((item) => item.pesoPct), [0, 0]);
  assert.deepEqual(calcularAlocacao([
    { classe: 'acao', subclasse: null, valorBrl: 75 },
    { classe: 'fundo', subclasse: null, valorBrl: 25 },
  ]).map((item) => item.pesoPct), [75, 25]);
});
