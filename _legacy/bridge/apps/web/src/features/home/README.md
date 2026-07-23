# Feature Home

## Objetivo
Responder rápido como a carteira está, qual é o principal ponto de atenção e qual é a próxima ação.

## Entradas esperadas
- `dashboard_home.json` no local mock
- `GET /v1/dashboard/home` no provider HTTP

## Blocos mínimos
- hero de patrimônio
- card do principal problema
- card da principal ação
- score
- distribuição
- insights
- updatedAt

## Regra
A Home deve caber em leitura rápida.
Uma ação principal por vez.

## Navegacao (E2E-010)
- CTA principal vem de `primaryAction.target`
- targets devem ser validados contra o router para evitar rota orfa
