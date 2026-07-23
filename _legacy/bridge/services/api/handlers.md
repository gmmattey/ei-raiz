# Handlers da API

## Primeira leva

### health
- objetivo: responder disponibilidade mínima
- depende de: conexão básica com D1

### profile/context get
- objetivo: ler contexto do usuário
- depende de: users + user_financial_context

### profile/context put
- objetivo: atualizar contexto do usuário
- depende de: validação mínima + upsert

### dashboard/home
- objetivo: montar a leitura principal da carteira
- depende de: último snapshot + última análise

## Segunda leva

### portfolio
- objetivo: listar categorias e holdings
- depende de: portfolio_positions + assets + asset_types + platforms

### holding detail
- objetivo: aprofundar uma posição
- depende de: portfolio_positions + assets + leitura analítica

### history
- objetivo: mostrar snapshots e eventos
- depende de: portfolio_snapshots + operational_events

## Terceira leva

### imports start
### imports preview
### imports commit

## Regra
Implementar da menor dependência para a maior.
