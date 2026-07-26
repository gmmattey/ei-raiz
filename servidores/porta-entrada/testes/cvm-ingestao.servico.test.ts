import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizarCnpjCvm, normalizarDataCvm, servicoCvmIngestao } from '../src/dominios/admin/cvm-ingestao.servico';

test('normaliza CNPJ CVM com ou sem pontuação', () => {
  assert.equal(normalizarCnpjCvm('12.345.678/0001-90'), '12345678000190');
  assert.equal(normalizarCnpjCvm('123'), null);
});

test('aceita somente data CVM no formato canônico', () => {
  assert.equal(normalizarDataCvm('2026-07-25'), '2026-07-25');
  assert.equal(normalizarDataCvm('25/07/2026'), null);
});

test('aceita cota CVM com patrimônio líquido negativo', async () => {
  const lotes: { sql: string; valores: unknown[] }[][] = [];
  const bd = {
    consultar: async () => [],
    primeiro: async () => ({ id: 'execucao-1' }),
    executar: async () => ({ sucesso: true, linhasAfetadas: 1 }),
    emLote: async (operacoes: { sql: string; valores: unknown[] }[]) => { lotes.push(operacoes); },
  };
  const resultado = await servicoCvmIngestao(bd).ingerirCotas('execucao-1', [{
    cnpj: '12.345.678/0001-90', data: '2026-07-25', valorCota: 1.23, patrimonioLiquidoBrl: -10,
  }]);
  assert.equal(resultado.ok, true);
  assert.equal(lotes[0][1].valores[3], -10);
});
