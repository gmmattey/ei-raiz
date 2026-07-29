# Savro (ex-Esquilo Wallet)

Savro é um app de organização patrimonial **local-first**: Android e iOS nativos (Kotlin
Multiplatform), sem conta, sem nuvem — os dados patrimoniais do usuário nunca saem do aparelho.
Este monorepo também hospeda a landing institucional do Savro.

## Status

- **Mobile oficial (produto ativo):** `aplicativo/` — Kotlin Multiplatform, Android + iOS. Fonte
  da verdade para qualquer trabalho de produto/funcionalidade. Ver
  `documentacao/arquitetura/ADR-002-savro-kmp-multiplataforma.md`.
- **Web (`apresentacao/`):** landing institucional do Savro + páginas legais
  (`/privacidade`, `/termos`, `/suporte`, `/faq`, `/changelog`). Não é mais um app patrimonial —
  o wrapper Capacitor e o runtime React de login/dashboard/carteira foram encerrados na issue
  #184. Publicada em https://esquilo.wallet e https://ei-raiz-web.pages.dev.
- **Backend patrimonial:** encerrado (#184 congelou, #235 decidiu o desligamento). O Worker
  `ei-api-gateway` e os bancos D1 (`esquilo-invest`, `esquilo-invest-dev`, `esquilo-invest-hml`)
  foram excluídos da Cloudflare; o código em `servidores/porta-entrada/`, os contratos
  compartilhados (`bibliotecas/contratos/`) e as migrations D1 (`infra/banco/`) foram removidos
  deste repositório. Não existe mais backend patrimonial ativo — o app KMP nunca dependeu dele
  (dados patrimoniais são só locais). Ver
  `documentacao/arquitetura/auditoria-backend-legado-235.md` para o levantamento que embasou a
  decisão.

## Arquitetura

O projeto usa npm workspaces (frontend + bibliotecas utilitárias) mais um módulo Gradle
independente (`aplicativo/`) para o app KMP.

```text
aplicativo/             App Android + iOS (Kotlin Multiplatform) — mobile oficial, local-first
apresentacao/           Landing institucional + páginas legais (React + Vite) → Cloudflare Pages
bibliotecas/
  utilitarios/           Funções utilitárias internas
  validacao/             Schemas de validação
utilitarios/
  scripts/               Scripts de operação (ícones, guard anti-regressão)
documentacao/           Arquitetura, produto e identidade visual
midia/                  Assets visuais (logos, ícones, fontes)
_legacy/                Gerações anteriores e protótipos relacionados — histórico, não executa
                        (ver _legacy/README.md)
```

## Pré-requisitos

- Node.js 18 ou superior
- npm 9 ou superior

O monorepo usa npm workspaces com **um único lockfile canônico**: `package-lock.json` na raiz.
Nenhum workspace (`apresentacao/`, `bibliotecas/*`) deve ter `package-lock.json` próprio —
`npm ci`/`npm install` sempre rodam a partir da raiz. Um `apresentacao/package-lock.json` aninhado
e dessincronizado existiu até a #184; foi removido, e o guard `npm run checar:legado-capacitor`
falha se um lockfile fora da raiz voltar a ser versionado.

## Desenvolvimento local

```bash
npm install
npm run dev
```

Serviço esperado:

- Web: `http://localhost:3000`

Também é possível usar `./dev-iniciar.sh` / `./dev-parar.sh`.

## Scripts principais

| Comando | Finalidade |
|---|---|
| `npm run dev` | Inicia a landing localmente |
| `npm run build` | Gera os builds dos workspaces |
| `npm run typecheck` | Valida os tipos do monorepo |
| `npm run deploy:web` | Publica o frontend em Pages |
| `npm run checar:legado-capacitor` | Guard: falha se Capacitor ou o runtime patrimonial React removido na #184 voltarem |

`aplicativo/` (Kotlin Multiplatform) não usa npm — ver Gradle wrapper próprio
(`aplicativo/gradlew`) e `.github/workflows/aplicativo-ci.yml`.

## Deploy

Automático via GitHub Actions (`.github/workflows/deploy.yml`) a cada push em `master`:
typecheck → build e deploy do frontend/landing (Cloudflare Pages). O app KMP (`aplicativo/`) não é
publicado por este workflow — release em loja é manual e fora do escopo de CI/CD automático.

## Documentação

- `documentacao/arquitetura/`: decisões e fluxos técnicos, incluindo a migração para KMP
  (ADR-001, ADR-002), o encerramento do Capacitor (#184) e o encerramento do backend patrimonial
  legado (#235)
- `documentacao/produto/`: especificação de produto
- `documentacao/marca/`: identidade visual e design system
- `_legacy/README.md`: origem e papel de cada geração anterior consolidada aqui

## Regras de manutenção

- Documentação que não representa o código atual deve ser atualizada ou arquivada.
- Nada em `_legacy/` deve ser importado pelo código ativo do monorepo.
- Nenhum backend patrimonial novo deve ser reintroduzido em `apresentacao/` — funcionalidade nova
  de produto entra em `aplicativo/`, que é local-first por design.

## Licença

Não definida.
