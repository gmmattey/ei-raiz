# Fluxo de importacao

## Estado real hoje

O fluxo de importacao esta distribuido entre:

- documentacao de produto
- contratos em Markdown
- rotas do starter D1
- cadeia de PRs `screen-*`

## Caminho integrado observado

Na `main`, a cadeia de merge ja absorveu:

- import manual
- custom template
- B3 CSV
- document assisted import
- preview review
- imports center
- duplicate conflict resolution
- import detail
- onboarding de entrada da carteira

## Onde esta o codigo mais vivo

- `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter/src/routes/imports.ts`
- `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter/src/routes/import_conflicts.ts`
- `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter/src/routes/import_detail.ts`
- `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter/src/routes/onboarding.ts`

## O que ainda falta para tratar como fluxo fechado

- definir backend oficial
- definir contrato HTTP oficial
- trazer parser/extracao assistida da PR `#8` para uma linha coerente com a `main`
- conectar isso a um front integrado real
