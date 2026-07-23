import { expect, test } from '@playwright/test';
import { BASE_URL, expectedInvestedTotal, expectedPortfolioTotal, registerSeedUser, resetDatabase, sql, triggerCron, waitForServerReady } from './helpers';

async function authedFetch(token: string, path: string, init: RequestInit = {}) {
  return fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

test.beforeEach(async () => {
  resetDatabase();
  await waitForServerReady();
});

test('GET /api/portfolio consolida saldos, frescor e benchmarks', async () => {
  const { token } = await registerSeedUser();
  const res = await authedFetch(token, '/api/portfolio');
  expect(res.ok).toBeTruthy();

  const portfolio = await res.json();
  expect(portfolio.userName).toBe('Luiz');
  expect(portfolio.total).toBeCloseTo(expectedPortfolioTotal(), 2);
  expect(portfolio.invested).toBeCloseTo(expectedInvestedTotal(), 2);
  expect(portfolio.grossWealth).toBeCloseTo(portfolio.total, 2);
  expect(portfolio.assets).toHaveLength(15);
  expect(portfolio.redeeming).toHaveLength(4);
  expect(portfolio.freshness.ok).toBe(10);
  expect(portfolio.freshness.total).toBe(11);
  expect(portfolio.freshness.byInstitution).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ institution: 'ONZE' }),
    ])
  );
  expect(portfolio.quoteProvider).toEqual(
    expect.objectContaining({
      name: 'BRAPI',
      marketTimeZone: 'America/Sao_Paulo',
      hasTokenConfigured: true,
    })
  );
  expect(['idle', 'ok', 'stale', 'degraded']).toContain(portfolio.quoteProvider.status);
  expect(portfolio.benchmarks.cdi.value).toBe(10.65);
  expect(portfolio.benchmarks.selic.value).toBe(10.5);
  expect(portfolio.benchmarks.ipca12m.value).toBe(4.2);
});

test('CRUD de ativos, aportes, snapshot e isolamento multi-user funcionam', async () => {
  const userA = await registerSeedUser();
  const userBRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'outro.usuario@exemplo.com',
      password: 'OutraSenha123!',
      name: 'Outro',
      cpf: '99988877766',
      birth_date: '1991-02-03',
    }),
  });
  expect(userBRes.ok).toBeTruthy();
  const userB = await userBRes.json();

  const createRes = await authedFetch(userA.token, '/api/assets', {
    method: 'POST',
    body: JSON.stringify({
      institution: 'XP',
      class: 'FUNDO',
      name: 'Fundo QA',
      manual_balance: 1000,
      invested: 900,
    }),
  });
  expect(createRes.status).toBe(201);
  const created = await createRes.json();
  expect(created.id).toBeGreaterThan(0);

  const contributionRes = await authedFetch(userA.token, `/api/assets/${created.id}/contributions`, {
    method: 'POST',
    body: JSON.stringify({
      amount: 100,
      contributedAt: '2026-06-15T12:00:00.000Z',
      note: 'aporte inicial',
    }),
  });
  expect(contributionRes.status).toBe(201);
  const contribution = await contributionRes.json();
  expect(contribution.invested).toBe(1000);

  const detailRes = await authedFetch(userA.token, `/api/assets/${created.id}/detail`);
  expect(detailRes.ok).toBeTruthy();
  const detail = await detailRes.json();
  expect(detail.asset.name).toBe('Fundo QA');
  expect(detail.asset.invested).toBe(1000);
  expect(detail.asset.gain).toBe(0);

  const updateRes = await authedFetch(userA.token, `/api/assets/${created.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: 'Fundo QA Atualizado',
      manual_balance: 1100,
      status: 'redeeming',
    }),
  });
  expect(updateRes.ok).toBeTruthy();

  const contribListRes = await authedFetch(userA.token, `/api/assets/${created.id}/contributions`);
  const contribList = await contribListRes.json();
  expect(contribList.count).toBe(2);
  expect(contribList.total).toBe(1000);

  const deleteContributionRes = await authedFetch(userA.token, `/api/assets/${created.id}/contributions/${contribution.id}`, {
    method: 'DELETE',
  });
  expect(deleteContributionRes.ok).toBeTruthy();
  const deletedContribution = await deleteContributionRes.json();
  expect(deletedContribution.deleted).toBeTruthy();
  expect(deletedContribution.invested).toBe(900);

  const contribListAfterDeleteRes = await authedFetch(userA.token, `/api/assets/${created.id}/contributions`);
  const contribListAfterDelete = await contribListAfterDeleteRes.json();
  expect(contribListAfterDelete.count).toBe(1);
  expect(contribListAfterDelete.total).toBe(900);

  const snapshotRes = await authedFetch(userA.token, '/api/snapshot', { method: 'POST' });
  expect(snapshotRes.ok).toBeTruthy();
  const snapshot = await snapshotRes.json();
  expect(snapshot.month).toMatch(/^\d{4}-\d{2}$/);
  expect(snapshot.created).toBeTruthy();

  const historyRes = await authedFetch(userA.token, '/api/history');
  const history = await historyRes.json();
  expect(history).toHaveLength(1);
  expect(history[0].total).toBeCloseTo(snapshot.total, 2);

  const historyAssetRes = await authedFetch(userA.token, '/api/assets', {
    method: 'POST',
    body: JSON.stringify({
      institution: 'XP',
      class: 'ACAO',
      name: 'PETR4 · Petrobras QA',
      ticker: 'PETR4',
      qty: 10,
      invested: 381.2,
    }),
  });
  expect(historyAssetRes.status).toBe(201);
  const historyAsset = await historyAssetRes.json();

  const assetHistoryRes = await authedFetch(userA.token, `/api/assets/${historyAsset.id}/history?period=1mo`);
  expect(assetHistoryRes.ok).toBeTruthy();
  const assetHistory = await assetHistoryRes.json();
  expect(assetHistory.ticker).toBe('PETR4');
  expect(assetHistory.period).toBe('1mo');
  expect(assetHistory.dataPoints.length).toBeGreaterThan(0);

  const invalidHistoryRes = await authedFetch(userA.token, `/api/assets/${historyAsset.id}/history?period=2y`);
  expect(invalidHistoryRes.status).toBe(400);

  const otherUserDetail = await authedFetch(userB.token, `/api/assets/${created.id}/detail`);
  expect(otherUserDetail.status).toBe(404);

  const deleteRes = await authedFetch(userA.token, `/api/assets/${created.id}`, { method: 'DELETE' });
  expect(deleteRes.ok).toBeTruthy();

  const deletedDetail = await authedFetch(userA.token, `/api/assets/${created.id}/detail`);
  expect(deletedDetail.status).toBe(404);
});

test('Importacao, busca de fundos, bens e analise IA degradam corretamente', async () => {
  const { token } = await registerSeedUser();

  const fundsSearch = await fetch(`${BASE_URL}/api/funds/search?q=Icatu`);
  expect(fundsSearch.ok).toBeTruthy();
  const funds = await fundsSearch.json();
  expect(funds.results.length).toBeGreaterThan(0);
  expect(funds.results.some((fund: { name: string }) => fund.name.includes('Icatu'))).toBeTruthy();
  expect(funds.results.every((fund: { name: string; cnpj: string }) => fund.name.includes('Icatu') || fund.cnpj.includes('12345678000190'))).toBeTruthy();

  const importRes = await authedFetch(token, '/api/import', {
    method: 'POST',
    body: JSON.stringify({
      items: [
        {
          institution: 'XP',
          class: 'ACAO',
          name: 'PETR4 · Petrobras',
          ticker: 'PETR4',
          qty: 10,
          invested: 1000,
          purchase_date: '2026-06-05T12:00:00.000Z',
        },
        {
          institution: 'XP',
          class: 'FII',
          name: 'HGLG11 · CSHG Logística',
          ticker: 'HGLG11',
          qty: 3,
          invested: 420,
          status: 'redeeming',
          purchase_date: '2026-06-06T12:00:00.000Z',
        },
        {
          institution: 'ITAU',
          class: 'POUPANCA',
          name: 'Poupanca QA',
          manual_balance: 500,
          invested: 500,
        },
      ],
    }),
  });
  expect(importRes.status).toBe(201);
  const imported = await importRes.json();
  expect(imported.created).toBe(3);

  const portfolioAfterImportRes = await authedFetch(token, '/api/portfolio');
  expect(portfolioAfterImportRes.ok).toBeTruthy();
  const portfolioAfterImport = await portfolioAfterImportRes.json();
  const importedStock = portfolioAfterImport.assets.find((asset: { ticker?: string | null }) => asset.ticker === 'PETR4');
  expect(importedStock).toBeTruthy();
  expect(importedStock.quoteSource).toBe('BRAPI');
  expect(importedStock.price).toBeGreaterThan(0);
  expect(importedStock.balance).toBeGreaterThan(0);
  expect(importedStock.quoteFetchedAt).toBeTruthy();
  const importedFii = portfolioAfterImport.redeeming.find((asset: { ticker?: string | null; class?: string | null; status?: string | null }) => asset.ticker === 'HGLG11');
  expect(importedFii).toBeTruthy();
  expect(importedFii.class).toBe('FII');
  expect(importedFii.status).toBe('redeeming');
  expect(importedFii.quoteSource).toBe('BRAPI');
  expect(importedFii.price).toBeGreaterThan(0);
  expect(importedFii.quoteFetchedAt).toBeTruthy();

  const importedStockDetailRes = await authedFetch(token, `/api/assets/${importedStock.id}/detail`);
  expect(importedStockDetailRes.ok).toBeTruthy();
  const importedStockDetail = await importedStockDetailRes.json();
  expect(importedStockDetail.contributions).toHaveLength(1);
  expect(importedStockDetail.contributions[0].qty).toBe(10);
  expect(importedStockDetail.contributions[0].contributedAt).toContain('2026-06-05');

  const importAudit = await sql("SELECT operation_type, status, summary_json FROM operation_logs WHERE operation_type = 'import_batch' ORDER BY id DESC LIMIT 1");
  expect(importAudit).toContain('import_batch');
  expect(importAudit).toContain('completed');
  expect(importAudit).toContain('itemsReceived');
  expect(importAudit).toContain('assetsCreated');

  const goodsCreate = await authedFetch(token, '/api/goods', {
    method: 'POST',
    body: JSON.stringify({
      type: 'IMOVEL',
      name: 'Casa QA',
      estimatedValue: 1234.56,
      propertyType: 'CASA',
      areaM2: 95.5,
      city: 'Campinas',
      state: 'SP',
      isFinanced: true,
    }),
  });
  expect(goodsCreate.status).toBe(201);
  const good = await goodsCreate.json();
  expect(good.type).toBe('IMOVEL');
  expect(good.name).toBe('Casa QA');
  expect(good.estimated_value).toBe(1234.56);
  expect(good.area_m2).toBe(95.5);

  const goodsList = await authedFetch(token, '/api/goods');
  const goods = await goodsList.json();
  expect(goods.total).toBeCloseTo(1234.56, 2);
  expect(goods.goods).toHaveLength(1);
  expect(goods.goods[0].areaM2).toBe(95.5);
  expect(goods.goods[0].propertyType).toBe('CASA');
  expect(goods.goods[0].state).toBe('SP');

  const goodsUpdate = await authedFetch(token, `/api/goods/${good.id}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: 'Casa QA Atualizada',
      estimatedValue: 1400.5,
      areaM2: 101,
      notes: 'atualizado pela suíte',
    }),
  });
  expect(goodsUpdate.ok).toBeTruthy();
  const updatedGood = await goodsUpdate.json();
  expect(updatedGood.name).toBe('Casa QA Atualizada');
  expect(updatedGood.estimated_value).toBe(1400.5);
  expect(updatedGood.area_m2).toBe(101);
  expect(updatedGood.balance_updated_at).toBeTruthy();

  const goodsDelete = await authedFetch(token, `/api/goods/${good.id}`, {
    method: 'DELETE',
  });
  expect(goodsDelete.ok).toBeTruthy();
  const archivedGood = await goodsDelete.json();
  expect(archivedGood.archived).toBe(true);

  const goodsAfterDelete = await authedFetch(token, '/api/goods');
  const goodsAfterDeleteJson = await goodsAfterDelete.json();
  expect(goodsAfterDeleteJson.goods).toHaveLength(0);

  const aiRes = await authedFetch(token, '/api/ai/analyze', {
    method: 'POST',
    body: JSON.stringify({ context: 'portfolio' }),
  });
  expect([500, 503]).toContain(aiRes.status);
});

test('Detalhe de ação continua funcionando mesmo sem tabela de aportes', async () => {
  const { token } = await registerSeedUser();
  await sql('DROP TABLE IF EXISTS asset_contributions;');

  const createRes = await authedFetch(token, '/api/assets', {
    method: 'POST',
    body: JSON.stringify({
      institution: 'XP',
      class: 'ACAO',
      name: 'VALE3 · Vale QA',
      ticker: 'VALE3',
      qty: 5,
      invested: 250,
    }),
  });
  expect(createRes.status).toBe(201);
  const created = await createRes.json();

  const detailRes = await authedFetch(token, `/api/assets/${created.id}/detail`);
  expect(detailRes.ok).toBeTruthy();
  const detail = await detailRes.json();
  expect(detail.asset.name).toBe('VALE3 · Vale QA');
  expect(detail.asset.invested).toBe(250);
  expect(Array.isArray(detail.contributions)).toBeTruthy();
  expect(detail.contributions).toHaveLength(0);
  expect(detail.asset.status).toBe('active');
  expect(detail.asset.quoteFetchedAt).toBeTruthy();

  const listRes = await authedFetch(token, `/api/assets/${created.id}/contributions`);
  expect(listRes.ok).toBeTruthy();
  const contribList = await listRes.json();
  expect(contribList.count).toBe(0);
  expect(contribList.total).toBe(0);
});

test('Cadastro manual aceita FII como classe automática distinta', async () => {
  const { token } = await registerSeedUser();

  const createRes = await authedFetch(token, '/api/assets', {
    method: 'POST',
    body: JSON.stringify({
      institution: 'XP',
      class: 'FII',
      name: 'HGLG11 · CSHG Logística QA',
      ticker: 'HGLG11',
      qty: 2,
      invested: 300,
    }),
  });
  expect(createRes.status).toBe(201);

  const portfolioRes = await authedFetch(token, '/api/portfolio');
  expect(portfolioRes.ok).toBeTruthy();
  const portfolio = await portfolioRes.json();
  const fii = portfolio.assets.find((asset: { ticker?: string | null }) => asset.ticker === 'HGLG11');
  expect(fii).toBeTruthy();
  expect(fii.class).toBe('FII');
  expect(fii.quoteSource).toBe('BRAPI');
  expect(fii.price).toBeGreaterThan(0);
});

test('Ação manual passa a guardar data e quantidade por compra', async () => {
  const { token } = await registerSeedUser();

  const createRes = await authedFetch(token, '/api/assets', {
    method: 'POST',
    body: JSON.stringify({
      institution: 'XP',
      class: 'ACAO',
      name: 'PETR4 · Petrobras Lotes QA',
      ticker: 'PETR4',
      qty: 10,
      invested: 400,
      purchase_date: '2026-06-10T12:00:00.000Z',
    }),
  });
  expect(createRes.status).toBe(201);
  const created = await createRes.json();

  const detailRes = await authedFetch(token, `/api/assets/${created.id}/detail`);
  expect(detailRes.ok).toBeTruthy();
  const detail = await detailRes.json();
  expect(detail.contributions).toHaveLength(1);
  expect(detail.contributions[0].qty).toBe(10);
  expect(detail.contributions[0].unitPrice).toBe(40);
  expect(detail.contributions[0].contributedAt).toContain('2026-06-10');

  const addLotRes = await authedFetch(token, `/api/assets/${created.id}/contributions`, {
    method: 'POST',
    body: JSON.stringify({
      amount: 84,
      qty: 2,
      contributedAt: '2026-06-12T12:00:00.000Z',
      note: 'segunda compra',
    }),
  });
  expect(addLotRes.status).toBe(201);
  const newLot = await addLotRes.json();
  expect(newLot.assetQty).toBe(12);

  const portfolioRes = await authedFetch(token, '/api/portfolio');
  expect(portfolioRes.ok).toBeTruthy();
  const portfolio = await portfolioRes.json();
  const stock = portfolio.assets.find((asset: { ticker?: string | null }) => asset.ticker === 'PETR4');
  expect(stock).toBeTruthy();
  expect(stock.qty).toBe(12);
  expect(stock.invested).toBe(484);

  const detailAfterRes = await authedFetch(token, `/api/assets/${created.id}/detail`);
  expect(detailAfterRes.ok).toBeTruthy();
  const detailAfter = await detailAfterRes.json();
  expect(detailAfter.contributions).toHaveLength(2);
  expect(detailAfter.contributions[0].qty).toBe(2);
  expect(detailAfter.contributions[0].unitPrice).toBe(42);
  expect(detailAfter.asset.avgCost).toBeCloseTo(484 / 12, 6);
});

test('Saída e venda de ação preservam histórico sem usar archived como atalho', async () => {
  const { token } = await registerSeedUser();

  const createRes = await authedFetch(token, '/api/assets', {
    method: 'POST',
    body: JSON.stringify({
      institution: 'XP',
      class: 'ACAO',
      name: 'VALE3 · Saída QA',
      ticker: 'VALE3',
      qty: 5,
      invested: 250,
      purchase_date: '2026-06-01T12:00:00.000Z',
    }),
  });
  expect(createRes.status).toBe(201);
  const created = await createRes.json();

  const startExitRes = await authedFetch(token, `/api/assets/${created.id}/exit/start`, {
    method: 'POST',
    body: JSON.stringify({ startedAt: '2026-06-15T12:00:00.000Z', note: 'preparando saída' }),
  });
  expect(startExitRes.status).toBe(200);
  const started = await startExitRes.json();
  expect(started.status).toBe('redeeming');

  const portfolioRedeemingRes = await authedFetch(token, '/api/portfolio');
  const portfolioRedeeming = await portfolioRedeemingRes.json();
  expect(portfolioRedeeming.assets.some((asset: { id: number }) => asset.id === created.id)).toBeFalsy();
  expect(portfolioRedeeming.redeeming.some((asset: { id: number }) => asset.id === created.id)).toBeTruthy();

  const cancelExitRes = await authedFetch(token, `/api/assets/${created.id}/exit/cancel`, {
    method: 'POST',
    body: JSON.stringify({ canceledAt: '2026-06-16T12:00:00.000Z' }),
  });
  expect(cancelExitRes.status).toBe(200);
  const canceled = await cancelExitRes.json();
  expect(canceled.status).toBe('active');

  const saleRes = await authedFetch(token, `/api/assets/${created.id}/sale`, {
    method: 'POST',
    body: JSON.stringify({
      soldAt: '2026-06-17T12:00:00.000Z',
      grossAmount: 310,
      note: 'venda total',
    }),
  });
  expect(saleRes.status).toBe(200);
  const sold = await saleRes.json();
  expect(sold.status).toBe('sold');
  expect(sold.grossAmount).toBe(310);

  const portfolioAfterSaleRes = await authedFetch(token, '/api/portfolio');
  const portfolioAfterSale = await portfolioAfterSaleRes.json();
  expect(portfolioAfterSale.assets.some((asset: { id: number }) => asset.id === created.id)).toBeFalsy();
  expect(portfolioAfterSale.redeeming.some((asset: { id: number }) => asset.id === created.id)).toBeFalsy();

  const detailRes = await authedFetch(token, `/api/assets/${created.id}/detail`);
  expect(detailRes.ok).toBeTruthy();
  const detail = await detailRes.json();
  expect(detail.asset.status).toBe('sold');
  expect(detail.lifecycle.latestSale.soldAt).toContain('2026-06-17');
  expect(detail.lifecycle.latestSale.grossAmount).toBe(310);
  expect(detail.contributions).toHaveLength(1);

  const newContributionRes = await authedFetch(token, `/api/assets/${created.id}/contributions`, {
    method: 'POST',
    body: JSON.stringify({
      amount: 50,
      qty: 1,
      contributedAt: '2026-06-18T12:00:00.000Z',
    }),
  });
  expect(newContributionRes.status).toBe(422);
});

test('Importacao rejeita status fora do contrato active/redeeming', async () => {
  const { token } = await registerSeedUser();

  const importRes = await authedFetch(token, '/api/import', {
    method: 'POST',
    body: JSON.stringify({
      items: [
        {
          institution: 'XP',
          class: 'ACAO',
          name: 'PETR4 · Petrobras',
          ticker: 'PETR4',
          qty: 10,
          status: 'archived',
        },
      ],
    }),
  });
  expect(importRes.status).toBe(400);
  const err = await importRes.json();
  expect(JSON.stringify(err)).toContain('invalid status');
});

test('Cron mensal cria snapshot automático', async () => {
  const { token } = await registerSeedUser();
  await triggerCron('0 12 1 * *');

  const historyRes = await authedFetch(token, '/api/history');
  expect(historyRes.ok).toBeTruthy();
  const history = await historyRes.json();
  expect(history.length).toBeGreaterThanOrEqual(1);
  expect(history[0].month).toMatch(/^\d{4}-\d{2}$/);

  const cronRes = await triggerCron('0 12 * * *');
  expect(cronRes.length).toBeGreaterThan(0);

  const portfolioRes = await authedFetch(token, '/api/portfolio');
  const portfolio = await portfolioRes.json();
  expect(portfolio.quotesFetchedAt).toBeTruthy();

  const cronAudit = await sql("SELECT operation_type, status, summary_json FROM operation_logs WHERE operation_type IN ('cron_snapshot', 'cron_brapi_quotes', 'cron_macro') ORDER BY id DESC LIMIT 10");
  expect(cronAudit).toContain('cron_snapshot');
  expect(cronAudit).toContain('cron_brapi_quotes');
  expect(cronAudit).toContain('cron_macro');
  expect(cronAudit).toContain('completed');
});
