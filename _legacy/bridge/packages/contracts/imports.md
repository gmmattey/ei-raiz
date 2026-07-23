# Imports contract

## Routes
- `POST /v1/imports/start`
- `GET /v1/imports/templates/custom` (CSV v1 oficial)
- `GET /v1/imports/templates/csv-v1` (alias do CSV v1 oficial)
- `GET /v1/imports/{importId}/preview`
- `GET /v1/imports/{importId}/engine-status`
- `GET /v1/imports/{importId}/conflicts`
- `GET /v1/imports/{importId}/detail`
- `POST /v1/imports/{importId}/commit`

Rotas de revisao (suportadas no runtime atual):

- `PATCH /v1/imports/{importId}/rows/{rowId}`
- `POST /v1/imports/{importId}/rows/{rowId}/duplicate-resolution`

## Envelope HTTP

Sucesso:

```json
{ "ok": true, "meta": { "requestId": "uuid", "timestamp": "2026-04-02T00:00:00.000Z", "version": "v1" }, "data": {} }
```

Erro:

```json
{ "ok": false, "meta": { "requestId": "uuid", "timestamp": "2026-04-02T00:00:00.000Z", "version": "v1" }, "error": { "code": "preview_not_consistent", "message": "O preview ainda possui pendências e não pode ser commitado." } }
```

Headers:

- `x-request-id` (sempre)
- `x-error-code` (apenas em erro)

## Templates (download)

As rotas abaixo retornam o CSV como arquivo (sem envelope JSON).

- `GET /v1/imports/templates/custom`: template com cabeçalho `tipo,codigo,nome,quantidade,valor_investido,valor_atual,categoria,observacoes`
- `GET /v1/imports/templates/csv-v1`: alias do template oficial (mesmo conteúdo)

## Start response (data)
```json
{
  "importId": "imp_123",
  "status": "pending_preview",
  "nextStep": "/v1/imports/imp_123/preview",
  "totals": { "totalRows": 10, "validRows": 8, "invalidRows": 1, "duplicateRows": 1 },
  "document": null,
  "importable": true
}
```

## Preview response (data)
```json
{
  "importId": "imp_123",
  "status": "PREVIEW_READY",
  "origin": "MANUAL_ENTRY",
  "totals": { "totalRows": 10, "validRows": 8, "invalidRows": 1, "duplicateRows": 1 },
  "readyToCommit": false,
  "document": null,
  "importable": true,
  "rows": [
    {
      "id": "imr_123",
      "rowNumber": 1,
      "source": {},
      "normalized": {},
      "resolutionStatus": "NORMALIZED",
      "errorMessage": null,
      "fieldSources": {},
      "fieldConfidences": {},
      "warnings": [],
      "reviewMeta": {}
    }
  ]
}
```

## Engine status response (data)

Leitura operacional do processamento (sem UI de negócio).

```json
{
  "screenState": "ready",
  "importId": "imp_123",
  "origin": "MANUAL_ENTRY",
  "importStatus": "PREVIEW_READY",
  "engineStatus": {
    "status": "ready_for_review",
    "label": "Pronta para revisão",
    "readyForReview": true,
    "readyToCommit": false
  },
  "document": { "parserMode": "manual", "confidence": 0.9, "importable": true },
  "summary": {
    "totalRows": 10,
    "processedRows": 10,
    "validRows": 8,
    "invalidRows": 1,
    "duplicateRows": 1,
    "lowConfidenceRows": 0,
    "blockedRows": 0,
    "failedRows": 0,
    "fallbackRows": 0,
    "manualDecisionRows": 0,
    "aiAssistedRows": 0
  },
  "states": {
    "received": false,
    "processing": false,
    "completed": false,
    "lowConfidence": false,
    "fallback": false,
    "nonImportable": false,
    "readyForReview": true
  },
  "targets": {
    "preview": "/v1/imports/imp_123/preview",
    "detail": "/v1/imports/imp_123/detail",
    "conflicts": "/v1/imports/imp_123/conflicts",
    "commit": null
  }
}
```

## Conflicts response (data)

Lista de conflitos de duplicidade (apenas linhas `PENDING`) com ações explícitas e determinísticas.

Quando não houver conflitos pendentes:

```json
{
  "screenState": "empty",
  "importId": "imp_123",
  "origin": "MANUAL_ENTRY",
  "summary": { "totalConflicts": 1, "unresolvedConflicts": 0, "resolvedConflicts": 1 },
  "emptyState": {
    "title": "Essa importação não tem conflitos de duplicidade pendentes",
    "body": "Quando houver ativos conflitantes com a carteira atual, eles aparecerão aqui para decisão explícita.",
    "ctaLabel": "Voltar ao preview",
    "target": "/imports/imp_123/preview"
  },
  "conflicts": []
}
```

Quando houver conflitos pendentes:

```json
{
  "screenState": "ready",
  "importId": "imp_123",
  "origin": "MANUAL_ENTRY",
  "summary": { "totalConflicts": 2, "unresolvedConflicts": 2, "resolvedConflicts": 0 },
  "conflicts": [
    {
      "rowId": "imr_123",
      "rowNumber": 12,
      "resolutionStatus": "PENDING",
      "errorMessage": "Possível duplicidade com ativo já existente na carteira.",
      "incoming": {
        "sourceKind": "ACOES",
        "code": "PETR4",
        "name": "Petrobras PN",
        "quantity": 100,
        "investedAmount": 3200,
        "currentAmount": 3510,
        "categoryLabel": "Ações"
      },
      "duplicateCandidates": [
        {
          "assetId": "ast_1",
          "assetCode": "PETR4",
          "assetName": "Petrobras PN",
          "quantity": 80,
          "investedAmount": 2500,
          "currentAmount": 2800
        }
      ],
      "allowedActions": [
        { "code": "keep_current", "label": "Manter atual" },
        { "code": "replace_existing", "label": "Substituir existente" },
        { "code": "consolidate", "label": "Consolidar posições" },
        { "code": "ignore_import", "label": "Ignorar entrada" }
      ],
      "target": {
        "preview": "/imports/imp_123/preview",
        "resolve": "/v1/imports/imp_123/rows/imr_123/duplicate-resolution"
      }
    }
  ]
}
```

## Detail response (data)

Detalhe operacional por documento e por linha (erros, conflitos, baixa confiança e decisões).

```json
{
  "screenState": "ready",
  "importId": "imp_123",
  "importMeta": {
    "origin": "MANUAL_ENTRY",
    "originLabel": "Manual",
    "status": "PREVIEW_READY",
    "statusLabel": "Pronta para commit",
    "totalRows": 10,
    "validRows": 8,
    "invalidRows": 1,
    "duplicateRows": 1,
    "createdAt": "2026-04-02T00:00:00.000Z",
    "updatedAt": "2026-04-02T00:00:00.000Z",
    "finishedAt": null,
    "fileName": null,
    "mimeType": null
  },
  "operationalSummary": {
    "engineStatus": { "status": "ready_for_review", "label": "Pronta para revisão", "readyForReview": true, "readyToCommit": false },
    "document": { "fileName": null, "mimeType": null, "documentType": null, "parserMode": "manual", "confidence": 0.9, "importable": true },
    "counts": { "totalRows": 10, "validRows": 8, "invalidRows": 1, "duplicateRows": 1, "lowConfidenceRows": 0, "blockedRows": 0, "failedRows": 0, "fallbackRows": 0, "manualDecisionRows": 0 },
    "targets": { "engineStatus": "/v1/imports/imp_123/engine-status", "preview": "/v1/imports/imp_123/preview", "conflicts": null }
  },
  "issueSummary": { "errorRows": 0, "conflictRows": 1, "lowConfidenceRows": 0, "nonImportableRows": 0, "items": [] },
  "decisionSummary": { "manualRows": 0, "fallbackRows": 0, "aiRows": 0, "systemRows": 10, "items": [] },
  "snapshot": null,
  "rows": []
}
```

## Commit response (data)
```json
{
  "importId": "imp_123",
  "status": "committed",
  "createdSnapshotId": "snp_123",
  "affectedPositions": 12,
  "nextStep": "/history/snapshots"
}
```

## Rules
- start não persiste posição final
- preview vem antes do commit
- conflito exige decisão explícita
- commit deve poder gerar snapshot
- Release 0.1: `origin` aceito no start é somente `CUSTOM_TEMPLATE` (alias `CSV_V1` também é aceito)
