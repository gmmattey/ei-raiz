# Health contract

## Route
`GET /v1/health`

## Response shape
```json
{
  "meta": {
    "requestId": "req_123",
    "timestamp": "2026-03-31T01:00:00Z",
    "version": "v1"
  },
  "data": {
    "status": "ok",
    "appEnv": "local|hml|prd",
    "services": {
      "d1": "ok",
      "externalReferences": "disabled|degraded|ok"
    }
  }
}
```

## Rules
- usado pelo bootstrap inicial
- nunca deve depender de leitura pesada
- precisa responder rápido
