/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  /** URL pública oficial do site (sem barra final) — ver `src/config/site.ts`. Obrigatória no deploy de produção. */
  readonly VITE_PUBLIC_SITE_URL?: string
  readonly VITE_PLAY_STORE_URL?: string
  readonly VITE_APP_STORE_URL?: string
  readonly VITE_SUPPORT_EMAIL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
