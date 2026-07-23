# Núcleo inicial de regras financeiras

## Objetivo
Centralizar as regras de cálculo que devem ser reaproveitadas pelo front e pelo back.

## Fórmulas base

### Valor investido
`invested_amount = quantity * average_price`

### Valor atual
`current_value = quantity * current_price`

### Lucro ou prejuízo
`profit_loss = current_value - invested_amount`

### Rentabilidade percentual
`performance_pct = ((current_value - invested_amount) / invested_amount) * 100`

## Regras
- se `invested_amount <= 0`, não calcular percentual
- se faltar `current_price`, não fingir rentabilidade
- `null` é melhor que chute

## Concentração

### Ativo
- acima de 20%: atenção forte
- entre 10% e 20%: atenção moderada
- abaixo de 10%: neutro

### Categoria
- acima de 60%: atenção forte
- entre 40% e 60%: atenção moderada
- abaixo de 40%: neutro

## Score
O score deve ser explicado por:
- concentração
- diversificação
- coerência com perfil
- atualização dos dados
- equilíbrio entre proteção e crescimento
