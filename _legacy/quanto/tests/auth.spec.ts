import { expect, test } from '@playwright/test';
import { BASE_URL, resetDatabase, waitForServerReady } from './helpers';

test.beforeEach(async () => {
  resetDatabase();
  await waitForServerReady();
});

function uniqueAuthUser(seed: string) {
  const slug = seed.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return {
    email: `quanto-auth-${slug}@example.com`,
    password: 'QaTest123!',
    newPassword: 'NovaSenha123!',
    name: 'Luiz QA',
    cpf: '11122233344',
    birth_date: '1990-01-01',
  };
}

test('API de autenticacao registra, loga e recupera senha', async ({}, testInfo) => {
  const user = uniqueAuthUser(`${testInfo.project.name}-${Date.now()}-api`);

  const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: user.email,
      password: user.password,
      name: user.name,
      cpf: user.cpf,
      birth_date: user.birth_date,
    }),
  });
  expect(registerRes.ok).toBeTruthy();
  const registered = await registerRes.json();
  expect(registered.token).toBeTruthy();

  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.password }),
  });
  expect(loginRes.ok).toBeTruthy();
  const loginJson = await loginRes.json();
  expect(loginJson.token).toBeTruthy();

  const recoverRes = await fetch(`${BASE_URL}/api/auth/recover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: user.email,
      cpf: user.cpf,
      birth_date: user.birth_date,
      new_password: user.newPassword,
    }),
  });
  expect(recoverRes.ok).toBeTruthy();

  const oldLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.password }),
  });
  expect(oldLoginRes.status).toBe(401);

  const newLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.newPassword }),
  });
  expect(newLoginRes.ok).toBeTruthy();
});

test('Fluxo de autenticação na interface registra, sai e recupera', async ({ page }, testInfo) => {
  const user = uniqueAuthUser(`${testInfo.project.name}-${Date.now()}-ui`);

  await page.goto('/');

  await expect(page.locator('#login-screen')).toBeVisible();
  await page.locator('#show-register').click();
  await expect(page.locator('#register-form')).toBeVisible();

  await page.locator('#reg-name').fill(user.name);
  await page.locator('#reg-email').fill(user.email);
  await page.locator('#reg-cpf').fill(user.cpf);
  await page.locator('#reg-birth').fill(user.birth_date);
  await page.locator('#reg-password').fill(user.password);
  await page.locator('#register-btn').click();

  await expect(page.locator('#app')).toBeVisible();
  await expect(page.locator('#tela-hoje')).toBeVisible();

  await page.locator('#logout-btn').click();
  await expect(page.locator('#login-screen')).toBeVisible();

  await page.locator('#show-login').click();
  await page.locator('#show-recover').click();
  await expect(page.locator('#recover-form')).toBeVisible();
  await page.locator('#rec-email').fill(user.email);
  await page.locator('#rec-cpf').fill(user.cpf);
  await page.locator('#rec-birth').fill(user.birth_date);
  await page.locator('#rec-password').fill(user.newPassword);
  await page.locator('#recover-btn').click();

  await expect(page.locator('#login-error')).toContainText('Senha redefinida');
  await page.locator('#login-password').fill(user.newPassword);
  await page.locator('#login-btn').click();

  await expect(page.locator('#app')).toBeVisible();
  await expect(page.locator('#greeting-name')).toContainText('Luiz');
});
