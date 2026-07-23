# Prompt 06 — Camada de análise e recomendação

Quero que você projete a camada de análise da carteira e de recomendação do Esquilo Invest no backend novo.

## Missão

Desenhar uma camada que:
- leia snapshot e contexto do usuário
- gere score
- identifique problema principal
- gere recomendação principal
- produza insights curtos
- registre histórico da análise

## Regras obrigatórias

- Não acople a lógica analítica ao handler HTTP.
- Não misture fraseologia final com cálculo bruto.
- Não dependa do Apps Script.
- O Apps Script pode servir apenas para comparação de regras antigas.
- Separe cálculo, interpretação e texto final.
- Pense em extensibilidade.

## O que eu quero como saída

Entregue:
1. arquitetura da camada analítica
2. entradas necessárias da análise
3. saídas necessárias da análise
4. proposta de score da carteira
5. proposta de diagnóstico principal
6. proposta de recomendação principal
7. proposta de insights secundários
8. estrutura de persistência do resultado analítico
9. estrutura de histórico das recomendações
10. separação entre regra, métrica e fraseologia

## Importante

Quero algo prático, que vire serviço de backend e não texto bonito.
