import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import * as XLSX from 'xlsx';
import { BASE_URL, expectedPortfolioTotal, registerSeedUser, resetDatabase, waitForServerReady } from './helpers';

const ROOT = process.cwd();
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
} as const;

let staticServer: Server | null = null;
let previewOrigin = '';

function contentTypeFor(pathname: string) {
  return MIME_TYPES[extname(pathname).toLowerCase() as keyof typeof MIME_TYPES] || 'application/octet-stream';
}

function buildPilotImportWorkbook() {
  const workbook = XLSX.utils.book_new();

  const equities = XLSX.utils.json_to_sheet([
    {
      Nome: 'QA Papel Piloto',
      Ticker: 'VALE3',
      Quantidade: 3,
      Instituicao: 'XP',
      'Valor Aplicado': 210.5,
      Situacao: 'Ativo',
      'Data Compra': '2026-06-10',
    },
    {
      Nome: 'QA Tijolo Piloto FII',
      Ticker: 'XPML11',
      Quantidade: 4,
      Instituicao: 'ITAU',
      'Valor Aplicado': 480,
      Situacao: 'Em resgate',
    },
  ]);

  const funds = XLSX.utils.json_to_sheet([
    {
      Nome: 'QA Fundo Piloto',
      Instituicao: 'ONZE',
      'Saldo Atual': 1234.56,
      Situacao: 'Ativo',
    },
    {
      Nome: 'QA Fundo Invalido',
      Instituicao: 'XP',
      'Valor Aplicado': 50,
      Situacao: 'Ativo',
    },
  ]);

  XLSX.utils.book_append_sheet(workbook, equities, 'Acoes-FIIs');
  XLSX.utils.book_append_sheet(workbook, funds, 'Fundos');

  return Buffer.from(XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }));
}

async function startStaticServer() {
  if (staticServer && previewOrigin) return;

  staticServer = createServer((request, response) => {
    const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
    const rawPath = decodeURIComponent(requestUrl.pathname === '/' ? '/apps/web/index.html' : requestUrl.pathname);
    const absolutePath = resolve(ROOT, `.${rawPath}`);

    if (!absolutePath.startsWith(normalize(ROOT))) {
      response.writeHead(403).end('forbidden');
      return;
    }

    let filePath = absolutePath;
    if (existsSync(filePath) && statSync(filePath).isDirectory()) {
      filePath = join(filePath, 'index.html');
    }

    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      response.writeHead(404).end('not found');
      return;
    }

    response.writeHead(200, { 'Content-Type': contentTypeFor(filePath) });
    createReadStream(filePath).pipe(response);
  });

  await new Promise<void>((resolveServer) => {
    staticServer?.listen(0, '127.0.0.1', () => resolveServer());
  });

  const address = staticServer.address();
  if (!address || typeof address === 'string') {
    throw new Error('failed to start static preview server');
  }

  previewOrigin = `http://127.0.0.1:${address.port}`;
}

test.beforeAll(async () => {
  await startStaticServer();
});

test.afterAll(async () => {
  if (!staticServer) return;
  await new Promise<void>((resolveServer, rejectServer) => {
    staticServer?.close((error) => {
      if (error) rejectServer(error);
      else resolveServer();
    });
  });
  staticServer = null;
  previewOrigin = '';
});

test.beforeEach(async () => {
  resetDatabase();
  await waitForServerReady();
});

test('apps/web auth cobre cadastro e recuperacao no shell rebrandado', async ({ page }) => {
  await page.goto(`${previewOrigin}/apps/web/index.html?apiBase=${encodeURIComponent(BASE_URL)}`);

  await page.getByRole('button', { name: 'Cadastro' }).click();
  await expect(page.getByTestId('pilot-register')).toBeVisible();
  await page.locator('#pilot-register-name').fill('Maria QA Brand');
  await page.locator('#pilot-register-email').fill('maria.brand@example.com');
  await page.locator('#pilot-register-cpf').fill('12345678901');
  await page.locator('#pilot-register-birth').fill('1990-05-15');
  await page.locator('#pilot-register-password').fill('QaBrand123!');
  await page.locator('#pilot-register-submit').click();

  await expect(page.getByTestId('today-page')).toBeVisible({ timeout: 15000 });

  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page.getByTestId('pilot-login')).toBeVisible();

  await page.getByRole('button', { name: 'Recuperar' }).click();
  await expect(page.getByTestId('pilot-recover')).toBeVisible();
  await page.locator('#pilot-recover-email').fill('maria.brand@example.com');
  await page.locator('#pilot-recover-cpf').fill('12345678901');
  await page.locator('#pilot-recover-birth').fill('1990-05-15');
  await page.locator('#pilot-recover-password').fill('QaBrand456!');
  await page.locator('#pilot-recover-submit').click();

  await expect(page.getByTestId('pilot-login')).toBeVisible();
  await expect(page.locator('.q-inline-note')).toContainText('Senha redefinida');

  await page.locator('#pilot-email').fill('maria.brand@example.com');
  await page.locator('#pilot-password').fill('QaBrand456!');
  await page.locator('#pilot-login-submit').click();
  await expect(page.getByTestId('today-page')).toBeVisible({ timeout: 15000 });
});

test('apps/web pilot shell autentica e renderiza Hoje, Carteira, Historico, Bens e Detalhe com o contrato vivo', async ({ page }, testInfo) => {
  const registered = await registerSeedUser();
  const authHeaders = {
    Authorization: `Bearer ${registered.token}`,
    'Content-Type': 'application/json',
  };

  const snapshotResponse = await fetch(`${BASE_URL}/api/snapshot`, {
    method: 'POST',
    headers: authHeaders,
  });
  expect(snapshotResponse.ok).toBeTruthy();

  const goodsResponse = await fetch(`${BASE_URL}/api/goods`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      type: 'IMOVEL',
      name: 'Apartamento QA Fusao',
      estimatedValue: 420000,
      propertyType: 'APARTAMENTO',
      city: 'Sao Paulo',
      state: 'SP',
    }),
  });
  expect(goodsResponse.ok).toBeTruthy();

  const portfolioResponse = await fetch(`${BASE_URL}/api/portfolio`, {
    method: 'GET',
    headers: authHeaders,
  });
  expect(portfolioResponse.ok).toBeTruthy();
  const portfolio = await portfolioResponse.json();
  const autoAsset = portfolio.assets.find((asset: { ticker?: string | null }) => asset.ticker === 'CPLE3');
  const manualAsset = portfolio.assets.find((asset: { name?: string | null }) => asset.name === 'AZ Quest Luce Icatu Prev PGBL');
  expect(autoAsset?.id).toBeTruthy();
  expect(manualAsset?.id).toBeTruthy();

  await page.goto(`${previewOrigin}/apps/web/index.html?apiBase=${encodeURIComponent(BASE_URL)}`);

  await expect(page.getByTestId('pilot-login')).toBeVisible();
  await page.locator('#pilot-email').fill('giammattey.luiz@gmail.com');
  await page.locator('#pilot-password').fill('QaTest123!');
  await page.locator('#pilot-login-submit').click();

  await expect(page.getByTestId('today-page')).toBeVisible();
  await expect(page.getByTestId('quote-health')).toBeVisible();
  await expect(page.getByTestId('freshness-card')).toBeVisible();
  await expect(page.getByTestId('allocation-section')).toBeVisible();
  await expect(page.getByTestId('history-section')).toBeVisible();

  const expectedTotal = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(expectedPortfolioTotal());

  await expect(page.getByTestId('metric-total')).toContainText(expectedTotal);
  await expect(page.getByTestId('metric-gain')).not.toContainText('—');

  const initialTheme = await page.evaluate(() => document.documentElement.dataset.theme || 'light');
  await page.getByRole('button', { name: /Tema:/ }).click();
  await expect.poll(async () => {
    return page.evaluate(() => document.documentElement.dataset.theme || 'light');
  }).not.toBe(initialTheme);
  await expect(page.getByTestId('today-page')).toBeVisible();
  await expect(page.getByTestId('quote-health')).toBeVisible();

  await page.getByRole('button', { name: 'Ocultar valores' }).click();
  await expect(page.getByTestId('metric-total')).toContainText('R$ ••••••');
  await expect(page.getByTestId('metric-gain')).toContainText('R$ ••••••');
  await expect(page.locator('.q-metric-subvalue').first()).toContainText('•••%');

  await page.locator('[data-view="carteira"]:visible').first().click();
  await expect(page.getByTestId('portfolio-page')).toBeVisible();
  await expect(page.getByTestId('portfolio-filters')).toBeVisible();
  await expect(page.getByTestId('portfolio-list-card')).toBeVisible();
  await expect(page.getByTestId('portfolio-count')).toContainText('ativo');
  await expect(page.getByTestId('portfolio-total')).toContainText('R$ ••••••');
  await expect(page.getByTestId('redeeming-section')).toBeVisible();

  await page.locator('#portfolio-search').fill('XP');
  await expect(page.getByTestId('portfolio-count')).toContainText('ativo');
  await expect(page.getByTestId('portfolio-list')).toContainText('XP');

  await page.locator('[data-group-mode="class"]').click();
  await expect(page.getByTestId('portfolio-filters')).toContainText('Acao');

  await page.locator('[data-view="historico"]:visible').first().click();
  await expect(page.getByTestId('history-page')).toBeVisible();
  await expect(page.getByTestId('history-page-list')).toContainText('Snapshot');
  await expect(page.getByTestId('history-page-list')).toContainText('R$ ••••••');

  await page.locator('[data-view="bens"]:visible').first().click();
  await expect(page.getByTestId('goods-page')).toBeVisible();
  await expect(page.getByTestId('goods-groups')).toContainText('Apartamento QA Fusao');
  await expect(page.getByTestId('goods-summary')).toContainText('Patrimonio bruto');
  await expect(page.getByTestId('goods-summary')).toContainText('R$ ••••••');

  await page.locator('[data-view="carteira"]:visible').first().click();
  await page.locator(`#portfolio-search`).fill('');
  await page.locator(`[data-open-detail="${autoAsset.id}"]:visible`).first().click();
  await expect(page.getByTestId('detail-page')).toBeVisible();
  await expect(page.getByTestId('detail-chart')).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('detail-analysis-card')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('#detail-chart-area')).not.toBeEmpty({ timeout: 15000 });
  await expect(page.locator('#detail-chart-area')).not.toContainText('Carregando', { timeout: 15000 });
  await expect(page.getByTestId('detail-page')).toContainText('R$ ••••••');
  await expect(page.getByTestId('detail-page')).toContainText('•••%');
  await expect(async () => {
    const hasFallback = await page.getByTestId('detail-analysis-fallback').count();
    const hasList = await page.getByTestId('detail-analysis-list').count();
    expect(hasFallback + hasList).toBeGreaterThan(0);
  }).toPass({ timeout: 15000 });

  await page.getByRole('button', { name: 'Registrar aporte' }).click();
  await page.locator('#detail-contribution-amount').fill('250,75');
  await page.locator('#detail-contribution-qty').fill('2');
  await page.locator('#detail-contribution-note').fill('Aporte piloto auto');
  await page.locator('[data-detail-aporte-form] button[type="submit"]').click();
  await expect(page.getByTestId('detail-page')).toContainText('Aporte registrado.', { timeout: 15000 });
  await expect(page.getByTestId('detail-page')).toContainText('Aporte piloto auto', { timeout: 15000 });

  const autoContributionDetailResponse = await fetch(`${BASE_URL}/api/assets/${autoAsset.id}/detail`, {
    method: 'GET',
    headers: { Authorization: authHeaders.Authorization },
  });
  expect(autoContributionDetailResponse.ok).toBeTruthy();
  const autoContributionDetail = await autoContributionDetailResponse.json();
  expect(autoContributionDetail.contributions).toHaveLength(1);
  expect(autoContributionDetail.contributions[0].amount).toBeCloseTo(250.75, 2);
  expect(autoContributionDetail.contributions[0].qty).toBeCloseTo(2, 2);
  expect(autoContributionDetail.contributions[0].note).toBe('Aporte piloto auto');

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Remover aporte' }).click();
  await expect(page.getByTestId('detail-page')).toContainText('Aporte removido.');

  const afterDeleteContributionResponse = await fetch(`${BASE_URL}/api/assets/${autoAsset.id}/detail`, {
    method: 'GET',
    headers: { Authorization: authHeaders.Authorization },
  });
  expect(afterDeleteContributionResponse.ok).toBeTruthy();
  const afterDeleteContributionDetail = await afterDeleteContributionResponse.json();
  expect(afterDeleteContributionDetail.contributions).toHaveLength(0);

  await page.getByRole('button', { name: 'Iniciar saida' }).click();
  await expect(page.getByTestId('detail-page')).toContainText('Saida iniciada.', { timeout: 15000 });
  await expect(page.getByTestId('detail-page')).toContainText('redeeming', { timeout: 15000 });

  const redeemingDetailResponse = await fetch(`${BASE_URL}/api/assets/${autoAsset.id}/detail`, {
    method: 'GET',
    headers: { Authorization: authHeaders.Authorization },
  });
  expect(redeemingDetailResponse.ok).toBeTruthy();
  const redeemingDetail = await redeemingDetailResponse.json();
  expect(redeemingDetail.asset.status).toBe('redeeming');

  await page.getByRole('button', { name: 'Cancelar saida' }).click();
  await expect(page.getByTestId('detail-page')).toContainText('Saida cancelada.', { timeout: 15000 });
  await expect(page.getByTestId('detail-page')).toContainText('active', { timeout: 15000 });

  const activeAgainDetailResponse = await fetch(`${BASE_URL}/api/assets/${autoAsset.id}/detail`, {
    method: 'GET',
    headers: { Authorization: authHeaders.Authorization },
  });
  expect(activeAgainDetailResponse.ok).toBeTruthy();
  const activeAgainDetail = await activeAgainDetailResponse.json();
  expect(activeAgainDetail.asset.status).toBe('active');

  await page.getByRole('button', { name: 'Iniciar saida' }).click();
  await expect(page.getByTestId('detail-page')).toContainText('Saida iniciada.', { timeout: 15000 });
  await page.getByRole('button', { name: 'Concluir venda' }).click();
  await page.locator('#detail-sale-gross').fill('520,90');
  await page.locator('#detail-sale-note').fill('Venda piloto');
  await page.locator('[data-detail-sale-form] button[type="submit"]').click();
  await expect(page.getByTestId('detail-page')).toContainText('Venda concluida.', { timeout: 15000 });
  await expect(page.getByTestId('detail-page')).toContainText('sold', { timeout: 15000 });
  await expect(page.getByTestId('detail-page')).toContainText('Venda piloto', { timeout: 15000 });

  const soldDetailResponse = await fetch(`${BASE_URL}/api/assets/${autoAsset.id}/detail`, {
    method: 'GET',
    headers: { Authorization: authHeaders.Authorization },
  });
  expect(soldDetailResponse.ok).toBeTruthy();
  const soldDetail = await soldDetailResponse.json();
  expect(soldDetail.asset.status).toBe('sold');
  expect(soldDetail.lifecycle.latestSale.grossAmount).toBeCloseTo(520.9, 2);
  expect(soldDetail.lifecycle.latestSale.note).toBe('Venda piloto');

  await page.getByRole('button', { name: /Voltar para Carteira/i }).click();
  await expect(page.getByTestId('portfolio-page')).toBeVisible();

  await page.locator('#portfolio-search').fill('AZ Quest');
  await page.locator(`[data-open-detail="${manualAsset.id}"]:visible`).first().click();
  await expect(page.getByTestId('detail-page')).toBeVisible();
  await page.getByRole('button', { name: 'Atualizar saldo' }).click();
  await page.locator('#detail-manual-balance').fill('13.210,55');
  await page.locator('[data-detail-saldo-form] button[type="submit"]').click();
  await expect(page.getByTestId('detail-page')).toContainText('Saldo manual atualizado.');

  await page.getByRole('button', { name: 'Editar ativo' }).click();
  await page.locator('#detail-edit-name').fill('AZ Quest Piloto');
  await page.locator('#detail-edit-invested').fill('10.450,10');
  await page.locator('[data-detail-edit-form] button[type="submit"]').click();
  await expect(page.getByTestId('detail-page')).toContainText('Ativo atualizado.');
  await expect(page.getByTestId('detail-page')).toContainText('AZ Quest Piloto');

  const manualDetailResponse = await fetch(`${BASE_URL}/api/assets/${manualAsset.id}/detail`, {
    method: 'GET',
    headers: { Authorization: authHeaders.Authorization },
  });
  expect(manualDetailResponse.ok).toBeTruthy();
  const manualDetail = await manualDetailResponse.json();
  expect(manualDetail.asset.manualBalance).toBeCloseTo(13210.55, 2);
  expect(manualDetail.asset.name).toBe('AZ Quest Piloto');
  expect(manualDetail.asset.invested).toBeCloseTo(10450.1, 2);

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Arquivar ativo' }).click();
  await expect(page.getByTestId('portfolio-page')).toBeVisible();
  await expect(page.getByTestId('import-success-banner')).toContainText('Ativo arquivado.');

  await page.locator('#portfolio-search').fill('AZ Quest Piloto');
  await expect(page.locator('#portfolio-list')).not.toContainText('AZ Quest Piloto');

  const archivedPortfolioResponse = await fetch(`${BASE_URL}/api/portfolio`, {
    method: 'GET',
    headers: { Authorization: authHeaders.Authorization },
  });
  expect(archivedPortfolioResponse.ok).toBeTruthy();
  const archivedPortfolio = await archivedPortfolioResponse.json();
  expect(archivedPortfolio.assets.some((asset: { id?: number }) => asset.id === manualAsset.id)).toBeFalsy();
  expect(archivedPortfolio.redeeming.some((asset: { id?: number }) => asset.id === manualAsset.id)).toBeFalsy();

  if (testInfo.project.name === 'mobile') {
    await expect(page.locator('.q-mobile-nav')).toBeVisible();
  } else {
    await expect(page.locator('.q-nav-shell')).toBeVisible();
  }
});

test('apps/web pilot cadastra ativo manual e automatico usando o contrato vivo', async ({ page }) => {
  const registered = await registerSeedUser();
  const authHeader = { Authorization: `Bearer ${registered.token}` };

  await page.goto(`${previewOrigin}/apps/web/index.html?apiBase=${encodeURIComponent(BASE_URL)}`);
  await expect(page.getByTestId('pilot-login')).toBeVisible();

  await page.locator('#pilot-email').fill('giammattey.luiz@gmail.com');
  await page.locator('#pilot-password').fill('QaTest123!');
  await page.locator('#pilot-login-submit').click();
  await expect(page.getByTestId('today-page')).toBeVisible();

  await page.locator('[data-view="carteira"]:visible').first().click();
  await expect(page.getByTestId('portfolio-page')).toBeVisible();

  await page.getByRole('button', { name: 'Novo ativo' }).click();
  await expect(page.getByTestId('create-asset-form')).toBeVisible();
  await page.locator('[data-create-field="institution"]').selectOption('OUTROS');
  await page.locator('[data-create-field="class"]').selectOption('POUPANCA');
  await page.locator('[data-create-field="institution_name"]').fill('Nubank');
  await page.locator('[data-create-field="name"]').fill('Reserva QA Nova');
  await page.locator('[data-create-field="manual_balance"]').fill('1.234,56');
  await page.locator('[data-create-field="invested"]').fill('1.200,00');
  await page.locator('[data-create-asset-form] button[type="submit"]').click();

  await expect(page.getByTestId('import-success-banner')).toContainText('Ativo criado: Reserva QA Nova.', { timeout: 15000 });
  await page.locator('#portfolio-search').fill('Reserva QA Nova');
  await expect(page.getByTestId('portfolio-list')).toContainText('Reserva QA Nova');
  await expect(page.getByTestId('portfolio-list')).toContainText('Nubank');

  let portfolioResponse = await fetch(`${BASE_URL}/api/portfolio`, {
    method: 'GET',
    headers: authHeader,
  });
  expect(portfolioResponse.ok).toBeTruthy();
  let portfolio = await portfolioResponse.json();
  const manualCreated = portfolio.assets.find((asset: { name?: string | null }) => asset.name === 'Reserva QA Nova');
  expect(manualCreated).toBeTruthy();
  expect(manualCreated.institution).toBe('OUTROS');
  expect(manualCreated.institutionName).toBe('Nubank');

  await page.locator('#portfolio-search').fill('');
  await page.getByRole('button', { name: 'Novo ativo' }).click();
  await expect(page.getByTestId('create-asset-form')).toBeVisible();
  await page.locator('[data-create-field="institution"]').selectOption('XP');
  await page.locator('[data-create-field="class"]').selectOption('FII');
  await page.locator('[data-create-field="name"]').fill('HGLG11 QA Novo');
  await page.locator('[data-create-field="ticker"]').fill('HGLG11');
  await page.locator('[data-create-field="qty"]').fill('3');
  await page.locator('[data-create-field="invested"]').fill('480,00');
  await page.locator('[data-create-field="purchase_date"]').fill('2026-06-10');
  await page.locator('[data-create-asset-form] button[type="submit"]').click();

  await expect(page.getByTestId('import-success-banner')).toContainText('Ativo criado: HGLG11 QA Novo.', { timeout: 15000 });
  await page.locator('#portfolio-search').fill('HGLG11 QA Novo');
  await expect(page.getByTestId('portfolio-list')).toContainText('HGLG11 QA Novo');

  portfolioResponse = await fetch(`${BASE_URL}/api/portfolio`, {
    method: 'GET',
    headers: authHeader,
  });
  expect(portfolioResponse.ok).toBeTruthy();
  portfolio = await portfolioResponse.json();
  const autoCreated = portfolio.assets.find((asset: { name?: string | null }) => asset.name === 'HGLG11 QA Novo');
  expect(autoCreated).toBeTruthy();
  expect(autoCreated.ticker).toBe('HGLG11');
  expect(autoCreated.qty).toBeCloseTo(3, 2);
  expect(autoCreated.invested).toBeCloseTo(480, 2);

  const autoDetailResponse = await fetch(`${BASE_URL}/api/assets/${autoCreated.id}/detail`, {
    method: 'GET',
    headers: authHeader,
  });
  expect(autoDetailResponse.ok).toBeTruthy();
  const autoDetail = await autoDetailResponse.json();
  expect(autoDetail.asset.ticker).toBe('HGLG11');
  expect(autoDetail.contributions.length).toBeGreaterThan(0);
  expect(autoDetail.contributions[0].amount).toBeCloseTo(480, 2);

  await page.locator('#portfolio-search').fill('');
  await page.getByRole('button', { name: 'Novo ativo' }).click();
  await expect(page.getByTestId('create-asset-form')).toBeVisible();
  await page.locator('[data-create-field="institution"]').selectOption('XP');
  await page.locator('[data-create-field="class"]').selectOption('FUNDO');
  await page.locator('[data-create-fund-query]').fill('Icatu');
  await page.getByRole('button', { name: 'Buscar no cache CVM' }).click();
  await expect(page.getByTestId('create-fund-results')).toContainText('Icatu Vanguarda Pos Fixado RF Prev');
  await page.locator('[data-select-create-fund]').filter({ hasText: 'Icatu Vanguarda Pos Fixado RF Prev' }).click();
  await page.locator('[data-create-field="initial_balance"]').fill('2.500,00');
  await page.locator('[data-create-field="invested"]').fill('2.200,00');

  const cvmRequestPromise = page.waitForRequest((request) => {
    return request.url() === `${BASE_URL}/api/assets` && request.method() === 'POST';
  });
  await page.locator('[data-create-asset-form] button[type="submit"]').click();
  const cvmRequest = await cvmRequestPromise;
  const cvmPayload = cvmRequest.postDataJSON();
  expect(cvmPayload.cvm_cnpj).toBe('12345678000190');
  expect(cvmPayload.initial_balance).toBe(2500);

  await expect(page.getByTestId('import-success-banner')).toContainText('Icatu Vanguarda Pos Fixado RF Prev', { timeout: 15000 });
  await page.locator('#portfolio-search').fill('Icatu Vanguarda Pos Fixado RF Prev');
  await expect(page.getByTestId('portfolio-list')).toContainText('Icatu Vanguarda Pos Fixado RF Prev');

  portfolioResponse = await fetch(`${BASE_URL}/api/portfolio`, {
    method: 'GET',
    headers: authHeader,
  });
  expect(portfolioResponse.ok).toBeTruthy();
  portfolio = await portfolioResponse.json();
  const cvmCreated = portfolio.assets.find((asset: { name?: string | null; institution?: string | null }) => {
    return asset.name === 'Icatu Vanguarda Pos Fixado RF Prev' && asset.institution === 'XP';
  });
  expect(cvmCreated).toBeTruthy();
  expect(cvmCreated.class).toBe('FUNDO');
});

test('apps/web pilot cadastra bens na trilha nova e sincroniza com o contrato vivo', async ({ page }) => {
  const registered = await registerSeedUser();
  const authHeader = { Authorization: `Bearer ${registered.token}` };

  let portfolioResponse = await fetch(`${BASE_URL}/api/portfolio`, {
    method: 'GET',
    headers: authHeader,
  });
  expect(portfolioResponse.ok).toBeTruthy();
  const initialPortfolio = await portfolioResponse.json();
  const initialGrossWealth = Number(initialPortfolio.grossWealth ?? 0);

  await page.goto(`${previewOrigin}/apps/web/index.html?apiBase=${encodeURIComponent(BASE_URL)}`);
  await expect(page.getByTestId('pilot-login')).toBeVisible();

  await page.locator('#pilot-email').fill('giammattey.luiz@gmail.com');
  await page.locator('#pilot-password').fill('QaTest123!');
  await page.locator('#pilot-login-submit').click();
  await expect(page.getByTestId('today-page')).toBeVisible();

  await page.locator('[data-view="bens"]:visible').first().click();
  await expect(page.getByTestId('goods-page')).toBeVisible();

  await page.getByRole('button', { name: 'Novo bem' }).click();
  await expect(page.getByTestId('create-good-form')).toBeVisible();
  await page.locator('[data-create-good-field="name"]').fill('FGTS QA Novo');
  await page.locator('[data-create-good-field="estimatedValue"]').fill('15.500,00');
  await page.locator('[data-create-good-field="employer"]').fill('Quanto Labs');
  await page.locator('[data-create-good-form] button[type="submit"]').click();
  await expect(page.getByRole('button', { name: 'Novo bem' })).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('goods-groups')).toContainText('FGTS QA Novo');
  await expect(page.getByTestId('goods-groups')).toContainText('Quanto Labs');

  await page.getByRole('button', { name: 'Novo bem' }).click();
  await expect(page.getByTestId('create-good-form')).toBeVisible();
  await page.locator('[data-create-good-field="type"]').selectOption('IMOVEL');
  await page.locator('[data-create-good-field="name"]').fill('Casa QA Nova');
  await page.locator('[data-create-good-field="estimatedValue"]').fill('350.000,00');
  await page.locator('[data-create-good-field="propertyType"]').selectOption('CASA');
  await page.locator('[data-create-good-field="areaM2"]').fill('132,5');
  await page.locator('[data-create-good-field="city"]').fill('Campinas');
  await page.locator('[data-create-good-field="state"]').fill('SP');
  await page.locator('[data-create-good-checkbox="isFinanced"]').check();
  await page.locator('[data-create-good-field="notes"]').fill('Primeiro imovel piloto');
  await page.locator('[data-create-good-form] button[type="submit"]').click();
  await expect(page.getByRole('button', { name: 'Novo bem' })).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('goods-groups')).toContainText('Casa QA Nova');
  await expect(page.getByTestId('goods-groups')).toContainText('132,5 m²');
  await expect(page.getByTestId('goods-groups')).toContainText('Campinas / SP');
  await expect(page.getByTestId('goods-groups')).toContainText('financiado');

  await page.getByRole('button', { name: 'Novo bem' }).click();
  await expect(page.getByTestId('create-good-form')).toBeVisible();
  await page.locator('[data-create-good-field="type"]').selectOption('VEICULO');
  await page.locator('[data-create-good-field="name"]').fill('Carro QA Novo');
  await page.locator('[data-create-good-field="estimatedValue"]').fill('88.900,00');
  await page.locator('[data-create-good-field="vehicleType"]').selectOption('CARRO');
  await page.locator('[data-create-good-field="year"]').fill('2022');
  await page.locator('[data-create-good-field="brand"]').fill('Toyota');
  await page.locator('[data-create-good-field="modelName"]').fill('Corolla');
  await page.locator('[data-create-good-form] button[type="submit"]').click();
  await expect(page.getByRole('button', { name: 'Novo bem' })).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('goods-groups')).toContainText('Carro QA Novo');
  await expect(page.getByTestId('goods-groups')).toContainText('Toyota Corolla');
  await expect(page.getByTestId('goods-groups')).toContainText('2022');

  await page.locator('.q-good-row').filter({ hasText: 'Casa QA Nova' }).locator('[data-edit-good]').click();
  await expect(page.getByTestId('create-good-form')).toBeVisible();
  await expect(page.locator('[data-create-good-field="type"]')).toBeDisabled();
  await page.locator('[data-create-good-field="name"]').fill('Casa QA Editada');
  await page.locator('[data-create-good-field="estimatedValue"]').fill('365.000,00');
  await page.locator('[data-create-good-field="areaM2"]').fill('140');
  await page.locator('[data-create-good-form] button[type="submit"]').click();
  await expect(page.getByTestId('import-success-banner')).toContainText('Bem atualizado: Casa QA Editada.', { timeout: 15000 });
  await expect(page.getByTestId('goods-groups')).toContainText('Casa QA Editada');
  await expect(page.getByTestId('goods-groups')).toContainText('140 m²');
  await expect(page.getByTestId('goods-groups')).toContainText('Campinas / SP');
  await expect(page.getByTestId('goods-groups')).toContainText('financiado');

  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('.q-good-row').filter({ hasText: 'FGTS QA Novo' }).locator('[data-archive-good]').click();
  await expect(page.getByTestId('import-success-banner')).toContainText('Bem arquivado:', { timeout: 15000 });
  await expect(page.getByTestId('goods-groups')).not.toContainText('FGTS QA Novo');

  await expect(page.getByTestId('goods-groups')).toContainText('Casa QA Editada');
  await expect(page.getByTestId('goods-groups')).toContainText('Carro QA Novo');
  await expect(page.getByTestId('goods-summary')).toContainText('Patrimonio bruto');

  const goodsResponse = await fetch(`${BASE_URL}/api/goods`, {
    method: 'GET',
    headers: authHeader,
  });
  expect(goodsResponse.ok).toBeTruthy();
  const goodsPayload = await goodsResponse.json();

  expect(goodsPayload.goods.some((good: { name?: string | null }) => {
    return good.name === 'FGTS QA Novo';
  })).toBeFalsy();
  expect(goodsPayload.goods.some((good: { name?: string | null; propertyType?: string | null; areaM2?: number | null; city?: string | null; state?: string | null; isFinanced?: boolean }) => {
    return good.name === 'Casa QA Editada' && good.propertyType === 'CASA' && good.areaM2 === 140 && good.city === 'Campinas' && good.state === 'SP' && good.isFinanced === true;
  })).toBeTruthy();
  expect(goodsPayload.goods.some((good: { name?: string | null; vehicleType?: string | null; year?: number | null; brand?: string | null; modelName?: string | null }) => {
    return good.name === 'Carro QA Novo' && good.vehicleType === 'CARRO' && good.year === 2022 && good.brand === 'Toyota' && good.modelName === 'Corolla';
  })).toBeTruthy();
  expect(goodsPayload.byType.FGTS).toBe(0);
  expect(goodsPayload.byType.IMOVEL).toBeGreaterThan(0);
  expect(goodsPayload.byType.VEICULO).toBeGreaterThan(0);

  portfolioResponse = await fetch(`${BASE_URL}/api/portfolio`, {
    method: 'GET',
    headers: authHeader,
  });
  expect(portfolioResponse.ok).toBeTruthy();
  const nextPortfolio = await portfolioResponse.json();
  expect(Number(nextPortfolio.grossWealth ?? 0)).toBeGreaterThan(initialGrossWealth);
});

test('apps/web pilot importar processa planilha, revisa itens e persiste no runtime vivo', async ({ page }) => {
  const registered = await registerSeedUser();
  const authHeader = { Authorization: `Bearer ${registered.token}` };

  await page.goto(`${previewOrigin}/apps/web/index.html?apiBase=${encodeURIComponent(BASE_URL)}`);
  await expect(page.getByTestId('pilot-login')).toBeVisible();

  await page.locator('#pilot-email').fill('giammattey.luiz@gmail.com');
  await page.locator('#pilot-password').fill('QaTest123!');
  await page.locator('#pilot-login-submit').click();
  await expect(page.getByTestId('today-page')).toBeVisible();

  await page.locator('[data-view="importar"]:visible').first().click();
  await expect(page.getByTestId('import-page')).toBeVisible();
  await expect(page.getByTestId('import-upload-step')).toBeVisible();
  await page.getByRole('button', { name: 'Selecionar arquivo' }).click();

  await page.locator('#import-file-input').setInputFiles({
    name: 'quanto-pilot-import.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: buildPilotImportWorkbook(),
  });

  await expect(page.getByTestId('import-page')).toContainText('quanto-pilot-import.xlsx');
  await page.getByRole('button', { name: 'Processar planilha' }).click();

  await expect(page.getByTestId('import-review-step')).toBeVisible();
  await expect(page.getByTestId('import-review-step')).toContainText('Alertas');
  await expect(page.getByTestId('import-review-list')).toContainText('QA Papel Piloto');
  await expect(page.getByTestId('import-review-list')).toContainText('QA Fundo Piloto');
  await expect(page.getByTestId('import-review-list')).toContainText('QA Fundo Invalido');
  await expect(page.getByTestId('import-review-list')).toContainText('Valor aplicado ausente; ganho inicial pode ficar parcial.');
  await expect(page.getByTestId('import-review-list')).toContainText('Saldo atual obrigatorio para ativo sem ticker');
  await expect(page.getByTestId('import-review-list')).toContainText('alerta');

  await page.getByRole('button', { name: 'Continuar com 3 ativos' }).click();
  await expect(page.getByTestId('import-confirm-step')).toBeVisible();
  await expect(page.getByTestId('import-confirm-step')).toContainText('Com alerta');
  await expect(page.getByTestId('import-summary')).toContainText('XP: 1');
  await expect(page.getByTestId('import-summary')).toContainText('Itau: 1');
  await expect(page.getByTestId('import-summary')).toContainText('Onze: 1');

  await page.getByRole('button', { name: 'Confirmar 3 ativos' }).click();
  await expect(page.getByTestId('portfolio-page')).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('import-success-banner')).toContainText('3 ativos importados.');

  await page.locator('#portfolio-search').fill('QA Fundo Piloto');
  await expect(page.getByTestId('portfolio-list')).toContainText('QA Fundo Piloto');

  await page.locator('#portfolio-search').fill('');
  await expect(page.getByTestId('redeeming-section')).toContainText('QA Tijolo Piloto FII');

  const portfolioResponse = await fetch(`${BASE_URL}/api/portfolio`, {
    method: 'GET',
    headers: authHeader,
  });
  expect(portfolioResponse.ok).toBeTruthy();
  const portfolio = await portfolioResponse.json();

  expect(portfolio.assets.some((asset: { name?: string | null }) => asset.name === 'QA Fundo Piloto')).toBeTruthy();
  expect(portfolio.assets.some((asset: { name?: string | null }) => asset.name === 'QA Papel Piloto')).toBeTruthy();
  expect(portfolio.redeeming.some((asset: { name?: string | null }) => asset.name === 'QA Tijolo Piloto FII')).toBeTruthy();
});

test('apps/web pilot recarrega offline com o ultimo estado valido salvo', async ({ page }) => {
  const registered = await registerSeedUser();
  const authHeaders = {
    Authorization: `Bearer ${registered.token}`,
    'Content-Type': 'application/json',
  };

  const snapshotResponse = await fetch(`${BASE_URL}/api/snapshot`, {
    method: 'POST',
    headers: authHeaders,
  });
  expect(snapshotResponse.ok).toBeTruthy();

  const goodsResponse = await fetch(`${BASE_URL}/api/goods`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      type: 'FGTS',
      name: 'FGTS Offline Piloto',
      estimatedValue: 19999.99,
      employer: 'Quanto Labs',
    }),
  });
  expect(goodsResponse.ok).toBeTruthy();

  const portfolioResponse = await fetch(`${BASE_URL}/api/portfolio`, {
    method: 'GET',
    headers: { Authorization: authHeaders.Authorization },
  });
  expect(portfolioResponse.ok).toBeTruthy();
  const portfolio = await portfolioResponse.json();
  const autoAsset = portfolio.assets.find((asset: { ticker?: string | null }) => asset.ticker === 'CPLE3');
  expect(autoAsset?.id).toBeTruthy();

  await page.goto(`${previewOrigin}/apps/web/index.html?apiBase=${encodeURIComponent(BASE_URL)}`);
  await expect(page.getByTestId('pilot-login')).toBeVisible();
  await page.locator('#pilot-email').fill('giammattey.luiz@gmail.com');
  await page.locator('#pilot-password').fill('QaTest123!');
  await page.locator('#pilot-login-submit').click();
  await expect(page.getByTestId('today-page')).toBeVisible();

  await page.locator('[data-view="bens"]:visible').first().click();
  await expect(page.getByTestId('goods-page')).toBeVisible();
  await expect(page.getByTestId('goods-groups')).toContainText('FGTS Offline Piloto');

  await page.locator('[data-view="carteira"]:visible').first().click();
  await expect(page.getByTestId('portfolio-page')).toBeVisible();
  await page.locator(`[data-open-detail="${autoAsset.id}"]:visible`).first().click();
  await expect(page.getByTestId('detail-page')).toContainText('CPLE3 · Copel', { timeout: 15000 });

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect(page.getByTestId('portfolio-page')).toBeVisible({ timeout: 15000 });
  await expect.poll(async () => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBeTruthy();

  await page.context().setOffline(true);
  await page.reload();

  await expect(page.getByTestId('runtime-notice')).toContainText('Sem conexao', { timeout: 15000 });
  await expect(page.getByTestId('runtime-notice')).toContainText('ultimo estado valido', { timeout: 15000 });
  await expect(page.getByTestId('portfolio-page')).toBeVisible();
  await expect(page.getByTestId('portfolio-list')).toContainText('CPLE3');

  await page.locator('[data-view="bens"]:visible').first().click();
  await expect(page.getByTestId('goods-page')).toBeVisible();
  await expect(page.getByTestId('goods-groups')).toContainText('FGTS Offline Piloto');

  await page.locator('[data-view="carteira"]:visible').first().click();
  await page.locator(`[data-open-detail="${autoAsset.id}"]:visible`).first().click();
  await expect(page.getByTestId('detail-page')).toContainText('CPLE3 · Copel', { timeout: 15000 });
});
