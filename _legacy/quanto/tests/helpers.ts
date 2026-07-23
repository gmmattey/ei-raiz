import { execFileSync, spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, unlinkSync, rmSync } from 'node:fs';
import { join } from 'node:path';

export const BASE_URL = 'http://127.0.0.1:8787';
export const TEST_JWT_SECRET = 'quanto-test-jwt-secret-local-only';
export const TEST_USER = {
  email: 'giammattey.luiz@gmail.com',
  password: 'QaTest123!',
  name: 'Luiz',
  cpf: '11122233344',
  birth_date: '1990-01-01',
};

const ROOT = process.cwd();
const RUNTIME_FILE = join(ROOT, 'tests', '.runtime.json');
const DEV_VARS_FILE = join(ROOT, '.dev.vars');
const DEV_VARS_BACKUP_FILE = join(ROOT, 'tests', '.dev.vars.backup');
const WRANGLER_BIN = join(ROOT, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const NODE = process.execPath;
const WRANGLER_LOCAL_STATE_DIRS = [
  join(ROOT, '.wrangler', 'state', 'v3', 'd1'),
  join(ROOT, '.wrangler', 'test-state', 'v3', 'd1'),
];

function run(command: string, args: string[]) {
  execFileSync(command, args, { stdio: 'pipe', encoding: 'utf8' });
}

function runAllowingDuplicateColumn(command: string, args: string[], columnName: string) {
  try {
    run(command, args);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes(`duplicate column name: ${columnName}`)) throw err;
  }
}

export function resetDatabase() {
  run(NODE, [
    WRANGLER_BIN,
    'd1',
    'execute',
    'quanto-db',
    '--local',
    '--command',
    [
      'PRAGMA foreign_keys=OFF;',
      'DROP TABLE IF EXISTS asset_contributions;',
      'DROP TABLE IF EXISTS asset_contributions_old;',
      'DROP TABLE IF EXISTS asset_lifecycle_events;',
      'DROP TABLE IF EXISTS operation_logs;',
      'DROP TABLE IF EXISTS goods;',
      'DROP TABLE IF EXISTS macro_cache;',
      'DROP TABLE IF EXISTS assets_old;',
      'PRAGMA foreign_keys=ON;',
    ].join(' '),
  ]);

  const files = [
    'schema.sql',
    join('migrations', '004_asset_contributions.sql'),
    join('migrations', '010_asset_contributions_qty.sql'),
    join('migrations', '005_goods.sql'),
    join('migrations', '006_macro_cache.sql'),
  ];

  for (const file of files) {
    if (file.endsWith(join('migrations', '010_asset_contributions_qty.sql'))) {
      runAllowingDuplicateColumn(NODE, [WRANGLER_BIN, 'd1', 'execute', 'quanto-db', '--local', '--file', file], 'qty');
    } else {
      run(NODE, [WRANGLER_BIN, 'd1', 'execute', 'quanto-db', '--local', '--file', file]);
    }
  }

  run(NODE, [
    WRANGLER_BIN,
    'd1',
    'execute',
    'quanto-db',
    '--local',
    '--command',
    [
      'DELETE FROM asset_contributions;',
      'DELETE FROM asset_lifecycle_events;',
      'DELETE FROM goods;',
      'DELETE FROM snapshots;',
      'DELETE FROM assets;',
      'DELETE FROM quotes_cache;',
      'DELETE FROM cvm_funds_cache;',
      'DELETE FROM users;',
      "DELETE FROM sqlite_sequence WHERE name IN ('users','assets','snapshots','asset_contributions','asset_lifecycle_events','goods');",
    ].join(' '),
  ]);

  run(NODE, [WRANGLER_BIN, 'd1', 'execute', 'quanto-db', '--local', '--file', 'seed.sql']);
  run(NODE, [WRANGLER_BIN, 'd1', 'execute', 'quanto-db', '--local', '--file', join('tests', 'fixtures', 'test-fixtures.sql')]);
}

export async function registerSeedUser() {
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_USER),
  });

  // If the user was already registered (stale miniflare D1 cache between resetDatabase() and
  // the API call), fall back to login — the credentials are the same.
  if (res.status === 409) {
    const login = await loginSeedUser();
    return { ...login, expiresAt: '', user: { id: 0, email: TEST_USER.email, name: TEST_USER.name } };
  }

  if (!res.ok) {
    throw new Error(`register failed: ${res.status} ${await res.text()}`);
  }

  return res.json() as Promise<{ token: string; expiresAt: string; user: { id: number; email: string; name: string | null } }>;
}

export async function loginSeedUser() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_USER.email, password: TEST_USER.password }),
  });

  if (!res.ok) {
    throw new Error(`login failed: ${res.status} ${await res.text()}`);
  }

  return res.json() as Promise<{ token: string }>;
}

export async function triggerCron(cron: string) {
  const url = new URL('/cdn-cgi/handler/scheduled', BASE_URL);
  url.searchParams.set('format', 'json');
  url.searchParams.set('cron', cron);
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`scheduled failed: ${res.status} ${await res.text()}`);
  }
  return res.text();
}

export async function sql(command: string) {
  return execFileSync(NODE, [WRANGLER_BIN, 'd1', 'execute', 'quanto-db', '--local', '--command', command], {
    stdio: 'pipe',
    encoding: 'utf8',
  });
}

async function waitForUrl(url: string, timeoutMs = 60000) {
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

function startProcess(command: string, args: string[], onStdout?: (chunk: string) => void) {
  const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');

  if (onStdout) {
    child.stdout.on('data', onStdout);
  }

  return child;
}

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

export async function globalSetup() {
  run(NODE, [join(ROOT, 'scripts', 'sync-web-runtime-assets.mjs')]);

  for (const dir of WRANGLER_LOCAL_STATE_DIRS) {
    rmSync(dir, { recursive: true, force: true });
  }

  resetDatabase();

  let mockPort = 0;
  const mockReady = new Promise<void>((resolve, reject) => {
    let resolved = false;
    let child: ReturnType<typeof spawn> | null = null;
    child = startProcess(NODE, [join(ROOT, 'tests', 'mock-brapi.js')], (chunk) => {
      const match = chunk.match(/READY:(\d+)/);
      if (match && !resolved) {
        resolved = true;
        mockPort = Number(match[1]);
        resolve();
      }
    });

    const timer = setTimeout(() => {
      if (!resolved) reject(new Error('mock server did not start'));
    }, 15000);

    child.on('exit', (code) => {
      clearTimeout(timer);
      if (!resolved) reject(new Error(`mock server exited early with code ${code}`));
    });

    writeRuntime({ mockPid: child.pid ?? 0 });
  });

  await mockReady;

  const mockBaseUrl = `http://127.0.0.1:${mockPort}`;
  const existingDevVars = existsSync(DEV_VARS_FILE) ? readFileSync(DEV_VARS_FILE, 'utf8') : '';
  writeFileSync(DEV_VARS_BACKUP_FILE, existingDevVars, 'utf8');
  const preservedLines = existingDevVars
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .filter((line) => !line.startsWith('BRAPI_BASE_URL=') && !line.startsWith('JWT_SECRET=') && !line.startsWith('BRAPI_TOKEN='));
  writeFileSync(
    DEV_VARS_FILE,
    [
      `BRAPI_BASE_URL=${mockBaseUrl}/api`,
      'BRAPI_TOKEN=mock-token',
      `JWT_SECRET=${TEST_JWT_SECRET}`,
      ...preservedLines,
      '',
    ].join('\n'),
    'utf8',
  );
  const wranglerArgs = [
    'dev',
    '--local',
    '--port',
    '8787',
    '--test-scheduled',
  ];

  const devChild = startProcess(NODE, [WRANGLER_BIN, ...wranglerArgs]);
  await waitForUrl(`${BASE_URL}/api/health`, 60000);

  writeRuntime({
    mockPid: readRuntime().mockPid,
    devPid: devChild.pid ?? 0,
    mockBaseUrl,
  });
}

export async function globalTeardown() {
  const runtime = existsSync(RUNTIME_FILE) ? readRuntime() : null;
  if (runtime) {
    killTree(runtime.devPid);
    killTree(runtime.mockPid);
    try {
      unlinkSync(RUNTIME_FILE);
    } catch {
      // ignore
    }
  }
  try {
    if (existsSync(DEV_VARS_BACKUP_FILE)) {
      writeFileSync(DEV_VARS_FILE, readFileSync(DEV_VARS_BACKUP_FILE, 'utf8'), 'utf8');
      unlinkSync(DEV_VARS_BACKUP_FILE);
    } else {
      unlinkSync(DEV_VARS_FILE);
    }
  } catch {
    // ignore
  }
}

function readRuntime() {
  return JSON.parse(readFileSync(RUNTIME_FILE, 'utf8')) as { mockPid: number; devPid: number; mockBaseUrl: string };
}

function writeRuntime(payload: Partial<{ mockPid: number; devPid: number; mockBaseUrl: string }>) {
  const existing = existsSync(RUNTIME_FILE) ? readRuntime() : { mockPid: 0, devPid: 0, mockBaseUrl: '' };
  writeFileSync(RUNTIME_FILE, JSON.stringify({ ...existing, ...payload }, null, 2), 'utf8');
}

export async function waitForServerReady() {
  await waitForUrl(`${BASE_URL}/api/health`, 60000);
}

export async function withCleanDatabase<T>(fn: () => Promise<T>) {
  resetDatabase();
  await waitForServerReady();
  return fn();
}

export async function authenticatedHeaders() {
  const registered = await registerSeedUser();
  return { Authorization: `Bearer ${registered.token}` };
}

export function expectedPortfolioTotal() {
  return 157530.61 + (28 * 14.61) + (27 * 12.88) + (41 * 7.95) + (200 * 2.93);
}

export function expectedInvestedTotal() {
  return 100818.72;
}
