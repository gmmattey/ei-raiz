import { defineConfig, devices } from '@playwright/test';

/**
 * Config de testes e2e para a landing do Savro (apresentacao/).
 * Rodas contra o build de produção (`vite preview`), não contra dev server.
 *
 * Antes de rodar: npm run build -w @ei/web
 * Depois: npm run preview -w @ei/web (em outro terminal ou background)
 * Testes: npx playwright test
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
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
