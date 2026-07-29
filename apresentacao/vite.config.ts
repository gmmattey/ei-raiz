import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import { VitePWA } from 'vite-plugin-pwa'

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
    // vite-plugin-pwa deve vir DEPOIS do plugin-legacy (requisito oficial).
    VitePWA({
      registerType: 'autoUpdate',
      // Não gera manifest — usamos o manifest.webmanifest manual em /public.
      manifest: false,
      workbox: {
        // Precache todos os assets do build: JS, CSS, HTML, fontes, ícones.
        globPatterns: ['**/*.{js,css,html,woff,woff2,ttf,eot,ico,png,svg,webp}'],
        // Evitar precache de sourcemaps e chunks de dev.
        globIgnores: ['**/node_modules/**', '**/*.map'],
        // Controla quanto tempo o SW espera a rede antes de cair no cache.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Fontes Google — CacheFirst (mudam raramente, impacto enorme no LCP).
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
        ],
      },
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
          'vendor-framer': ['framer-motion'],
          'vendor-router': ['react-router-dom'],
        },
      },
    },
  }
})
