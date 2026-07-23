import { expect, test } from '@playwright/test';
import * as XLSX from 'xlsx';
import { registerSeedUser, resetDatabase, waitForServerReady } from './helpers';

async function primeSession(page: import('@playwright/test').Page, token: string) {
  await page.addInitScript((value) => {
    if (!sessionStorage.getItem('__quanto_test_primed')) {
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem('__quanto_test_primed', '1');
    }
    localStorage.setItem('quanto-token', value);
  }, token);
}

function createImportWorkbook(outputPath: string) {
  const wb = XLSX.utils.book_new();

  const acoes = XLSX.utils.aoa_to_sheet([
    ['Nome', 'Instituicao', 'Ticker', 'Quantidade', 'Saldo Atual', 'Valor Aplicado', 'Situacao', 'Data Compra'],
    ['CPLE3 · Copel QA', 'XP', 'CPLE3', 10, null, 100, 'Ativo', '10/06/2026'],
    ['HGLG11 · CSHG Logística QA', 'XP', 'HGLG11', 2, null, 280, 'Em resgate', '11/06/2026'],
  ]);
  const fundos = XLSX.utils.aoa_to_sheet([
    ['Nome', 'Instituicao', 'Ticker', 'Quantidade', 'Saldo Atual', 'Valor Aplicado', 'Situacao', 'Data Compra'],
    ['Fundo Browser QA', 'ITAU', null, null, 500, 400],
  ]);
  const prev = XLSX.utils.aoa_to_sheet([
    ['Nome', 'Instituicao', 'Ticker', 'Quantidade', 'Saldo Atual', 'Valor Aplicado', 'Situacao', 'Data Compra'],
    ['Previdencia Browser QA', 'ONZE', null, null, 700, 700],
  ]);

  XLSX.utils.book_append_sheet(wb, acoes, 'Acoes-FIIs');
  XLSX.utils.book_append_sheet(wb, fundos, 'Fundos');
  XLSX.utils.book_append_sheet(wb, prev, 'Previdencia');
  XLSX.writeFile(wb, outputPath);
}

test.beforeEach(async () => {
  resetDatabase();
  await waitForServerReady();
});

test('Shell principal responde, mascara valores e persiste preferencias', async ({ page }) => {
  const { token } = await registerSeedUser();
  await primeSession(page, token);
  await page.goto('/');

  await expect(page.locator('#app')).toBeVisible();
  await expect(page.locator('#tela-hoje')).toBeVisible();
  await expect(page.locator('#kpi-inteiro')).not.toHaveText('—');
  await expect(page.locator('#benchmarks-bar')).toBeVisible();

  await page.locator('#eye-btn').click();
  await expect(page.locator('body')).toHaveClass(/masked/);
  await expect(page.locator('#eye-icon-closed')).toBeVisible();

  await page.locator('#dark-btn').click();
  await expect(page.locator('html')).toHaveClass(/dark/);

  await page.locator('#tab-carteira').click();
  await expect(page.locator('#tela-carteira')).toBeVisible();
  await page.locator('#ct-inst').click();
  await page.locator('[data-filter="ONZE"]').click();
  await page.locator('#tab-hoje').click();
  await page.locator('#dt-class').click();

  const beforeReload = await page.evaluate(() => ({
    hide: localStorage.getItem('quanto-hide'),
    groupMode: localStorage.getItem('quanto-group-mode'),
    filter: localStorage.getItem('quanto-filter'),
    donutMode: localStorage.getItem('quanto-donut-mode'),
  }));
  expect(beforeReload).toEqual({
    hide: '1',
    groupMode: 'institution',
    filter: 'ONZE',
    donutMode: 'class',
  });

  await page.reload();
  await page.locator('#tab-carteira').click();
  await expect(page.locator('#tela-carteira')).toBeVisible();
  await expect(page.locator('#ct-inst')).toHaveClass(/sel/);
  await expect(page.locator('[data-filter="ONZE"]')).toHaveClass(/sel/);
  await page.locator('#tab-hoje').click();
  await expect(page.locator('#dt-class')).toHaveClass(/sel/);
});

test('Importa XLSX, abre detalhe, edita ativo e cadastra bem', async ({ page }, testInfo) => {
  const { token } = await registerSeedUser();
  await primeSession(page, token);
  await page.goto('/');

  const xlsxPath = testInfo.outputPath('quanto-import.xlsx');
  createImportWorkbook(xlsxPath);

  await page.locator('#tab-importar').click();
  await expect(page.locator('#tela-importar')).toBeVisible();
  await page.locator('#file-input').setInputFiles(xlsxPath);
  await page.locator('#process-btn').click();

  await expect(page.locator('#imp-step2')).toBeVisible();
  await expect(page.locator('#imp-file-info')).toContainText('4 ativos encontrados');
  await expect(page.locator('#imp-review-list')).toContainText('Em resgate');
  await page.locator('#imp-continue-btn').click();
  await expect(page.locator('#imp-step3')).toBeVisible();
  await expect(page.locator('#imp-breakdown')).toContainText('Em resgate: 1');
  await page.locator('#imp-confirm-btn').click();

  await expect(page.locator('#tab-carteira')).toHaveClass(/active/, { timeout: 15000 });
  await expect(page.locator('#tela-carteira')).toBeVisible();
  await expect(page.locator('#cart-count')).toContainText('18 ativos');
  await expect(page.locator('[data-asset-status="redeeming"]').first()).toContainText('Resgate');

  await page.locator('[data-asset-id]').filter({ hasText: 'Copel QA' }).first().click();
  await expect(page.locator('#screen-detail')).toBeVisible();
  await expect(page.locator('#detail-body')).toContainText('CPLE3 · Copel QA');
  await expect(page.locator('#detail-body')).toContainText('Valor aplicado');
  await expect(page.locator('#detail-body')).toContainText('Preço médio');
  await expect(page.locator('#detail-body')).toContainText('Compra registrada');
  await expect(page.locator('#detail-body')).toContainText('Referência da cotação');
  await expect(page.locator('#detail-body')).toContainText('10 ações');
  await expect(page.locator('#detail-body')).toContainText('por ação');
  await page.locator('#detail-aporte-btn').click();
  await expect(page.locator('#sheet-aporte')).toHaveClass(/open/);
  await expect(page.locator('#sh-aporte-qty-row')).toBeVisible();
  await page.locator('#sh-aporte-amount').fill('25,00');
  await page.locator('#sh-aporte-date').fill('2026-06-12');
  await page.locator('#sh-aporte-qty').fill('2');
  await page.locator('#sh-aporte-note').fill('segunda compra browser');
  await page.locator('#sh-aporte-save').click();
  await expect(page.locator('#detail-body')).toContainText('segunda compra browser');
  await expect(page.locator('#detail-body')).toContainText('2 ações');
  await page.locator('#detail-edit-btn').click();
  await expect(page.locator('#sheet-edit')).toHaveClass(/open/);
  await page.locator('#sh-edit-name').fill('CPLE3 · Copel QA Renomeado');
  await page.locator('#sh-edit-save').click();
  await page.locator('#detail-back-btn').click();
  await expect(page.locator('#cart-list')).toContainText('Copel QA Renomeado');

  await page.locator('#tab-carteira').click();
  await page.locator('#fab-add').click();
  await expect(page.locator('#sheet-add')).toHaveClass(/open/);
  await page.locator('#sh-add-auto-name').fill('VALE3 · Vale QA');
  await page.locator('#sh-add-ticker').fill('VALE3');
  await page.locator('#sh-add-qty').fill('8');
  await page.locator('#sh-add-auto-invested').fill('500');
  await expect(page.locator('#sh-add-purchase-date')).toBeVisible();
  await page.locator('#sh-add-purchase-date').fill('2026-06-09');
  await page.locator('#sh-add-save').click();
  await expect(page.locator('#cart-list')).toContainText('VALE3 · Vale QA');
  await page.locator('[data-asset-id]').filter({ hasText: 'VALE3 · Vale QA' }).first().click();
  await expect(page.locator('#detail-body')).toContainText('8 ações');
  await expect(page.locator('#detail-body')).toContainText('Compra registrada');
  await expect(page.locator('#detail-exit-start-btn')).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#detail-exit-start-btn').click();
  await expect(page.locator('#detail-body')).toContainText('Em resgate');
  await expect(page.locator('#detail-sale-btn')).toBeVisible();
  await page.locator('#detail-sale-btn').click();
  await expect(page.locator('#sheet-sale')).toHaveClass(/open/);
  await page.locator('#sh-sale-date').fill('2026-06-17');
  await page.locator('#sh-sale-gross').fill('520,00');
  await page.locator('#sh-sale-note').fill('venda total browser');
  await page.locator('#sh-sale-save').click();
  await expect(page.locator('#detail-body')).toContainText('Vendido');
  await expect(page.locator('#detail-body')).toContainText('Valor bruto da venda');
  await page.locator('#detail-back-btn').click();
  await expect(page.locator('#cart-list')).not.toContainText('VALE3 · Vale QA');

  await page.locator('#tab-bens').click();
  await expect(page.locator('#tela-bens')).toBeVisible();
  await page.locator('#fab-bem-add').click();
  await expect(page.locator('#sheet-bem')).toHaveClass(/open/);
  await page.locator('#sh-bem-type-chips [data-type="FGTS"]').click();
  await page.locator('#sh-bem-name').fill('FGTS QA');
  await page.locator('#sh-bem-value').fill('1234,56');
  await page.locator('#sh-bem-employer').fill('Empresa QA');
  await page.locator('#sh-bem-save').click();
  await expect(page.locator('#bens-body')).toContainText('FGTS QA');
  await page.locator('#tab-hoje').click();
  await expect(page.locator('#gross-wealth-wrap')).toBeVisible();
});
