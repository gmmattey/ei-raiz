# Home (Dashboard) contract

## Route
`GET /v1/dashboard/home`

## Envelope HTTP

Sucesso:

```json
{
  "ok": true,
  "meta": { "requestId": "uuid", "timestamp": "2026-04-02T00:00:00.000Z", "version": "v1" },
  "data": {}
}
```

Erro:

```json
{
  "ok": false,
  "meta": { "requestId": "uuid", "timestamp": "2026-04-02T00:00:00.000Z", "version": "v1" },
  "error": { "code": "unauthorized", "message": "Sessao nao encontrada.", "details": {} }
}
```

Headers:

- `x-request-id` (sempre)
- `x-error-code` (apenas em erro)

## Response shape (data)

O payload da Home trabalha por estado (`screenState`):

- `redirect_onboarding`: usuario sem contexto (redireciona para onboarding)
- `empty`: sem snapshot ainda
- `portfolio_ready_analysis_pending`: snapshot existe, analise ainda nao
- `ready`: snapshot + analise existem

Campo opcional:
- `aiSuggestion`: sugestao textual (IA) para traduzir/orientar, sem interferir no score/problema/acao. Pode vir como `disabled`, `ready` ou `error`.

```json
{
  "screenState": "ready",
  "redirectTo": "/onboarding",
  "portfolioId": "pfl_123",
  "hero": {
    "totalEquity": 120000,
    "totalInvested": 100000,
    "totalProfitLoss": 20000,
    "totalProfitLossPct": 20,
    "statusLabel": "Analise concluida"
  },
  "primaryProblem": {
    "code": "concentracao",
    "title": "Principal problema identificado",
    "body": "Resumo do problema",
    "severity": "info"
  },
  "primaryAction": {
    "code": "diluir_concentracao",
    "title": "Principal acao recomendada",
    "body": "Resumo da acao",
    "ctaLabel": "Ver carteira",
    "target": "/portfolio"
  },
  "score": { "value": 78, "status": "saudavel", "explanation": "Texto explicativo" },
  "distribution": [
    {
      "key": "STOCK",
      "label": "Acoes",
      "value": 50000,
      "sharePct": 41.6,
      "performancePct": 0,
      "sourceType": "STOCK"
    }
  ],
  "insights": [{ "kind": "concentration", "title": "Insight", "body": "Mensagem" }],
  "aiSuggestion": { "status": "ready", "text": "Paragrafo...\\n- bullet\\n- bullet\\n- bullet", "provider": "openai", "generatedAt": "2026-04-02T00:00:00.000Z" },
  "updatedAt": "2026-04-02T00:00:00.000Z"
}
```

## Rules

- a Home precisa consolidar (numeros), traduzir (problema) e orientar (acao) com baixo atrito.
- a tela deve funcionar com `screenState` de redirect/empty/pending, sem “payload diferente por rota”.
