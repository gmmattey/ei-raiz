# Recomendacoes de integracao e estabilizacao

## Objetivo

Registrar o que precisa ser estabilizado antes de iniciar feature nova.

## Ordem recomendada

### 1. Fechar a fronteira oficial do backend

Decidir qual trilha e oficial:

- `services/api`
- `backend/`
- `04_STARTER_BACKEND/`

Sem isso, qualquer implementacao nova corre alto risco de nascer no lugar errado.

### 2. Escolher a fonte oficial de schema

Conflito atual:

- `OLD/banco_legado/01_schema.sql`
- `database/d1/schema.sql`

Recomendacao:

- decidir qual schema governa a V1
- rebaixar o outro para material historico ou de referencia

### 3. Escolher a fonte oficial de contrato HTTP

Conflito atual:

- `services/api/openapi.yaml`
- `docs/api/swagger.yaml`

Recomendacao:

- unificar em uma fonte principal
- registrar explicitamente o status da outra como historica, experimental ou descartada

### 4. Registrar a integracao da PR `#9` como ganho funcional, nao como resolucao estrutural

Situacao:

- a PR `#9` ja foi integrada na `main`
- ela fechou a lacuna historica da tela 8
- o codigo entrou em starter paralelo

Recomendacao:

- nao tratar esse merge como decisao arquitetural final
- registrar que o onboarding de entrada hoje vive no starter D1
- decidir depois se ele permanece ali, migra para a area oficial de backend ou e absorvido por outra trilha

### 5. Tratar PR `#8` como trilha tecnica separada

Situacao:

- motor de extracao fora da `main`
- base paralela
- adiciona um novo modulo de extracao com dependencia tecnica propria

Recomendacao:

- avaliar separadamente como capability tecnica
- nao assumir que ela fecha o backlog de importacao na base principal

### 6. Sincronizar backlog GitHub com status real

Problema:

- `233` abertas
- `0` fechadas
- varias PRs merged recentes

Recomendacao:

- mapear quais issues foram parcialmente atendidas pela cadeia `screen-*`
- separar claramente o que foi so prototipo, so merge estrutural ou entrega funcional real
- so depois fechar ou atualizar status

### 7. Corrigir artefatos soltos e quebrados

Itens criticos:

- `OLD/codigo_solto/score.routes.ts` quebrado e deslocado
- `backend/modules/*` sem entrypoint oficial
- fronteira oficial de runtime ainda indefinida

Recomendacao:

- primeiro registrar a decisao de destino de cada grupo
- depois mover ou eliminar com seguranca

## Riscos se isso for ignorado

- codigo novo entrar em trilha errada
- contratos se contradizerem em runtime
- merges abrirem regressao por base velha
- backlog continuar mentindo sobre estado real
- duplicacao estrutural aumentar mais rapido que a implementacao

## Proximo passo recomendado

Antes de qualquer nova feature:

1. fechar fronteira oficial de backend
2. fechar fonte oficial de schema
3. fechar fonte oficial de OpenAPI
4. reavaliar a PR `#8` e a absorcao definitiva do onboarding da PR `#9`
5. so entao retomar execucao de backlog funcional
