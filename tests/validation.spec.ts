import { expect, test } from '@playwright/test';
import { BASE_URL, registerSeedUser, resetDatabase, waitForServerReady } from './helpers';

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

// ── POST /api/assets validation ───────────────────────────────────────────────

test('POST /api/assets — validacao de campos rejeita entradas invalidas', async () => {
  const { token } = await registerSeedUser();

  // Sem institution
  let r = await authedFetch(token, '/api/assets', {
    method: 'POST',
    body: JSON.stringify({ class: 'ACAO', name: 'Test', ticker: 'T4', qty: 10 }),
  });
  expect(r.status).toBe(400);

  // OUTROS sem institution_name
  r = await authedFetch(token, '/api/assets', {
    method: 'POST',
    body: JSON.stringify({ institution: 'OUTROS', class: 'POUPANCA', name: 'Test', manual_balance: 100 }),
  });
  expect(r.status).toBe(400);
  const errOUTROS = await r.json();
  expect(JSON.stringify(errOUTROS)).toContain('institution_name');

  // Classe invalida
  r = await authedFetch(token, '/api/assets', {
    method: 'POST',
    body: JSON.stringify({ institution: 'XP', class: 'CRYPTO', name: 'Test', manual_balance: 100 }),
  });
  expect(r.status).toBe(400);

  // ticker sem qty
  r = await authedFetch(token, '/api/assets', {
    method: 'POST',
    body: JSON.stringify({ institution: 'XP', class: 'ACAO', name: 'Test', ticker: 'PETR4' }),
  });
  expect(r.status).toBe(400);

  // FII automatico valido
  r = await authedFetch(token, '/api/assets', {
    method: 'POST',
    body: JSON.stringify({ institution: 'XP', class: 'FII', name: 'HGLG11 QA', ticker: 'HGLG11', qty: 3, invested: 450 }),
  });
  expect(r.status).toBe(201);

  // Sem manual_balance e sem ticker
  r = await authedFetch(token, '/api/assets', {
    method: 'POST',
    body: JSON.stringify({ institution: 'XP', class: 'POUPANCA', name: 'Test' }),
  });
  expect(r.status).toBe(400);

  // cvm_cnpj e ticker sao mutuamente exclusivos
  r = await authedFetch(token, '/api/assets', {
    method: 'POST',
    body: JSON.stringify({
      institution: 'XP', class: 'FUNDO', name: 'Test',
      cvm_cnpj: '12345678000190', ticker: 'PETR4', qty: 10,
    }),
  });
  expect(r.status).toBe(400);
});

// ── PUT /api/assets/:id validation ───────────────────────────────────────────

test('PUT /api/assets/:id — campos invalidos e body vazio retornam 400', async () => {
  const { token } = await registerSeedUser();

  // Body sem campos reconhecidos → "no fields to update"
  let r = await authedFetch(token, '/api/assets/1', {
    method: 'PUT',
    body: JSON.stringify({}),
  });
  expect(r.status).toBe(400);

  // Status invalido
  r = await authedFetch(token, '/api/assets/1', {
    method: 'PUT',
    body: JSON.stringify({ status: 'inexistente' }),
  });
  expect(r.status).toBe(400);

  // Status sold bloqueado no PUT generico
  r = await authedFetch(token, '/api/assets/1', {
    method: 'PUT',
    body: JSON.stringify({ status: 'sold' }),
  });
  expect(r.status).toBe(422);

  // Institution invalida
  r = await authedFetch(token, '/api/assets/1', {
    method: 'PUT',
    body: JSON.stringify({ institution: 'BITCOIN' }),
  });
  expect(r.status).toBe(400);
});

// ── POST /api/snapshot idempotencia ──────────────────────────────────────────

test('POST /api/snapshot — segundo call no mesmo mes retorna created: false', async () => {
  const { token } = await registerSeedUser();

  const first = await authedFetch(token, '/api/snapshot', { method: 'POST' });
  expect(first.ok).toBeTruthy();
  const firstJson = await first.json();
  expect(firstJson.created).toBe(true);

  const second = await authedFetch(token, '/api/snapshot', { method: 'POST' });
  expect(second.ok).toBeTruthy();
  const secondJson = await second.json();
  expect(secondJson.created).toBe(false);
  expect(secondJson.month).toBe(firstJson.month);
});

// ── GET /api/funds/search borda ───────────────────────────────────────────────

test('GET /api/funds/search — query curta ou ausente retorna lista vazia', async () => {
  // Sem q
  let r = await fetch(`${BASE_URL}/api/funds/search`);
  expect(r.ok).toBeTruthy();
  expect((await r.json()).results).toHaveLength(0);

  // q com 2 chars (abaixo do minimo de 3)
  r = await fetch(`${BASE_URL}/api/funds/search?q=ab`);
  expect(r.ok).toBeTruthy();
  expect((await r.json()).results).toHaveLength(0);
});

// ── GET /api/portfolio bordas ─────────────────────────────────────────────────

test('GET /api/portfolio — sem autenticacao retorna 401', async () => {
  const r = await fetch(`${BASE_URL}/api/portfolio`);
  expect(r.status).toBe(401);
});

test('GET /api/portfolio — portfolio vazio retorna zeros e arrays vazios', async () => {
  const r = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'vazio@exemplo.com',
      password: 'Senha123!',
      name: 'Vazio',
      cpf: '55566677788',
      birth_date: '1995-01-01',
    }),
  });
  expect(r.ok).toBeTruthy();
  const { token } = await r.json();

  const portfolio = await authedFetch(token, '/api/portfolio');
  expect(portfolio.ok).toBeTruthy();
  const json = await portfolio.json();
  expect(json.total).toBe(0);
  expect(json.assets).toHaveLength(0);
  expect(json.redeeming).toHaveLength(0);
  expect(json.freshness.total).toBe(0);
  expect(json.freshness.ok).toBe(0);
  expect(json.byInstitution).toHaveLength(0);
  expect(json.byClass).toHaveLength(0);
});

// ── POST /api/goods validation ────────────────────────────────────────────────

test('POST /api/goods — IMOVEL e VEICULO com campos obrigatorios', async () => {
  const { token } = await registerSeedUser();

  // IMOVEL sem propertyType
  let r = await authedFetch(token, '/api/goods', {
    method: 'POST',
    body: JSON.stringify({ type: 'IMOVEL', name: 'Casa QA', estimatedValue: 500000 }),
  });
  expect(r.status).toBe(400);

  // IMOVEL com propertyType invalido
  r = await authedFetch(token, '/api/goods', {
    method: 'POST',
    body: JSON.stringify({ type: 'IMOVEL', name: 'Casa QA', estimatedValue: 500000, propertyType: 'BARRACO' }),
  });
  expect(r.status).toBe(400);

  // VEICULO sem vehicleType
  r = await authedFetch(token, '/api/goods', {
    method: 'POST',
    body: JSON.stringify({ type: 'VEICULO', name: 'Carro QA', estimatedValue: 50000 }),
  });
  expect(r.status).toBe(400);

  // IMOVEL valido
  r = await authedFetch(token, '/api/goods', {
    method: 'POST',
    body: JSON.stringify({
      type: 'IMOVEL', name: 'Apto QA', estimatedValue: 400000,
      propertyType: 'APARTAMENTO', city: 'São Paulo', state: 'SP', areaM2: 80,
    }),
  });
  expect(r.status).toBe(201);
  const imovel = await r.json();
  expect(imovel.type).toBe('IMOVEL');

  // VEICULO valido
  r = await authedFetch(token, '/api/goods', {
    method: 'POST',
    body: JSON.stringify({
      type: 'VEICULO', name: 'Honda Civic QA', estimatedValue: 80000,
      vehicleType: 'CARRO', year: 2022, brand: 'Honda', modelName: 'Civic',
    }),
  });
  expect(r.status).toBe(201);
  const veiculo = await r.json();
  expect(veiculo.type).toBe('VEICULO');

  // grossWealth inclui ambos os bens
  const portfolio = await authedFetch(token, '/api/portfolio');
  const portfolioJson = await portfolio.json();
  expect(portfolioJson.goods.byType.IMOVEL).toBeCloseTo(400000, 2);
  expect(portfolioJson.goods.byType.VEICULO).toBeCloseTo(80000, 2);
  expect(portfolioJson.grossWealth).toBeCloseTo(portfolioJson.total + portfolioJson.goods.total, 2);
});

test('POST /api/goods — tipo invalido, campos faltando e borda de valor', async () => {
  const { token } = await registerSeedUser();

  // Tipo invalido
  let r = await authedFetch(token, '/api/goods', {
    method: 'POST',
    body: JSON.stringify({ type: 'CRYPTO', name: 'Bitcoin', estimatedValue: 10000 }),
  });
  expect(r.status).toBe(400);

  // Sem name
  r = await authedFetch(token, '/api/goods', {
    method: 'POST',
    body: JSON.stringify({ type: 'FGTS', estimatedValue: 5000 }),
  });
  expect(r.status).toBe(400);

  // estimatedValue negativo
  r = await authedFetch(token, '/api/goods', {
    method: 'POST',
    body: JSON.stringify({ type: 'FGTS', name: 'FGTS QA', estimatedValue: -100 }),
  });
  expect(r.status).toBe(400);
});

test('PUT /api/goods/:id — body vazio e DELETE de id inexistente', async () => {
  const { token } = await registerSeedUser();

  const createR = await authedFetch(token, '/api/goods', {
    method: 'POST',
    body: JSON.stringify({ type: 'FGTS', name: 'FGTS QA', estimatedValue: 1000, employer: 'Empresa' }),
  });
  expect(createR.status).toBe(201);
  const good = await createR.json();

  // PUT sem campos reconhecidos
  let r = await authedFetch(token, `/api/goods/${good.id}`, {
    method: 'PUT',
    body: JSON.stringify({}),
  });
  expect(r.status).toBe(400);

  // DELETE de id inexistente
  r = await authedFetch(token, '/api/goods/99999', { method: 'DELETE' });
  expect(r.status).toBe(404);
});

// ── POST /api/assets/:id/contributions validation ─────────────────────────────

test('POST /api/assets/:id/contributions — restricoes de classe e validacao', async () => {
  const { token } = await registerSeedUser();

  // POUPANCA nao aceita aportes
  const poupancaR = await authedFetch(token, '/api/assets', {
    method: 'POST',
    body: JSON.stringify({ institution: 'ITAU', class: 'POUPANCA', name: 'Poupanca Test', manual_balance: 500 }),
  });
  const poupanca = await poupancaR.json();
  let r = await authedFetch(token, `/api/assets/${poupanca.id}/contributions`, {
    method: 'POST',
    body: JSON.stringify({ amount: 100, contributedAt: '2026-06-01T12:00:00.000Z' }),
  });
  expect(r.status).toBe(422);

  // COFRINHO nao aceita aportes
  const cofrinhoR = await authedFetch(token, '/api/assets', {
    method: 'POST',
    body: JSON.stringify({ institution: 'ITAU', class: 'COFRINHO', name: 'Cofrinho Test', manual_balance: 300 }),
  });
  const cofrinho = await cofrinhoR.json();
  r = await authedFetch(token, `/api/assets/${cofrinho.id}/contributions`, {
    method: 'POST',
    body: JSON.stringify({ amount: 50, contributedAt: '2026-06-01T12:00:00.000Z' }),
  });
  expect(r.status).toBe(422);

  // ACAO aceita aportes — validacoes
  const acaoR = await authedFetch(token, '/api/assets', {
    method: 'POST',
    body: JSON.stringify({ institution: 'XP', class: 'ACAO', name: 'PETR4 QA', ticker: 'PETR4', qty: 10, invested: 400 }),
  });
  const acao = await acaoR.json();

  // Amount <= 0
  r = await authedFetch(token, `/api/assets/${acao.id}/contributions`, {
    method: 'POST',
    body: JSON.stringify({ amount: 0, contributedAt: '2026-06-01T12:00:00.000Z' }),
  });
  expect(r.status).toBe(400);

  // Amount negativo
  r = await authedFetch(token, `/api/assets/${acao.id}/contributions`, {
    method: 'POST',
    body: JSON.stringify({ amount: -50, contributedAt: '2026-06-01T12:00:00.000Z' }),
  });
  expect(r.status).toBe(400);

  // Sem contributedAt
  r = await authedFetch(token, `/api/assets/${acao.id}/contributions`, {
    method: 'POST',
    body: JSON.stringify({ amount: 100 }),
  });
  expect(r.status).toBe(400);

  // ACAO sem qty agora é inválida
  r = await authedFetch(token, `/api/assets/${acao.id}/contributions`, {
    method: 'POST',
    body: JSON.stringify({ amount: 100, contributedAt: '2026-06-01T12:00:00.000Z' }),
  });
  expect(r.status).toBe(400);

  // Data futura (> 1 minuto)
  const future = new Date(Date.now() + 120_000).toISOString();
  r = await authedFetch(token, `/api/assets/${acao.id}/contributions`, {
    method: 'POST',
    body: JSON.stringify({ amount: 100, qty: 2, contributedAt: future }),
  });
  expect(r.status).toBe(400);

  // ACAO com qty válida
  r = await authedFetch(token, `/api/assets/${acao.id}/contributions`, {
    method: 'POST',
    body: JSON.stringify({ amount: 100, qty: 2, contributedAt: '2026-06-01T12:00:00.000Z' }),
  });
  expect(r.status).toBe(201);

  // Ativo inexistente
  r = await authedFetch(token, '/api/assets/99999/contributions', {
    method: 'POST',
    body: JSON.stringify({ amount: 100, contributedAt: '2026-06-01T12:00:00.000Z' }),
  });
  expect(r.status).toBe(404);
});

// ── GET /api/assets/:id/history bordas ───────────────────────────────────────

test('GET /api/assets/:id/history — ativo manual retorna 422, inexistente retorna 404', async () => {
  const { token } = await registerSeedUser();

  // Ativo manual (sem ticker) → history nao disponivel
  const manualR = await authedFetch(token, '/api/assets', {
    method: 'POST',
    body: JSON.stringify({ institution: 'XP', class: 'FUNDO', name: 'Fundo Manual', manual_balance: 1000 }),
  });
  const manual = await manualR.json();
  let r = await authedFetch(token, `/api/assets/${manual.id}/history?period=1mo`);
  expect(r.status).toBe(422);

  // Ativo inexistente → 404
  r = await authedFetch(token, '/api/assets/99999/history?period=1mo');
  expect(r.status).toBe(404);
});

// ── Auth validation ───────────────────────────────────────────────────────────

test('POST /api/auth/register — email duplicado retorna 409', async () => {
  await registerSeedUser();

  const r = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'giammattey.luiz@gmail.com',
      password: 'OutraSenha123!',
      name: 'Outro Luiz',
      cpf: '11122233344',
      birth_date: '1990-01-01',
    }),
  });
  expect(r.status).toBe(409);
  const json = await r.json();
  expect(json.error).toBeTruthy();
});

test('POST /api/auth/recover — CPF, data de nascimento ou email errados retornam 400', async () => {
  await registerSeedUser();

  // CPF errado
  let r = await fetch(`${BASE_URL}/api/auth/recover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'giammattey.luiz@gmail.com',
      cpf: '99999999999',
      birth_date: '1990-01-01',
      new_password: 'Nova123!',
    }),
  });
  expect(r.status).toBe(400);

  // Data de nascimento errada
  r = await fetch(`${BASE_URL}/api/auth/recover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'giammattey.luiz@gmail.com',
      cpf: '11122233344',
      birth_date: '2000-12-31',
      new_password: 'Nova123!',
    }),
  });
  expect(r.status).toBe(400);

  // Email inexistente
  r = await fetch(`${BASE_URL}/api/auth/recover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'naoexiste@exemplo.com',
      cpf: '11122233344',
      birth_date: '1990-01-01',
      new_password: 'Nova123!',
    }),
  });
  expect(r.status).toBe(400);

  // Senha nova muito curta
  r = await fetch(`${BASE_URL}/api/auth/recover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'giammattey.luiz@gmail.com',
      cpf: '11122233344',
      birth_date: '1990-01-01',
      new_password: '123',
    }),
  });
  expect(r.status).toBe(400);
});

// ── Multi-user isolation for goods ───────────────────────────────────────────

test('Isolamento multi-user de bens: usuario B nao acessa bens do usuario A', async () => {
  const userA = await registerSeedUser();
  const userBR = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'userb.bens@exemplo.com',
      password: 'Senha123!',
      name: 'UserB',
      cpf: '22233344455',
      birth_date: '1992-03-03',
    }),
  });
  const userB = await userBR.json();

  // UserA cria um bem
  const goodR = await authedFetch(userA.token, '/api/goods', {
    method: 'POST',
    body: JSON.stringify({ type: 'FGTS', name: 'FGTS UserA', estimatedValue: 5000, employer: 'Empresa A' }),
  });
  expect(goodR.status).toBe(201);
  const good = await goodR.json();

  // UserB nao ve bem do UserA
  const listB = await authedFetch(userB.token, '/api/goods');
  const listBJson = await listB.json();
  expect(listBJson.goods).toHaveLength(0);
  expect(listBJson.total).toBe(0);

  // UserB nao consegue atualizar bem do UserA
  const updateR = await authedFetch(userB.token, `/api/goods/${good.id}`, {
    method: 'PUT',
    body: JSON.stringify({ estimatedValue: 0 }),
  });
  expect(updateR.status).toBe(404);

  // UserB nao consegue deletar bem do UserA
  const deleteR = await authedFetch(userB.token, `/api/goods/${good.id}`, { method: 'DELETE' });
  expect(deleteR.status).toBe(404);
});

// ── Investido nao sobrescrito quando contributions existem ────────────────────

test('PUT /api/assets/:id — invested ignorado quando contributions ja existem', async () => {
  const { token } = await registerSeedUser();

  const assetR = await authedFetch(token, '/api/assets', {
    method: 'POST',
    body: JSON.stringify({
      institution: 'XP', class: 'ACAO', name: 'VALE3 QA', ticker: 'VALE3', qty: 5, invested: 250,
    }),
  });
  const asset = await assetR.json();

  // Adiciona aporte — invested vira 250 + 150 = 400
  await authedFetch(token, `/api/assets/${asset.id}/contributions`, {
    method: 'POST',
    body: JSON.stringify({ amount: 150, qty: 3, contributedAt: '2026-06-01T12:00:00.000Z' }),
  });

  const detail1 = await authedFetch(token, `/api/assets/${asset.id}/detail`);
  expect((await detail1.json()).asset.invested).toBe(400);

  // PUT tenta sobrescrever invested com 999 — deve ser ignorado
  await authedFetch(token, `/api/assets/${asset.id}`, {
    method: 'PUT',
    body: JSON.stringify({ invested: 999 }),
  });

  const detail2 = await authedFetch(token, `/api/assets/${asset.id}/detail`);
  expect((await detail2.json()).asset.invested).toBe(400);
});

test('POST /api/import — purchase_date futura e rejeitada', async () => {
  const { token } = await registerSeedUser();

  const importRes = await authedFetch(token, '/api/import', {
    method: 'POST',
    body: JSON.stringify({
      items: [
        {
          institution: 'XP',
          class: 'ACAO',
          name: 'PETR4 Futuro QA',
          ticker: 'PETR4',
          qty: 1,
          purchase_date: '2999-01-01T12:00:00.000Z',
        },
      ],
    }),
  });

  expect(importRes.status).toBe(400);
  const err = await importRes.json();
  expect(JSON.stringify(err)).toContain('invalid purchase_date');
});
