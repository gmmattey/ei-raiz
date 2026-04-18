# Feature - Objetivos Financeiros (US)

## Resumo da feature

Criar o módulo **Objetivos Financeiros**, permitindo que o usuário cadastre múltiplos objetivos de vida financeira, vincule investimentos específicos quando quiser e receba uma análise de viabilidade com sugestões práticas para tentar atingir cada meta dentro do prazo.

A feature deve considerar não apenas o objetivo isolado, mas também a coerência do conjunto de objetivos com a realidade financeira do usuário.

O sistema não deve atuar como promessa de retorno nem como garantia de resultado. As projeções e sugestões devem ser apresentadas como **simulações orientativas**, com base nas informações atuais do usuário, nas premissas adotadas e no perfil de risco.

---

# Problema que a feature resolve

Hoje o produto analisa carteira, score, perfil e decisões, mas ainda não conecta isso de forma explícita aos planos reais de vida do usuário.

O usuário precisa conseguir responder perguntas como:
- Consigo comprar um imóvel em 5 anos?
- Faz sentido perseguir carro e apartamento ao mesmo tempo?
- Qual objetivo cabe primeiro na minha realidade?
- Quanto eu precisaria aportar por mês?
- Que tipo de estratégia tende a ser mais compatível com esse prazo?

Essa feature transforma o sistema em um planejador orientado à execução, não apenas em um leitor de carteira.

---

# Objetivo de produto

Permitir que o usuário:
- cadastre **N objetivos**
- organize prioridade entre eles
- vincule investimentos específicos ou use o patrimônio elegível total
- descubra se cada objetivo é viável, parcialmente viável ou inviável no cenário atual
- receba sugestões práticas para aumentar a chance de atingir a meta
- entenda conflitos entre objetivos concorrentes

---

# Princípios da feature

1. **Múltiplos objetivos são permitidos**
   - o usuário pode cadastrar vários objetivos
   - mas o sistema deve validar coerência do conjunto

2. **Não basta cadastrar sonhos**
   - o sistema deve avaliar se os objetivos fazem sentido diante da renda, patrimônio, aporte e prazo

3. **Viabilidade deve ser explícita**
   - viável
   - viável com ajuste
   - incompatível com a realidade atual

4. **Sugestão não é garantia**
   - o sistema pode sugerir caminhos, ajustes e estratégias compatíveis
   - mas não pode prometer retorno nem garantir resultado

5. **A análise deve ser orientativa, clara e honesta**
   - evitar linguagem mágica
   - evitar recomendação prescritiva absoluta

---

# User Stories

## US-01 - Cadastrar objetivo financeiro
**Como usuário**, quero cadastrar um objetivo financeiro com nome, valor alvo, prazo e prioridade, **para** acompanhar se ele faz sentido na minha realidade.

### Critérios de aceite
- [ ] usuário consegue criar objetivo
- [ ] campos obrigatórios: nome, valor alvo, prazo, prioridade
- [ ] usuário pode escolher categoria do objetivo
- [ ] objetivo fica salvo e editável

---

## US-02 - Cadastrar múltiplos objetivos
**Como usuário**, quero cadastrar múltiplos objetivos financeiros, **para** planejar diferentes metas de vida ao mesmo tempo.

### Critérios de aceite
- [ ] usuário pode cadastrar mais de um objetivo
- [ ] sistema lista todos os objetivos cadastrados
- [ ] sistema exibe prioridade de cada objetivo
- [ ] sistema não limita artificialmente a quantidade, mas valida coerência

---

## US-03 - Vincular investimentos a um objetivo
**Como usuário**, quero vincular ativos ou grupos de investimentos a um objetivo, **para** indicar quais recursos considero destinados àquela meta.

### Critérios de aceite
- [ ] usuário pode selecionar ativos/investimentos para um objetivo
- [ ] usuário pode deixar sem vínculo explícito
- [ ] quando não houver vínculo, o sistema considera o patrimônio elegível total
- [ ] sistema exibe com clareza quais ativos estão vinculados

---

## US-04 - Avaliar viabilidade individual do objetivo
**Como usuário**, quero saber se um objetivo é viável no prazo definido, **para** entender se a meta cabe na minha estrutura atual.

### Critérios de aceite
- [ ] sistema calcula projeção do objetivo
- [ ] sistema classifica como: viável, viável com ajuste ou incompatível com a realidade atual
- [ ] sistema explica o motivo da classificação
- [ ] sistema mostra projeção de valor no prazo

---

## US-05 - Avaliar conflito entre objetivos
**Como usuário**, quero saber se meus objetivos competem entre si, **para** evitar assumir metas que não cabem na minha vida financeira.

### Critérios de aceite
- [ ] sistema avalia o conjunto de objetivos
- [ ] sistema identifica conflito entre metas concorrentes
- [ ] sistema informa quando os objetivos excedem a capacidade financeira atual
- [ ] sistema sugere reordenação ou redução de escopo quando necessário

---

## US-06 - Receber sugestões para atingir o objetivo
**Como usuário**, quero receber sugestões práticas para aumentar a chance de atingir meu objetivo, **para** saber o que ajustar na prática.

### Exemplos de sugestão permitida
- aumentar aporte mensal
- ampliar prazo
- reduzir valor alvo
- tornar o objetivo prioridade principal
- redistribuir patrimônio elegível
- usar estratégia de alocação compatível com o horizonte

### Critérios de aceite
- [ ] sistema sugere ações práticas quando houver margem para viabilização
- [ ] sugestões devem ser coerentes com prazo, perfil e contexto do usuário
- [ ] sugestões devem ser claras e acionáveis
- [ ] sistema não deve prometer cumprimento da meta

---

## US-07 - Receber sugestão de estratégia compatível com o objetivo
**Como usuário**, quero ver estratégias e classes de alocação que tendem a ser mais compatíveis com meu objetivo, **para** orientar meu planejamento.

### Importante
No MVP, a sugestão deve priorizar:
- classes de ativos
- estratégias de alocação
- nível de risco compatível

Evitar, na primeira fase:
- recomendação agressiva de ativo específico com tom prescritivo

### Critérios de aceite
- [ ] sistema sugere estratégia compatível com prazo e perfil
- [ ] sistema sugere classes de ativos / perfis de alocação compatíveis
- [ ] sistema explica o racional da sugestão
- [ ] sistema deixa claro que é uma simulação orientativa

---

## US-08 - Exibir aviso de responsabilidade
**Como usuário**, quero ver com clareza que as projeções são simulações e não garantias, **para** não interpretar a sugestão como promessa de resultado.

### Critérios de aceite
- [ ] toda projeção exibe disclaimer claro
- [ ] toda sugestão exibe disclaimer claro
- [ ] linguagem não deve ser jurídica demais nem enganosa

### Texto base sugerido
> Esta projeção é uma simulação baseada nas informações atuais da sua carteira, do seu perfil e nas premissas adotadas pelo sistema. Ela não representa garantia de retorno nem recomendação individual definitiva de investimento.

---

## US-09 - Priorizar objetivos dentro da realidade financeira
**Como usuário**, quero entender qual objetivo cabe primeiro na minha realidade, **para** focar no que é mais executável agora.

### Critérios de aceite
- [ ] sistema mostra objetivo principal e secundários
- [ ] sistema indica quando metas competem entre si
- [ ] sistema sugere qual objetivo deve vir primeiro
- [ ] sistema mostra quando a capacidade atual suporta apenas um objetivo principal

---

## US-10 - Integrar objetivos com insights, score e aportes
**Como usuário**, quero que meus objetivos influenciem a leitura do sistema, **para** que as recomendações façam sentido para a minha vida e não só para a carteira.

### Critérios de aceite
- [ ] objetivos influenciam a camada de insights
- [ ] objetivos influenciam leitura de adequação ao momento de vida
- [ ] objetivos influenciam recomendações de aporte
- [ ] sistema consegue explicar essa relação

---

# Regras de negócio

## RN-01 - Múltiplos objetivos
O usuário pode cadastrar múltiplos objetivos financeiros.

## RN-02 - Campos mínimos
Todo objetivo deve conter:
- nome
- tipo/categoria
- valor alvo
- prazo
- prioridade

## RN-03 - Fonte de recursos do objetivo
O objetivo pode usar:
- investimentos vinculados explicitamente
- ou patrimônio elegível total quando não houver vínculo

## RN-04 - Classificação de viabilidade
Cada objetivo deve ser classificado como:
- `viavel`
- `viavel_com_ajuste`
- `incompativel_realidade_atual`

## RN-05 - Avaliação do conjunto
O sistema deve calcular também a coerência do conjunto de objetivos.

## RN-06 - Conflito de metas
Se a soma da exigência financeira dos objetivos exceder a capacidade real do usuário, o sistema deve apontar conflito.

## RN-07 - Sugestões permitidas
O sistema pode sugerir:
- ajuste de prazo
- ajuste de aporte
- ajuste de prioridade
- estratégia compatível
- classes de ativos compatíveis

## RN-08 - Sugestões proibidas ou sensíveis no MVP
Evitar no MVP:
- tom de recomendação garantida
- promessa de retorno
- linguagem de certeza
- “compre X que você chega lá”

## RN-09 - Transparência
Toda projeção deve informar:
- premissas usadas
- natureza simulada da análise
- ausência de garantia

---

# Estrutura de tela sugerida

## Tela principal `/objetivos`

### Bloco 1 - Resumo geral
- total de objetivos
- objetivos viáveis
- objetivos com ajuste
- objetivos incompatíveis
- indicador de coerência global

### Bloco 2 - Lista de objetivos
Cada card deve mostrar:
- nome
- tipo
- valor alvo
- prazo
- prioridade
- patrimônio considerado
- status de viabilidade
- conflito com outros objetivos

### Bloco 3 - Diagnóstico global
Exemplo:
- sua estrutura atual suporta bem 1 objetivo principal e 1 secundário de menor valor
- seus objetivos atuais competem entre si

### Bloco 4 - CTA
- criar objetivo
- editar objetivo
- reorganizar prioridades

---

## Tela de detalhe do objetivo `/objetivos/:id`

### Deve mostrar
- dados do objetivo
- investimentos vinculados
- patrimônio considerado
- projeção no prazo
- status de viabilidade
- motivo da classificação
- sugestões práticas
- estratégia compatível com o horizonte
- disclaimer

---

# Modelo de dados sugerido

```ts
type ObjetivoFinanceiro = {
  id: string
  nome: string
  tipo: 'imovel' | 'carro' | 'eletronico' | 'viagem' | 'educacao' | 'reserva' | 'outro'
  valorAlvo: number
  prazoMeses: number
  prioridade: 'alta' | 'media' | 'baixa'
  investimentosVinculados?: string[]
  usarPatrimonioTotalElegivel: boolean
  aporteMensalPlanejado?: number
  observacoes?: string
  statusViabilidade: 'viavel' | 'viavel_com_ajuste' | 'incompativel_realidade_atual'
  motivoStatus?: string
  valorProjetado?: number
  conflitoComOutrosObjetivos?: boolean
}
```

---

# Dados necessários para cálculo

O motor de objetivos deve considerar:
- patrimônio atual
- ativos vinculados ou patrimônio elegível
- aporte mensal atual
- renda mensal
- gasto mensal
- reserva mínima necessária
- endividamento
- horizonte do objetivo
- perfil de risco
- prioridade dos demais objetivos

---

# Saídas esperadas do motor

Para cada objetivo:
- valor atual considerado
- valor projetado no prazo
- valor alvo
- diferença para a meta
- status de viabilidade
- sugestões de ajuste
- estratégia compatível com horizonte/perfil
- conflito com outros objetivos

Para o conjunto:
- coerência global
- objetivos concorrentes
- capacidade atual suportada
- recomendação de priorização

---

# Fases sugeridas

## Fase 1 - MVP realista
- CRUD de objetivos
- múltiplos objetivos
- vínculo opcional com investimentos
- cálculo simples de viabilidade
- conflito entre objetivos
- sugestões práticas básicas
- estratégia por classe de ativo / horizonte
- disclaimer

## Fase 2
- priorização automática
- impacto no score
- integração com recomendações de aporte
- cenários alternativos

## Fase 3
- integração com simuladores
- recomendações mais sofisticadas
- possíveis veículos compatíveis (com muito cuidado de linguagem)

---

# Critérios de aceite da feature como um todo

- [ ] usuário pode cadastrar múltiplos objetivos
- [ ] objetivo isolado é analisado
- [ ] conjunto de objetivos é analisado
- [ ] sistema identifica conflito entre metas
- [ ] sistema sugere ações práticas para tentar atingir a meta
- [ ] sistema sugere estratégia compatível com horizonte/perfil
- [ ] toda projeção exibe disclaimer
- [ ] linguagem do sistema é honesta e não promete retorno
- [ ] objetivos influenciam insights, score e aportes em fases futuras

---

# Resumo executivo da feature

O módulo de Objetivos Financeiros deve transformar metas pessoais em planejamento viável. O usuário pode cadastrar múltiplos objetivos, mas o sistema deve avaliar se eles cabem na sua realidade financeira atual, apontar conflitos, sugerir ajustes e orientar estratégias compatíveis com o horizonte da meta. Tudo isso deve ser apresentado como simulação orientativa, sem garantia de retorno e sem promessas irreais.