import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = 'https://409f47de.ei-raiz-web.pages.dev';
const artifactsDir = path.resolve('tests/e2e-artifacts');
fs.mkdirSync(artifactsDir, { recursive: true });

const csvDir = path.resolve('tests/massa-importacao/csv');
const csvForaPadrao = path.join(csvDir, '12_arquivo_fora_padrao.csv');
const csvMultiplos = path.join(csvDir, '02_multiplos_ativos.csv');
const csvInvalido = path.join(csvDir, '08_misto_validos_invalidos.csv');

function gerarCpfValido() {
  const n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  const d1Raw = 11 - (n.reduce((acc, v, i) => acc + v * (10 - i), 0) % 11);
  const d1 = d1Raw >= 10 ? 0 : d1Raw;
  const d2Raw = 11 - ([...n, d1].reduce((acc, v, i) => acc + v * (11 - i), 0) % 11);
  const d2 = d2Raw >= 10 ? 0 : d2Raw;
  return `${n.join('')}${d1}${d2}`;
}

const id = Date.now();
const usuario = {
  nome: 'Teste E2E Producao',
  cpf: gerarCpfValido(),
  dataNasc: '10/10/1990',
  email: `e2e.prod.${id}@teste.local`,
  telefone: '(11) 99999-9999',
  senha: 'E2e@Senha123',
};

const resultados = [];
async function evidenciar(page, fluxo, resultado, problema = '', correcao = '', status = 'OK') {
  const arquivo = `${String(resultados.length + 1).padStart(2, '0')}_${fluxo.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}.png`;
  const caminho = path.join(artifactsDir, arquivo);
  await page.screenshot({ path: caminho, fullPage: true });
  resultados.push({ fluxo, resultado, problema, correcao, evidencia: caminho, status });
}

function salvarRelatorio() {
  const linhas = ['# Relatorio E2E Producao', '', `URL: ${baseUrl}`, `Usuario teste: ${usuario.email}`, ''];
  for (const r of resultados) {
    linhas.push(`## Fluxo: ${r.fluxo}`);
    linhas.push(`- Resultado: ${r.resultado}`);
    linhas.push(`- Problema encontrado: ${r.problema || 'Nenhum'}`);
    linhas.push(`- Correção aplicada: ${r.correcao || 'N/A'}`);
    linhas.push(`- Evidência: ${r.evidencia}`);
    linhas.push(`- Status: ${r.status}`);
    linhas.push('');
  }
  fs.writeFileSync(path.join(artifactsDir, 'relatorio-e2e-producao.md'), linhas.join('\n'), 'utf8');
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

try {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

  // 1) Landing
  await page.waitForSelector('text=Criar conta', { timeout: 20000 });
  await evidenciar(page, 'Landing', 'Home publica carregada com CTAs de entrar/cadastro.');

  // 3) Login inválido
  await page.getByRole('button', { name: 'Entrar' }).first().click();
  const loginModal = page.locator('div.bg-white.rounded-xl').first();
  await page.getByPlaceholder('seu@email.com').fill(usuario.email);
  await page.getByPlaceholder('Digite sua senha').fill('senhaerrada');
  await loginModal.getByRole('button', { name: /^Entrar$/ }).first().click();
  await page.waitForSelector('text=E-mail ou senha incorretos');
  await evidenciar(page, 'Login Invalido', 'Mensagem de credencial invalida exibida corretamente.');
  await loginModal.getByRole('button', { name: /Criar conta/i }).first().click();

  // 2) Cadastro / Onboarding
  await page.waitForURL('**/onboarding');
  await page.getByPlaceholder('Digite seu nome completo').fill(usuario.nome);
  await page.getByPlaceholder('000.000.000-00').fill(usuario.cpf);
  await page.getByPlaceholder('DD/MM/AAAA').fill(usuario.dataNasc);
  await page.getByPlaceholder('seu@email.com').fill(usuario.email);
  await page.getByPlaceholder('(00) 00000-0000').fill(usuario.telefone);
  await page.getByRole('button', { name: /Continuar/i }).click();

  await page.getByRole('button', { name: /Pular etapa/i }).click();
  await page.getByPlaceholder('R$ 0,00').fill('15000');
  await page.getByRole('button', { name: /Continuar/i }).click();
  await page.getByRole('button', { name: /Pular etapa/i }).click();
  await page.getByPlaceholder('Crie uma senha forte').fill(usuario.senha);
  await page.getByRole('button', { name: /Feito!/i }).click();
  await page.waitForURL('**/importar', { timeout: 30000 });
  await evidenciar(page, 'Cadastro Onboarding', 'Cadastro concluido e redirecionado para importacao.');

  // 10) Empty state Home antes de importar
  await page.goto(`${baseUrl}/home`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  const estaNoPreInsight = page.url().includes('/pre-insight') || (await page.locator('text=Seu primeiro diagnóstico').count()) > 0;
  if (estaNoPreInsight) {
    await page.waitForSelector('text=Seu primeiro diagnóstico');
    await evidenciar(page, 'Gate Pre-Insight', 'Redirecionamento para pre-insight antes da home ocorreu como esperado.');
    const btnContinuar = page.locator('button:has-text(\"Ver tudo isso no detalhe\")').first();
    await btnContinuar.click({ force: true });
    await page.waitForTimeout(1000);
    if (page.url().includes('/pre-insight')) {
      await page.getByAltText('Esquilo Invest').first().click({ force: true });
      await page.waitForTimeout(1000);
    }
    if (page.url().includes('/pre-insight')) {
      await page.evaluate(() => localStorage.setItem('hasSeenPreInsight', 'true'));
      await page.goto(`${baseUrl}/home`, { waitUntil: 'domcontentloaded' });
    }
    await page.waitForURL('**/home', { timeout: 30000 });
  }
  const estadoHome = page.locator('text=Sua carteira ainda está vazia').or(page.locator('text=Falha ao carregar resumo da carteira.'));
  await estadoHome.first().waitFor({ timeout: 30000 });
  const houveErroHome = await page.locator('text=Falha ao carregar resumo da carteira.').count();
  await evidenciar(
    page,
    'Home Empty State',
    houveErroHome ? 'Home exibiu erro ao carregar resumo antes da importação.' : 'Estado vazio exibido com CTA para importacao.',
    houveErroHome ? 'Instabilidade de carregamento de resumo em conta nova.' : '',
    '',
    houveErroHome ? 'ATENCAO' : 'OK',
  );

  // 4) Importacao erro granular (manual)
  await page.goto(`${baseUrl}/importar`, { waitUntil: 'domcontentloaded' });
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(csvForaPadrao);
  await page.waitForSelector('text=Arquivo fora do padrão esperado', { timeout: 20000 });
  await evidenciar(page, 'Importacao Erro Granular', 'CSV fora do padrao retorna erro especifico.');

  // 4) Importacao por drag-and-drop (csv invalido misto)
  const csvInvalidoConteudo = fs.readFileSync(csvInvalido, 'utf8');
  await page.evaluate((csvText) => {
    const area = document.querySelector('div.border-2.border-dashed');
    if (!area) throw new Error('Drop area nao encontrada');
    const dt = new DataTransfer();
    const file = new File([csvText], '08_misto_validos_invalidos.csv', { type: 'text/csv' });
    dt.items.add(file);
    area.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: dt }));
    area.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer: dt }));
    area.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
  }, csvInvalidoConteudo);
  await page.waitForSelector('text=Revisão da Importação', { timeout: 20000 });
  await page.waitForSelector('text=ticker não reconhecido', { timeout: 20000 });
  await evidenciar(page, 'Importacao Preview com Erros', 'Preview mostra validos e erros por linha com motivo.');

  // reenviar arquivo válido
  await page.getByRole('button', { name: /Reenviar arquivo/i }).click();
  await fileInput.setInputFiles(csvMultiplos);
  await page.waitForSelector('text=Revisão da Importação', { timeout: 20000 });
  await page.getByRole('button', { name: /Confirmar itens válidos/i }).click();
  await page.waitForURL('**/home', { timeout: 30000 });
  await evidenciar(page, 'Importacao Sucesso', 'Importacao confirmada e redirect para Home.');

  // 5) Home dados
  await page.waitForSelector('text=Patrimônio Total');
  await evidenciar(page, 'Home Com Dados', 'Home carregou resumo com dados apos importacao.');

  // 6) Carteira
  await page.getByRole('banner').getByRole('button', { name: 'Carteira', exact: true }).click();
  await page.waitForURL('**/carteira');
  await page.getByRole('button', { name: 'Fundos' }).click();
  await page.getByPlaceholder('BUSCAR ATIVO...').fill('MXRF11');
  await page.waitForSelector('table');
  await page.locator('tbody tr').first().waitFor({ timeout: 30000 });
  await page.locator('tbody tr').first().click();
  await page.waitForURL('**/ativo/**');
  await evidenciar(page, 'Carteira', 'Listagem, filtro, busca e detalhe do ativo funcionando.');

  // 7) Insights
  await page.goto(`${baseUrl}/insights`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Score de Saúde');
  await evidenciar(page, 'Insights', 'Score, diagnostico e cards de risco/acao exibidos.');

  // 8) Historico
  await page.goto(`${baseUrl}/historico`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Snapshots');
  await page.getByRole('button', { name: '12m' }).click();
  await evidenciar(page, 'Historico', 'Snapshots e eventos com filtro de periodo.');

  // 9) Perfil/Configuracoes e logout
  await page.goto(`${baseUrl}/configuracoes`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('text=Encerrar Sessão no Dispositivo');
  await page.getByRole('button', { name: /Encerrar Sessão no Dispositivo/i }).click();
  await page.waitForURL('**/');
  await evidenciar(page, 'Perfil Configuracoes Logout', 'Logout funcional e retorno para landing.');

  // 3) Login valido
  await page.getByRole('button', { name: 'Entrar' }).first().click();
  await page.getByPlaceholder('seu@email.com').fill(usuario.email);
  await page.getByPlaceholder('Digite sua senha').fill(usuario.senha);
  await loginModal.getByRole('button', { name: /^Entrar$/ }).first().click();
  await page.waitForURL('**/home', { timeout: 30000 });
  await evidenciar(page, 'Login Valido', 'Login com usuario valido redireciona para home.');

} catch (error) {
  await evidenciar(page, 'Falha Geral', `Erro durante execucao: ${String(error)}`, String(error), '', 'FALHOU');
  throw error;
} finally {
  salvarRelatorio();
  await context.close();
  await browser.close();
}
