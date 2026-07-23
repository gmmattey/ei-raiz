# Pocket Ops - Contrato AppScript Mobile

## Base URL

Use o mesmo deploy web app do Apps Script:

```text
https://script.google.com/macros/s/SEU_DEPLOY/exec
```

## Parametros

- `format=json`
- `resource=dashboard|ai-analysis|health`
- `token=...` apenas se `MOBILE_APP_API_TOKEN` estiver configurado no Script Properties

## Recursos

### `dashboard`

Retorna o envelope abaixo:

```json
{
  "ok": true,
  "resource": "dashboard",
  "data": {
    "...": "payload atual de getDashboardData()"
  },
  "updatedAt": "2026-03-27T22:00:00.000Z"
}
```

### `ai-analysis`

Retorna:

```json
{
  "ok": true,
  "resource": "ai-analysis",
  "data": {
    "analysis": "texto da Esquilo IA",
    "updatedAt": "2026-03-27T22:00:00.000Z"
  }
}
```

### `health`

Retorna:

```json
{
  "ok": true,
  "resource": "health",
  "data": {
    "releaseName": "Pocket Ops",
    "versionNumber": "2.0.0",
    "updatedAt": "2026-03-27T22:00:00.000Z"
  }
}
```

## Arquivos AppScript envolvidos

- `apps_script/backend/Backend_Core.gs`
- `apps_script/backend/Mobile_Api.gs`
- `apps_script/utils/Config.gs`

## Observacoes

- o frontend HTML continua sendo servido normalmente quando `format=json` nao e enviado
- o app Flutter nao cria logica paralela; ele consome o mesmo `getDashboardData()`
- `MOBILE_APP_API_TOKEN` e opcional, mas recomendado para testes externos reais
