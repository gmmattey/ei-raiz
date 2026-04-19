# Setup - Deploy Automático Cloudflare

## Configuração do GitHub Secrets

O workflow de deploy automático requer 2 secrets no GitHub:

### 1. CLOUDFLARE_API_TOKEN
Token de API do Cloudflare com permissões de deploy

**Como obter:**
1. Acesse https://dash.cloudflare.com/profile/api-tokens
2. Clique "Create Token"
3. Use o template "Edit Cloudflare Workers" ou crie custom com permissões:
   - Account > Cloudflare Workers Scripts > Edit
   - Account > Pages Build & Deployment > Edit
   - Zone > Workers KV Storage > Write

**Para adicionar no GitHub:**
1. Abra seu repositório no GitHub
2. Settings → Secrets and variables → Actions
3. Clique "New repository secret"
4. Nome: `CLOUDFLARE_API_TOKEN`
5. Colar o token

### 2. CLOUDFLARE_ACCOUNT_ID
ID da sua conta Cloudflare

**Como obter:**
1. Acesse https://dash.cloudflare.com/
2. URL de exemplo: https://dash.cloudflare.com/`12a3b4c5d6e7f8g9h0i1j2k3l4m5n6o7`
3. O ID é a string após `/` no dashboard

**Para adicionar no GitHub:**
1. Settings → Secrets and variables → Actions
2. Clique "New repository secret"
3. Nome: `CLOUDFLARE_ACCOUNT_ID`
4. Colar o ID

## Como funciona

Quando houver push para `master`:
1. GitHub Actions executa o workflow
2. Instala dependências (`npm ci`)
3. Roda typecheck (continua mesmo se falhar)
4. Deploy frontend: `npm run deploy:web`
   - Build React + deploy para Cloudflare Pages
5. Deploy backend: `npm run deploy:api`
   - Deploy Cloudflare Workers (@ei/api)

## Verificar Deploy

Após o push:
1. Abra https://github.com/seu-repo/actions
2. Veja o workflow "Deploy to Cloudflare"
3. Clique para ver logs detalhados
4. URLs após sucesso:
   - Frontend: https://ei-raiz-web.pages.dev (ou custom domain)
   - Backend: https://ei-api-gateway.giammattey-luiz.workers.dev

## Troubleshooting

**"Unauthorized" error:**
- Verifique se o token está correto
- Verifique se o token tem permissões suficientes
- Tente gerar um novo token

**"Account ID not found":**
- Verifique se o Account ID está correto
- Sem caracteres especiais ou espaços extras

**Build falha:**
- Rode `npm run typecheck` localmente para debugar
- Rode `npm run build` para ver erro de build
