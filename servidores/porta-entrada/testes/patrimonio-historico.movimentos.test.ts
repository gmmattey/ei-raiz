import assert from 'node:assert/strict';
import test from 'node:test';
import { reconstruirHistoricoDeMovimentos } from '../src/jobs/patrimonio-historico.movimentos';

test('reconstrói o fechamento mensal pelo último movimento de cada posição', () => {
  const snapshots = reconstruirHistoricoDeMovimentos([
    { item_id: 'acao-1', item_tipo: 'acao', tipo: 'compra', valor_brl: 100, data: '2026-01-10', criado_em: '2026-01-10T10:00:00Z' },
    { item_id: 'fundo-1', item_tipo: 'fundo', tipo: 'aporte', valor_brl: 50, data: '2026-02-05', criado_em: '2026-02-05T10:00:00Z' },
    { item_id: 'acao-1', item_tipo: 'acao', tipo: 'correcao', valor_brl: 120, data: '2026-02-20', criado_em: '2026-02-20T10:00:00Z' },
    { item_id: 'acao-1', item_tipo: 'acao', tipo: 'retirada', valor_brl: 120, data: '2026-03-01', criado_em: '2026-03-01T10:00:00Z' },
  ], '2026-04', 2);

  assert.equal(snapshots.length, 3);
  assert.deepEqual(snapshots.map(({ anoMes, patrimonioBrutoBrl, aporteMesBrl, ehConfiavel }) => ({ anoMes, patrimonioBrutoBrl, aporteMesBrl, ehConfiavel })), [
    { anoMes: '2026-01', patrimonioBrutoBrl: 100, aporteMesBrl: 0, ehConfiavel: true },
    { anoMes: '2026-02', patrimonioBrutoBrl: 170, aporteMesBrl: 50, ehConfiavel: true },
    { anoMes: '2026-03', patrimonioBrutoBrl: 50, aporteMesBrl: 0, ehConfiavel: true },
  ]);
});

test('marca a reconstrução como incompleta quando há posição sem movimento', () => {
  const [snapshot] = reconstruirHistoricoDeMovimentos([
    { item_id: 'acao-1', item_tipo: 'acao', tipo: 'compra', valor_brl: 100, data: '2026-01-10', criado_em: '2026-01-10T10:00:00Z' },
  ], '2026-02', 2);
  assert.equal(snapshot.ehConfiavel, false);
  assert.deepEqual(JSON.parse(snapshot.dadosJson), {
    fonte: 'movimentos', itensComMovimento: 1, itensSemMovimento: 1, itensSemValor: 0,
  });
});
