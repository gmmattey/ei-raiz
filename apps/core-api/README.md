# apps/core-api

Destino da extracao modular do backend atual.

Regra desta fase:

- `src/index.ts` continua sendo a entrypoint real
- esta pasta vai receber modulos por dominio
- a extracao deve acontecer sem quebrar contratos vivos

Estado atual:

- `types.ts` concentra os tipos base de runtime compartilhados (`Bindings` e `Variables`)
- `domain/assets.ts` concentra enums e tipos canonicos do dominio de ativos
- `runtime/db.ts` e `runtime/lifecycle.ts` concentram helpers compartilhados de tabela/eventos
- `market/brapi.ts` concentra o refresh do provider vivo de cotacao
- `ai/display-name.ts` concentra o helper de Smart Labels herdado do runtime atual
- `auth.ts` concentra as rotas publicas de autenticacao e o middleware JWT
- `routes/public.ts`, `routes/assets-create.ts`, `routes/history.ts`, `routes/import.ts` e `routes/ai-analysis.ts` absorveram os endpoints vivos restantes
- `routes/goods.ts`, `routes/portfolio.ts`, `routes/assets-detail.ts` e `routes/assets-mutations.ts` ja nasceram como extracoes reais de dominio
- `src/index.ts` agora atua majoritariamente como composicao do core-api e wiring do scheduler vivo
- a meta continua sendo composicao fina no entrypoint vivo, sem cutover prematuro
