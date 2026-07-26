import assert from 'node:assert/strict';
import test from 'node:test';
import type { Env } from '../src/infra/bd';
import { executarJobMonitorado } from '../src/jobs/observabilidade.job';

test('registra sucesso, duração e volume de um job', async () => {
  const execucoes: { sql: string; valores: unknown[] }[] = [];
  const bd = {
    prepare(sql: string) {
      return { bind: (...valores: unknown[]) => ({
        all: async () => ({ results: [] }),
        first: async () => null,
        run: async () => {
          execucoes.push({ sql, valores });
          return { success: true, meta: { changes: 1 } };
        },
      }) };
    },
    batch: async () => [],
  };
  await executarJobMonitorado({ DB: bd } as unknown as Env, 'teste', async () => 7);
  assert.match(execucoes[0].sql, /INSERT INTO job_execucoes/);
  assert.match(execucoes[1].sql, /status = 'concluido'/);
  assert.equal(execucoes[1].valores[2], 7);
});

test('registra falha antes de propagar o erro do job', async () => {
  const execucoes: { sql: string; valores: unknown[] }[] = [];
  const bd = {
    prepare(sql: string) {
      return { bind: (...valores: unknown[]) => ({
        all: async () => ({ results: [] }), first: async () => null,
        run: async () => { execucoes.push({ sql, valores }); return { success: true, meta: { changes: 1 } }; },
      }) };
    },
    batch: async () => [],
  };
  await assert.rejects(
    executarJobMonitorado({ DB: bd } as unknown as Env, 'teste', async () => { throw new Error('indisponível'); }),
    /indisponível/,
  );
  assert.match(execucoes[1].sql, /status = 'falhou'/);
  assert.equal(execucoes[1].valores[2], 'indisponível');
});
