# Feature Onboarding

## Objetivo
Coletar contexto minimo do usuario de forma leve e rastreavel, destravando Home/Radar/Historico.

## Contrato de dados
O onboarding usa `GET/PUT /v1/profile/context` como fonte de verdade:

- `GET /v1/profile/context` traz `context` + `onboarding` (passos faltantes).
- `PUT /v1/profile/context` persiste incrementos (por step) e devolve o estado atualizado.

## Estados obrigatorios (E2E-002 / E2E-018)
- sem contexto: guiar passo a passo usando `onboarding.missing`
- revisao: permitir confirmar antes de concluir (`review` local + `step=confirm`)
- concluido: redirecionar para Home (ou proxima etapa definida)

## Regra
Nao fazer roundtrip por clique: persistir por etapa concluida (goal, risk_quiz, income_horizon, platforms, confirm).
