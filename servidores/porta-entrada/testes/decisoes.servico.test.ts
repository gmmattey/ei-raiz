import assert from 'node:assert/strict';
import test from 'node:test';
import type { Bd } from '../src/infra/bd';
import { servicoDecisoes } from '../src/dominios/decisoes/decisoes.servico';

const linhaResumoAtual = {
  usuario_id: 'usuario-1',
  patrimonio_bruto_brl: 1000,
  divida_brl: 100,
  patrimonio_liquido_brl: 900,
  quantidade_itens: 3,
  score_total: 70,
  score_faixa: 'bom',
  score_calculado_em: '2026-07-20T10:00:00.000Z',
  aporte_mes_brl: 0,
  rentabilidade_mes_pct: null,
};

test('simulação criada carrega a versão e confiança do resumo patrimonial usado', async () => {
  const inseridos: { valores: unknown[] }[] = [];
  const bd: Bd = {
    async primeiro(sql: string) {
      if (sql.includes('vw_patrimonio_resumo')) return linhaResumoAtual as never;
      if (sql.includes('decisoes_simulacoes')) {
        const [ultimo] = inseridos.slice(-1);
        return {
          id: ultimo?.valores[0], usuario_id: 'usuario-1', tipo: 'imovel',
          premissas_json: ultimo?.valores[3], resultado_json: ultimo?.valores[4],
          criado_em: '2026-07-26T10:00:00.000Z',
        } as never;
      }
      return null;
    },
    async consultar() { return []; },
    async executar(sql: string, ...valores: unknown[]) {
      if (sql.includes('INSERT INTO decisoes_simulacoes')) inseridos.push({ valores });
      return { sucesso: true, linhasAfetadas: 1 };
    },
    async emLote() {},
  };
  const resultado = await servicoDecisoes(bd).criar('usuario-1', {
    tipo: 'imovel', premissasJson: { valorImovel: 500000 },
  });
  assert.equal(resultado.ok, true, JSON.stringify(resultado));
  if (!resultado.ok) return;
  const contexto = resultado.dados.resultadoJson.contextoFinanceiro as { versao: string; confianca: string };
  assert.ok(contexto.versao);
  assert.equal(contexto.confianca, 'atual');
});
