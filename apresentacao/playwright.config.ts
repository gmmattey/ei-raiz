import { defineConfig, devices } from '@playwright/test';

/**
 * Config de testes e2e para a landing do Savro (apresentacao/).
 * Roda contra o build de produção (`vite preview`), não contra dev server.
 *
 * Antes de rodar: VITE_PUBLIC_SITE_URL=<url pública> npm run build -w @ei/web
 *   (a suíte usa a mesma env var — via process.env.VITE_PUBLIC_SITE_URL — para montar as
 *   asserções de canonical/OG/sitemap; sem ela, cai no domínio Cloudflare Pages real do
 *   projeto como default de teste, nunca um domínio inventado)
 * Depois: npm run preview -w @ei/web (em outro terminal ou background)
 * Testes: npx playwright test
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // Acima do default (30s): a suíte "sem URL pública configurada" builda um dist/ isolado
  // (tsc + vite build) e sobe um segundo `vite preview` dentro do beforeAll.
  timeout: 60_000,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run preview -w @ei/web',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
