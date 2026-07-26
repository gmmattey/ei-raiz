import assert from 'node:assert/strict';
import test from 'node:test';
import type { PatrimonioResumoSaida } from '@ei/contratos';
import { avaliarConfiancaContextoFinanceiro, versaoContextoFinanceiro } from '../src/dominios/patrimonio/calculos/contexto-financeiro';

const resumoBase: PatrimonioResumoSaida = {
  patrimonioBrutoBrl: 1000,
  patrimonioLiquidoBrl: 900,
  dividaBrl: 100,
  quantidadeItens: 3,
  aporteMesBrl: 0,
  rentabilidadeMesPct: null,
  scoreTotal: 70,
  scoreFaixa: 'bom',
  scoreCalculadoEm: '2026-07-20T10:00:00.000Z',
  alocacao: [],
  evolucao: [],
  principaisAtivos: [],
  atualizadoEm: '2026-07-26T10:00:00.000Z',
};

test('sem itens patrimoniais gera confiança sem_dados', () => {
  const resultado = avaliarConfiancaContextoFinanceiro({ ...resumoBase, quantidadeItens: 0 });
  assert.equal(resultado.confianca, 'sem_dados');
  assert.deepEqual(resultado.motivos, ['nenhum_item_patrimonial']);
});

test('score ainda não calculado gera confiança parcial', () => {
  const resultado = avaliarConfiancaContextoFinanceiro({ ...resumoBase, scoreTotal: null, scoreCalculadoEm: null });
  assert.equal(resultado.confianca, 'parcial');
});

test('score calculado há mais de 35 dias gera confiança defasada', () => {
  const agora = new Date('2026-07-26T10:00:00.000Z');
  const resultado = avaliarConfiancaContextoFinanceiro(
    { ...resumoBase, scoreCalculadoEm: '2026-06-01T10:00:00.000Z' },
    agora,
  );
  assert.equal(resultado.confianca, 'defasada');
});

test('score recente gera confiança atual', () => {
  const agora = new Date('2026-07-26T10:00:00.000Z');
  const resultado = avaliarConfiancaContextoFinanceiro(resumoBase, agora);
  assert.equal(resultado.confianca, 'atual');
});

test('versão do contexto muda apenas quando score, itens ou patrimônio líquido mudam', () => {
  const v1 = versaoContextoFinanceiro(resumoBase);
  const v2 = versaoContextoFinanceiro({ ...resumoBase, atualizadoEm: '2026-07-26T11:00:00.000Z' });
  const v3 = versaoContextoFinanceiro({ ...resumoBase, patrimonioLiquidoBrl: 950 });
  assert.equal(v1, v2, 'atualizadoEm sozinho não deve mudar a versão');
  assert.notEqual(v1, v3, 'patrimônio líquido diferente deve mudar a versão');
});
