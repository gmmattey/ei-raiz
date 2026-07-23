import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { BASE_URL, registerSeedUser, resetDatabase, waitForServerReady } from './helpers';

const ROOT = process.cwd();
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
} as const;

let staticServer: Server | null = null;
let previewOrigin = '';

function contentTypeFor(pathname: string) {
  return MIME_TYPES[extname(pathname).toLowerCase() as keyof typeof MIME_TYPES] || 'application/octet-stream';
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

function normalizeCurrency(text: string) {
  return text.replace(/\s+/g, ' ').replace(/[^\d,R$\-.,]/g, '').trim();
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

test('smoke de cutover compara public e apps/web contra o mesmo runtime vivo', async ({ browser }) => {
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
      name: 'FGTS Smoke Cutover',
      estimatedValue: 20000,
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

  const legacyContext = await browser.newContext();
  const pilotContext = await browser.newContext();

  await legacyContext.addInitScript((token) => {
    localStorage.setItem('quanto-token', token);
  }, registered.token);

  await pilotContext.addInitScript((token) => {
    localStorage.setItem('quanto-token', token);
  }, registered.token);

  const legacyPage = await legacyContext.newPage();
  const pilotPage = await pilotContext.newPage();

  try {
    await legacyPage.goto(BASE_URL);
    await pilotPage.goto(`${previewOrigin}/apps/web/index.html?apiBase=${encodeURIComponent(BASE_URL)}`);

    await expect(legacyPage.locator('#app')).toBeVisible();
    await expect(pilotPage.getByTestId('today-page')).toBeVisible();

    await expect(legacyPage.locator('#kpi-num')).not.toContainText('—', { timeout: 15000 });
    await expect(pilotPage.getByTestId('metric-total')).not.toContainText('Carregando', { timeout: 15000 });

    const legacyTotal = normalizeCurrency(await legacyPage.locator('#kpi-num').innerText());
    const pilotTotal = normalizeCurrency(await pilotPage.getByTestId('metric-total').innerText());
    expect(legacyTotal).toBe(pilotTotal);

    await expect(pilotPage.getByTestId('today-page')).toContainText('Patrimonio bruto');

    await legacyPage.locator('#tab-historico').click();
    await pilotPage.locator('[data-view="historico"]:visible').first().click();
    await expect(legacyPage.locator('#tela-historico')).toBeVisible();
    await expect(legacyPage.locator('#hist-list')).not.toBeEmpty({ timeout: 15000 });
    await expect(pilotPage.getByTestId('history-page')).toBeVisible();
    await expect(pilotPage.getByTestId('history-page-list')).toContainText('Snapshot', { timeout: 15000 });

    await legacyPage.locator('#tab-carteira').click();
    await pilotPage.locator('[data-view="carteira"]:visible').first().click();
    await expect(legacyPage.locator('#tela-carteira')).toBeVisible();
    await expect(pilotPage.getByTestId('portfolio-page')).toBeVisible();
    await expect(legacyPage.locator('#cart-list')).toContainText('CPLE3');
    await expect(pilotPage.getByTestId('portfolio-list')).toContainText('CPLE3');
    await expect(legacyPage.locator('[data-asset-status="redeeming"]').first()).toBeVisible();
    await expect(pilotPage.getByTestId('redeeming-section')).toBeVisible();

    await legacyPage.locator(`[data-asset-id="${autoAsset.id}"]`).first().click();
    await pilotPage.locator(`[data-open-detail="${autoAsset.id}"]:visible`).first().click();
    await expect(legacyPage.locator('#screen-detail')).toBeVisible();
    await expect(pilotPage.getByTestId('detail-page')).toBeVisible();
    await expect(legacyPage.locator('#detail-body')).toContainText('CPLE3 · Copel', { timeout: 15000 });
    await expect(pilotPage.getByTestId('detail-page')).toContainText('CPLE3 · Copel', { timeout: 15000 });
  } finally {
    await legacyContext.close();
    await pilotContext.close();
  }
});

test('assets de public e apps/web coexistem sem colidir na PWA atual', async () => {
  const legacyManifest = await fetch(`${BASE_URL}/manifest.json`);
  expect(legacyManifest.ok).toBeTruthy();
  const legacyManifestJson = await legacyManifest.json();
  expect(legacyManifestJson.name).toContain('Quanto');

  const legacySw = await fetch(`${BASE_URL}/sw.js`);
  expect(legacySw.ok).toBeTruthy();
  const legacySwText = await legacySw.text();
  expect(legacySwText).toContain("'/app.js'");
  expect(legacySwText).toContain("'/manifest.json'");

  const pilotShell = await fetch(`${previewOrigin}/apps/web/index.html`);
  expect(pilotShell.ok).toBeTruthy();

  const pilotSw = await fetch(`${previewOrigin}/apps/web/sw.js`);
  expect(pilotSw.ok).toBeTruthy();
  const pilotSwText = await pilotSw.text();
  expect(pilotSwText).toContain('runtime-ui/styles.css');
  expect(pilotSwText).toContain('runtime-ui/components.js');
  expect(pilotSwText).toContain('SHELL_INDEX');
});
