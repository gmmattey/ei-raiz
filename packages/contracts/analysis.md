# Analysis (Radar) contract

## Route
`GET /v1/analysis`

## Envelope HTTP

Sucesso:

```json
{ "ok": true, "meta": { "requestId": "uuid", "timestamp": "2026-04-02T00:00:00.000Z", "version": "v1" }, "data": {} }
```

Erro:

```json
{ "ok": false, "meta": { "requestId": "uuid", "timestamp": "2026-04-02T00:00:00.000Z", "version": "v1" }, "error": { "code": "portfolio_not_found", "message": "Carteira principal nao encontrada." } }
```

Headers:

- `x-request-id` (sempre)
- `x-error-code` (apenas em erro)

## Response shape (data)

Estados:

- `redirect_onboarding`
- `pending` (nao existe analise persistida)
- `ready`

Pending:

```json
{
  "screenState": "pending",
  "portfolioId": "pfl_123",
  "pendingState": { "title": "string", "body": "string", "ctaLabel": "string", "target": "/history/snapshots" }
}
```

Ready:

```json
{
  "screenState": "ready",
  "analysisId": "anl_123",
  "portfolioId": "pfl_123",
  "snapshotId": "snp_123",
  "score": { "value": 72, "status": "atencao_moderada", "explanation": "Resumo" },
  "primaryProblem": { "code": "concentracao", "title": "string", "body": "string", "severity": "info" },
  "primaryAction": { "code": "diluir_concentracao", "title": "string", "body": "string", "ctaLabel": "Ver carteira", "target": "/portfolio" },
  "portfolioDecision": "string",
  "actionPlan": ["passo 1", "passo 2"],
  "summary": "Resumo",
  "insights": [
    {
      "kind": "concentration",
      "title": "Insight",
      "body": "Mensagem",
      "priority": 1,
      "severity": "critical",
      "ctaLabel": "Ver carteira",
      "target": "/portfolio"
    }
  ],
  "generatedAt": "2026-04-02T00:00:00.000Z"
}
```

## Insights (fields)

`insights[]` é o mecanismo unificado para Score/Alertas no MVP. Cada item vem com um próximo passo determinístico.

Campos adicionais (backward-compatible):

- `severity`: `info | warning | critical`
- `ctaLabel`: string curta (ex: "Ver carteira")
- `target`: path relativo do app (ex: `/portfolio`, `/history/imports`, `/onboarding`)

## Rules

- a analise deve explicar e orientar com foco em problema/acao principal.
- `pending` deve orientar proximo passo sem “deixar a tela muda”.
