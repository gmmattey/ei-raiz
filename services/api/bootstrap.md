# Bootstrap inicial da API

## Primeiras rotas a implementar
1. `GET /v1/health`
2. `GET /v1/profile/context`
3. `PUT /v1/profile/context`
4. `GET /v1/dashboard/home`
5. `GET /v1/portfolio`

## Regra de implementação
- começar pelo caminho feliz
- manter contrato estável
- repositório concentra SQL
- rota concentra composição
- UI não precisa saber de banco

## Ordem sugerida
1. health
2. profile/context
3. dashboard/home
4. portfolio
5. holding detail

## Regra de retorno
Toda rota deve tentar seguir envelope com:
- `meta.requestId`
- `meta.timestamp`
- `meta.version`
- `data`
