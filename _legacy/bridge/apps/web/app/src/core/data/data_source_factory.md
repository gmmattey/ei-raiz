# Data source factory

## Objetivo
Trocar a origem dos dados sem reescrever tela.

## Ambientes previstos
- `local`
- `hml`
- `prd`

## Contrato esperado
A factory resolve providers para:
- dashboard
- portfolio
- profile
- holdingDetail
- history
- analysis
- health

## Regra
A tela nunca faz `fetch` direto.
A tela recebe um provider pronto.

## Exemplo de decisão
- `local` -> mock JSON (mesmo schema do hml)
- `hml` -> mock JSON
- `prd` -> HTTP real (backend novo)

## Meta
Deixar o front plug and play, sem gambiarra de ambiente espalhada.
