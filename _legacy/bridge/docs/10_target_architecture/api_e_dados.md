# API e dados

## Objetivo

Dar forma clara ao que o backend novo precisa entregar e ao que o banco precisa sustentar.

## Rotas centrais
- `GET /v1/health`
- `GET /v1/profile/context`
- `PUT /v1/profile/context`
- `GET /v1/dashboard/home`
- `GET /v1/portfolio`
- `GET /v1/portfolio/{portfolioId}/holdings/{holdingId}`
- `GET /v1/history/snapshots`
- `GET /v1/analysis`
- `POST /v1/imports/start`
- `GET /v1/imports/{importId}/preview`
- `POST /v1/imports/{importId}/commit`

## Tabelas centrais no D1
- `users`
- `user_financial_context`
- `platforms`
- `portfolios`
- `assets`
- `asset_types`
- `portfolio_positions`
- `portfolio_snapshots`
- `portfolio_snapshot_positions`
- `imports`
- `import_rows`
- `portfolio_analyses`
- `analysis_insights`
- `operational_events`

## Regras
- o dado do usuário é a base da posição
- snapshot é fotografia de referência
- análise é derivada e persistida
- importação nunca persiste sem preview
- fonte externa complementa, não manda na posição do usuário

## Saídas mínimas por tela

### Home
- patrimônio
- investido
- lucro/prejuízo
- score
- principal problema
- principal ação
- distribuição
- insights
- updatedAt

### Carteira
- resumo
- grupos por categoria
- holdings
- ordens sugeridas

### Detalhe do ativo
- cabeçalho do ativo
- métricas
- score
- contexto da categoria
- link externo quando existir

### Histórico
- snapshots
- eventos

### Importação
- totais
- linhas
- conflitos
- erros

## Meta comum de resposta
Toda rota deve carregar o mínimo abaixo quando fizer sentido:
- `requestId`
- `timestamp`
- `version`
- `source` ou `sourceWarning` quando houver fonte externa
