# Holding detail contract

## Route
`GET /v1/portfolio/{portfolioId}/holdings/{holdingId}`

## Envelope HTTP

Sucesso:

```json
{ "ok": true, "meta": { "requestId": "uuid", "timestamp": "2026-04-02T00:00:00.000Z", "version": "v1" }, "data": {} }
```

Erro:

```json
{ "ok": false, "meta": { "requestId": "uuid", "timestamp": "2026-04-02T00:00:00.000Z", "version": "v1" }, "error": { "code": "holding_not_found", "message": "Ativo nao encontrado." } }
```

Headers:

- `x-request-id` (sempre)
- `x-error-code` (apenas em erro)

## Response shape (data)

Pode retornar redirect:

```json
{ "screenState": "redirect_onboarding", "redirectTo": "/onboarding" }
```

No caminho feliz:

```json
{
  "holding": {
    "id": "pos_123",
    "assetId": "ast_123",
    "code": "ITSA4",
    "name": "Itausa",
    "categoryKey": "acoes",
    "categoryLabel": "Acoes",
    "platformId": "plt_xp",
    "platformName": "XP Investimentos",
    "quantity": 10,
    "averagePrice": 13.5,
    "currentPrice": 14.5,
    "currentValue": 145,
    "investedAmount": 135,
    "performanceValue": 10,
    "performancePct": 7.4,
    "allocationPct": 1.2,
    "recommendation": "Manter e monitorar",
    "statusLabel": "Cotacao disponivel",
    "quotationStatus": "priced",
    "notes": "",
    "stopLoss": null,
    "targetPrice": null,
    "sourceKind": "manual",
    "assetTypeCode": "STOCK"
  },
  "ranking": {
    "score": 70,
    "status": "Neutro",
    "motives": [],
    "opportunityScore": 70
  },
  "recommendation": {
    "code": "hold_and_monitor",
    "title": "Manter e monitorar",
    "body": "Texto"
  },
  "categoryContext": {
    "categoryKey": "acoes",
    "categoryLabel": "Acoes",
    "categoryRisk": "Neutra",
    "categoryRecommendation": "Sem recomendacao consolidada especifica",
    "primaryMessage": "Contexto...",
    "holdingsCount": 3,
    "totalCurrent": 60000,
    "totalInvested": 50000,
    "totalProfitLoss": 10000,
    "totalProfitLossPct": 20
  },
  "externalLink": "https://www.google.com/finance/quote/ITSA4:BVMF",
  "benchmarkComparison": {
    "benchmark": "CDI",
    "fromDate": "2026-01-01",
    "toDate": "2026-04-01",
    "benchmarkAccumulatedPct": 3.21,
    "holdingPerformancePct": 2.5,
    "deltaPct": -0.71,
    "status": "ok",
    "label": "Abaixo do CDI"
  }
}
```

## Rules

- detalhe aprofunda sem virar relatorio gigante.
- a recomendacao deve ser coerente com peso (`allocationPct`) e performance (`performancePct`).
- `benchmarkComparison` e complementar e pode ser `null` quando a referencia externa estiver desabilitada ou indisponivel.
