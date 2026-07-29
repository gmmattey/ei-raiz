# Deploy Cloudflare (Pages + Workers)

## Pré-requisitos
- `wrangler login`
- Worker D1 criado e `database_id` configurado em `apps/api/wrangler.toml`
- Projeto Pages `ei-raiz-web` criado na conta Cloudflare

## Deploy API (Workers)
```bash
npm run deploy:api
```

## Deploy Web (Pages)
```bash
npm run deploy:web
```

## Variáveis de ambiente
- Pages (`apps/web/wrangler.toml`):
  - `VITE_API_BASE_URL`: URL pública do Worker de API
- Worker (`apps/api/wrangler.toml`):
  - `DB` (binding D1)
  - `JWT_SECRET` (secret)

## Configuração de secret da API
```bash
cd apps/api
wrangler secret put JWT_SECRET
```

## Banco D1 em produção
```bash
cd apps/api
wrangler d1 migrations apply ei-raiz --remote
wrangler d1 execute ei-raiz --remote --file ../../banco/seed.sql
```
