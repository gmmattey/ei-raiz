# Environment Variables

## Objective
Define all environment variables required to run the system locally and in production.

## Naming convention
- uppercase
- snake_case
- prefix by domain when necessary

## Variables

### Core
- NODE_ENV=development | production
- APP_PORT=3000
- API_VERSION=v1
- APP_ENV=local | hml | production

### Database
- D1_DATABASE_ID
- D1_DATABASE_NAME

### Auth / Recovery
- APPS_SCRIPT_RECOVERY_URL
- APPS_SCRIPT_RECOVERY_SECRET

### Telegram
- TELEGRAM_BOT_TOKEN
- TELEGRAM_DEFAULT_CHAT_ID

### AI
- OPENAI_API_KEY
- GEMINI_API_KEY

## Example (.env.example)

NODE_ENV=development
APP_PORT=3000
API_VERSION=v1
APP_ENV=local

D1_DATABASE_ID=your_database_id
D1_DATABASE_NAME=esquilo

APPS_SCRIPT_RECOVERY_URL=
APPS_SCRIPT_RECOVERY_SECRET=

TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_DEFAULT_CHAT_ID=

OPENAI_API_KEY=
GEMINI_API_KEY=

## Rule
If a variable is required by a module, it must be declared here and in .env.example.

## Observacao (Cloudflare Worker)

No runtime atual (Cloudflare Worker), variaveis podem vir de:

- `wrangler.toml` (`[vars]` e `env.<name>.vars`)
- secrets via `wrangler secret put` por ambiente

IDs e nomes de D1/R2 sao configuracao do `wrangler.toml`, nao `.env`.
