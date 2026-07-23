# Feature Historico

## Objetivo
Mostrar trajetoria de forma rastreavel (snapshots + eventos) e orientar proximo passo quando vazio.

## Entradas esperadas
- `history_snapshots.json` e `history_timeline.json` no local mock
- `GET /v1/history/snapshots` e `GET /v1/history/timeline` no provider HTTP

## Estados obrigatorios (E2E-018)
- `redirect_onboarding`: orientar para onboarding
- `empty`: orientar para importacao (gerar primeiro snapshot)
- `ready`: listar itens em ordem temporal decrescente

## Regra
Historico nao e dumping de dado: priorizar o que ajuda o usuario a entender evolucao e proxima acao.

## Implementacao (sem layout)
`history_controller.ts` consolida snapshots + timeline em uma chamada headless.

