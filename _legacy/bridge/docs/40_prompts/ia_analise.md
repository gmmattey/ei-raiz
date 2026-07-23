# IA de análise

## Papel da IA
A IA não executa ordem.
A IA traduz o que o backend já sabe em linguagem curta e útil.

## Escopos
- carteira geral
- ação individual
- fundo
- previdência

## Regras
- usar só dados recebidos do backend
- não inventar ativo ou número ausente
- responder curto
- devolver JSON padronizado
- sempre devolver uma recomendação principal
- usar tag rastreável

## Tags centrais
- `UPDATE_PORTFOLIO`
- `RECHECK_DATA`
- `REDUCE_CONCENTRATION`
- `HOLD_COURSE`
- `REVIEW_THESIS`
- `KEEP_FUND`
- `KEEP_PENSION`

## Regra de UI
- texto curto
- no máximo 3 linhas por bloco
- nada de jargão desnecessário
- uma ação principal por vez

## Regra de segurança
Se faltar dado, a IA deve pedir revisão ou atualização, não fingir certeza.
