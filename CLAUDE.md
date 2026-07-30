# Savro — Guia do Ambiente

Savro é um app de organização patrimonial **local-first** para investidores brasileiros: Android e
iOS nativos (Kotlin Multiplatform), sem conta, sem nuvem — os dados patrimoniais do usuário nunca
saem do aparelho. Ver `documentacao/arquitetura/ADR-002-savro-kmp-multiplataforma.md`.

Este monorepo também hospeda a landing institucional do Savro (`apresentacao/`). Não há backend
patrimonial ativo: o Worker Cloudflare `ei-api-gateway` e os bancos D1 do produto anterior
(Esquilo Invest) foram encerrados na issue #235, após congelamento na #184 — ver
`documentacao/arquitetura/auditoria-backend-legado-235.md` e o histórico arquivado em
`documentacao/arquitetura/_archive/`.

---

## Estrutura do Monorepo

```
esquilo-wallet/
├── aplicativo/             # App KMP Android + iOS — mobile oficial, local-first
├── apresentacao/           # Landing institucional + páginas legais → Cloudflare Pages
├── bibliotecas/
│   ├── utilitarios/         # Funções utilitárias internas
│   └── validacao/           # Schemas de validação
├── utilitarios/
│   └── scripts/             # Scripts Node.js de operação (ícones, guard anti-regressão)
├── documentacao/            # Arquitetura, produto, marca
├── midia/                   # Assets visuais (logos, ícones, fontes)
└── _legacy/                 # Gerações anteriores — histórico, somente leitura
```

---

## Frontend (`apresentacao/`)

React + Vite → Cloudflare Pages (`savro-site`). Hoje é só a landing (`features/landing/`) e as
páginas legais (`features/legal/`) — o wrapper Capacitor e o runtime patrimonial autenticado
(login, dashboard, carteira, aportes, insights, importação, decisões, perfil, admin) foram
removidos na #184.

### Deploy

Automático via GitHub Actions (`.github/workflows/deploy.yml`) a cada push em `master`:
typecheck → build → deploy no Cloudflare Pages.

URL: https://savro-site.pages.dev

### Variáveis de ambiente (`apresentacao/wrangler.toml`)

| Variável | Uso |
|----------|-----|
| `VITE_PUBLIC_SITE_URL` | URL pública oficial do site (sitemap/robots/canonical) |
| `VITE_SUPPORT_EMAIL` | Canal de suporte/privacidade exibido em Privacidade/Termos/Suporte |

---

## App KMP (`aplicativo/`)

Não segue as convenções deste documento — é um módulo Gradle/Kotlin próprio. Ver
`documentacao/arquitetura/ADR-001-savro-android-local-first.md` e
`documentacao/arquitetura/ADR-002-savro-kmp-multiplataforma.md`.

---

## Regras de nomenclatura ativas

### TypeScript (`apresentacao/`, `bibliotecas/`)

- DTOs em `camelCase`; tipos em `PascalCase`.
- Sufixos: `Entrada`, `Saida`, `Filtro`, `Resumo`, `Dto`.

### Palavras banidas no código

Herdadas do domínio patrimonial (`portfolio`, `financial-core`, `insights`/`analytics`,
`carteira`, `assets`, `posicoes`, `snapshot`, `unified`/`_v2`) — não reintroduzir sem decisão
explícita de trazer de volta um backend patrimonial.

---

## Backend patrimonial legado (histórico)

Arquitetura completa do Worker `ei-api-gateway`, das 26 tabelas + 9 views do D1 e dos 35 endpoints
que existiram: `documentacao/arquitetura/_archive/2026-07-29_CLAUDE-backend-congelado.md`,
`2026-07-29_backend-target-architecture.md` e `2026-07-29_backend-rebuild-report.md`. Não usar
como referência de arquitetura ativa — só para investigação histórica.
