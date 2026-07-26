import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizarCnpjCvm, normalizarDataCvm } from '../src/dominios/admin/cvm-ingestao.servico';

test('normaliza CNPJ CVM com ou sem pontuação', () => {
  assert.equal(normalizarCnpjCvm('12.345.678/0001-90'), '12345678000190');
  assert.equal(normalizarCnpjCvm('123'), null);
});

test('aceita somente data CVM no formato canônico', () => {
  assert.equal(normalizarDataCvm('2026-07-25'), '2026-07-25');
  assert.equal(normalizarDataCvm('25/07/2026'), null);
});
