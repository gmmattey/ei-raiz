import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
    minify: 'esbuild'
  }
})