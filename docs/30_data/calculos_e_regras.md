# Cálculos e regras

## Cálculos base

### Valor investido da posição
`invested_amount = quantity * average_price`

### Valor atual da posição
`current_value = quantity * current_price`

### Lucro ou prejuízo
`profit_loss = current_value - invested_amount`

### Rentabilidade percentual
`performance_pct = ((current_value - invested_amount) / invested_amount) * 100`

Regra:
- se `invested_amount <= 0`, não calcular percentual
- exibir `—` ou `null`

## Carteira consolidada

### Patrimônio total
`total_equity = soma(current_value)`

### Total investido
`total_invested = soma(invested_amount)`

### Resultado consolidado
`total_profit_loss = total_equity - total_invested`

### Rentabilidade consolidada
`total_profit_loss_pct = ((total_equity - total_invested) / total_invested) * 100`

## Alocação

### Participação do ativo
`allocation_pct = current_value / total_equity * 100`

### Participação da categoria
`category_share_pct = total_categoria / total_equity * 100`

## Regras de concentração sugeridas

### Por ativo
- acima de 20%: atenção forte
- entre 10% e 20%: atenção moderada
- abaixo de 10%: neutro

### Por categoria
- acima de 60%: atenção forte
- entre 40% e 60%: atenção moderada
- abaixo de 40%: neutro

## Score da carteira
O score não pode parecer número mágico.
Ele deve ser explicado por pilares:
- concentração
- diversificação
- coerência com perfil
- qualidade da atualização dos dados
- equilíbrio entre proteção e crescimento
- presença de posições em atenção

## Regra de recomendação principal
Gerar apenas uma.
Ordem sugerida de prioridade:
1. falta de dado confiável
2. conflito ou atualização pendente
3. concentração excessiva
4. posição problemática
5. desalinhamento com perfil
6. rebalanceamento leve

## Regras de benchmark
- benchmark é referência, não sentença
- não comparar tudo com CDI sem contexto
- fonte externa pode falhar sem derrubar a carteira
