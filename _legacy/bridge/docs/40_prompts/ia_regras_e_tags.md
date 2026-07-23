# IA — regras e tags

## Papel da IA
A IA não toma decisão financeira no lugar do usuário.
Ela lê o payload do backend e devolve uma explicação curta, clara e rastreável.

## Regras
- usar só dados recebidos
- não inventar número, ativo ou contexto
- responder curto
- devolver JSON padronizado
- sempre gerar uma recomendação principal
- usar tag rastreável pelo código
- no máximo 3 linhas por bloco de texto

## Escopos
- carteira geral
- ação individual
- fundo
- previdência

## Tags aprovadas para carteira
- `UPDATE_PORTFOLIO`
- `RECHECK_DATA`
- `REDUCE_CONCENTRATION`
- `HOLD_COURSE`
- `INCREASE_GROWTH`
- `PROTECT_CAPITAL`

## Tags aprovadas para ativo
- `REVIEW_THESIS`
- `HOLD_COURSE`
- `ADD_SMALL_POSITION`
- `PROTECT_CAPITAL`
- `RECHECK_DATA`

## Tags aprovadas para fundos
- `KEEP_FUND`
- `REVIEW_FUND_ROLE`
- `REDUCE_FUND_WEIGHT`
- `COMPARE_WITH_GOAL`
- `RECHECK_DATA`

## Tags aprovadas para previdência
- `KEEP_PENSION`
- `CHECK_CONCENTRATION`
- `CHECK_PLAN_COST`
- `ALIGN_WITH_GOAL`
- `RECHECK_DATA`

## Regra de destino
Toda tag precisa mapear para uma ação de UI.
Exemplos:
- `UPDATE_PORTFOLIO` -> tela de importação
- `RECHECK_DATA` -> perfil ou importação
- `REDUCE_CONCENTRATION` -> carteira filtrada
- `REVIEW_THESIS` -> detalhe do ativo

## Regra de fallback
Se faltar dado, a IA deve pedir revisão ou atualização.
Nunca deve fingir certeza.
