# PRs, branches e dependencias de merge

## Base auditada

- `main` sincronizada em `10d0519`
- GitHub tratado como verdade de integracao

## O que entrou na `main`

PRs merged recentes observadas:

- `#7` `gap0-align-auth-and-contracts`
- `#245` `screen-10-import-detail`
- `#11` `screen-9-duplicate-conflict-resolution`
- `#10` `screen-7-4-imports-center`
- `#253` `screen-7-3-import-preview-review`
- `#252` `screen-7-2c-document-ai-parse`
- `#251` `screen-7-2b-b3-csv-import`
- `#250` `screen-7-2a-custom-template-import`
- `#249` `screen-7-manual-import`
- `#248` `screen-6-analysis`
- `#247` `screen-5-history-snapshots`
- `#246` `screen-4-2-holding-detail`

Leitura importante:

- a cadeia de telas `screen-4` ate `screen-10` foi parcialmente integrada pela `main`
- a tela `screen-8-portfolio-onboarding-entry` ficou fora da cadeia integrada por um periodo e foi absorvida pela PR `#9`

## PR resolvida recentemente

### PR `#9` `Add portfolio entry onboarding flow`

Estado atual:

- merged em `2026-04-02T02:59:06Z`
- merge commit: `10d0519`
- base final: `main`
- head: `screen-8-portfolio-onboarding-entry`

O que foi resolvido:

- o conflito em `src/index.ts` foi composto preservando as rotas mais novas da `main`
- o conflito em `src/types/contracts.ts` foi composto preservando os contratos mais novos da `main`
- foram integrados:
  - `src/lib/portfolio_onboarding_service.ts`
  - `src/routes/onboarding.ts`
  - a rota `GET /v1/onboarding/portfolio-entry`
  - a interface `PortfolioEntryOnboardingData`

Arquivos afetados no merge:

- `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter/src/index.ts`
- `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter/src/lib/portfolio_onboarding_service.ts`
- `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter/src/routes/onboarding.ts`
- `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter/src/types/contracts.ts`

Leitura:

- a PR estava envelhecida e conflitada
- foi trazida para a `main` com resolucao manual e segura
- continua valendo a ressalva estrutural: ela mexe no starter, nao na trilha oficial `services/api`

Status: `completo`

## PR aberta fora da `main`

### PR `#8` `Evolve assisted extraction engine for raw files`

Estado atual:

- aberta
- `mergeStateStatus=CLEAN` em relacao a propria base
- base: `service-assisted-extraction-engine`
- head: `service-assisted-extraction-engine-v2`

Comparacao com a `main`:

- `ahead_by=5`
- `behind_by=19`
- merge base antiga: `db91698`

Arquivos afetados:

- `04_STARTER_BACKEND/esquilo_extraction_engine/*`
- `docs/30_data/extraction_audit_schema.sql`
- `tmp_po_issue_bodies/.keep`

Leitura:

- a PR segue uma trilha tecnica paralela
- nao esta encadeada sobre a `main`
- entrega um modulo novo de extracao fora da area oficial `services/api`

Status: `parcial`

## Dependencias de merge relevantes

### Cadeia integrada na `main`

A `main` hoje absorveu esta sequencia funcional:

- detalhe
- historico
- analysis
- import manual
- import custom template
- import B3 CSV
- import documento assistido
- preview review
- imports center
- duplicate conflict resolution
- import detail

### Lacuna historica fechada

`screen-8-portfolio-onboarding-entry` foi finalmente integrado.

Impacto:

- a cadeia historica de telas/importacao deixou de ter esse buraco
- a prioridade de merge aberta restante saiu do onboarding e ficou concentrada no motor de extracao

### Linha de extracao assistida

A linha `service-assisted-extraction-engine -> service-assisted-extraction-engine-v2` segue paralela e sem merge na `main`.

Impacto:

- a estrategia de parsing assistido por arquivo ainda nao faz parte da base integrada

## Diagnostico de merge

- cadeia `screen-*` integrada ate a tela 8: `parcial`
- onboarding de entrada via PR `#9`: `completo`
- motor de extracao via PR `#8`: `parcial`
- seguranca de merge geral: `media para baixa`

Motivo:

- a `main` absorveu boa parte da cadeia de telas
- a PR aberta restante `#8` ainda nao parte da `main`
- a trilha integrada continua sem consolidacao estrutural da area oficial de backend
