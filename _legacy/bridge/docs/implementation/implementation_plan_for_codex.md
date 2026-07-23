# Esquilo Invest — Plano de Implementacao para o Codex

## Objetivo
Este documento define a ordem de implementacao do produto para reduzir retrabalho, evitar ambiguidade e maximizar a produtividade do Codex.

## Principios
- implementar em modulos
- um backend unico com responsabilidades separadas
- regra deterministica no backend
- IA apenas para traducao e linguagem
- front so deve consumir contratos estaveis
- nao criar microservicos neste momento

## Estrutura alvo
```plaintext
backend/
  modules/
    profile/
    portfolio/
    score/
    import/
    alerts/
    goals/
    recommendations/
    notifications/
  shared/
  config/
  db/
```

## Ordem de implementacao

### Fase 1 — Fundacao tecnica
1. configurar projeto backend
2. configurar ambiente cloudflare
3. configurar D1
4. criar estrutura de pastas por modulos
5. configurar validacao de payloads
6. configurar logs e tratamento de erro

### Fase 2 — Modulo profile
Objetivo: persistir e ler contexto do usuario

Entregas:
- rotas de leitura e escrita de perfil
- tipos de perfil
- persistencia em D1
- validacoes

Critério de pronto:
- perfil salvo e lido corretamente
- contratos estaveis

### Fase 3 — Modulo portfolio
Objetivo: representar a carteira consolidada

Entregas:
- entidades de posicao
- leitura consolidada da carteira
- agregacoes por tipo
- agregacoes por instituicao

Critério de pronto:
- carteira retornando valores consolidados e listas

### Fase 4 — Modulo score
Objetivo: calcular score deterministico

Entregas:
- regras de score
- breakdown por dimensao
- classificacao final
- problema principal
- acao principal

Critério de pronto:
- score calculado a partir de portfolio + profile
- nenhum uso de IA no calculo

### Fase 5 — Modulo import
Objetivo: entrada de dados por arquivo e fallback

Entregas:
- upload inicial
- leitura do arquivo
- preview dos dados detectados
- confirmacao de importacao
- resultado da importacao
- historico de importacoes

Critério de pronto:
- usuario consegue importar, revisar e confirmar dados

### Fase 6 — Modulo alerts
Objetivo: detectar eventos relevantes

Entregas:
- regras de concentracao
- regras de fundo abaixo do CDI
- regras de ausencia de aporte
- regras de drawdown relevante
- cooldown
- deduplicacao
- persistencia do alerta

Critério de pronto:
- alertas gerados de forma consistente e rastreavel

### Fase 7 — Modulo goals
Objetivo: simular metas e viabilidade

Entregas:
- simulacao por prazo e aporte
- projected value
- gap para objetivo
- feasible true ou false
- acao sugerida deterministica

Critério de pronto:
- simulador funcionando sem IA no calculo

### Fase 8 — Modulo recommendations
Objetivo: transformar problema em recomendacao simples

Entregas:
- mapa problema -> acao
- chaves de recomendacao
- resposta padronizada para front

Critério de pronto:
- sempre retornar uma acao principal coerente

### Fase 9 — Modulo notifications
Objetivo: disparar alertas externos

Entregas:
- integracao Telegram
- integracao email via Apps Script
- regra de roteamento por canal
- historico de envio

Critério de pronto:
- alertas enviados sem duplicacao burra

### Fase 10 — Integracao IA
Objetivo: traduzir resultado tecnico para linguagem do produto

Entregas:
- montar contexto para IA
- transformar score em explicacao curta
- transformar alerta em linguagem humana
- transformar recomendacao em texto curto

Critério de pronto:
- IA sem calcular regra
- IA sem decidir alerta
- IA apenas traduzindo

### Fase 11 — Frontend do MVP
Objetivo: consumir contratos prontos

Ordem:
1. onboarding
2. importacao
3. home
4. carteira
5. detalhe de ativo
6. score
7. alertas
8. meta

Critério de pronto:
- fluxo completo do MVP navegavel

## Contratos obrigatorios antes do front
- profile read/write
- portfolio summary
- score result
- alert list
- goal simulation
- import preview/result

## Regras para o Codex
- nao criar regras fora dos documentos
- nao mover logica de negocio para o front
- nao usar IA para score, alertas ou metas
- nao criar servicos separados sem necessidade
- nao renomear campos sem atualizar o dicionario
- cada modulo deve ter tipos, service, repository e routes

## Ordem de prompts para o Codex
1. foundation
2. profile
3. portfolio
4. score
5. import
6. alerts
7. goals
8. recommendations
9. notifications
10. IA translation layer
11. frontend MVP

## Definicao de pronto por modulo
Um modulo so esta pronto quando:
- possui contratos claros
- possui validacao
- possui persistencia quando necessario
- possui erro tratado
- possui resposta previsivel para o front
- respeita as regras do produto ja definidas

## O que fica para depois
- conexoes diretas com corretoras
- atualizacao automatica de precos em tempo real
- decisoes financeiras expandidas alem do MVP
- auth completo e recuperacao de senha real
- versao mobile nativa

## Regra final
Se houver duvida entre inventar e seguir a documentacao, seguir a documentacao.
