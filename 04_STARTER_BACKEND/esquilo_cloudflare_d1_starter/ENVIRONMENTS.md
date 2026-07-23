# Ambientes do Worker (local / hml / production)

Este runtime usa o `wrangler.toml` como fonte de configuracao de ambiente.

## Pre-requisitos

- Node instalado (o projeto usa `wrangler` como devDependency)
- Dependencias instaladas:

```bash
npm install
```

## Regra desta fase

- sempre executar com `--env local|hml|production`
- os IDs reais do D1 **não ficam commitados**: preencher `REPLACE_WITH_*` no `wrangler.toml` localmente e **não commitar** essa mudança
- em CI/CD, passar os IDs via variável de ambiente ou secret do pipeline
- secrets não ficam em arquivo: usar `wrangler secret put` por ambiente

> ⚠️ O `database_id` de produção foi removido do `wrangler.toml` por segurança.
> Preencha `REPLACE_WITH_PROD_D1_DATABASE_ID` localmente antes de fazer deploy.
> O ID pode ser obtido em: Cloudflare Dashboard → Workers & Pages → D1.

## O que voce precisa configurar

### 1) D1 (obrigatorio)

No `wrangler.toml`, preencher:

- `REPLACE_WITH_LOCAL_D1_DATABASE_ID`
- `REPLACE_WITH_HML_D1_DATABASE_ID`
- `REPLACE_WITH_PROD_D1_DATABASE_ID`

E manter os `database_name` consistentes com os nomes criados no Cloudflare.

#### Criar D1 (Cloudflare)

Nomes definidos no `wrangler.toml`:

- local: `esquilo-invest-local`
- hml: `esquilo-invest-hml`
- production: `esquilo-invest`

Criar cada banco e copiar o `database_id` retornado para o `wrangler.toml`:

```bash
npx wrangler d1 create esquilo-invest-local
npx wrangler d1 create esquilo-invest-hml
npx wrangler d1 create esquilo-invest
```

### 2) R2 (por enquanto so hml/prd)

No `wrangler.toml`, criar os buckets com os nomes:

- `esquilo-invest-imports-hml`
- `esquilo-invest-imports`

Ou alterar o `bucket_name` e manter o nome real em Cloudflare.

#### Criar R2 (Cloudflare)

```bash
npx wrangler r2 bucket create esquilo-invest-imports-hml
npx wrangler r2 bucket create esquilo-invest-imports
```

### 3) Secrets (quando usar)

Exemplos de secrets esperados pelo runtime:

- `APPS_SCRIPT_RECOVERY_SECRET`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`

Exemplo:

```bash
npx wrangler secret put APPS_SCRIPT_RECOVERY_SECRET --env hml
npx wrangler secret put APPS_SCRIPT_RECOVERY_SECRET --env production
```

## Como rodar

### Local

```bash
npm run dev
```

### HML

```bash
npm run deploy:hml
```

### Producao

```bash
npm run deploy:prod
```

## Aplicar schema e seeds

O schema oficial esta em `../../database/d1/schema.sql`.
As seeds estao em `../../database/seeds/*`.

Regra:

- aplicar `schema.sql` antes de qualquer seed
- aplicar `seed_base.sql` antes dos cenarios extras

### Comandos (sem adivinhacao)

Regra: sempre usar `--env local|hml|production` para reduzir o risco de executar no banco errado.

Opcao A (rodar no D1 remoto do ambiente): em algumas versoes do `wrangler`, isso exige `--remote`.

```bash
# schema
npx wrangler d1 execute esquilo-invest-local --env local --file=../../database/d1/schema.sql --remote
npx wrangler d1 execute esquilo-invest-hml --env hml --file=../../database/d1/schema.sql --remote
npx wrangler d1 execute esquilo-invest --env production --file=../../database/d1/schema.sql --remote

# seeds base
npx wrangler d1 execute esquilo-invest-local --env local --file=../../database/seeds/seed_base.sql --remote
npx wrangler d1 execute esquilo-invest-hml --env hml --file=../../database/seeds/seed_base.sql --remote
npx wrangler d1 execute esquilo-invest --env production --file=../../database/seeds/seed_base.sql --remote
```

Opcao B (rodar em modo local/Miniflare): em algumas versoes do `wrangler`, isso exige `--local`.

Se voce for usar modo local, valide os flags com `npx wrangler d1 execute --help` no seu ambiente para nao executar no alvo errado.
