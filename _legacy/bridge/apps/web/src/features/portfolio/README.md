# Feature Portfolio

## Objetivo
Ler a carteira por categoria e por ativo sem confusão.

## Entradas esperadas
- `portfolio.json` no local mock
- `GET /v1/portfolio` no provider HTTP

## Blocos mínimos
- resumo da carteira
- grupos por categoria
- holding tile
- concentracao por ativo e por instituicao (view model, sem layout)
- filtros básicos
- acesso ao detalhe do ativo

## Regra
A carteira precisa ser legível mesmo sem filtro avançado no começo.
Agrupamento por categoria e a base da leitura macro (US029).

## Filtros (contrato atual)
- `performance=all|best|worst` (opcional)

## Filtros locais (sem inventar contrato)
- `categoryKey` e `platformId` podem ser aplicados no front sobre o payload atual
