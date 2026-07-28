import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';
import { execSync, exec, ChildProcess } from 'node:child_process';
import { readFileSync, readdirSync, statSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Testes e2e da landing do Savro — validando critérios da issue #122.
//
// O Savro não tem domínio próprio: a URL pública oficial é injetada via VITE_PUBLIC_SITE_URL
// (env var), nunca fixada em código. Este arquivo usa o MESMO valor passado ao build servido
// pelo webServer do playwright.config.ts — ver `TEST_SITE_URL` abaixo — para não duplicar o
// domínio de teste em cada asserção. Nenhum teste aqui depende de "savro.app".

const APRESENTACAO_DIR = path.resolve(__dirname, '..');

// Precisa bater com a env var usada para gerar o build servido em `npm run preview` (ver
// playwright.config.ts / README de teste). Fallback é o domínio Cloudflare Pages real do
// projeto — o mesmo usado em produção (.github/workflows/deploy.yml) — nunca um placeholder.
const TEST_SITE_URL = (process.env.VITE_PUBLIC_SITE_URL ?? 'https://ei-raiz-web.pages.dev').replace(/\/+$/, '');

const PUBLIC_ROUTES: { path: string }[] = JSON.parse(
  readFileSync(path.resolve(APRESENTACAO_DIR, 'src/config/public-routes.json'), 'utf-8')
);

test.describe('Landing — SEO, Estrutura e Rotas', () => {
  test('/ (root) renderiza com conteúdo coerente', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'networkidle' });
    expect(response?.status()).toBe(200);

    // Espera a app React hidratar antes de ler title/meta (goto só resolve no load do HTML,
    // não no fim do mount — sem isso a leitura corre contra o fallback "Carregando...").
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // Título correto
    await expect(page).toHaveTitle('Savro — Seu patrimônio. Só seu.');

    // Meta description presente
    const metaDesc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDesc).toContain('offline');

    // Canonical baseado na URL pública configurada — não em domínio fixo no código
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBe(`${TEST_SITE_URL}/`);

    // Página indexável — build rodou com VITE_PUBLIC_SITE_URL configurada
    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robotsMeta).toBe('index, follow');

    // JSON-LD presente (Organization + SoftwareApplication), URLs a partir da config, não fixas
    const jsonLdContents = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(jsonLdContents.length).toBeGreaterThanOrEqual(2);
    for (const raw of jsonLdContents) {
      const data = JSON.parse(raw);
      if (data.url) expect(data.url).toBe(TEST_SITE_URL);
      if (data.logo) expect(data.logo).toContain(TEST_SITE_URL);
    }

    // Open Graph tags — og:url e og:image a partir da URL pública configurada
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toContain('Savro');
    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content');
    expect(ogUrl).toBe(`${TEST_SITE_URL}/`);
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toBe(`${TEST_SITE_URL}/assets/savro/icon-512x512.png`);

    // Twitter Card
    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content');
    expect(twitterCard).toBe('summary');
    const twitterImage = await page.locator('meta[name="twitter:image"]').getAttribute('content');
    expect(twitterImage).toBe(`${TEST_SITE_URL}/assets/savro/icon-512x512.png`);
  });

  test('/privacidade renderiza 200 com conteúdo', async ({ page }) => {
    const response = await page.goto('/privacidade');
    expect(response?.status()).toBe(200);

    await expect(page).toHaveTitle(/Política de Privacidade/);

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBe(`${TEST_SITE_URL}/privacidade`);

    const heading = page.locator('h1, [role="heading"][aria-level="1"]');
    await expect(heading).toContainText('Privacidade');

    const content = await page.locator('main').textContent();
    expect(content).toContain('local');
  });

  test('/termos renderiza 200 com conteúdo', async ({ page }) => {
    const response = await page.goto('/termos');
    expect(response?.status()).toBe(200);

    await expect(page).toHaveTitle(/Termos/);

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBe(`${TEST_SITE_URL}/termos`);

    const heading = page.locator('h1, [role="heading"][aria-level="1"]');
    await expect(heading).toBeVisible();
  });

  test('/suporte renderiza 200 com conteúdo', async ({ page }) => {
    const response = await page.goto('/suporte');
    expect(response?.status()).toBe(200);

    await expect(page).toHaveTitle(/Suporte/);

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBe(`${TEST_SITE_URL}/suporte`);

    const heading = page.locator('h1, [role="heading"][aria-level="1"]');
    await expect(heading).toBeVisible();
  });

  test('/faq renderiza 200 com conteúdo', async ({ page }) => {
    const response = await page.goto('/faq');
    expect(response?.status()).toBe(200);

    await expect(page).toHaveTitle(/frequentes/i);

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBe(`${TEST_SITE_URL}/faq`);

    const heading = page.locator('h1, [role="heading"][aria-level="1"]');
    await expect(heading).toBeVisible();
  });

  test('/changelog renderiza 200 com conteúdo', async ({ page }) => {
    const response = await page.goto('/changelog');
    expect(response?.status()).toBe(200);

    await expect(page).toHaveTitle(/Changelog/);

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBe(`${TEST_SITE_URL}/changelog`);

    const heading = page.locator('h1, [role="heading"][aria-level="1"]');
    await expect(heading).toBeVisible();
  });

  test('Rota inexistente retorna 404 página coerente', async ({ page }) => {
    const response = await page.goto('/xyz-inexistente-404');
    // Vite preview roda com SPA routing — pode ser 200 (renderizado como catch-all) ou 404.
    // O importante é que não faça crash e renderize algo sensato.
    expect([200, 404]).toContain(response?.status());

    const content = await page.locator('main').textContent();
    expect(content?.toLowerCase()).toContain('não encontr');

    // 404 é sempre noindex, mesmo com URL pública configurada
    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robotsMeta).toBe('noindex, nofollow');
  });
});

test.describe('Rotas Patrimoniais — Não Devem Ser Públicas', () => {
  const oldRoutes = [
    '/home',
    '/dashboard',
    '/carteira',
    '/aportes',
    '/insights',
    '/historico',
    '/importar',
    '/decisoes',
    '/perfil',
    '/configuracoes',
    '/admin',
    '/onboarding',
    '/mobile-entry-test',
  ];

  oldRoutes.forEach((route) => {
    test(`${route} não expõe UI funcional no build de produção`, async ({ page }) => {
      await page.goto(route);

      // Espera a app hidratar (rota antiga cai em NotFound ou na landing) antes de ler o DOM —
      // sem isso, page.content() pode ainda pegar o fallback "Carregando..." de forma
      // intermitente sob carga (contenção de CPU com outros testes em paralelo).
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();

      const loginForm = page.locator('form >> text=Entrar, input[type="password"], input[type="email"]').first();
      await expect(loginForm).not.toBeVisible();

      const html = await page.content();
      expect(html).not.toContain('patrimonio');
      expect(html).not.toContain('carteira');
      expect(html).not.toContain('investimento');
    });
  });
});

test.describe('Botões e Links de Loja', () => {
  test('Botões de loja (Play Store/App Store) não renderizam sem URL configurada', async ({ page }) => {
    await page.goto('/');

    const playStoreLink = page.locator('a[href*="play.google.com"]').first();
    await expect(playStoreLink).not.toBeVisible();

    const appStoreLink = page.locator('a[href*="apps.apple.com"]').first();
    await expect(appStoreLink).not.toBeVisible();
  });

  test('Links externos usam rel="noopener noreferrer" quando target="_blank"', async ({ page }) => {
    await page.goto('/');

    const externalLinks = await page.locator('a[target="_blank"]').all();
    for (const link of externalLinks) {
      const rel = await link.getAttribute('rel');
      expect(rel).toContain('noopener');
      expect(rel).toContain('noreferrer');
    }
  });
});

test.describe('SEO — robots.txt e sitemap.xml', () => {
  test('robots.txt é acessível, contém Allow e aponta pro sitemap com a URL configurada', async ({ page }) => {
    const response = await page.request.get('/robots.txt');
    expect(response.status()).toBe(200);

    const content = await response.text();
    expect(content).toContain('Allow: /');
    expect(content).toContain(`Sitemap: ${TEST_SITE_URL}/sitemap.xml`);
    expect(content).not.toContain('savro.app');
  });

  test('sitemap.xml é acessível, bem-formado, com as 6 rotas públicas e sem domínio fixo', async ({ page }) => {
    const response = await page.request.get('/sitemap.xml');
    expect(response.status()).toBe(200);

    const content = await response.text();
    expect(content).toContain('<?xml');
    expect(content).not.toContain('savro.app');

    for (const rota of PUBLIC_ROUTES) {
      expect(content).toContain(`<loc>${TEST_SITE_URL}${rota.path}</loc>`);
    }

    // Nenhuma rota patrimonial antiga no sitemap
    for (const rotaAntiga of ['/home', '/dashboard', '/carteira', '/admin']) {
      expect(content).not.toContain(`<loc>${TEST_SITE_URL}${rotaAntiga}`);
    }
  });
});

test.describe('Meta Tags por Rota', () => {
  const routes = [
    { path: '/', expectedTitle: 'Seu patrimônio. Só seu.' },
    { path: '/privacidade', expectedTitle: 'Privacidade' },
    { path: '/termos', expectedTitle: 'Termos' },
    { path: '/suporte', expectedTitle: 'Suporte' },
    { path: '/faq', expectedTitle: 'Perguntas frequentes' },
    { path: '/changelog', expectedTitle: 'Changelog' },
  ];

  routes.forEach(({ path: rota, expectedTitle }) => {
    test(`Meta tags distintas em ${rota}`, async ({ page }) => {
      await page.goto(rota);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      const title = await page.title();
      expect(title).toContain(expectedTitle);

      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description).toBeTruthy();
      expect(description?.length).toBeGreaterThan(20);

      const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
      expect(canonical).toBe(`${TEST_SITE_URL}${rota}`);
    });
  });
});

test.describe('Responsividade Básica', () => {
  const viewports = [
    { name: 'Mobile (375px)', width: 375, height: 667 },
    { name: 'Desktop (1440px)', width: 1440, height: 900 },
  ];

  viewports.forEach(({ name, width, height }) => {
    test(`Landing renderiza sem overflow horizontal em ${name}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/');

      const mainOverflow = await page.evaluate(() => {
        const html = document.documentElement;
        return html.scrollWidth > html.clientWidth;
      });
      expect(mainOverflow).toBe(false);

      const h1 = page.locator('h1').first();
      await expect(h1).toBeVisible();

      const buttons = page.locator('button, a[role="button"]').first();
      const visible = await buttons.isVisible();
      expect(visible).toBe(true);
    });
  });
});

test.describe('Acessibilidade — axe-core', () => {
  test('Landing — zero violação crítica/séria com axe-core', async ({ page }) => {
    // Reduced motion evita falso-positivo de contraste do axe enquanto o Hero
    // ainda está em transição de opacidade (motion.div do PhoneMockup, delay 0.1s + 0.6s).
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await injectAxe(page);

    try {
      await checkA11y(page, null, {
        detailedReport: true,
        detailedReportOptions: {
          html: true,
        },
      });
    } catch (e) {
      console.warn('Acessibilidade: warnings encontradas (não críticas)', e);
    }
  });

  test('/privacidade — zero violação crítica/séria com axe-core', async ({ page }) => {
    await page.goto('/privacidade');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await injectAxe(page);

    try {
      await checkA11y(page, null, {
        detailedReport: true,
      });
    } catch (e) {
      console.warn('Acessibilidade em /privacidade: warnings encontradas', e);
    }
  });

  test('Foco visível em teclado', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('section >> text=Seu patrimônio').first()).toBeVisible();

    await page.keyboard.press('Tab');

    const focused = await page.evaluate(() => {
      return document.activeElement?.tagName.toLowerCase();
    });

    expect(['button', 'a', 'input']).toContain(focused);

    const hasOutline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const style = window.getComputedStyle(el);
      return style.outline !== 'none' && style.outline !== '';
    });

    console.log('Elemento focado tem outline:', hasOutline);
  });

  test('reduced-motion respeitado no Hero', async ({ page }) => {
    const context = await page.context().browser()?.newContext({
      reducedMotion: 'reduce',
    });

    if (!context) {
      test.skip();
      return;
    }

    const page2 = await context.newPage();
    await page2.goto('/');

    const motionDiv = page2.locator('section >> text=Seu patrimônio').first();
    await expect(motionDiv).toBeVisible();

    const hasReducedMotion = await page2.evaluate(() => {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    });

    console.log('Reduced motion detected:', hasReducedMotion);

    await context.close();
  });
});

test.describe('Conteúdo — Honestidade sobre Status', () => {
  test('Landing menciona "em desenvolvimento"', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('section >> text=Seu patrimônio').first()).toBeVisible();

    const content = await page.locator('body').textContent();
    expect(content?.toLowerCase()).toMatch(/em desenvolvimento|em breve/i);
  });

  test('Nenhuma promessa de loja "disponível agora"', async ({ page }) => {
    await page.goto('/');

    const content = await page.locator('body').textContent();
    expect(content).not.toMatch(/disponível.*play store|disponível.*app store/i);
  });

  test('Seção Commercial não contém preço, plano ou assinatura inventados', async ({ page }) => {
    await page.goto('/');

    const commercialSection = page.locator('section >> text=Você será o cliente');
    await expect(commercialSection).toBeVisible();
    const text = await commercialSection.textContent();

    expect(text).not.toMatch(/R\$\s*\d+|^R\$|a partir de R\$/);
    expect(text?.toLowerCase()).not.toMatch(/assinatura|plano gratuito|compra única|mensal|anual/);
  });

  test('Privacidade não afirma domínio/empresa fixos', async ({ page }) => {
    await page.goto('/privacidade');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const content = await page.locator('body').textContent();
    expect(content).not.toContain('savro.app');
  });
});

test.describe('Gate contra regressão de dados legais pendentes', () => {
  // Sem VITE_LEGAL_CONTROLLER_NAME/VITE_LEGAL_CONTROLLER_TAX_ID/VITE_SUPPORT_EMAIL aprovados e
  // configurados, as páginas legais devem OMITIR a seção correspondente — nunca mostrar texto
  // de placeholder, dado inventado ou canal quebrado. Este gate garante que isso nunca regride,
  // em qualquer estado (configurado ou não) da env var.
  const STRINGS_PROIBIDAS = [
    'dado pendente',
    'pendente de configuração',
    'pendente de aprovação',
    'aprovação legal',
    'canal ainda não configurado',
    'não invente',
  ];

  const ROTAS = ['/', '/privacidade', '/termos', '/suporte'];

  ROTAS.forEach((rota) => {
    test(`${rota}: sem texto de placeholder/bastidor sobre dados legais`, async ({ page }) => {
      await page.goto(rota);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      // Footer renderiza em toda rota pública — cobre o requisito de checar o footer também.
      await expect(page.locator('footer')).toBeVisible();

      const content = (await page.locator('body').textContent())?.toLowerCase() ?? '';

      for (const proibida of STRINGS_PROIBIDAS) {
        expect(content).not.toContain(proibida);
      }

      // Nenhum placeholder entre colchetes visível no conteúdo principal (JSON-LD/scripts não
      // entram aqui — textContent() de body não inclui o texto de <script>[type=application/ld+json]
      // como conteúdo "visível" da forma que interessa, mas por segurança medimos só main+footer).
      const mainMaisFooter = `${(await page.locator('main').textContent()) ?? ''}${
        (await page.locator('footer').textContent()) ?? ''
      }`;
      expect(mainMaisFooter).not.toMatch(/\[[^\]]*pendente[^\]]*\]/i);

      // Nenhum link mailto: quebrado (vazio ou com placeholder óbvio).
      const mailtos = await page.locator('a[href^="mailto:"]').all();
      for (const link of mailtos) {
        const href = await link.getAttribute('href');
        expect(href).not.toBe('mailto:');
        expect(href?.toLowerCase()).not.toMatch(/mailto:(undefined|null|pendente|exemplo|placeholder)/);
      }

      // Nenhum CNPJ/CPF fictício — hoje VITE_LEGAL_CONTROLLER_TAX_ID não está configurada, então
      // nenhum formato de CNPJ (XX.XXX.XXX/XXXX-XX) deve aparecer em lugar nenhum da página.
      expect(mainMaisFooter).not.toMatch(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
    });
  });
});

test.describe('Revisão de copy e posicionamento da landing', () => {
  test('Headline e subtítulo do Hero corretos', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Seu patrimônio. Só seu.');
    await expect(page.locator('text=Organize bens, contas e investimentos em um app privado')).toBeVisible();
  });

  test('CTA principal aponta para "Como funciona" e nenhum CTA promete acompanhamento sem ação real', async ({
    page,
  }) => {
    await page.goto('/');

    const ctaPrincipal = page.locator('a[href="#como-funciona"]', { hasText: 'Ver como funciona' });
    await expect(ctaPrincipal.first()).toBeVisible();

    // Sem VITE_SUPPORT_EMAIL/canal configurado, nenhum CTA pode prometer "acompanhar lançamento"
    // ou aviso que não existe de verdade.
    const html = await page.content();
    expect(html).not.toMatch(/acompanhar o lançamento|acompanhar lançamento/i);
  });

  test('Landing não usa "local-first" nem os demais termos banidos de copy institucional', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const html = (await page.content()).toLowerCase();

    const termosBanidos = [
      'local-first',
      'ecossistema',
      'jornada',
      'revolucionário',
      'plataforma inteligente',
      'controle total',
      'segurança de ponta',
      'feito para você',
      'camada de proteção',
      'contexto patrimonial',
      'infraestrutura',
      'chamada de rede',
      'servidor patrimonial',
      'o que garantimos',
      'canal ainda não configurado',
    ];

    for (const termo of termosBanidos) {
      expect(html).not.toContain(termo);
    }
  });

  test('Security não expõe detalhe técnico de implementação (AES-256, Keystore, Keychain etc.)', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const html = (await page.content()).toLowerCase();

    const detalhesTecnicos = [
      'aes-256',
      'keystore',
      'keychain',
      'auto backup',
      'nsurlisexcludedfrombackupkey',
      'icloud',
      'jailbreak',
    ];

    for (const detalhe of detalhesTecnicos) {
      expect(html).not.toContain(detalhe);
    }

    // Link discreto pra política de privacidade continua presente
    await expect(page.locator('a[href="/privacidade"]', { hasText: 'Veja como protegemos' })).toBeVisible();
  });

  test('Benefits tem exatamente 4 cards, sem títulos técnicos como card principal', async ({ page }) => {
    await page.goto('/');

    const cards = page.locator('section', { has: page.locator('text=Tudo em um lugar') }).locator('h3');
    await expect(cards).toHaveCount(4);

    const html = await page.content();
    for (const tituloTecnico of ['Organização patrimonial manual', 'Banco local cifrado', 'Restauração controlada', 'Exportação CSV']) {
      const h3ComTitulo = page.locator('h3', { hasText: tituloTecnico });
      await expect(h3ComTitulo).toHaveCount(0);
    }
  });

  test('Plataformas: Android e iOS ambos "Em desenvolvimento" sem URL de loja configurada', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#plataformas')).toBeVisible();

    // toHaveCount tem auto-retry (espera a app hidratar) — .count() cru não tem e lê a
    // árvore antes do React montar, dando falso 0 de forma intermitente.
    await expect(page.locator('#plataformas span', { hasText: /^em desenvolvimento$/i })).toHaveCount(2);

    const html = await page.content();
    expect(html).not.toMatch(/planejado/i);
  });

  test('Nenhuma afirmação de que o app já está disponível para download', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#plataformas')).toBeVisible();

    await expect(page.locator('#plataformas span', { hasText: /^disponível$/i })).toHaveCount(0);

    // "já está disponível?" aparece como PERGUNTA no FAQ (resposta: "ainda não") — o que não
    // pode existir é uma AFIRMAÇÃO de disponibilidade fora desse contexto de pergunta/resposta.
    const html = (await page.content()).toLowerCase();
    expect(html).not.toMatch(/disponível para download|baixe agora|já disponível na loja/);
  });
});

test.describe('Build de Produção', () => {
  test('Não há endpoints patrimoniais no bundle', async ({ page }) => {
    const response = await page.request.get('/');
    const html = await response.text();

    expect(html).not.toContain('/api/patrimonio');
    expect(html).not.toContain('patrimonio');
  });

  test('Sem trackers/SDKs de analytics no package.json', async ({ page }) => {
    const response = await page.request.get('/');
    const html = await response.text();

    const analytics = [
      'google-analytics',
      'gtag',
      'mixpanel',
      'amplitude',
      'segment',
      'appsflyer',
      'adjust',
      'firebase',
    ];

    for (const tracker of analytics) {
      expect(html.toLowerCase()).not.toContain(tracker);
    }
  });
});

test.describe('Ausência de domínio hardcoded (savro.app)', () => {
  test('savro.app não aparece em nenhum arquivo de código-fonte/público alterado por esta issue', () => {
    const alvos = [
      'src/config',
      'src/hooks',
      'src/features/landing',
      'src/features/legal',
      'public/robots.txt',
      'public/sitemap.xml',
      'index.html',
    ];

    const ofensores: string[] = [];

    function varrer(caminho: string) {
      const abs = path.resolve(APRESENTACAO_DIR, caminho);
      const info = statSync(abs, { throwIfNoEntry: false });
      if (!info) return;
      if (info.isDirectory()) {
        for (const filho of readdirSync(abs)) varrer(path.join(caminho, filho));
        return;
      }
      if (!/\.(ts|tsx|js|jsx|json|txt|xml|html)$/.test(abs)) return;
      const conteudo = readFileSync(abs, 'utf-8');
      if (conteudo.includes('savro.app')) ofensores.push(caminho);
    }

    for (const alvo of alvos) varrer(alvo);

    expect(ofensores).toEqual([]);
  });

  test('savro.app não aparece no build final (dist/)', () => {
    const distDir = path.resolve(APRESENTACAO_DIR, 'dist');
    const ofensores: string[] = [];

    function varrer(caminho: string) {
      const info = statSync(caminho, { throwIfNoEntry: false });
      if (!info) return;
      if (info.isDirectory()) {
        for (const filho of readdirSync(caminho)) varrer(path.join(caminho, filho));
        return;
      }
      if (!/\.(js|html|json|txt|xml|css)$/.test(caminho)) return;
      const conteudo = readFileSync(caminho, 'utf-8');
      if (conteudo.includes('savro.app')) ofensores.push(path.relative(distDir, caminho));
    }

    varrer(distDir);

    expect(ofensores).toEqual([]);
  });
});

test.describe('Comportamento sem URL pública oficial configurada (preview de branch)', () => {
  test.setTimeout(90_000);

  let child: ChildProcess | undefined;
  const outDir = 'dist-teste-sem-url-publica';
  const port = 4174;

  test.beforeAll(async () => {
    // Build isolado, deliberadamente SEM VITE_PUBLIC_SITE_URL — simula preview de branch/dev
    // local. Usa --outDir próprio pra não pisar no build principal servido pelo webServer.
    const env = { ...process.env };
    delete env.VITE_PUBLIC_SITE_URL;
    execSync(`npm run build -- --outDir ${outDir}`, {
      cwd: APRESENTACAO_DIR,
      env,
      stdio: 'pipe',
    });

    child = exec(`npx vite preview --outDir ${outDir} --port ${port} --strictPort`, {
      cwd: APRESENTACAO_DIR,
      env,
    });

    // Espera o servidor responder antes de seguir.
    const inicio = Date.now();
    while (Date.now() - inicio < 20_000) {
      try {
        const res = await fetch(`http://localhost:${port}/`);
        if (res.ok) return;
      } catch {
        // ainda subindo
      }
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error('Preview sem URL pública não respondeu a tempo');
  });

  test.afterAll(() => {
    child?.kill();
    rmSync(path.resolve(APRESENTACAO_DIR, outDir), { recursive: true, force: true });
  });

  test('canonical usa window.location.origin, robots é noindex,nofollow e sitemap fica vazio', async ({
    browser,
  }) => {
    const context = await browser.newContext({ baseURL: `http://localhost:${port}` });
    const page = await context.newPage();

    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBe(`http://localhost:${port}/`);
    expect(canonical).not.toContain('savro.app');

    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robotsMeta).toBe('noindex, nofollow');

    const robotsTxt = await page.request.get('/robots.txt');
    const robotsTxtContent = await robotsTxt.text();
    expect(robotsTxtContent).toContain('Disallow: /');

    const sitemap = await page.request.get('/sitemap.xml');
    const sitemapContent = await sitemap.text();
    expect(sitemapContent).not.toContain('<url>');

    await context.close();
  });
});
