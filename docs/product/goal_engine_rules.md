# GOAL ENGINE — REGRAS

---

## OBJETIVO

Ajudar o usuário a atingir objetivos financeiros reais com base na sua realidade.

---

## INPUTS

- faixa de renda
- capacidade de aporte mensal
- prazo (meses)
- objetivo
- maturity_score
- score_carteira

---

## LÓGICA

O motor deve:
1. validar se a meta faz sentido para o usuário
2. calcular projeção
3. ajustar expectativa
4. gerar recomendação simples

---

## CÁLCULO BASE

valor_final = aporte_mensal * meses * fator_rendimento

fator_rendimento (MVP):
- conservador: 1.005
- moderado: 1.008
- agressivo: 1.01

---

## CAMADAS DE COMPLEXIDADE

### Maturity 0–1
- metas simples
- foco em consistência

### Maturity 2
- metas com prazo
- cálculo direto

### Maturity 3
- metas com cenários
- ajuste fino

---

## OUTPUT

Deve sempre conter:
- valor projetado
- gap vs objetivo
- recomendação simples

---

## REGRA

- cálculo é determinístico
- IA apenas traduz resultado

---

FIM
