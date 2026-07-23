# Rotas da API

## Primeira leva
- `GET /v1/health`
- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `GET /v1/auth/session`
- `POST /v1/auth/logout`
- `POST /v1/auth/recover`
- `GET /v1/profile/context`
- `PUT /v1/profile/context`
- `GET /v1/dashboard/home`
- `GET /v1/portfolio`

## Segunda leva
- `GET /v1/portfolio/{portfolioId}/holdings/{holdingId}`
- `GET /v1/history/snapshots`
- `GET /v1/history/timeline`
- `GET /v1/analysis`

## Terceira leva
- `POST /v1/imports/start`
- `GET /v1/imports/{importId}/preview`
- `POST /v1/imports/{importId}/commit`
- `GET /v1/history/imports`

## Operacao (interno)
- `GET /v1/ops/events` (protegida por cookie; lista trilha operacional do usuario)

## Regra
Implementar na ordem do menor risco para o maior.
Cada tela só avança quando contrato, backend e dado mínimo estiverem coerentes.
