/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL pública oficial do site (sem barra final) — ver `src/config/site.ts`. Obrigatória no deploy de produção. */
  readonly VITE_PUBLIC_SITE_URL?: string
  readonly VITE_PLAY_STORE_URL?: string
  readonly VITE_APP_STORE_URL?: string
  readonly VITE_SUPPORT_EMAIL?: string
  /** Identidade do controlador (LGPD) — ver `src/config/legal.ts`. Sem aprovação, ficam ausentes. */
  readonly VITE_LEGAL_CONTROLLER_NAME?: string
  readonly VITE_LEGAL_CONTROLLER_TAX_ID?: string
  readonly VITE_LEGAL_PUBLIC_BRAND_NAME?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
