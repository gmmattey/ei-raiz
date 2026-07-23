# GOAL ENGINE — REGRAS

## INPUTS
- monthly_investment
- months
- target
- maturity_score
- portfolio_score

## CÁLCULO
valor_final = aporte * meses * fator

fator:
- conservador: 1.005
- moderado: 1.008
- agressivo: 1.01

## OUTPUT
{
  "projected": 42000,
  "gap": -8000,
  "feasible": false
}

## REGRA
Cálculo determinístico. IA apenas traduz.
