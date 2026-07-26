import assert from 'node:assert/strict';
import test from 'node:test';
import type { Env } from '../src/infra/bd';
import { patrimonioReconstruirJob } from '../src/jobs/patrimonio-reconstruir.job';

test('reconstrução atualiza somente posições com quantidade e preserva valores manuais', async () => {
  const consultas: string[] = [];
  const execucoes: { sql: string; valores: unknown[] }[] = [];
  const bd = {
    prepare(sql: string) {
      return {
        bind(...valores: unknown[]) {
          return {
            all: async () => {
              consultas.push(sql);
              if (sql.includes('FROM patrimonio_fila_reconstrucao')) return { results: [{ id: 'fila-1', usuario_id: 'usuario-1' }] };
              return { results: [{ id: 'acao-1', quantidade: 10, preco_medio_brl: 5, preco_atual_brl: null }] };
            },
            first: async () => null,
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

  await patrimonioReconstruirJob({ DB: bd } as unknown as Env);

  assert.match(consultas[1], /p\.quantidade IS NOT NULL/);
  const atualizacao = execucoes.find((execucao) => execucao.sql.includes('UPDATE patrimonio_itens'));
  assert.ok(atualizacao);
  assert.equal(atualizacao.valores[0], 50);
});
