# Data Mapping da Migração para D1

## Objetivo do documento

Descrever o mapeamento entre as estruturas atuais do projeto e o modelo de dados alvo, de forma utilizável para geração posterior do schema do banco em Cloudflare D1.

Este documento tem função estrutural. Ele deve permitir, com base no próprio conteúdo, derivar depois com segurança:

- schema relacional inicial
- `CREATE TABLE`
- `CREATE INDEX`
- `CREATE VIEW` de compatibilidade com legado, quando necessário
- regras de carga inicial e transição

Este documento não define estratégia detalhada de migração por fase nem contém SQL. O foco aqui é mapear, com precisão suficiente, a passagem entre:

- fontes atuais do projeto
- estruturas operacionais herdadas de planilha e BigQuery
- modelo de dados alvo definido para D1

Critério de qualidade deste documento:

- cada tabela-alvo relevante deve ter origem identificável
- cada campo relevante deve ter justificativa de existência
- cada regra de transformação deve apoiar a geração posterior do schema
- cada incerteza deve ser explicitada para não contaminar o SQL futuro com suposição silenciosa

---

## Premissas e limitações

### Premissas

#### Fato

O backend atual em Apps Script não deve ser alterado nesta etapa de desenho.

#### Fato

O projeto atual opera com BigQuery como fonte primária do dashboard e Google Sheets como fallback e origem estrutural herdada.

#### Fato

O modelo de dados alvo já foi definido previamente com núcleo relacional baseado em:

- `users`
- `portfolios`
- `platforms`
- `asset_types`
- `assets`
- `portfolio_positions`
- `planned_orders`
- `portfolio_contributions`
- `user_financial_context`
- `portfolio_snapshots`
- `portfolio_snapshot_positions`
- `portfolio_analyses`
- `analysis_insights`
- `imports`
- `import_rows`
- `external_data_sources`
- `external_market_references`
- `operational_events`

#### Fato

A nova base deve permitir convivência temporária com o legado AppScript e não pode exigir ruptura imediata do runtime atual.

#### Inferência

O data mapping precisa servir simultaneamente a dois objetivos:

1. estruturar o novo domínio em D1
2. preservar informação suficiente para posterior criação de views ou camada de compatibilidade para o legado

#### Inferência

O mapeamento não pode assumir que toda origem atual é semanticamente correta. Parte do trabalho aqui é separar:

- campo herdado útil
- campo herdado apenas operacional
- alias legado
- ambiguidade que precisa de saneamento antes do schema final

### Limitações

#### Fato

Nem todos os fluxos futuros já existem no código atual. Parte das necessidades vem de issues futuras do GitHub e ainda não de implementação.

#### Fato

Nem todos os campos futuros possuem hoje origem materializada em uma base estruturada. Em vários casos, a necessidade está confirmada, mas a origem inicial dependerá de criação de nova captura ou de preenchimento posterior.

#### Fato

Há convivência entre três camadas de verdade parcial:

- legado funcional centrado em planilha
- runtime atual centrado em BigQuery + Apps Script
- backlog futuro com ampliação de produto

#### Inferência

Alguns campos do modelo alvo poderão nascer inicialmente vazios, opcionais ou derivados, desde que isso esteja explicitado no mapeamento.

#### Hipótese

A resolução de identidade de alguns instrumentos, especialmente fundos e previdência, pode exigir normalização por nome antes de haver identificador mais estável na base nova.

#### Hipótese

Algumas regras futuras de autenticação e multiusuário ainda podem alterar detalhes de identificação do usuário, mas não invalidam a necessidade de mapear desde já a separação por usuário.

### Regras de uso deste documento

- quando a origem estiver confirmada no código ou na documentação operacional, marcar como fato
- quando a ligação for estruturalmente muito provável, mas não literalmente implementada, marcar como inferência
- quando depender de decisão futura ou validação adicional, marcar como hipótese
- não inventar preenchimento para campo sem origem, sem derivação clara ou sem justificativa funcional evidente

---

## Fontes atuais de dados

## 1. Google Sheets operacional

- **Nome da fonte:** Planilha operacional do Esquilo Invest
- **Tipo da fonte:** planilha estruturada
- **Papel no sistema atual:** origem histórica da estrutura operacional; fallback do dashboard; base do contrato herdado por cabeçalhos; referência para sync com BigQuery
- **Nível de confiabilidade da informação disponível:** alto para estrutura de abas e cabeçalhos; médio para semântica de alguns campos; baixo para governança de domínio
- **Observações relevantes:**
  - as abas operacionais conhecidas são `Acoes`, `Fundos`, `Previdencia`, `PreOrdens`, `Aportes` e `Config`
  - há aliases legados preservados nos cabeçalhos, como `qtd`, `entrada`, `stop`, `inicio`, `plano_fundo` e `total_aportado`
  - o contrato herdado ainda depende fortemente de cabeçalho exato ou normalização por leitor
  - a planilha não deve ser tratada como modelo de domínio alvo, mas como fonte importante de transição

### Estruturas conhecidas

#### Aba `Acoes`

Campos operacionais confirmados:

- `tipo`
- `ativo`
- `plataforma`
- `status`
- `situacao`
- `data_entrada`
- `quantidade`
- `preco_medio`
- `cotacao_atual`
- `valor_investido`
- `valor_atual`
- `stop_loss`
- `alvo`
- `rentabilidade`
- `observacao`
- `atualizado_em`
- aliases: `entrada`, `qtd`, `stop`

#### Aba `Fundos`

Campos operacionais confirmados:

- `fundo`
- `plataforma`
- `categoria`
- `estrategia`
- `status`
- `situacao`
- `data_inicio`
- `valor_investido`
- `valor_atual`
- `rentabilidade`
- `observacao`
- `atualizado_em`
- alias: `inicio`

#### Aba `Previdencia`

Campos operacionais confirmados:

- `plano`
- `plataforma`
- `tipo`
- `estrategia`
- `status`
- `situacao`
- `data_inicio`
- `valor_investido`
- `valor_atual`
- `rentabilidade`
- `observacao`
- `atualizado_em`
- aliases: `plano_fundo`, `inicio`, `total_aportado`

#### Aba `PreOrdens`

Campos operacionais confirmados:

- `tipo`
- `ativo`
- `plataforma`
- `tipo_ordem`
- `quantidade`
- `preco_alvo`
- `validade`
- `valor_potencial`
- `cotacao_atual`
- `status`
- `observacao`
- alias: `qtd`

#### Aba `Aportes`

Campos operacionais confirmados:

- `mes_ano`
- `destino`
- `categoria`
- `plataforma`
- `valor`
- `acumulado`
- `status`

#### Aba `Config`

Campos operacionais confirmados:

- `chave`
- `valor`
- `descricao`
- `atualizado_em`

## 2. BigQuery operacional

- **Nome da fonte:** dataset operacional `esquilo_invest`
- **Tipo da fonte:** banco analítico/operacional estruturado
- **Papel no sistema atual:** fonte primária de leitura do dashboard atual; persistência principal do backend atual; base do CRUD controlado
- **Nível de confiabilidade da informação disponível:** alto para existência das tabelas e colunas principais; médio para semântica consolidada de domínio; médio para regras de chave funcional
- **Observações relevantes:**
  - as tabelas conhecidas refletem diretamente as abas operacionais
  - o modelo atual é uma transposição estruturada do legado de planilha, não um modelo de domínio já estabilizado
  - parte da leitura atual do dashboard depende dessas tabelas como fonte principal

### Tabelas conhecidas

- `acoes`
- `fundos`
- `previdencia`
- `pre_ordens`
- `aportes`
- `app_config`

### Estrutura operacional confirmada por documentação e código

#### `acoes`

Campos confirmados:

- `tipo`
- `ativo`
- `plataforma`
- `status`
- `situacao`
- `data_entrada`
- `quantidade`
- `preco_medio`
- `cotacao_atual`
- `valor_investido`
- `valor_atual`
- `stop_loss`
- `alvo`
- `rentabilidade`
- `observacao`
- `atualizado_em`

#### `fundos`

Campos confirmados:

- `fundo`
- `plataforma`
- `categoria`
- `estrategia`
- `status`
- `situacao`
- `data_inicio`
- `valor_investido`
- `valor_atual`
- `rentabilidade`
- `observacao`
- `atualizado_em`

#### `previdencia`

Campos confirmados:

- `plano`
- `plataforma`
- `tipo`
- `estrategia`
- `status`
- `situacao`
- `data_inicio`
- `valor_investido`
- `valor_atual`
- `rentabilidade`
- `observacao`
- `atualizado_em`

#### `pre_ordens`

Campos confirmados:

- `tipo`
- `ativo`
- `plataforma`
- `tipo_ordem`
- `quantidade`
- `preco_alvo`
- `validade`
- `valor_potencial`
- `cotacao_atual`
- `status`
- `observacao`

#### `aportes`

Campos confirmados:

- `mes_ano`
- `destino`
- `categoria`
- `plataforma`
- `valor`
- `acumulado`
- `status`

#### `app_config`

Campos confirmados:

- `chave`
- `valor`
- `descricao`
- `atualizado_em`

## 3. Payload consolidado do backend Apps Script

- **Nome da fonte:** payload de `getDashboardData()` e rotas correlatas
- **Tipo da fonte:** estrutura agregada e derivada
- **Papel no sistema atual:** contrato funcional do dashboard web e base de parte do contrato mobile
- **Nível de confiabilidade da informação disponível:** alto para presença de blocos principais; médio para estrutura detalhada de todos os subcampos; alto para relevância funcional
- **Observações relevantes:**
  - esta fonte não é origem primária de domínio bruto; ela é resultado consolidado de leitura, cálculo e transformação
  - ainda assim, ela é fonte importante para identificar quais objetos de negócio realmente existem no produto atual
  - também orienta o que precisará de compatibilidade futura entre base nova e backend atual

### Blocos funcionais confirmados no payload atual

- `summary`
- `actions`
- `investments`
- `previdencias`
- `orders`
- `score`
- `actionPlan`
- `portfolioDecision`
- `messaging`
- `categorySnapshots`
- `assetRanking`
- `operations`
- `updatedAt`
- `dataSource`
- `sourceWarning`

### Uso estrutural desta fonte no data mapping

- identificar entidades analíticas reais
- identificar recortes históricos necessários
- identificar campos derivados que não devem ser tratados como persistência bruta
- identificar estruturas que poderão exigir view de compatibilidade ou materialização posterior

## 4. Código e documentação operacional do repositório

* **Nome da fonte:** código-fonte do repositório e documentação operacional consolidada
* **Tipo da fonte:** fonte estrutural e documental
* **Papel no sistema atual:** confirmar responsabilidades reais do backend, contratos legados, drift entre documentação e runtime e necessidades futuras já reconhecidas
* **Nível de confiabilidade da informação disponível:** alto para responsabilidades atuais e estruturas conhecidas; médio para detalhes futuros ainda não implementados
* **Observações relevantes:**

  * essa fonte não substitui a base operacional, mas ajuda a validar o que o produto realmente usa hoje
  * é especialmente importante para distinguir dado bruto, dado derivado, dado apenas visual e necessidade futura legítima

### Itens confirmados relevantes para o data mapping

#### Documentação e mapeamentos operacionais

* `data/bigquery/table_schemas.md`
* `data/mappings/operational_sheet_headers.md`
* `docs/project_context.md`
* `docs/functional/functional_overview_legacy.md`
* `docs/release_notes/release_notes.md`
* `plans/roadmap/evolution_tracks.md`
* `plans/sprints/backlog.md`

#### Arquivos de backend e serviços

* `apps_script/backend/Backend_Core.gs`
* `apps_script/backend/Mobile_Api.gs`
* `apps_script/backend/Operational_CRUD.gs`
* `apps_script/services/BigQueryService.gs`
* `apps_script/integrations/BigQuery_Sync.gs`
* `apps_script/integrations/Api_Keys.gs`

#### Arquivos de frontend e app

* `frontend/html/Dashboard.html`
* `mobile_app/lib/*`

### Uso estrutural desta fonte no data mapping

* confirmar quais tabelas atuais existem de fato
* confirmar quais campos e blocos do payload são persistidos e quais são derivados
* confirmar dependências do legado AppScript
* identificar o que já pode ser tratado como necessidade de schema e o que ainda é apenas direção futura

---

## 5. Issues futuras do GitHub

* **Nome da fonte:** backlog futuro registrado em issues do repositório
* **Tipo da fonte:** fonte de evolução funcional e estrutural
* **Papel no sistema atual:** indicar necessidades futuras já legitimadas pelo projeto e que devem influenciar o data mapping sem gerar overengineering
* **Nível de confiabilidade da informação disponível:** alto para direção de produto e técnica; médio para detalhe exato de implementação
* **Observações relevantes:**

  * as issues não são origem de dado atual, mas são origem válida para justificar estruturas futuras mínimas no modelo alvo
  * elas não autorizam inflar o schema; autorizam apenas preparar o que já é recorrente, explícito e estruturalmente necessário

### Trilhas futuras com impacto direto no mapping

#### Multiusuário, autenticação e segregação

Issues relevantes:

* autenticação mínima
* login por Google e e-mail
* preparação para múltiplos usuários
* separação por usuário e contexto individual

Impacto no mapping:

* exige `users`
* exige `portfolios`
* exige associação de importações, snapshots, análises e eventos ao usuário correto

---

#### Importação e confiabilidade operacional

Issues relevantes:

* automação de testes de importação
* preview
* padronização
* deduplicação
* QA ponta a ponta

Impacto no mapping:

* exige `imports`
* exige `import_rows`
* exige rastreabilidade de linha importada e resultado de consolidação

---

#### Evolução analítica e histórico

Issues relevantes:

* histórico de recomendações
* alertas de mudança relevante
* score em camadas
* detalhamento de insights por carteira e ativo
* isolar motor de análise

Impacto no mapping:

* exige `portfolio_snapshots`
* exige `portfolio_snapshot_positions`
* exige `portfolio_analyses`
* exige `analysis_insights`

---

#### Cobertura de tipos e fontes externas

Issues relevantes:

* catálogo de tipos suportados
* suporte a tipos avançados
* CDI e benchmark
* dados externos complementares
* fallback de fonte externa
* política de atualização de cotações
* validação de consistência com dados externos

Impacto no mapping:

* exige `asset_types`
* reforça necessidade de `assets`
* exige `external_data_sources`
* exige `external_market_references`

---

#### Observabilidade e operação

Issues relevantes:

* logging técnico mínimo
* monitoramento de falhas
* observabilidade básica
* rollback e controle de versão

Impacto no mapping:

* exige `operational_events`
* exige campos mínimos de rastreabilidade nas entidades principais

---

## Visão geral do mapeamento

| Origem              | Estrutura de origem  | Destino | Estrutura de destino                                         | Objetivo funcional                  | Observações                                   |
| ------------------- | -------------------- | ------- | ------------------------------------------------------------ | ----------------------------------- | --------------------------------------------- |
| Google Sheets       | Aba Acoes            | D1      | portfolio_positions + assets + platforms                     | Representar posições de ações       | Separação entre ativo e posição               |
| Google Sheets       | Aba Fundos           | D1      | portfolio_positions + assets + platforms                     | Representar posições de fundos      | Categoria vira atributo, não tabela           |
| Google Sheets       | Aba Previdencia      | D1      | portfolio_positions + assets + platforms                     | Representar posições de previdência | Alias precisam de normalização                |
| Google Sheets       | Aba PreOrdens        | D1      | planned_orders                                               | Representar ordens planejadas       | Estrutura distinta de posição                 |
| Google Sheets       | Aba Aportes          | D1      | portfolio_contributions                                      | Representar aportes                 | Manter semântica operacional                  |
| Google Sheets       | Aba Config           | D1      | user_financial_context                                       | Representar contexto financeiro     | Não replicar como config genérico             |
| BigQuery            | tabelas operacionais | D1      | mesmas estruturas do modelo alvo                             | Fonte principal de dados atuais     | Base principal da carga inicial               |
| Backend Apps Script | payload consolidado  | D1      | portfolio_snapshots + portfolio_analyses + analysis_insights | Persistir leitura analítica         | Não persistir tudo, apenas o que agrega valor |
| Issues futuras      | backlog              | D1      | múltiplas tabelas estruturais                                | Preparar evolução                   | Não inflar schema além do necessário          |

---

## Mapeamento por entidade

### Entidade: Usuário

* **Função no produto:** dono da carteira, contexto e histórico
* **Origem atual:** inexistente explicitamente (modelo implícito single-user)
* **Destino proposto:** `users`
* **Observações de transição:** criação inicial com único usuário padrão
* **Riscos:** inconsistência futura se identificador não for padronizado desde início

---

### Entidade: Carteira

* **Função no produto:** agregador de posições, análises e importações
* **Origem atual:** implícita (carteira única no sistema)
* **Destino proposto:** `portfolios`
* **Observações de transição:** inicializar uma carteira principal por usuário
* **Riscos:** duplicidade futura se não houver controle de unicidade por usuário

---

### Entidade: Plataforma

* **Função no produto:** origem dos investimentos
* **Origem atual:** campo textual em múltiplas tabelas
* **Destino proposto:** `platforms`
* **Observações de transição:** normalização por nome
* **Riscos:** inconsistência textual histórica

---

### Entidade: Tipo de ativo

* **Função no produto:** classificar instrumentos
* **Origem atual:** implícito nas abas e campos `tipo`
* **Destino proposto:** `asset_types`
* **Observações de transição:** mapear categorias existentes (acao, fundo, previdencia)
* **Riscos:** divergência semântica entre categorias atuais e futuras

---

### Entidade: Ativo

* **Função no produto:** instrumento financeiro
* **Origem atual:** campos `ativo`, `fundo`, `plano`
* **Destino proposto:** `assets`
* **Observações de transição:** normalização por nome ou símbolo
* **Riscos:** colisão de identidade

---

### Entidade: Posição

* **Função no produto:** estado atual da carteira
* **Origem atual:** tabelas `acoes`, `fundos`, `previdencia`
* **Destino proposto:** `portfolio_positions`
* **Observações de transição:** consolidação das tabelas
* **Riscos:** perda de semântica se campos não forem bem mapeados

---

### Entidade: Pré-ordem

* **Função no produto:** planejamento de operação
* **Origem atual:** `pre_ordens`
* **Destino proposto:** `planned_orders`
* **Observações de transição:** mapeamento direto
* **Riscos:** baixo

---

### Entidade: Aporte

* **Função no produto:** entrada de capital
* **Origem atual:** `aportes`
* **Destino proposto:** `portfolio_contributions`
* **Observações de transição:** manter semântica atual
* **Riscos:** interpretação de acumulado

---

### Entidade: Snapshot

* **Função no produto:** histórico da carteira
* **Origem atual:** inexistente persistido
* **Destino proposto:** `portfolio_snapshots`
* **Observações de transição:** derivado do payload
* **Riscos:** volume de dados

---

### Entidade: Análise

* **Função no produto:** leitura estratégica
* **Origem atual:** payload do backend
* **Destino proposto:** `portfolio_analyses`
* **Observações de transição:** persistência seletiva
* **Riscos:** inconsistência entre versões do motor

---

### Entidade: Importação

* **Função no produto:** entrada de dados estruturados
* **Origem atual:** implícita
* **Destino proposto:** `imports` + `import_rows`
* **Observações de transição:** nova funcionalidade estruturada
* **Riscos:** complexidade operacional


## 4. Código e documentação operacional do repositório

* **Nome da fonte:** código-fonte do repositório e documentação operacional consolidada
* **Tipo da fonte:** fonte estrutural e documental
* **Papel no sistema atual:** confirmar responsabilidades reais do backend, contratos legados, drift entre documentação e runtime e necessidades futuras já reconhecidas
* **Nível de confiabilidade da informação disponível:** alto para responsabilidades atuais e estruturas conhecidas; médio para detalhes futuros ainda não implementados
* **Observações relevantes:**

  * esta fonte não substitui a base operacional, mas ajuda a validar o que o produto realmente usa hoje
  * é especialmente importante para distinguir dado bruto, dado derivado, dado apenas visual e necessidade futura legítima

### Itens confirmados relevantes para o data mapping

#### Documentação e mapeamentos operacionais

* `data/bigquery/table_schemas.md`
* `data/mappings/operational_sheet_headers.md`
* `docs/project_context.md`
* `docs/functional/functional_overview_legacy.md`
* `docs/release_notes/release_notes.md`
* `plans/roadmap/evolution_tracks.md`
* `plans/sprints/backlog.md`

#### Arquivos de backend e serviços

* `apps_script/backend/Backend_Core.gs`
* `apps_script/backend/Mobile_Api.gs`
* `apps_script/backend/Operational_CRUD.gs`
* `apps_script/services/BigQueryService.gs`
* `apps_script/integrations/BigQuery_Sync.gs`
* `apps_script/integrations/Api_Keys.gs`

#### Arquivos de frontend e app

* `frontend/html/Dashboard.html`
* `mobile_app/lib/*`

### Uso estrutural desta fonte no data mapping

* confirmar quais tabelas atuais existem de fato
* confirmar quais campos e blocos do payload são persistidos e quais são derivados
* confirmar dependências do legado AppScript
* identificar o que já pode ser tratado como necessidade de schema e o que ainda é apenas direção futura

## 5. Issues futuras do GitHub

* **Nome da fonte:** backlog futuro registrado em issues do repositório
* **Tipo da fonte:** fonte de evolução funcional e estrutural
* **Papel no sistema atual:** indicar necessidades futuras já legitimadas pelo projeto e que devem influenciar o data mapping sem gerar overengineering
* **Nível de confiabilidade da informação disponível:** alto para direção de produto e técnica; médio para detalhe exato de implementação
* **Observações relevantes:**

  * as issues não são origem de dado atual, mas são origem válida para justificar estruturas futuras mínimas no modelo alvo
  * elas não autorizam inflar o schema; autorizam apenas preparar o que já é recorrente, explícito e estruturalmente necessário

### Trilhas futuras com impacto direto no mapping

#### Multiusuário, autenticação e segregação

Issues relevantes:

* autenticação mínima
* login por Google e e-mail
* preparação para múltiplos usuários
* separação por usuário e contexto individual

Impacto no mapping:

* exige `users`
* exige `portfolios`
* exige associação de importações, snapshots, análises e eventos ao usuário correto

#### Importação e confiabilidade operacional

Issues relevantes:

* automação de testes de importação
* preview
* padronização
* deduplicação
* QA ponta a ponta

Impacto no mapping:

* exige `imports`
* exige `import_rows`
* exige rastreabilidade de linha importada e resultado de consolidação

#### Evolução analítica e histórico

Issues relevantes:

* histórico de recomendações
* alertas de mudança relevante
* score em camadas
* detalhamento de insights por carteira e ativo
* isolar motor de análise

Impacto no mapping:

* exige `portfolio_snapshots`
* exige `portfolio_snapshot_positions`
* exige `portfolio_analyses`
* exige `analysis_insights`

#### Cobertura de tipos e fontes externas

Issues relevantes:

* catálogo de tipos suportados
* suporte a tipos avançados
* CDI e benchmark
* dados externos complementares
* fallback de fonte externa
* política de atualização de cotações
* validação de consistência com dados externos

Impacto no mapping:

* exige `asset_types`
* reforça necessidade de `assets`
* exige `external_data_sources`
* exige `external_market_references`

#### Observabilidade e operação

Issues relevantes:

* logging técnico mínimo
* monitoramento de falhas
* observabilidade básica
* rollback e controle de versão

Impacto no mapping:

* exige `operational_events`
* exige campos mínimos de rastreabilidade nas entidades principais

---

## Visão geral do mapeamento

| Origem              | Estrutura de origem                                                                                     | Destino | Estrutura de destino                                                                                                        | Objetivo funcional                                    | Observações                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------- |
| Google Sheets       | Aba `Acoes`                                                                                             | D1      | `portfolio_positions` + `assets` + `platforms`                                                                              | Representar posições atuais de ações                  | Separação entre instrumento e posição                                |
| Google Sheets       | Aba `Fundos`                                                                                            | D1      | `portfolio_positions` + `assets` + `platforms`                                                                              | Representar posições atuais de fundos                 | Categoria atual vira tipo ou atributo, não tabela principal          |
| Google Sheets       | Aba `Previdencia`                                                                                       | D1      | `portfolio_positions` + `assets` + `platforms`                                                                              | Representar posições atuais de previdência            | Exige tratamento cuidadoso de aliases e semântica de valor investido |
| Google Sheets       | Aba `PreOrdens`                                                                                         | D1      | `planned_orders`                                                                                                            | Representar planejamento operacional sem execução     | Estrutura funcional distinta de posição                              |
| Google Sheets       | Aba `Aportes`                                                                                           | D1      | `portfolio_contributions`                                                                                                   | Representar aportes e histórico de entrada de capital | `acumulado` exige interpretação de negócio                           |
| Google Sheets       | Aba `Config`                                                                                            | D1      | `user_financial_context` e, de forma residual, configurações futuras fora do domínio                                        | Representar contexto útil ao produto                  | Nem todo `app_config` deve virar tabela de domínio                   |
| BigQuery            | tabelas operacionais atuais                                                                             | D1      | tabelas centrais do modelo alvo                                                                                             | Carga inicial principal                               | BigQuery é a melhor fonte atual para extração estruturada            |
| Payload Apps Script | `summary`, `score`, `actionPlan`, `portfolioDecision`, `assetRanking`, `categorySnapshots` e correlatos | D1      | `portfolio_snapshots`, `portfolio_snapshot_positions`, `portfolio_analyses`, `analysis_insights`                            | Persistir histórico analítico e leitura consolidada   | Apenas recortes com valor histórico real devem ser persistidos       |
| Backlog futuro      | issues legitimadas                                                                                      | D1      | `users`, `imports`, `import_rows`, `external_data_sources`, `external_market_references`, `operational_events` e correlatas | Preparar evolução estrutural do produto               | Não justifica inflar demais a primeira carga                         |

---

## Mapeamento por entidade

### Entidade: Usuário

* **Função no produto:** dono da carteira, do contexto financeiro, das importações, dos snapshots, das análises e dos eventos operacionais
* **Origem atual:** inexistente explicitamente; cenário atual é implicitamente single-user
* **Destino proposto:** `users`
* **Observações de transição:** criar carga inicial com um único usuário lógico representando o operador atual do sistema
* **Riscos:** se a estratégia de identidade futura não for definida cedo, pode haver retrabalho em campos de autenticação ou unicidade

### Entidade: Carteira

* **Função no produto:** agregador principal de posições, aportes, análises, snapshots, pré-ordens e importações
* **Origem atual:** implícita; o sistema atual opera como se houvesse uma carteira consolidada única
* **Destino proposto:** `portfolios`
* **Observações de transição:** criar uma carteira principal para o usuário inicial; manter possibilidade estrutural de mais de uma carteira sem exigir uso disso agora
* **Riscos:** se o legado continuar assumindo carteira única sem chave lógica clara, a compatibilidade futura pode ficar frágil

### Entidade: Plataforma

* **Função no produto:** origem dos investimentos e eixo de leitura futura por instituição ou origem operacional
* **Origem atual:** campo textual `plataforma` repetido em `acoes`, `fundos`, `previdencia`, `pre_ordens` e `aportes`
* **Destino proposto:** `platforms`
* **Observações de transição:** normalização por nome; criação de catálogo inicial a partir dos valores distintos já existentes
* **Riscos:** inconsistência textual histórica, variações de grafia e registros sem plataforma definida

### Entidade: Tipo de ativo

* **Função no produto:** classificar instrumentos suportados pelo Esquilo
* **Origem atual:** implícito nas abas e parcialmente expresso nos campos `tipo` e `categoria`
* **Destino proposto:** `asset_types`
* **Observações de transição:** mapear primeiro os tipos comprovados no estado atual e abrir espaço controlado para os tipos previstos nas issues futuras
* **Riscos:** mistura indevida entre tipo de instrumento, categoria de análise e agrupamento visual

### Entidade: Ativo ou instrumento

* **Função no produto:** representar o item investível ou instrumento reconhecido pelo sistema
* **Origem atual:** campos operacionais como `ativo`, `fundo` e `plano`
* **Destino proposto:** `assets`
* **Observações de transição:** exigir política de resolução conservadora; usar nome normalizado, símbolo e tipo para minimizar colisão
* **Riscos:** colisão de identidade, instrumentos com nome inconsistente e ausência de identificador forte em parte do legado

### Entidade: Posição

* **Função no produto:** estado atual consolidado da carteira por instrumento
* **Origem atual:** tabelas `acoes`, `fundos` e `previdencia`
* **Destino proposto:** `portfolio_positions`
* **Observações de transição:** consolidar as três origens em uma estrutura única, mantendo campos legados mínimos necessários para compatibilidade
* **Riscos:** perda de semântica se a consolidação ignorar diferenças reais entre tipos de posição

### Entidade: Pré-ordem

* **Função no produto:** planejamento operacional sem execução financeira
* **Origem atual:** `pre_ordens`
* **Destino proposto:** `planned_orders`
* **Observações de transição:** mapeamento direto, com baixa necessidade de transformação estrutural
* **Riscos:** baixo; principal risco é padronização de datas e quantidade

### Entidade: Aporte

* **Função no produto:** registrar entrada de capital ou intenção operacional equivalente
* **Origem atual:** `aportes`
* **Destino proposto:** `portfolio_contributions`
* **Observações de transição:** manter semântica atual, mas tratar `acumulado` como campo potencialmente derivado ou de consistência variável
* **Riscos:** interpretação errada de `destino`, `categoria` e `acumulado`

### Entidade: Contexto financeiro do usuário

* **Função no produto:** personalizar leitura e recomendação
* **Origem atual:** parcialmente implícita em `app_config`; parcialmente ainda inexistente como estrutura materializada
* **Destino proposto:** `user_financial_context`
* **Observações de transição:** não assumir que toda configuração atual vira contexto de usuário; mapear apenas o que tiver utilidade real de domínio
* **Riscos:** contaminar essa entidade com chaves genéricas herdadas do `app_config`

### Entidade: Snapshot da carteira

* **Função no produto:** capturar o estado consolidado da carteira em um instante
* **Origem atual:** inexistente como persistência estruturada; inferível a partir do payload consolidado atual
* **Destino proposto:** `portfolio_snapshots`
* **Observações de transição:** a carga inicial dessa entidade não vem de tabela bruta atual; depende de estratégia posterior de materialização
* **Riscos:** crescimento de volume e falta de política de periodicidade

### Entidade: Posição dentro do snapshot

* **Função no produto:** registrar a composição da carteira em cada snapshot
* **Origem atual:** inexistente persistida; derivável das posições correntes no momento da captura
* **Destino proposto:** `portfolio_snapshot_positions`
* **Observações de transição:** entidade depende estruturalmente de `portfolio_snapshots`
* **Riscos:** incoerência se o snapshot for gerado sem congelar corretamente a composição da carteira

### Entidade: Análise da carteira

* **Função no produto:** persistir score, decisão, recomendação principal e síntese analítica
* **Origem atual:** payload consolidado do Apps Script
* **Destino proposto:** `portfolio_analyses`
* **Observações de transição:** persistir apenas recortes com valor histórico e auditável, não o payload inteiro
* **Riscos:** inconsistência entre versões do motor analítico e duplicação de semântica textual

### Entidade: Insight analítico

* **Função no produto:** armazenar sinais ou observações detalhadas da análise
* **Origem atual:** blocos derivados do payload atual e necessidades explícitas de evolução futura
* **Destino proposto:** `analysis_insights`
* **Observações de transição:** começar com estrutura enxuta e foco em insights relevantes ao histórico
* **Riscos:** exagerar na granularidade e transformar insight em log textual sem utilidade estrutural

### Entidade: Importação

* **Função no produto:** representar uma execução de importação de dados
* **Origem atual:** ainda implícita, sem persistência estruturada
* **Destino proposto:** `imports`
* **Observações de transição:** entidade nova, justificada por backlog futuro e necessidade operacional clara
* **Riscos:** inflar a primeira versão se a importação real ainda não estiver suficientemente delimitada

### Entidade: Linha de importação

* **Função no produto:** registrar granularmente o que entrou, foi normalizado, deduplicado ou rejeitado
* **Origem atual:** inexistente
* **Destino proposto:** `import_rows`
* **Observações de transição:** também é entidade nova; depende da evolução do fluxo de importação
* **Riscos:** retenção excessiva ou payload bruto descontrolado

### Entidade: Fonte externa de dados

* **Função no produto:** catalogar benchmark, cotações e outras referências externas
* **Origem atual:** necessidade legitimada em backlog; não consolidada como persistência atual
* **Destino proposto:** `external_data_sources`
* **Observações de transição:** não exige carga inicial rica; pode começar mínimo
* **Riscos:** entrar cedo demais com detalhamento que o produto ainda não usa

### Entidade: Referência externa de mercado

* **Função no produto:** armazenar valores de referência como CDI e similares
* **Origem atual:** futura; sem tabela operacional atual equivalente
* **Destino proposto:** `external_market_references`
* **Observações de transição:** introduzir apenas quando houver regra clara de atualização e uso
* **Riscos:** virar cache genérico sem semântica estável

### Entidade: Evento operacional

* **Função no produto:** registrar falhas, eventos críticos e rastros úteis de operação
* **Origem atual:** necessidade explícita em backlog; sem estrutura relacional atual equivalente
* **Destino proposto:** `operational_events`
* **Observações de transição:** estrutura nova, mas justificada
* **Riscos:** tentar usar essa entidade como observabilidade total do sistema

[CONTINUA NA PRÓXIMA RESPOSTA]
