# Esquilo Invest Backend Starter

Starter real para a nova base do backend em **Cloudflare Workers + D1**.

## Objetivo

Servir como ponto de partida para:
- API HTTP do produto novo
- schema inicial do D1
- contratos TypeScript estáveis para Home, Carteira, Importação, Perfil, Histórico e Análise
- estrutura de rotas e repositórios sem dependência do Apps Script

## Premissas

- Apps Script é **legado congelado**
- nova versão não depende de Google runtime
- persistência principal em **D1**
- arquivos brutos de importação podem ir para **R2**
- este starter prioriza clareza arquitetural e contratos estáveis

## Estrutura

- `sql/schema.sql`: schema inicial do banco
- `src/index.ts`: roteador principal do Worker
- `src/routes/*`: handlers por domínio
- `src/contracts/*`: contratos de payload
- `src/repositories/*`: ponto de acesso ao D1
- `src/lib/*`: utilitários de ambiente, HTTP e banco

## Rotas iniciais

- `GET /health`
- `GET /api/v1/dashboard`
- `GET /api/v1/portfolio`
- `GET /api/v1/analysis`
- `GET /api/v1/profile`
- `PUT /api/v1/profile/context`
- `GET /api/v1/history`
- `POST /api/v1/imports/preview`
- `POST /api/v1/imports/commit`

## Próximos passos

1. criar o banco D1 com `sql/schema.sql`
2. ligar `DB` no `wrangler.toml`
3. substituir os repositórios stub por queries reais
4. adicionar auth mínima
5. integrar R2 para upload de importações
6. cobrir com testes

## Comandos esperados

```bash
npm install
npm run typecheck
npm run dev
npm run deploy
```
