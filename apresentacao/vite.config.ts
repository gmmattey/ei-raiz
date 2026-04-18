import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    react(),
    // Entrega build moderno por padrão, mas adiciona fallback (nomodule) para browsers antigos.
    // Isso é o que permite abrir em iPads antigos sem sacrificar o "premium" no desktop/mobile atual.
    legacy({
      // iPad 2012 costuma ficar preso em iOS 9/10 dependendo do modelo/atualização.
      // Mantemos o alvo conservador para não quebrar em Safari antigo.
      targets: ['iOS >= 10', 'Safari >= 10', 'Chrome >= 49', 'Firefox >= 45'],
      // Alguns WebViews antigos falham se o polyfill for injetado via module.
      modernPolyfills: false,
      renderLegacyChunks: true,
    }),
  ],
  server: {
    port: 3000,
    host: '0.0.0.0', // Acessível de qualquer interface de rede
    open: true,
    strictPort: false, // Se 3000 estiver ocupado, usa próxima porta disponível
    cors: true,
    hmr: {
      host: 'localhost',
      port: 3000,
      protocol: 'ws'
    }
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: false
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-recharts': ['recharts'],
          'vendor-framer': ['framer-motion'],
          'vendor-router': ['react-router-dom'],
        },
      },
    },
  }
})
