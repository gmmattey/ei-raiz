# Feature Radar (Analysis)

## Objetivo
Traduzir a analise consolidada em problema principal + acao principal, sem virar relatorio.

## Entradas esperadas
- `analysis.json` no local mock
- `GET /v1/analysis` no provider HTTP

## Estados obrigatorios (E2E-018)
- `redirect_onboarding`: orientar para onboarding (nao deixar tela muda)
- `pending`: orientar proximo passo (ex: ir para Historico)
- `ready`: mostrar score + problema + acao + plano

## Regra
Uma acao principal por vez. O resto so existe para sustentar a decisao.

## Implementacao (sem layout)
`analysis_controller.ts` centraliza consumo do contrato e targets de navegacao.

