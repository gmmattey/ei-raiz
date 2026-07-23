# Prompt 07 — Snapshots, linha do tempo e histórico

Quero que você desenhe o modelo e o fluxo de snapshots e histórico do Esquilo Invest no backend novo.

## Missão

Estruturar:
- fotografia da carteira em momentos relevantes
- histórico de importações
- histórico de análises
- comparação entre momentos
- linha do tempo do usuário

## Regras obrigatórias

- Separe posição atual de snapshot histórico.
- Separe evento operacional de análise da carteira.
- Não trate histórico como log solto e inútil.
- O histórico precisa servir à tela de Histórico do produto.
- O modelo precisa sustentar comparação antes/depois.

## O que eu quero como saída

Entregue:
1. quando criar snapshot
2. que tabelas participam do snapshot
3. como comparar dois snapshots
4. como guardar recomendação associada ao snapshot
5. como guardar evento de importação
6. como montar uma timeline útil para o usuário
7. payload da tela de Histórico
8. campos obrigatórios e opcionais
9. riscos de crescimento descontrolado
10. mitigação para volume e consulta

## Saída esperada

Desenho claro para virar tabela, serviço e endpoint.
