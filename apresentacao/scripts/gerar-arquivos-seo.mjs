#!/usr/bin/env node
// Gera public/robots.txt e public/sitemap.xml antes do build (npm "prebuild").
//
// Fonte única das rotas públicas: src/config/public-routes.json (mesma lista usada pelos
// testes e2e — não duplicar em nenhum outro lugar).
//
// Este script NUNCA derruba um build genérico (CI de PR, dev local, preview de branch): sem
// `VITE_PUBLIC_SITE_URL` configurada, ele gera um robots.txt seguro (Disallow: /) e um sitemap
// vazio, e avisa por quê. A obrigatoriedade real da env var para produção é aplicada em
// `scripts/checar-site-url-obrigatoria.mjs`, chamado só no workflow de deploy — é lá que "o
// build deve falhar" de fato, sem quebrar a validação de PR de quem não está fazendo deploy.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = resolve(__dirname, '../public')
const rotas = JSON.parse(readFileSync(resolve(__dirname, '../src/config/public-routes.json'), 'utf-8'))

function normalizarUrl(url) {
  return url.trim().replace(/\/+$/, '')
}

const raw = process.env.VITE_PUBLIC_SITE_URL
const siteUrl = raw && /^https:\/\/.+/.test(raw.trim()) ? normalizarUrl(raw) : null

if (!siteUrl) {
  if (raw) {
    console.warn(
      `[gerar-arquivos-seo] VITE_PUBLIC_SITE_URL="${raw}" não é uma URL https válida — gerando robots.txt/sitemap.xml não indexáveis.`
    )
  } else {
    console.warn(
      '[gerar-arquivos-seo] VITE_PUBLIC_SITE_URL não configurada (dev local / preview de branch) — gerando robots.txt/sitemap.xml não indexáveis.'
    )
  }

  writeFileSync(resolve(publicDir, 'robots.txt'), 'User-agent: *\nDisallow: /\n')
  writeFileSync(
    resolve(publicDir, 'sitemap.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n'
  )
  process.exit(0)
}

const hoje = new Date().toISOString().slice(0, 10)

const urls = rotas
  .map(
    (r) =>
      `  <url>\n    <loc>${siteUrl}${r.path}</loc>\n    <lastmod>${hoje}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>`
  )
  .join('\n')

writeFileSync(
  resolve(publicDir, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
)
writeFileSync(resolve(publicDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`)

console.log(`[gerar-arquivos-seo] robots.txt e sitemap.xml gerados para ${siteUrl} (${rotas.length} rotas).`)
