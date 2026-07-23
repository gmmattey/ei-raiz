## Inventário de entidades

### 1. Usuário

**Papel no modelo**

Representa o dono do contexto, da carteira, das importações, dos snapshots, das leituras analíticas e dos eventos operacionais.

**Classificação**

* **Fato:** as issues futuras exigem preparação para múltiplos usuários, login, associação correta de dados e redução do cenário centrado em um único usuário.
* **Inferência:** a nova base não pode permanecer implicitamente single-user.
* **Hipótese:** o identificador final do usuário poderá vir de login Google, e-mail ou outra camada futura de autenticação, mas isso ainda não está fechado.

**Justificativa**

Essa entidade existe porque a separação por usuário já é necessidade explícita do produto futuro e também corrige uma fragilidade estrutural do estado atual.

---

### 2. Carteira

**Papel no modelo**

Representa o agrupamento lógico principal de posições e contexto analítico de um usuário.

**Classificação**

* **Fato:** o produto já trabalha conceitualmente sobre “a carteira” como unidade principal de leitura, score, recomendação, alertas e comparação.
* **Inferência:** mesmo em cenário de um usuário com uma carteira principal, separar `usuario` de `carteira` evita acoplamento futuro desnecessário.
* **Hipótese:** inicialmente o produto pode continuar operando com uma única carteira principal por usuário, mas o modelo deve aceitar mais de uma sem exigir refatoração estrutural.

**Justificativa**

Essa entidade estabiliza o domínio e evita espalhar `user_id` diretamente em todas as tabelas sem um agregado claro de negócio.

---

### 3. Plataforma

**Papel no modelo**

Representa a origem operacional ou financeira do investimento, como XP, Ion, Itaú e equivalentes.

**Classificação**

* **Fato:** o projeto já usa `plataforma` em ações, fundos, previdência, aportes e pré-ordens.
* **Fato:** há issue futura para comparação da carteira por plataforma.
* **Inferência:** plataforma deve deixar de ser apenas texto repetido em múltiplas tabelas e passar a ser referência estruturada.

**Justificativa**

Essa entidade reduz inconsistência textual, ajuda comparativos por origem e melhora integridade sem criar complexidade excessiva.

---

### 4. Tipo de ativo

**Papel no modelo**

Representa o catálogo de tipos de investimento reconhecidos pelo sistema.

**Classificação**

* **Fato:** há issues futuras explícitas para catálogo de tipos suportados e suporte progressivo a tipos avançados.
* **Fato:** o estado atual já diferencia ao menos ações, fundos, previdência, aportes e pré-ordens, e há referência futura a FIIs, ETFs, Tesouro, CDB, LCI, LCA e equivalentes.
* **Inferência:** a nova base precisa de um catálogo controlado de tipos para evitar proliferação de tabelas por categoria.

**Justificativa**

Essa entidade permite evolução gradual de cobertura sem obrigar uma nova tabela operacional para cada tipo novo.

---

### 5. Ativo ou instrumento

**Papel no modelo**

Representa o item investível ou instrumento financeiro reconhecido pelo sistema, como ticker, fundo, plano, título ou produto identificado.

**Classificação**

* **Fato:** o projeto atual já manipula identificadores como `ativo`, `fundo` e `plano`.
* **Inferência:** o domínio precisa de uma entidade unificadora para instrumentos, ainda que o legado continue consumindo recortes por categoria.
* **Hipótese:** alguns instrumentos poderão inicialmente existir com identificação parcial ou com taxonomia imperfeita, especialmente em importações futuras mais amplas.

**Justificativa**

Essa entidade é necessária para evitar duplicação estrutural entre ação, fundo e previdência no núcleo do domínio, mantendo a categorização como atributo e não como silos obrigatórios.

---

### 6. Posição da carteira

**Papel no modelo**

Representa a presença de um instrumento em uma carteira, com seus dados operacionais consolidados atuais.

**Classificação**

* **Fato:** o dashboard atual já depende de valores consolidados como quantidade, preço médio, cotação atual, valor investido, valor atual, status, situação e rentabilidade.
* **Inferência:** o produto precisa distinguir claramente o instrumento em si da posição do usuário naquele instrumento.
* **Hipótese:** para alguns tipos de produto, parte dos campos poderá não se aplicar diretamente, exigindo nulabilidade controlada.

**Justificativa**

Essa é uma entidade central do domínio. Sem ela, a modelagem fica presa a tabelas específicas de categoria ou a registros de importação como falsa fonte de verdade.

---

### 7. Snapshot de carteira

**Papel no modelo**

Representa uma captura temporal da carteira consolidada para sustentar histórico de leitura, recomendação, alertas e comparativos.

**Classificação**

* **Fato:** o produto já trabalha com leitura consolidada, score, decisão, plano de ação e atualização temporal.
* **Fato:** há issue futura para histórico de recomendações e evolução da leitura ao longo do tempo.
* **Inferência:** histórico leve de snapshots é necessário para sustentar evolução analítica sem depender de reconstrução retroativa frágil.

**Justificativa**

Essa entidade atende necessidade real de histórico e reduz dependência de recomputar o passado a partir de estado corrente.

---

### 8. Leitura analítica

**Papel no modelo**

Representa o resultado consolidado do motor analítico para uma carteira em determinado momento.

**Classificação**

* **Fato:** o sistema já gera score, status, perfil, recomendação principal, plano de ação, alertas e resumo executivo.
* **Fato:** há backlog explícito para isolar o motor analítico, testar essa camada e armazenar histórico de recomendações.
* **Inferência:** persistir a leitura analítica como entidade própria melhora auditabilidade, histórico e estabilidade de contrato.

**Justificativa**

A leitura analítica não deve ficar implícita apenas no payload transitório do backend.

---

### 9. Insight ou item analítico

**Papel no modelo**

Representa observações ou sinais específicos associados a uma leitura analítica, a uma categoria, a um ativo ou à carteira.

**Classificação**

* **Fato:** o produto já expõe alertas, radar, principal ponto de atenção, ranking e explicações complementares.
* **Fato:** há issue futura para detalhar insights por carteira e ativo.
* **Inferência:** armazenar insights como itens estruturados evita reduzir toda a análise a um bloco textual único.

**Justificativa**

Essa entidade prepara profundidade progressiva de leitura sem inflar demais a tabela principal de análise.

---

### 10. Importação

**Papel no modelo**

Representa uma execução de importação de dados para atualização da carteira.

**Classificação**

* **Fato:** issues futuras exigem preview, padronização, deduplicação e testes de importação.
* **Fato:** a operação do produto depende de manter a carteira atualizada.
* **Inferência:** importação não pode continuar tratada apenas como substituição silenciosa de estado operacional.

**Justificativa**

Essa entidade é necessária para rastreabilidade, debug, rollback parcial e confiança operacional.

---

### 11. Linha importada ou staging de importação

**Papel no modelo**

Representa o detalhe granular dos registros recebidos em uma importação, antes ou durante consolidação na posição final.

**Classificação**

* **Fato:** as issues futuras falam explicitamente em preview, padronização, falhas previsíveis e deduplicação.
* **Inferência:** sem staging por linha, esses comportamentos ficam frágeis ou invisíveis.
* **Hipótese:** a implementação inicial pode optar por retenção curta ou retenção limitada por volume para evitar peso desnecessário.

**Justificativa**

Essa entidade existe por necessidade operacional real e não por “idealização ETL”.

---

### 12. Contexto financeiro do usuário

**Papel no modelo**

Representa informações que personalizam recomendação e leitura, como objetivo, perfil simplificado, renda aproximada, plataformas usadas e valor disponível para investir.

**Classificação**

* **Fato:** existem issues futuras para editar contexto financeiro e capturar valor disponível para investir.
* **Inferência:** esse contexto deve ser tratado como dado persistido e não apenas como parâmetro efêmero do backend.
* **Hipótese:** parte desse contexto poderá começar opcional e incompleto nas primeiras fases.

**Justificativa**

Essa entidade aproxima o banco do uso real do produto e melhora aderência das recomendações futuras.

---

### 13. Evento operacional ou log relevante

**Papel no modelo**

Representa eventos úteis de backend, integração, importação e falha com contexto mínimo.

**Classificação**

* **Fato:** há issues futuras para logging técnico mínimo, observabilidade de falhas e monitoramento básico de saúde.
* **Inferência:** a nova base precisa prever uma estrutura simples de eventos operacionais relevantes.
* **Hipótese:** nem todo logging futuro ficará necessariamente no D1, mas uma estrutura mínima relacional faz sentido para rastros críticos do produto.

**Justificativa**

Essa entidade atende necessidade explícita de rastreabilidade e suporte operacional.

---

### 14. Fonte externa de mercado

**Papel no modelo**

Representa referência de origem de dados complementares, como benchmark, cotação ou comparação externa.

**Classificação**

* **Fato:** há issues para integração de dados externos, fallback, política de atualização e validação de consistência com fontes externas.
* **Inferência:** o banco precisa ao menos prever organização mínima dessas referências.
* **Hipótese:** a profundidade dessa modelagem deve ser contida na fase inicial para evitar overengineering.

**Justificativa**

Essa entidade existe porque fontes externas já estão na trilha de evolução do produto e exigem honestidade sobre disponibilidade, origem e atualização.

---

## Tabelas propostas

## 1. `users`

**Objetivo**

Armazenar a identidade lógica do usuário do produto.

**Campos principais sugeridos**

* `id`
* `external_auth_subject`
* `email`
* `display_name`
* `status`
* `created_at`
* `updated_at`

**Tipo de chave**

* chave primária técnica
* unicidade opcional por `external_auth_subject`
* unicidade opcional por `email`, se a estratégia de autenticação exigir

**Justificativa**

Necessária para sair do cenário implícito de usuário único e sustentar login, histórico e segregação de dados.

---

## 2. `portfolios`

**Objetivo**

Representar a carteira lógica do usuário.

**Campos principais sugeridos**

* `id`
* `user_id`
* `name`
* `slug`
* `status`
* `is_primary`
* `base_currency`
* `created_at`
* `updated_at`

**Justificativa**

Evita acoplamento direto entre usuário e todas as estruturas operacionais. Também sustenta crescimento futuro sem obrigar múltiplas carteiras agora.

---

## 3. `platforms`

**Objetivo**

Normalizar instituições e plataformas de origem dos investimentos.

**Campos principais sugeridos**

* `id`
* `code`
* `name`
* `normalized_name`
* `kind`
* `website_url`
* `is_active`
* `created_at`
* `updated_at`

**Justificativa**

Hoje plataforma é texto repetido. Essa tabela melhora consistência, comparação por origem e reduz duplicidade sem excessos.

---

## 4. `asset_types`

**Objetivo**

Definir o catálogo de tipos suportados.

**Campos principais sugeridos**

* `id`
* `code`
* `name`
* `category_group`
* `is_active`
* `is_supported_in_mvp`
* `notes`
* `created_at`
* `updated_at`

**Justificativa**

Atende necessidade explícita de catálogo de tipos e expansão progressiva de cobertura, sem multiplicar tabelas operacionais.

---

## 5. `assets`

**Objetivo**

Representar o instrumento financeiro ou item investível reconhecido pelo sistema.

**Campos principais sugeridos**

* `id`
* `asset_type_id`
* `symbol`
* `name`
* `normalized_name`
* `issuer_name`
* `reference_currency`
* `external_reference`
* `status`
* `created_at`
* `updated_at`

**Justificativa**

Cria uma camada unificada para instrumentos, sem depender de tabelas apartadas por categoria como única forma de persistência.

---

## 6. `portfolio_positions`

**Objetivo**

Representar a posição atual consolidada de um ativo em uma carteira.

**Campos principais sugeridos**

* `id`
* `portfolio_id`
* `asset_id`
* `platform_id`
* `legacy_position_type`
* `status`
* `situation`
* `started_on`
* `quantity`
* `average_price`
* `current_price`
* `invested_amount`
* `current_amount`
* `target_price`
* `stop_loss_price`
* `profitability_ratio`
* `notes`
* `source_updated_at`
* `created_at`
* `updated_at`

**Justificativa**

Essa é a tabela central da carteira atual consolidada. Ela absorve o que hoje está espalhado em `acoes`, `fundos` e `previdencia`, sem apagar a necessidade de compatibilidade futura com o legado.

---

## 7. `position_lots` *(hipótese controlada)*

**Objetivo**

Registrar granularidade por lote apenas se a evolução futura exigir maior precisão operacional.

**Campos principais sugeridos**

* `id`
* `portfolio_position_id`
* `acquired_on`
* `quantity`
* `unit_cost`
* `source_import_row_id`
* `created_at`

**Classificação**

* **Hipótese:** a necessidade de lote não está comprovada no runtime atual.
* **Inferência:** pode ser útil futuramente para alguns tipos de ativo ou importações mais ricas.
* **Decisão:** não deve entrar como estrutura obrigatória da primeira fase se a migração inicial não precisar disso.

**Justificativa**

Mantida como hipótese explícita para evitar sobrecarregar a base inicial sem evidência suficiente.

---

## 8. `planned_orders`

**Objetivo**

Representar pré-ordens ou ordens sugeridas de apoio tático, sem execução financeira.

**Campos principais sugeridos**

* `id`
* `portfolio_id`
* `asset_id`
* `platform_id`
* `order_type`
* `quantity`
* `target_price`
* `valid_until`
* `potential_amount`
* `reference_current_price`
* `status`
* `notes`
* `source_updated_at`
* `created_at`
* `updated_at`

**Justificativa**

Corresponde ao papel atual de `pre_ordens` e mantém o escopo do produto, que orienta mas não executa ordens.

---

## 9. `portfolio_contributions`

**Objetivo**

Representar aportes ou entradas de capital associados à carteira.

**Campos principais sugeridos**

* `id`
* `portfolio_id`
* `platform_id`
* `contribution_month`
* `destination_label`
* `category_label`
* `amount`
* `accumulated_amount`
* `status`
* `source_updated_at`
* `created_at`
* `updated_at`

**Justificativa**

Reflete necessidade já existente de aportes e também pode sustentar lógica futura de valor disponível e evolução patrimonial.

---

## 10. `user_financial_context`

**Objetivo**

Persistir contexto editável do usuário para personalização de leitura e recomendação.

**Campos principais sugeridos**

* `id`
* `user_id`
* `primary_goal`
* `risk_profile_label`
* `monthly_income_range`
* `available_to_invest_amount`
* `recurring_contribution_amount`
* `preferred_platforms_snapshot`
* `notes`
* `created_at`
* `updated_at`

**Justificativa**

Há demanda futura explícita para editar contexto financeiro e capturar valor disponível para investir. Essa tabela evita empurrar esse contexto para `app_config` ou para campos soltos em usuário.

---

## 11. `portfolio_snapshots`

**Objetivo**

Persistir uma captura consolidada da carteira em um instante.

**Campos principais sugeridos**

* `id`
* `portfolio_id`
* `snapshot_date`
* `snapshot_kind`
* `total_invested_amount`
* `total_current_amount`
* `total_profitability_ratio`
* `data_source_label`
* `source_reference`
* `created_at`

**Justificativa**

Atende necessidade futura de histórico de recomendação, alerta de mudança relevante e comparações temporais com base auditável.

---

## 12. `portfolio_snapshot_positions`

**Objetivo**

Persistir o recorte da composição de posições dentro de cada snapshot.

**Campos principais sugeridos**

* `id`
* `portfolio_snapshot_id`
* `asset_id`
* `platform_id`
* `asset_type_id`
* `quantity`
* `invested_amount`
* `current_amount`
* `profitability_ratio`
* `portfolio_share_ratio`
* `status_label`
* `created_at`

**Justificativa**

Permite reconstruir composição histórica da carteira sem depender de estado corrente. É necessária para histórico confiável de evolução.

---

## 13. `portfolio_analyses`

**Objetivo**

Persistir o resultado consolidado do motor analítico para uma carteira ou snapshot.

**Campos principais sugeridos**

* `id`
* `portfolio_id`
* `portfolio_snapshot_id`
* `analysis_version`
* `score_value`
* `score_status`
* `investor_profile_label`
* `decision_status`
* `decision_action_text`
* `decision_focus_label`
* `decision_critical_point`
* `primary_recommendation_title`
* `primary_recommendation_reason`
* `action_plan_priority`
* `action_plan_main_action`
* `action_plan_reason`
* `general_advice_text`
* `analysis_source`
* `created_at`

**Justificativa**

O produto já gera esses artefatos hoje. Persisti-los como análise estruturada melhora histórico, auditabilidade e estabilidade de leitura entre app e backend.

---

## 14. `analysis_insights`

**Objetivo**

Persistir itens analíticos associados a uma análise consolidada.

**Campos principais sugeridos**

* `id`
* `portfolio_analysis_id`
* `scope_type`
* `scope_asset_id`
* `scope_asset_type_id`
* `scope_platform_id`
* `insight_type`
* `priority_level`
* `title`
* `body`
* `metadata_json`
* `created_at`

**Justificativa**

Evita reduzir o histórico analítico a um texto único e prepara a evolução futura de insights detalhados por carteira e por ativo.

---

## 15. `imports`

**Objetivo**

Persistir cada execução de importação de dados.

**Campos principais sugeridos**

* `id`
* `user_id`
* `portfolio_id`
* `source_kind`
* `source_name`
* `file_name`
* `status`
* `started_at`
* `finished_at`
* `raw_row_count`
* `accepted_row_count`
* `rejected_row_count`
* `deduplicated_row_count`
* `error_summary`
* `created_at`

**Justificativa**

Essa tabela é necessária porque importação já foi identificada como fluxo crítico e precisa de rastreabilidade real.

---

## 16. `import_rows`

**Objetivo**

Persistir o detalhe das linhas processadas em uma importação.

**Campos principais sugeridos**

* `id`
* `import_id`
* `row_number`
* `raw_payload_json`
* `normalized_payload_json`
* `deduplication_key`
* `classification_status`
* `error_code`
* `error_message`
* `resolved_asset_id`
* `resolved_platform_id`
* `resolved_position_id`
* `created_at`

**Justificativa**

Suporta preview, deduplicação, depuração e validação de consistência sem precisar tratar tudo como transformação invisível.

---

## 17. `external_data_sources`

**Objetivo**

Catalogar fontes externas complementares relevantes para benchmark, cotação e comparativos.

**Campos principais sugeridos**

* `id`
* `code`
* `name`
* `data_kind`
* `status`
* `update_policy_label`
* `last_success_at`
* `last_failure_at`
* `created_at`
* `updated_at`

**Justificativa**

Há trilha futura explícita para dados externos, fallback e política de atualização. Esta tabela organiza isso no nível certo, sem exagero.

---

## 18. `external_market_references`

**Objetivo**

Persistir valores de referência externa relevantes para o produto.

**Campos principais sugeridos**

* `id`
* `external_data_source_id`
* `reference_code`
* `reference_name`
* `reference_date`
* `reference_value`
* `reference_ratio`
* `status`
* `created_at`

**Justificativa**

Suporta comparativos simples como CDI e futuras referências sem contaminar as posições da carteira com dados de mercado externos.

---

## 19. `operational_events`

**Objetivo**

Persistir eventos relevantes de backend, integração, importação e falha com contexto mínimo.

**Campos principais sugeridos**

* `id`
* `user_id`
* `portfolio_id`
* `event_type`
* `severity`
* `component`
* `message`
* `context_json`
* `occurred_at`

**Justificativa**

As issues futuras já exigem logging mínimo, observabilidade e monitoramento básico. Esta tabela atende isso com escopo controlado.

## Relacionamentos e integridade

## 1. Relações principais

### `users` -> `portfolios`

* um usuário pode ter uma ou mais carteiras
* uma carteira pertence a exatamente um usuário

**Regra de integridade**

* `portfolios.user_id` deve referenciar `users.id`
* não deve existir carteira sem usuário associado
* `is_primary` deve ser coerente por usuário, idealmente com no máximo uma carteira principal ativa por usuário

**Justificativa**

Essa relação é a base para multiusuário e para segregação correta de contexto e dados.

---

### `portfolios` -> `portfolio_positions`

* uma carteira pode ter várias posições
* uma posição pertence a exatamente uma carteira

**Regra de integridade**

* `portfolio_positions.portfolio_id` deve referenciar `portfolios.id`
* não deve existir posição solta sem carteira
* deve haver unicidade operacional mínima para evitar duplicação óbvia da mesma posição consolidada

**Observação**

A chave natural exata ainda precisa de validação. Em princípio, a combinação abaixo tende a ser suficiente para posição consolidada atual:

* `portfolio_id`
* `asset_id`
* `platform_id`
* `legacy_position_type`

**Classificação**

* **Inferência:** essa combinação parece adequada para reduzir duplicidade sem impedir coexistência de tipos distintos de posição.
* **Hipótese:** pode ser necessário refinamento quando houver mais diversidade de instrumentos ou granularidade operacional.

---

### `asset_types` -> `assets`

* um tipo de ativo pode classificar vários ativos
* um ativo pertence a exatamente um tipo principal

**Regra de integridade**

* `assets.asset_type_id` deve referenciar `asset_types.id`
* ativo não deve existir sem tipo classificado

**Justificativa**

Sem isso, o catálogo de tipos vira enfeite e a expansão futura volta a depender de texto livre.

---

### `platforms` -> `portfolio_positions`

* uma plataforma pode aparecer em várias posições
* uma posição pode estar associada a zero ou uma plataforma

**Regra de integridade**

* `portfolio_positions.platform_id` deve referenciar `platforms.id`
* a nulabilidade é aceitável apenas quando a origem não estiver identificada com segurança

**Classificação**

* **Fato:** o legado atual depende fortemente de `plataforma`
* **Inferência:** a plataforma deve ser referência opcionalmente obrigatória, conforme qualidade da origem
* **Hipótese:** em fases futuras pode ser razoável tornar `platform_id` obrigatório para todos os registros operacionais novos

---

### `assets` -> `portfolio_positions`

* um ativo pode existir em várias posições de várias carteiras
* uma posição deve apontar para exatamente um ativo

**Regra de integridade**

* `portfolio_positions.asset_id` deve referenciar `assets.id`
* posição não deve existir sem ativo resolvido

**Ponto de atenção**

No legado, o nome do item e sua categoria ainda são muitas vezes a própria identidade operacional. Na migração inicial, o processo de resolução de ativo precisa ser conservador para não gerar associação errada.

---

### `portfolios` -> `planned_orders`

* uma carteira pode ter várias pré-ordens
* uma pré-ordem pertence a uma carteira

**Regra de integridade**

* `planned_orders.portfolio_id` deve referenciar `portfolios.id`

### `assets` -> `planned_orders`

* uma pré-ordem deve apontar para um ativo
* `planned_orders.asset_id` deve referenciar `assets.id`

**Justificativa**

Pré-ordem é parte do fluxo atual do produto e não deve ficar implícita dentro de posição ou análise.

---

### `portfolios` -> `portfolio_contributions`

* uma carteira pode ter vários aportes
* um aporte pertence a uma carteira

**Regra de integridade**

* `portfolio_contributions.portfolio_id` deve referenciar `portfolios.id`

### `platforms` -> `portfolio_contributions`

* aporte pode opcionalmente estar associado a plataforma

**Justificativa**

O legado já trata aportes como conjunto próprio e isso continua tendo função real no produto.

---

### `users` -> `user_financial_context`

* um usuário pode ter zero ou um contexto financeiro ativo principal
* o contexto pertence a exatamente um usuário

**Regra de integridade**

* `user_financial_context.user_id` deve referenciar `users.id`
* deve haver no máximo um contexto ativo corrente por usuário, salvo se futuramente for adotado versionamento explícito dessa tabela

**Classificação**

* **Inferência:** começar com um registro atual por usuário é suficiente
* **Hipótese:** histórico formal de contexto pode ser necessário depois, mas não deve entrar agora sem demanda operacional concreta

---

### `portfolios` -> `portfolio_snapshots`

* uma carteira pode gerar vários snapshots
* um snapshot pertence a exatamente uma carteira

**Regra de integridade**

* `portfolio_snapshots.portfolio_id` deve referenciar `portfolios.id`

### `portfolio_snapshots` -> `portfolio_snapshot_positions`

* um snapshot pode ter várias posições fotografadas
* uma posição de snapshot pertence a exatamente um snapshot

**Regra de integridade**

* `portfolio_snapshot_positions.portfolio_snapshot_id` deve referenciar `portfolio_snapshots.id`

### `assets`, `platforms`, `asset_types` -> `portfolio_snapshot_positions`

* registro do snapshot pode apontar para ativo, plataforma e tipo

**Justificativa**

Isso permite reconstrução histórica sem corromper a posição corrente.

---

### `portfolios` -> `portfolio_analyses`

* uma carteira pode ter várias análises ao longo do tempo
* uma análise pertence a uma carteira
* opcionalmente pode estar associada a um snapshot específico

**Regra de integridade**

* `portfolio_analyses.portfolio_id` deve referenciar `portfolios.id`
* `portfolio_analyses.portfolio_snapshot_id` pode referenciar `portfolio_snapshots.id`

**Justificativa**

A análise não deve depender obrigatoriamente de snapshot se, em alguma fase, houver leitura gerada sobre estado corrente sem captura formal. Mas quando houver snapshot, a associação é desejável.

---

### `portfolio_analyses` -> `analysis_insights`

* uma análise pode ter vários insights estruturados
* um insight pertence a exatamente uma análise

**Regra de integridade**

* `analysis_insights.portfolio_analysis_id` deve referenciar `portfolio_analyses.id`

**Justificativa**

Sustenta profundidade progressiva de leitura e histórico auditável dos sinais exibidos.

---

### `users`, `portfolios` -> `imports`

* um usuário pode executar várias importações
* uma importação pertence a um usuário
* uma importação pode estar associada a uma carteira

**Regra de integridade**

* `imports.user_id` deve referenciar `users.id`
* `imports.portfolio_id` deve referenciar `portfolios.id`

### `imports` -> `import_rows`

* uma importação pode ter várias linhas
* uma linha pertence a exatamente uma importação

**Regra de integridade**

* `import_rows.import_id` deve referenciar `imports.id`

**Justificativa**

Essa relação é necessária para rastreabilidade, preview, deduplicação e suporte operacional.

---

### `external_data_sources` -> `external_market_references`

* uma fonte externa pode produzir várias referências
* uma referência pertence a exatamente uma fonte

**Regra de integridade**

* `external_market_references.external_data_source_id` deve referenciar `external_data_sources.id`

**Justificativa**

Separa claramente o catálogo da fonte da série de dados ou referência consumida.

---

### `users`, `portfolios` -> `operational_events`

* evento pode estar associado a usuário, carteira ou ambos

**Regra de integridade**

* `operational_events.user_id` pode referenciar `users.id`
* `operational_events.portfolio_id` pode referenciar `portfolios.id`

**Justificativa**

Observabilidade útil exige contexto, mas nem todo evento terá ambos os níveis preenchidos.

---

## 2. Regras de integridade relevantes

### 2.1 Integridade de identidade

* usuário não pode ser implícito
* carteira não pode existir sem usuário
* posição não pode existir sem carteira e sem ativo
* análise não pode existir sem carteira

### 2.2 Integridade de domínio

* tipo de ativo deve existir antes do ativo
* ativo deve existir antes da posição
* snapshot deve existir antes de suas posições históricas
* análise deve referenciar carteira e, quando disponível, snapshot coerente com a mesma carteira

### 2.3 Integridade de rastreabilidade

* importação deve existir antes de suas linhas
* evento operacional deve registrar ao menos tipo, severidade, componente e instante
* snapshot e análise devem ter marca temporal clara

### 2.4 Integridade de status

Campos de status devem ser controlados por convenção de domínio, e não por texto livre ilimitado.

Exemplos que merecem vocabulário controlado:

* status de posição
* situação operacional
* status de importação
* severidade de evento
* status de fonte externa
* prioridade de plano de ação

**Classificação**

* **Inferência:** em D1/SQLite, o controle pode começar com validação de aplicação e convenção documentada, sem tentar sofisticar demais o banco logo na fase inicial.
* **Hipótese:** algumas dessas listas poderão migrar para tabelas de domínio se a operação futura provar necessidade.

### 2.5 Integridade temporal

* `created_at` deve existir onde o registro nasce como entidade persistida
* `updated_at` deve existir onde o registro pode ser alterado ao longo do tempo
* `source_updated_at` deve existir quando a origem do dado atual for diferente do instante de persistência local
* snapshots e análises devem ter data suficiente para reconstrução cronológica

**Justificativa**

Isso atende necessidade explícita de histórico, atualização honesta e observabilidade mínima.

---

## Decisões de modelagem e justificativas

## 1. Separar `asset` de `portfolio_position`

**Decisão**

Ativo e posição não serão a mesma entidade.

**Justificativa**

O ativo representa o instrumento. A posição representa o vínculo do usuário com esse instrumento em uma carteira e plataforma. Misturar os dois manteria a modelagem presa à lógica atual de linhas operacionais.

**Classificação**

* **Fato:** o produto já diferencia conceitualmente o item investível da posição na carteira
* **Inferência:** essa separação é necessária para suportar reuso, multiusuário e histórico
* **Hipótese:** certos ativos muito específicos podem exigir refinamento futuro, mas a separação continua válida

---

## 2. Não manter “uma tabela principal por tipo” como núcleo do domínio

**Decisão**

A base alvo não será centrada em tabelas independentes como `acoes`, `fundos` e `previdencia` como verdade de domínio principal.

**Justificativa**

Esse desenho é reflexo do legado operacional. Como núcleo permanente, ele trava:

* catálogo expandido de tipos
* suporte progressivo a novos instrumentos
* multiusuário
* comparações transversais
* histórico unificado
* importação consistente

**Classificação**

* **Fato:** as issues futuras pedem ampliação de tipos, histórico, comparação por plataforma e multiusuário
* **Inferência:** manter o mesmo desenho como núcleo bloquearia essas evoluções
* **Hipótese:** tabelas ou views compatíveis por categoria ainda farão sentido na transição

---

## 3. Manter estruturas específicas apenas quando o comportamento for realmente distinto

**Decisão**

Estruturas específicas permanecem apenas quando representam comportamento de negócio realmente diferente, como:

* `planned_orders`
* `portfolio_contributions`
* `imports`
* `operational_events`

**Justificativa**

Esses casos não são “tipos de ativo”. São processos ou objetos com papel distinto no produto.

---

## 4. Persistir snapshots e análises separadamente

**Decisão**

Snapshot e análise serão entidades distintas.

**Justificativa**

Snapshot registra o estado observado da carteira. Análise registra interpretação calculada sobre esse estado. Misturar os dois dificultaria auditoria e evolução do motor analítico.

**Classificação**

* **Fato:** o produto já distingue dados da carteira de leitura analítica
* **Inferência:** persistir isso separadamente é coerente com a evolução futura
* **Hipótese:** em algumas fases iniciais uma análise poderá ser gerada sem snapshot formal, mas o modelo continua comportando isso

---

## 5. Tratar importação como processo rastreável

**Decisão**

Importação terá entidade própria e staging por linha.

**Justificativa**

As issues futuras pedem explicitamente preview, padronização, deduplicação, QA de importação e confiabilidade operacional. Sem staging, isso vira caixa-preta.

---

## 6. Não transformar contexto financeiro em configuração genérica

**Decisão**

Contexto do usuário fica em tabela própria e não em `app_config` genérico.

**Justificativa**

Esse contexto influencia recomendação, perfil, disponibilidade de investimento e leitura futura. Ele é dado de domínio, não configuração arbitrária.

---

## 7. Não inflar a base com engine genérica de regras

**Decisão**

Não serão criadas agora tabelas abstratas para qualquer tipo de regra, recomendação, fórmula ou motor configurável.

**Justificativa**

O projeto atual não demonstra necessidade real de um motor totalmente parametrizável em banco. Isso seria overengineering claro.

---

## 8. Não antecipar demais suporte profundo a tipos avançados

**Decisão**

A modelagem prepara `asset_types`, mas não cria agora tabelas específicas para cripto, derivativos, internacional ou renda fixa complexa.

**Justificativa**

Há evidência de preparação futura, mas não de necessidade estrutural imediata para modelagem especializada por subtipo.

**Classificação**

* **Fato:** há issue para suporte progressivo a tipos avançados
* **Inferência:** o catálogo deve permitir crescimento
* **Hipótese:** especialização por subtipo só deve entrar quando o produto realmente precisar tratar esses instrumentos com regras próprias

## Pontos de atenção

## 1. Resolução de identidade de ativo ainda é sensível

### Fato

O legado atual usa identificadores diferentes conforme a categoria:

* `ativo` para ações
* `fundo` para fundos
* `plano` para previdência

### Inferência

A unificação em `assets` é correta, mas a migração inicial vai depender de uma política conservadora de resolução de identidade. Isso é especialmente importante para:

* nomes de fundos inconsistentes
* planos de previdência com nomenclatura instável
* registros com identificação parcial
* uso simultâneo de apelidos e nomes completos

### Hipótese

Pode ser necessário operar inicialmente com `external_reference` ou `normalized_name` como apoio de resolução antes de haver catálogo mais estável para todos os instrumentos.

---

## 2. A posição consolidada atual pode esconder granularidade futura

### Fato

O runtime atual trabalha sobre estado consolidado, não sobre histórico transacional detalhado.

### Inferência

A tabela `portfolio_positions` é suficiente para a migração inicial e para o produto atual, mas ela não substitui uma futura camada transacional caso o produto passe a exigir:

* histórico real de movimentações
* precisão fiscal
* cálculo por lote
* cronologia detalhada de entradas e saídas

### Decisão

Essa profundidade não deve entrar agora. O modelo alvo deve admitir crescimento futuro, mas sem antecipar estrutura transacional completa.

---

## 3. Compatibilidade com legado exigirá vocabulário operacional persistido

### Fato

O Apps Script atual consome conceitos e nomes operacionais que ainda derivam da planilha e das tabelas atuais.

### Inferência

A base nova precisará preservar alguns campos auxiliares com função transitória, como:

* `legacy_position_type`
* `destination_label`
* `category_label`
* `status`
* `situation`

Esses campos não são ideais como taxonomia permanente, mas são úteis para compatibilidade de transição.

### Risco

Se esses campos se tornarem o centro do domínio novamente, a modelagem nova degrada para uma reedição do legado.

---

## 4. Observabilidade em banco precisa ser contida

### Fato

Há necessidade explícita de logging técnico mínimo e observabilidade de falhas.

### Inferência

Persistir eventos relevantes em `operational_events` faz sentido.

### Risco

Usar D1 como repositório de log bruto de alto volume seria escolha ruim. O papel dessa tabela deve ser:

* registrar eventos críticos
* registrar contexto mínimo de falha
* sustentar diagnóstico e histórico operacional relevante

e não substituir uma stack completa de observabilidade.

---

## 5. Histórico analítico pode crescer rápido se não houver política de retenção

### Fato

O produto quer histórico de recomendação, alertas e evolução.

### Inferência

`portfolio_snapshots`, `portfolio_snapshot_positions`, `portfolio_analyses` e `analysis_insights` são justificáveis.

### Risco

Sem política clara de periodicidade e retenção, o crescimento pode ficar desordenado.

### Hipótese

Pode ser suficiente começar com snapshots e análises em eventos relevantes, como:

* importação concluída
* atualização operacional relevante
* mudança significativa de score ou recomendação
* execução agendada de consolidação

sem transformar tudo em snapshot contínuo sem critério.

---

## 6. Importação com staging é necessária, mas precisa de escopo realista

### Fato

Há demanda real por preview, normalização, deduplicação e validação de falhas previsíveis.

### Inferência

`imports` e `import_rows` são necessárias.

### Risco

Transformar esse staging em pipeline excessivamente sofisticado antes da hora seria exagero.

### Decisão

A modelagem deve sustentar:

* rastreabilidade
* preview
* deduplicação
* erro por linha
* vínculo com posição resolvida

sem tentar virar plataforma genérica de ETL.

---

## 7. A nova base ainda não resolve sozinha a fragilidade do backend atual

### Fato

O backend atual continuará existindo neste momento.

### Inferência

A nova base melhora a fundação estrutural, mas não elimina sozinha problemas atuais de:

* segredos mal geridos
* deploy frágil do Apps Script
* drift de versionamento
* contratos frouxos de API
* acoplamento excessivo no `Dashboard.html`

### Conclusão

O banco novo é condição importante para evolução saudável, mas não é solução mágica isolada.

---

## Riscos de overengineering

## 1. Criar estrutura transacional completa sem demanda real

### Risco

Antecipar agora tabelas completas de:

* ordens executadas
* movimentações detalhadas
* lote fiscal
* eventos contábeis

seria desnecessário.

### Motivo

O produto atual é de leitura, consolidação e orientação. Ele não executa operações e não demonstra necessidade comprovada de ledger completo nesta fase.

---

## 2. Criar hierarquia profunda de subtipos de ativo

### Risco

Modelar agora tabelas específicas para:

* ações
* FIIs
* ETFs
* cripto
* títulos públicos
* CDB
* LCI
* LCA
* previdência com subtipos
* fundos com taxonomia profunda

seria prematuro.

### Motivo

As issues futuras pedem preparação e ampliação gradual, não taxonomia definitiva de todos os instrumentos desde já.

### Decisão

`asset_types` + `assets` + `portfolio_positions` é suficiente como base inicial sustentável.

---

## 3. Criar engine parametrizável de análise em banco

### Risco

Criar tabelas genéricas para:

* regras de score
* fórmulas configuráveis
* pipeline declarativo de recomendação
* templates profundamente parametrizados

não tem base suficiente no projeto atual.

### Motivo

O motor analítico ainda é código e as issues futuras pedem isolamento, teste e auditabilidade, não transformação em engine low-code.

---

## 4. Criar modelo completo de RBAC ou IAM interno

### Risco

Antecipar um sistema complexo de perfis, papéis, permissões e escopos finos dentro do banco seria exagero.

### Motivo

O projeto precisa de autenticação mínima, isolamento por usuário e restrição mais clara de rotas. Isso não exige, neste momento, um modelo corporativo de autorização.

---

## 5. Criar camada de observabilidade pesada dentro do D1

### Risco

Usar D1 como base de logs detalhados de tudo seria ruim para simplicidade, custo e manutenção.

### Motivo

A necessidade comprovada é de logging técnico mínimo e rastros úteis de falha, não de observabilidade total dentro do banco relacional.

---

## 6. Criar histórico de tudo indiscriminadamente

### Risco

Versionar em banco cada alteração de cada tabela desde o início pode inflar a estrutura sem ganho proporcional.

### Motivo

O histórico com justificativa real hoje está claramente ligado a:

* snapshots de carteira
* leituras analíticas
* importações
* eventos operacionais relevantes

e não a um versionamento universal de todas as entidades.

---

## Pendências para validação

## 1. Estratégia final de identificação do usuário

### Pendente

Definir se o identificador principal futuro será baseado em:

* Google login
* e-mail
* identificador interno abstraído da autenticação
* combinação desses fatores

### Impacto

Afeta unicidade e campos definitivos de `users`.

---

## 2. Regra de unicidade da posição consolidada

### Pendente

Validar se a combinação abaixo é suficiente para evitar duplicidade indevida na posição atual:

* `portfolio_id`
* `asset_id`
* `platform_id`
* `legacy_position_type`

### Impacto

Afeta integridade da tabela `portfolio_positions` e futura camada de compatibilidade com o legado.

---

## 3. Política de retenção de snapshots e análises

### Pendente

Definir quando o sistema deve gerar:

* snapshot
* análise
* insights persistidos

### Impacto

Afeta volume de dados, cronologia confiável e utilidade do histórico.

---

## 4. Grau de persistência das linhas de importação

### Pendente

Definir se `import_rows` terá:

* retenção longa
* retenção curta
* retenção apenas para execuções recentes
* descarte parcial após consolidação

### Impacto

Afeta custo, auditabilidade e suporte operacional.

---

## 5. Estratégia de resolução de ativos na migração inicial

### Pendente

Definir como a nova base resolverá instrumentos do legado que hoje dependem de nomes operacionais ou cabeçalhos inconsistentes.

### Impacto

Afeta migração segura de ações, fundos e previdência sem associação errada.

---

## 6. Nível inicial de obrigatoriedade para `platform_id`

### Pendente

Definir se, na migração inicial, registros sem plataforma conhecida serão aceitos como exceção ou se haverá saneamento obrigatório prévio.

### Impacto

Afeta consistência da base e complexidade da etapa inicial.

---

## 7. Escopo inicial de fontes externas

### Pendente

Definir se a primeira fase da modelagem deve contemplar apenas benchmark simples, como CDI, ou já também:

* cotações de ativos
* comparativos por mercado
* referência por categoria

### Impacto

Afeta profundidade real de `external_data_sources` e `external_market_references`.

---

## 8. Necessidade real de `position_lots`

### Pendente

Confirmar se a granularidade por lote deve entrar em fase posterior ou permanecer fora da estrutura inicial.

### Impacto

Afeta simplicidade da base inicial e profundidade operacional futura.

