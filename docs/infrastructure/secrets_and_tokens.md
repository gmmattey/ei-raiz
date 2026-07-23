# Secrets and Tokens

## Objective
Define all sensitive values required by Esquilo Invest without storing real secrets in the repository.

## Rules
- never commit real secrets
- keep only templates and naming conventions in the repository
- use environment variables for all tokens and credentials
- document where each variable is used

## Required secrets

### Auth recovery via Apps Script
- APPS_SCRIPT_RECOVERY_URL
- APPS_SCRIPT_RECOVERY_SECRET

Used by:
- auth screen backend
- password recovery flow in the initial delivery

### Telegram
- TELEGRAM_BOT_TOKEN
- TELEGRAM_DEFAULT_CHAT_ID (optional fallback)

Used by:
- notifications module

### AI providers
- OPENAI_API_KEY
- GEMINI_API_KEY

Used by:
- ia_translation layer only

### Cloudflare
- CLOUDFLARE_ACCOUNT_ID
- CLOUDFLARE_D1_DATABASE_ID
- CLOUDFLARE_API_TOKEN

Used by:
- deployment and database access

## Final rule
If a secret is not documented here, it should not be introduced silently in code.
