# Regras de dados

## Princípios
- posição do usuário é a verdade principal
- dado externo complementa
- preview vem antes da persistência
- snapshot é fotografia fechada
- análise é derivada do snapshot e do contexto do usuário

## O que precisa persistir
- contexto do usuário
- plataformas usadas
- posições correntes
- origem da posição
- snapshots
- imports e suas linhas
- análises e insights
- eventos operacionais
- fonte e data de atualização externa quando houver

## Regras de importação
- nada entra direto sem preview
- conflito precisa de decisão explícita
- arquivo inválido precisa de erro humano, não técnico
- mesma importação não deve ser processada em paralelo várias vezes

## Regras de edge case
- `null` é melhor que chute
- warning é melhor que silêncio
- cálculo percentual só existe com base suficiente
- benchmark não pode quebrar a leitura da carteira

## Regras de origem
- `manual`: digitado pelo usuário
- `import`: veio de arquivo
- `external`: veio de fonte externa complementar
- `derived`: veio de cálculo interno

## Regra final
Sem rastreabilidade de origem, o dado perde valor rápido.
