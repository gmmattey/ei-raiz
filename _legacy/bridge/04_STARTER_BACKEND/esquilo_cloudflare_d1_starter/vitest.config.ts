import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Usa o ambiente Node.js padrão (Node 18+ tem Request, Response, URL, crypto globais).
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
  },
});
