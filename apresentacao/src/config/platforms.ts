// Lê URLs de loja e contato de suporte de env vars. Hoje nenhuma dessas envs existe no ambiente
// (`apresentacao/.env*` não declara nenhuma) — por isso os componentes que consomem isso devem
// cair no estado "ainda não disponível" honesto, nunca inventar um link/e-mail.

function readValidStoreUrl(raw: string | undefined): string | null {
  if (!raw) return null
  try {
    const url = new URL(raw)
    // Só HTTPS é aceito — nunca renderiza botão de loja com URL http/placeholder.
    return url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

export const PLAY_STORE_URL = readValidStoreUrl(import.meta.env.VITE_PLAY_STORE_URL as string | undefined)
export const APP_STORE_URL = readValidStoreUrl(import.meta.env.VITE_APP_STORE_URL as string | undefined)

function readValidEmail(raw: string | undefined): string | null {
  if (!raw) return null
  // Validação simples, suficiente para o propósito (não é validação de RFC completa).
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? raw : null
}

export const SUPPORT_EMAIL = readValidEmail(import.meta.env.VITE_SUPPORT_EMAIL as string | undefined)
