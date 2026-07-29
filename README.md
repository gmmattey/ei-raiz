# Savro (ex-Esquilo Wallet)

Savro é um app de organização patrimonial **local-first**: Android e iOS nativos (Kotlin
Multiplatform), sem conta, sem nuvem — os dados patrimoniais do usuário nunca saem do aparelho.
Este monorepo também hospeda a landing institucional e o backend legado (ver "Status" abaixo).

## Status

- **Mobile oficial (produto ativo):** `aplicativo/` — Kotlin Multiplatform, Android + iOS. Fonte
  da verdade para qualquer trabalho de produto/funcionalidade. Ver
  `documentacao/arquitetura/ADR-002-savro-kmp-multiplataforma.md`.
- **Web (`apresentacao/`):** landing institucional do Savro + páginas legais
  (`/privacidade`, `/termos`, `/suporte`, `/faq`, `/changelog`). Não é mais um app patrimonial —
  o wrapper Capacitor e o runtime React de login/dashboard/carteira foram encerrados na issue
  #184. Publicada em https://esquilo.wallet e https://ei-raiz-web.pages.dev.
- **Backend (`servidores/porta-entrada/`):** Worker Cloudflare Gateway do produto patrimonial
  anterior (auth, patrimônio, decisões, mercado). **Congelado** desde a #184: nenhum cliente ativo
  o consome (o app KMP não acessa D1/Worker diretamente — dados patrimoniais são só locais), os
  cron triggers já estavam desativados desde 2026-07-23, e nenhum desenvolvimento novo deve
  ocorrer nele. Segue publicado (não desligado) até uma decisão explícita de exportação/retenção/
  descarte dos dados existentes em D1 — ver issue de acompanhamento vinculada à #184.
  URL: https://ei-api-gateway.giammattey-luiz.workers.dev

### Pendências operacionais conhecidas (2026-07-23)

- Ingestão diária de fundos CVM (`.github/workflows/ingest-cvm.yml`) está com o `schedule`
  desativado — o secret `EI_ADMIN_TOKEN` expirou. Reexecução manual via `workflow_dispatch`
  continua disponível.
- Os 3 cron triggers do Worker (`servidores/porta-entrada/wrangler.toml`) foram removidos
  temporariamente — a conta Cloudflare atingiu o limite de 5 cron triggers. Como o backend está
  congelado desde a #184, esses crons não serão reativados sem decisão explícita.

## Arquitetura

O projeto usa npm workspaces (frontend/backend/contratos) mais um módulo Gradle independente
(`aplicativo/`) para o app KMP.

```text
aplicativo/             App Android + iOS (Kotlin Multiplatform) — mobile oficial, local-first
apresentacao/           Landing institucional + páginas legais (React + Vite) → Cloudflare Pages
servidores/
  porta-entrada/        Backend Cloudflare Worker do produto patrimonial anterior — congelado
bibliotecas/
  contratos/             Tipos TypeScript compartilhados (DTOs) — consumidos pelo backend congelado
  utilitarios/           Funções utilitárias internas
  validacao/             Schemas de validação
infra/
  banco/                 Migrations e seed do D1 do backend congelado
utilitarios/
  scripts/               Scripts de operação (ingestão CVM, backfill, guard anti-regressão)
testes/                 Testes e2e + massa de teste do backend congelado
documentacao/           Arquitetura, produto e identidade visual
midia/                  Assets visuais (logos, ícones, fontes)
_legacy/                Gerações anteriores e protótipos relacionados — histórico, não executa
                        (ver _legacy/README.md)
```

## Pré-requisitos

- Node.js 18 ou superior
- npm 9 ou superior
- Wrangler CLI

O monorepo usa npm workspaces com **um único lockfile canônico**: `package-lock.json` na raiz.
Nenhum workspace (`apresentacao/`, `servidores/porta-entrada/`, `bibliotecas/*`) deve ter
`package-lock.json` próprio — `npm ci`/`npm install` sempre rodam a partir da raiz. Um
`apresentacao/package-lock.json` aninhado e dessincronizado existiu até a #184; foi removido, e o
guard `npm run checar:legado-capacitor` falha se um lockfile fora da raiz voltar a ser versionado.

## Desenvolvimento local

```bash
npm install
npm run dev:all
```

Serviços esperados:

- Web: `http://localhost:3000`
- API: `http://localhost:8787`

Também é possível executar os ambientes separadamente:

```bash
npm run dev
npm run dev:api
```

## Scripts principais

| Comando | Finalidade |
|---|---|
| `npm run dev:all` | Inicia web e API |
| `npm run build` | Gera os builds dos workspaces |
| `npm run typecheck` | Valida os tipos do monorepo |
| `npm run deploy:api` | Publica a API em Workers |
| `npm run deploy:web` | Publica o frontend em Pages |
| `npm run test:api` | Roda os testes do backend |
| `npm run ingest:cvm` | Ingestão de fundos CVM |
| `npm run backfill:cvm-monthly` | Backfill de histórico mensal CVM |
| `npm run checar:legado-capacitor` | Guard: falha se Capacitor ou o runtime patrimonial React removido na #184 voltarem |

`aplicativo/` (Kotlin Multiplatform) não usa npm — ver Gradle wrapper próprio
(`aplicativo/gradlew`) e `.github/workflows/aplicativo-ci.yml`.

## Deploy

Automático via GitHub Actions (`.github/workflows/deploy.yml`) a cada push em `master`:
typecheck → build e deploy do frontend/landing (Cloudflare Pages) → deploy do Worker (backend
congelado). O app KMP (`aplicativo/`) não é publicado por este workflow — release em loja é
manual e fora do escopo de CI/CD automático.

## Documentação

- `documentacao/arquitetura/`: decisões e fluxos técnicos, incluindo a migração para KMP
  (ADR-001, ADR-002) e o encerramento do Capacitor (#184)
- `documentacao/produto/`: especificação de produto
- `documentacao/marca/`: identidade visual e design system
- `_legacy/README.md`: origem e papel de cada geração anterior consolidada aqui

## Regras de manutenção

- Contratos compartilhados devem permanecer em `bibliotecas/contratos/`.
- Regras de domínio não devem ser duplicadas entre web e API.
- Mudanças em banco precisam incluir migration versionada em `infra/banco/migrations/`.
- Documentação que não representa o código atual deve ser atualizada ou arquivada.
- Nada em `_legacy/` deve ser importado pelo código ativo do monorepo.
- Nenhum desenvolvimento patrimonial novo deve ocorrer em `apresentacao/` ou
  `servidores/porta-entrada/` — esse backend está congelado (ver "Status"). Funcionalidade nova de
  produto entra em `aplicativo/`.

## Licença

Não definida.
