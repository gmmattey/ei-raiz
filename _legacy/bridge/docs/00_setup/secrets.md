# Segredos e tokens (MVP)

Objetivo: rodar e fazer deploy sem espalhar tokens em chats/arquivos, e sem nunca versionar segredos no Git.

## Regras

- Nunca commitar `.env`, `.env.local`, `.dev.vars` ou similares.
- Só versionar `.env.example` com chaves vazias.
- Token real entra por:
  - ambiente local (arquivo ignorado pelo git), ou
  - `wrangler secret put` (Cloudflare Workers), ou
  - Secrets do GitHub (CI).

## Local (dev)

1. Copie o exemplo para um arquivo local (não versionado):

   - `apps/web/app/.env.example` -> `apps/web/app/.env.local`

2. Preencha:

   - `VITE_API_BASE_URL` (quando existir backend real publicado)
   - `VITE_APP_ENV`
   - `VITE_DATA_SOURCE_MODE`

Obs: o repositório ignora automaticamente `.env*` e `.dev.vars*` via `.gitignore`.

## Cloudflare Workers (quando houver Worker oficial)

- Segredos sensíveis devem virar secret no Worker (não variáveis em texto plano):
  - `wrangler secret put OPENAI_API_KEY`
  - `wrangler secret put TELEGRAM_BOT_TOKEN`

- Variáveis não sensíveis podem ficar em `wrangler.toml` como `vars`.

## GitHub Actions (CI)

- Preferir Secrets do repositório para credenciais de CI/deploy.
- Nunca “ecoar” secrets em logs de build.

## Checklist de rotação

- Rotacionar imediatamente se um token aparecer em commit/log/chat.
- Revogar token antigo na plataforma (Cloudflare/OpenAI/etc).
- Atualizar secrets no Worker e/ou GitHub.
