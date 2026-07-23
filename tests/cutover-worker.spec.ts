import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { BASE_URL, registerSeedUser, resetDatabase, waitForServerReady } from './helpers';

const ROOT = process.cwd();
const NODE = process.execPath;
const WRANGLER_BIN = join(ROOT, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const PORT = 8791;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const SCRATCH_DIR = join(ROOT, '.wrangler', 'cutover-worker-spec');

let worker: ReturnType<typeof spawn> | null = null;
let stderr = '';

function killTree(pid?: number) {
  if (!pid) return;
  try {
    if (process.platform === 'win32') {
      execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      process.kill(pid, 'SIGTERM');
    }
  } catch {
    // ignore
  }
}

async function waitFor(url: string, timeoutMs = 60000) {
  const started = Date.now();
  for (;;) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // keep waiting
    }
    if (Date.now() - started > timeoutMs) {
      throw new Error(`Timed out waiting for ${url}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

test.beforeAll(async () => {
  execFileSync(NODE, [join(ROOT, 'scripts', 'sync-web-runtime-assets.mjs')], { cwd: ROOT, stdio: 'pipe' });
  mkdirSync(SCRATCH_DIR, { recursive: true });

  worker = spawn(
    NODE,
    [
      WRANGLER_BIN,
      'dev',
      '--local',
      '--port',
      String(PORT),
      '--persist-to',
      SCRATCH_DIR,
      '--assets',
      'apps/web',
      '--show-interactive-dev-session=false',
      '--log-level',
      'error',
    ],
    {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    },
  );

  worker.stdout.setEncoding('utf8');
  worker.stderr.setEncoding('utf8');
  worker.stderr.on('data', (chunk) => {
    stderr += chunk;
  });

  await waitFor(`${ORIGIN}/api/health`);
});

test.afterAll(async () => {
  killTree(worker?.pid);
  worker = null;
  stderr = '';
  if (existsSync(SCRATCH_DIR)) {
    try {
      rmSync(SCRATCH_DIR, { recursive: true, force: true });
    } catch {
      // Windows may keep transient handles after taskkill; cleanup is best-effort.
    }
  }
});

test.beforeEach(async () => {
  resetDatabase();
  await waitForServerReady();
});

test('worker local com assets apps/web entrega shell, manifest e recarga offline', async ({ page }) => {
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
      name: 'FGTS Cutover Worker',
      estimatedValue: 15750.25,
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

  const manifestResponse = await fetch(`${ORIGIN}/manifest.json`);
  expect(manifestResponse.ok, stderr).toBeTruthy();
  const manifest = await manifestResponse.json();
  expect(manifest.name).toBe('Quanto');
  expect(manifest.start_url).toBe('./');
  expect(manifest.icons).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ src: './icons/quanto-icon-192.png' }),
      expect.objectContaining({ src: './icons/quanto-icon-512.png' }),
    ]),
  );

  const swResponse = await fetch(`${ORIGIN}/sw.js`);
  expect(swResponse.ok, stderr).toBeTruthy();
  const swText = await swResponse.text();
  expect(swText).toContain("shellAsset('/manifest.json')");
  expect(swText).toContain("shellAsset('/icons/quanto-icon-192.png')");

  await page.goto(`${ORIGIN}/?apiBase=${encodeURIComponent(BASE_URL)}`);
  await expect(page.getByTestId('pilot-login')).toBeVisible();

  await page.locator('#pilot-email').fill('giammattey.luiz@gmail.com');
  await page.locator('#pilot-password').fill('QaTest123!');
  await page.locator('#pilot-login-submit').click();

  await expect(page.getByTestId('today-page')).toBeVisible();
  await page.locator('[data-view="bens"]:visible').first().click();
  await expect(page.getByTestId('goods-page')).toBeVisible();
  await expect(page.getByTestId('goods-groups')).toContainText('FGTS Cutover Worker');

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
  await expect(page.getByTestId('portfolio-list')).toContainText('CPLE3', { timeout: 15000 });

  await page.locator('[data-view="bens"]:visible').first().click();
  await expect(page.getByTestId('goods-page')).toBeVisible();
  await expect(page.getByTestId('goods-groups')).toContainText('FGTS Cutover Worker');

  await page.locator('[data-view="carteira"]:visible').first().click();
  await page.locator(`[data-open-detail="${autoAsset.id}"]:visible`).first().click();
  await expect(page.getByTestId('detail-page')).toContainText('CPLE3 · Copel', { timeout: 15000 });
});
