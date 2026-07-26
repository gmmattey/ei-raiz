import assert from 'node:assert/strict';
import test from 'node:test';
import type { Env } from '../src/infra/bd';
import { historicoMensalJob } from '../src/jobs/historico-mensal.job';

test('snapshot mensal reduz a confiança quando há cotação expirada', async () => {
  const execucoes: { sql: string; valores: unknown[] }[] = [];
  const bd = {
    prepare(sql: string) {
      return {
        bind(...valores: unknown[]) {
          return {
            all: async () => ({ results: sql.includes('FROM patrimonio_movimentos') ? [] : [{ id: 'usuario-1' }] }),
            first: async () => sql.includes('vw_patrimonio_resumo')
              ? { patrimonio_bruto_brl: 100, patrimonio_liquido_brl: 100, divida_brl: 0, aporte_mes_brl: 0 }
              : { total_itens: 2, itens_sem_valor: 0, itens_cotacao_expirada: 1 },
            run: async () => {
              execucoes.push({ sql, valores });
              return { success: true, meta: { changes: 1 } };
            },
          };
        },
      };
    },
    batch: async () => [],
  };

  await historicoMensalJob({ DB: bd } as unknown as Env);

  assert.equal(execucoes.length, 1);
  assert.match(execucoes[0].sql, /ON CONFLICT\(usuario_id, ano_mes\)/);
  assert.equal(execucoes[0].valores[6], 0);
  assert.deepEqual(JSON.parse(execucoes[0].valores[7] as string), {
    totalItens: 2, itensSemValor: 0, itensCotacaoExpirada: 1,
  });
});
