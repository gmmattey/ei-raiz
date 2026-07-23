# Feature Consistency (E2E)

## Objetivo
Validar consistencia entre Home, Radar e Carteira (E2E-021) para evitar produto contraditorio.

## Regra
Nao "corrige" nada: apenas sinaliza mismatch.

## Implementacao (sem layout)
`consistency_controller.ts` roda os controllers headless e devolve um report com issues.

