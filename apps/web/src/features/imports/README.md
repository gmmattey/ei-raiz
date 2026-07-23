# Feature Imports

## Objetivo
Permitir entrada/atualizacao de dados com preview antes do commit.

## Contrato
- `POST /v1/imports/start`
- `GET /v1/imports/{importId}/preview`
- `POST /v1/imports/{importId}/commit`

## Regra
- nunca commitar sem preview
- nao maquiar invalido/duplicado/conflito
- o fluxo deve gerar proximo passo claro (`nextStep`)

## Implementacao (sem layout)
`imports_controller.ts` encapsula start/preview/commit e devolve o minimo para a UI navegar.

