# Bancos e códigos oficiais

## Fonte oficial
A fonte oficial recomendada para lista de instituições e códigos é o conjunto de dados do Banco Central com a lista de participantes do STR.

## O que usar como base
Campos que interessam ao produto:
- ISPB
- Nome_Reduzido
- Nome_Extenso
- Numero-Codigo
- Participa_da_Compe
- Acesso_principal
- Inicio_da_Operacao

## Regra de produto
- usar a base oficial para identificação institucional
- guardar código oficial junto da instituição quando existir
- não manter lista manual gigante sem estratégia de atualização

## Uso esperado no produto
- exibir nome padronizado
- ligar instituição a logo ou placeholder
- cruzar banco/corretora com códigos e fontes externas

## Estratégia recomendada
1. baixar ou sincronizar a base oficial do BCB
2. normalizar para tabela interna
3. mapear slug amigável para a interface
4. usar placeholder quando a identidade visual ainda não existir
