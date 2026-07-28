#!/usr/bin/env node
// Gate de deploy: falha explicitamente se VITE_PUBLIC_SITE_URL não estiver configurada ou não
// for uma URL https válida. Chamado só em .github/workflows/deploy.yml, antes do deploy real —
// não em ci.yml (validação de PR não deve exigir a URL pública oficial).
const raw = process.env.VITE_PUBLIC_SITE_URL

function normalizarUrl(url) {
  return url.trim().replace(/\/+$/, '')
}

if (!raw || !/^https:\/\/.+/.test(raw.trim())) {
  console.error(
    `[checar-site-url-obrigatoria] VITE_PUBLIC_SITE_URL ausente ou inválida (valor: ${JSON.stringify(raw ?? null)}) — obrigatória para o deploy de produção do Savro. Build abortado.`
  )
  process.exit(1)
}

console.log(`[checar-site-url-obrigatoria] OK: ${normalizarUrl(raw)}`)
