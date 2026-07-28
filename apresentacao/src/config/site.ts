// URL pública canônica do site institucional do Savro.
//
// O Savro não tem domínio próprio neste momento — o MVP1 é publicado inicialmente no domínio
// Cloudflare Pages já usado pelo projeto Esquilo. A URL real é injetada via env var
// `VITE_PUBLIC_SITE_URL` (configurada no pipeline de deploy, não neste arquivo — ver
// `.github/workflows/deploy.yml`). Nenhum domínio é fixado em código: se a env não existir
// (dev local, preview de branch), o app usa `window.location.origin` em runtime e marca a
// página como não indexável (ver `useSeo`).

function normalizarUrl(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

const configurada = import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined

/** URL pública oficial normalizada (sem barra final), só quando configurada via env var. */
export const SITE_URL_CONFIGURADA = configurada ? normalizarUrl(configurada) : undefined

/** True somente quando existe uma URL pública oficial configurada para este build. */
export const SITE_URL_PUBLICA_CONFIGURADA = Boolean(SITE_URL_CONFIGURADA)

/**
 * URL absoluta a usar em metadados desta página, nesta ordem de preferência:
 * 1. `VITE_PUBLIC_SITE_URL` (produção real);
 * 2. `window.location.origin` em runtime (dev local, preview de branch);
 * 3. string vazia (SSR/build sem `window`, não deve ocorrer nesta SPA).
 */
export function getSiteUrl(): string {
  if (SITE_URL_CONFIGURADA) return SITE_URL_CONFIGURADA
  if (typeof window !== 'undefined') return normalizarUrl(window.location.origin)
  return ''
}

export const SITE_NAME = 'Savro'
