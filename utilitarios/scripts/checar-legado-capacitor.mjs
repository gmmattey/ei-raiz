#!/usr/bin/env node
// Guard de CI contra regressão do Capacitor e do runtime patrimonial React legado (issue #184).
//
// Checa arquivos RASTREADOS pelo git (não o workspace, que pode ter artefato de build solto) e
// dependências reais declaradas em package.json — não é grep cego: cada regra sabe exatamente o
// que está proibido e por quê. Rodar via `node utilitarios/scripts/checar-legado-capacitor.mjs`
// a partir da raiz do monorepo.
import { execSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'

const erros = []

function arquivosRastreados() {
  return execSync('git ls-files', { encoding: 'utf-8' })
    .split('\n')
    .filter(Boolean)
}

const todos = arquivosRastreados()

// 1. Nenhum arquivo de config do Capacitor, nem wrapper Android/iOS gerado por ele.
const padroesCapacitor = [
  /(^|\/)capacitor\.config\.(ts|js|json)$/,
  /^apresentacao\/android\//,
  /^apresentacao\/ios\//,
]
for (const arquivo of todos) {
  if (padroesCapacitor.some((re) => re.test(arquivo))) {
    erros.push(`Arquivo de wrapper/config Capacitor voltou a existir: ${arquivo}`)
  }
}

// 2. Nenhum package.json do monorepo pode declarar dependência @capacitor/*.
const packageJsons = todos.filter((f) => f.endsWith('package.json') && !f.includes('node_modules/'))
for (const caminho of packageJsons) {
  if (!existsSync(caminho)) continue
  let pkg
  try {
    pkg = JSON.parse(readFileSync(caminho, 'utf-8'))
  } catch {
    continue
  }
  const secoes = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']
  for (const secao of secoes) {
    const deps = pkg[secao] || {}
    for (const nome of Object.keys(deps)) {
      if (nome.startsWith('@capacitor/')) {
        erros.push(`Dependência Capacitor reintroduzida em ${caminho}: ${nome}`)
      }
    }
  }
}

// 3. Nenhum diretório do runtime patrimonial React removido na #184 pode voltar em apresentacao/src.
const diretoriosBanidos = [
  'apresentacao/src/cliente-api',
  'apresentacao/src/components',
  'apresentacao/src/context',
  'apresentacao/src/features/admin',
  'apresentacao/src/features/aportes',
  'apresentacao/src/features/autenticacao',
  'apresentacao/src/features/carteira',
  'apresentacao/src/features/decisoes',
  'apresentacao/src/features/historico',
  'apresentacao/src/features/home',
  'apresentacao/src/features/importacao',
  'apresentacao/src/features/insights',
  'apresentacao/src/features/onboarding',
  'apresentacao/src/features/perfil',
]
for (const arquivo of todos) {
  for (const dirBanido of diretoriosBanidos) {
    if (arquivo === dirBanido || arquivo.startsWith(`${dirBanido}/`)) {
      erros.push(`Diretório do runtime patrimonial legado voltou a existir: ${arquivo}`)
    }
  }
}

// 4. A landing/rotas legais (apresentacao/src) não pode referenciar rotas de API patrimonial/auth.
const padraoApiPatrimonial = /\/api\/(auth|patrimonio)\b/
const arquivosFrontend = todos.filter(
  (f) => f.startsWith('apresentacao/src/') && /\.(ts|tsx|js|jsx|css)$/.test(f)
)
for (const arquivo of arquivosFrontend) {
  if (!existsSync(arquivo)) continue
  const conteudo = readFileSync(arquivo, 'utf-8')
  if (padraoApiPatrimonial.test(conteudo)) {
    erros.push(`Referência a API patrimonial/auth dentro da landing: ${arquivo}`)
  }
}

// 5. O app KMP (aplicativo/) não pode depender de WebView/WKWebView.
const padraoWebView = /\bWebView\b|\bWKWebView\b/
const arquivosApp = todos.filter(
  (f) => f.startsWith('aplicativo/') && /\.(kt|kts|swift)$/.test(f)
)
for (const arquivo of arquivosApp) {
  if (!existsSync(arquivo)) continue
  const conteudo = readFileSync(arquivo, 'utf-8')
  if (padraoWebView.test(conteudo)) {
    erros.push(`Referência a WebView/WKWebView no app KMP: ${arquivo}`)
  }
}

if (erros.length > 0) {
  console.error('[checar-legado-capacitor] Regressão do legado Capacitor/React detectada:\n')
  for (const erro of erros) console.error(`  - ${erro}`)
  console.error('\nVer issue #184 (encerramento do Capacitor e do runtime patrimonial React).')
  process.exit(1)
}

console.log('[checar-legado-capacitor] OK: nenhum sinal de Capacitor ou runtime patrimonial legado.')
