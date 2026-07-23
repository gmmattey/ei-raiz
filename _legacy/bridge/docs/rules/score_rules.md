# SCORE — REGRAS

## OBJETIVO
Avaliar a coerência da carteira com a realidade do usuário.

## MODELO (0–100)
- Estrutura: 40
- Adequação à realidade: 30
- Capacidade financeira: 20
- Comportamento: 10

## ESTRUTURA (40)
### Diversificação
- 3 ou mais classes: +20
- 2 classes: +12
- 1 classe: +5

### Concentração
- maior posição abaixo de 25%: +20
- entre 25% e 50%: +12
- acima de 50%: +5

## ADEQUAÇÃO (30)
Inputs: renda, objetivo, horizonte, tolerância a oscilações
- alinhado: +30
- leve desalinhamento: +15
- desalinhado: 0

## CAPACIDADE (20)
Inputs: renda, aporte mensal, necessidade de liquidez
- compatível: +20
- leve pressão: +10
- pesado demais: 0

## COMPORTAMENTO (10)
- aporte regular: +10
- irregular: +5
- parado: 0

## FAIXAS
- 85–100: ótimo
- 70–84: bom
- 50–69: atenção
- abaixo de 50: crítico

## SAÍDA PADRÃO
{
  "score": 72,
  "level": "good",
  "primary_problem_key": "concentration_high",
  "primary_action_key": "rebalance_next_contributions"
}

## REGRA
Cálculo determinístico. IA apenas traduz.
