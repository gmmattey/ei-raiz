# Runbook Backend (Cloudflare Worker + D1)

Objetivo: deixar o backend novo **instalavel, executavel, validavel e deployavel** sem ritual tribal.

Escopo: runtime atual em `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter` (Cloudflare Worker + D1).

## Pre-requisitos

- Node instalado (para `npm` / `npx`)
- Conta Cloudflare com acesso ao projeto
- `wrangler` via `npx` (usa devDependency do starter)

## Setup local (primeira vez)

1. Entrar na pasta do runtime:

```bash
cd 04_STARTER_BACKEND/esquilo_cloudflare_d1_starter
```

2. Instalar dependencias:

```bash
npm install
```

3. Login no Cloudflare:

```bash
npx wrangler login
```

## Ambientes e bindings

Regra: **sempre operar com ambiente explicito** (`--env local|hml|production`).

Fonte de verdade da configuracao operacional:

- `04_STARTER_BACKEND/esquilo_cloudflare_d1_starter/wrangler.toml`

Se a `main` ainda nao tiver a configuracao por ambiente fechada, ver PR da TEC-003 (#172).

## D1 (criar e configurar)

Criar os bancos (nomes sao exemplos; manter consistentes com `wrangler.toml`):

```bash
npx wrangler d1 create esquilo-invest-local
npx wrangler d1 create esquilo-invest-hml
npx wrangler d1 create esquilo-invest
```

Copiar os `database_id` retornados e preencher no `wrangler.toml` do starter.

## (Opcional) R2 (importacao)

Criar buckets:

```bash
npx wrangler r2 bucket create esquilo-invest-imports-hml
npx wrangler r2 bucket create esquilo-invest-imports
```

## Secrets

Secrets **nao** ficam em `.env`. Setar por ambiente:

```bash
npx wrangler secret put APPS_SCRIPT_RECOVERY_SECRET --env hml
npx wrangler secret put APPS_SCRIPT_RECOVERY_SECRET --env production
```

## Aplicar schema + seeds

Ordem:

1. `database/d1/schema.sql`
2. `database/seeds/seed_reference_minimal.sql` (production: apenas referencias minimas)
3. `database/seeds/seed_base.sql` (somente local/hml: cenarios de teste)
4. seeds extras (se existir)

Exemplo (D1 remoto por ambiente; algumas versoes exigem `--remote`):

```bash
npx wrangler d1 execute esquilo-invest-local --env local --file=../../database/d1/schema.sql --remote
npx wrangler d1 execute esquilo-invest-local --env local --file=../../database/seeds/seed_reference_minimal.sql --remote
npx wrangler d1 execute esquilo-invest-local --env local --file=../../database/seeds/seed_base.sql --remote
```

## Rodar local

```bash
npx wrangler dev --env local
```

## Deploy (hml / production)

```bash
npx wrangler deploy --env hml
npx wrangler deploy --env production
```

## Validacao pos-deploy

1. Health:

```bash
curl -i https://<host>/v1/health
```

Esperado:

- status `200`
- body JSON com `ok: true`

2. Correlacao (quando disponivel):

- `x-request-id` em toda resposta
- `x-error-code` em respostas de erro

3. Trilha operacional (quando disponivel):

```bash
curl -i https://<host>/v1/ops/events
```

Obs: exige cookie de sessao (`esquilo_session`).

## Diagnostico rapido

- Procure o `x-request-id` e use como chave de correlacao no log do Worker.
- Em erro, use `x-error-code` para agrupar falhas por tipo (sem depender de texto livre).
- Eventos persistidos em `operational_events` complementam o log (menos volatil).

