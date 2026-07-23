# Payload examples

## Home
Arquivo: `mock/local/dashboard_home.json`

Deve conter:
- hero
- problema principal
- ação principal
- score
- distribuição
- insights
- updatedAt

## Carteira
Arquivo: `mock/local/portfolio.json`

Deve conter:
- summary
- groups
- holdings
- orders

## Detalhe do ativo
Arquivo: `mock/local/holding_detail_tesouro.json`
ou um por ativo principal

Deve conter:
- holding
- ranking
- categoryContext
- externalLink

## Perfil
Arquivo: `mock/local/profile_context.json`

Deve conter:
- userId
- displayName
- context
- backendHealth
- displayPreferences

## Histórico
Arquivo: `mock/local/history_snapshots.json`

Deve conter:
- snapshots
- events

## Análise
Arquivo: `mock/local/analysis.json`

Deve conter:
- score
- problema principal
- ação principal
- insights
- generatedAt

## Import preview
Arquivo: `mock/local/import_preview.json`

Deve conter:
- totals
- rows
- duplicados
- inválidos
- conflitos
