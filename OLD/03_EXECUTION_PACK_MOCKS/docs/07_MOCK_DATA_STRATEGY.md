# Estratégia de dados mockados

## Meta

Os mocks devem parecer reais, não fake de tutorial.

## O que os mocks precisam simular

- usuário com contexto financeiro preenchido
- patrimônio distribuído entre categorias
- múltiplas plataformas
- holdings com performances diferentes
- score com motivação
- problema principal claro
- recomendação principal clara
- histórico com snapshots
- eventos operacionais
- preview de importação com linhas válidas e inválidas

## Regra de qualidade do mock

Mock bom:
- ajuda a testar layout
- ajuda a testar estados
- ajuda a validar contrato
- ajuda a mostrar produto

Mock ruim:
- tem tudo zerado
- não mostra conflito
- não mostra edge case
- não deixa a interface ser tensionada

## Casos que devem existir

- carteira equilibrada
- carteira concentrada
- carteira com alerta
- usuário com pouco dado
- usuário com contexto preenchido
- importação boa
- importação com conflito
- importação com duplicidade
