# Feature Holding Detail

## Objetivo
Aprofundar um ativo sem virar relatorio: situacao, recomendacao e contexto da categoria.

## Entradas esperadas
- `holding_detail_pos_1.json` no local mock
- `holding_detail_pos_bal_3.json` e `holding_detail_pos_bal_4.json` no local mock (fundos/previdencia)
- `GET /v1/portfolio/{portfolioId}/holdings/{holdingId}` no provider HTTP

## Estados
- `redirect_onboarding`: orientar para onboarding
- caminho feliz: `holding` + `recommendation` + `categoryContext` + `externalLink`

## Regra
Detalhe existe para orientar decisao. Se nao muda acao, nao merece complexidade.

## Tipos (US034/US035)
A tela pode variar blocos com base em `holding.assetTypeCode` (ex.: `FUND` vs `PENSION`) sem mudar o contrato base.

## Implementacao (sem layout)
`holding_detail_controller.ts` centraliza leitura do contrato e targets de navegacao.

Blocos de view model (US036/US038):
- `summary`: cabecalho + papel na carteira + metricas chave (sem inventar contrato)
- `attentionSignals`: sinais de atencao derivados de dados ja existentes (cotacao, peso, performance, guardrails)

Blocos (US037):
- `positiveSignals`: sinais positivos objetivos (cotacao, performance, guardrails, peso) para equilibrar a leitura

US041:
- `summary.roleMessage` considera `assetTypeCode=PENSION` para explicar papel estrategico da previdencia sem depender de UI/layout
