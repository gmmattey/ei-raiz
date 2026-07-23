# Fusao Quanto + Esquilo — Trilhas Remanescentes

Atualizado em: 2026-06-19
Status: fase pos-cutover

## 1. Objetivo deste documento

Registrar o que ainda faz sentido tratar depois da fusao concluida e do cutover para `apps/web`.

Este documento nao reabre a fusao.
Ele separa o que agora e:

- estabilizacao tecnica
- evolucao de design e UX
- reducao de legado

## 2. O que ja esta fechado

- `apps/web` ativo no Worker principal
- `src/index.ts` preservado como backend vivo
- `JWT_SECRET` remoto migrado para `secret_text`
- preflight e postflight oficiais criados
- checklist de cutover fechado em `36/36`

## 3. Trilhas remanescentes priorizadas

### Trilha A — Design evolution do app

Objetivo:

- consolidar a direcao visual final do Quanto pos-cutover
- elevar consistencia de layout, tipografia, densidade e hierarquia de informacao
- reduzir sobras visuais de fase piloto

Escopo sugerido:

- shell e navegacao
- tokens finais
- metric cards
- headers de tela
- listas e agrupamentos da Carteira
- detalhamento visual de Historico, Bens e Importar
- estados vazios, loading e erro

Dono-lente principal:

- Beatriz + Marina

### Trilha B — Smoke autenticado em producao

Objetivo:

- confirmar o contrato vivo do app ja promovido com JWT real, sem depender so de smoke anonimo

Escopo sugerido:

- login
- `GET /api/portfolio`
- `Hoje`
- `Carteira`
- `Detalhe`
- `Bens`
- `Historico`

Dono-lente principal:

- Pedro + Carlos

### Trilha C — Observabilidade pos-cutover

Objetivo:

- melhorar leitura operacional do app depois da promocao

Escopo sugerido:

- auditoria minima de operacoes principais
- padrao de log para erros do Worker
- checklist de investigacao rapida
- indicadores minimos de auth, portfolio, import e cron

Dono-lente principal:

- Carlos + Pedro

### Trilha D — Reducao gradual de legado

Objetivo:

- diminuir dependencia cognitiva de `public/` sem apagar fallback cedo demais

Escopo sugerido:

- mapear o que em `public/` ainda serve como fallback real
- identificar o que virou apenas referencia historica
- planejar limpeza em etapas pequenas, sem impacto no runtime

Dono-lente principal:

- Thiago + Marina

### Trilha E — Extracao backend incremental

Objetivo:

- reduzir peso de `src/index.ts` com seguranca

Escopo sugerido:

- continuar a mover wiring fino para `apps/core-api`
- isolar pontos restantes de dominio
- manter a mesma cobertura antes de qualquer refactor grande

Dono-lente principal:

- Thiago + Carlos

## 4. Ordem recomendada

1. Trilha B — smoke autenticado em producao
2. Trilha A — design evolution do app
3. Trilha C — observabilidade pos-cutover
4. Trilha D — reducao gradual de legado
5. Trilha E — extracao backend incremental

## 5. Regras para a fase pos-cutover

- nao reabrir a fusao como se o cutover nao tivesse acontecido
- nao remover `public/` sem plano proprio de rollback
- nao mexer em auth remoto sem motivo forte
- qualquer novo passo estrutural continua exigindo regressao automatizada
- design e UX agora podem liderar a prioridade, com tecnico de estabilizacao em paralelo
