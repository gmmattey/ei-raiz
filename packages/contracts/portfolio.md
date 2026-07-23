# Portfolio contract

## Route
`GET /v1/portfolio`

Query params:

- `performance=all|best|worst` (opcional)
- `category=<categoryKey>` (opcional)
- `platformId=<platformId>` (opcional)
- `attentionOnly=true|false` (opcional)

## Envelope HTTP

Sucesso:

```json
{ "ok": true, "meta": { "requestId": "uuid", "timestamp": "2026-04-02T00:00:00.000Z", "version": "v1" }, "data": {} }
```

Erro:

```json
{ "ok": false, "meta": { "requestId": "uuid", "timestamp": "2026-04-02T00:00:00.000Z", "version": "v1" }, "error": { "code": "unauthorized", "message": "Sessao nao encontrada." } }
```

Headers:

- `x-request-id` (sempre)
- `x-error-code` (apenas em erro)

## Response shape (data)

O payload da Carteira trabalha por estado (`screenState`):

- `redirect_onboarding`
- `empty`
- `ready`

```json
{
  "screenState": "ready",
  "redirectTo": "/onboarding",
  "portfolioId": "pfl_123",
  "summary": {
    "totalEquity": 120000,
    "totalInvested": 100000,
    "totalProfitLoss": 20000,
    "totalProfitLossPct": 20,
    "statusLabel": "Posicoes ativas"
  },
  "emptyState": { "title": "string", "body": "string", "ctaLabel": "string", "target": "/imports/entry" },
  "groups": [
    {
      "categoryKey": "acoes",
      "categoryLabel": "Acoes",
      "totalInvested": 50000,
      "totalCurrent": 60000,
      "totalProfitLoss": 10000,
      "totalProfitLossPct": 20,
      "holdings": [
        {
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
          "quotationStatus": "priced"
        }
      ]
    }
  ],
  "filters": { "performance": "all", "category": "acoes", "platformId": "plt_xp", "attentionOnly": false },
  "orders": []
}
```

## Rules

- a Carteira deve ser navegavel por relevancia (ordem) e por categoria (grouping).
- `performancePct` pode ser `null` quando `investedAmount` for 0.
