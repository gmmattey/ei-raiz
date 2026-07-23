# 08-appscript-migration-inputs-checklist.md

## Objetivo da integração

Montar um AppsScript que funcione como ponte de carga inicial entre o BigQuery atual e o Cloudflare D1, respeitando:

- o schema D1 já aprovado
- o data mapping já parcialmente documentado
- a migração progressiva do legado
- a necessidade de não hardcodar segredos no código

O foco desta integração é carga inicial pragmática, não arquitetura final do produto.

## O que já foi identificado automaticamente na documentação e nos repositórios

### Visão geral da origem atual

**Fato**

O projeto atual usa Google Apps Script com BigQuery como fonte principal de leitura e escrita operacional, mantendo planilha Google Sheets como fallback e apoio administrativo.

### Projeto, dataset e tabelas atuais no BigQuery

**Fato**

Foram encontrados no código atual:

- `PROJECT_ID = esquilo-invest`
- `DATASET_ID = esquilo_invest`

Tabelas operacionais atuais identificadas:

- `acoes`
- `fundos`
- `previdencia`
- `pre_ordens`
- `aportes`
- `app_config`

### AppsScript atual e pontos úteis já existentes

**Fato**

Foram encontrados no projeto atual:

- `apps_script/services/BigQueryService.gs`
- `apps_script/integrations/BigQuery_Sync.gs`
- `apps_script/utils/Config.gs`

Esses arquivos já mostram:

- como o BigQuery é acessado hoje
- quais tabelas existem hoje
- quais colunas são consideradas obrigatórias no fluxo atual
- quais Script Properties já são usadas no AppsScript atual
- qual planilha operacional está associada ao projeto atual

### Planilha operacional atual associada ao projeto

**Fato**

Foi encontrado em `Config.gs`:

- `spreadsheetId = 119enzesF7j5g7Cd1uBgjiu-YSlTKHpubfc_ZSv1M3Lk`

Isso é útil como referência de apoio e contingência, mas não deve ser tratado como fonte principal desta carga inicial se o objetivo for carregar do BigQuery para o D1.

### Cloudflare D1 e forma de envio

**Fato**

A documentação oficial atual da Cloudflare confirma que o D1 pode ser acessado por:

- Workers Binding API
- REST API
- Wrangler

Também há endpoint REST para query em D1 e operações de controle do banco. Isso sustenta tecnicamente uma estratégia de AppsScript chamando a API REST do D1. ([developers.cloudflare.com](https://developers.cloudflare.com/d1/best-practices/query-d1/?utm_source=chatgpt.com))

## Quais tabelas do D1 participarão da carga

### Tabelas claramente relevantes para a carga inicial

**Inferência forte**

Com base no schema aprovado e nas fontes atuais do BigQuery, as tabelas mais diretamente ligadas à carga inicial são:

- `users`
- `portfolios`
- `platforms`
- `asset_types`
- `assets`
- `portfolio_positions`
- `planned_orders`
- `portfolio_contributions`

### Tabelas que parecem menos prioritárias para a carga inicial

**Inferência**

Estas tabelas existem no schema, mas não parecem depender de carga direta do BigQuery operacional atual nesta primeira etapa:

- `imports`
- `import_rows`
- `portfolio_snapshots`
- `portfolio_snapshot_positions`
- `portfolio_analyses`
- `analysis_insights`
- `external_data_sources`
- `external_market_references`
- `operational_events`
- `user_financial_context`

Motivo:

- não há evidência suficiente de que essas estruturas já possuam fonte direta e pronta no BigQuery atual para uma carga inicial simples e segura
- parte delas parece mais ligada a operação futura, rastreabilidade ou evolução do novo backend

### Tabela do legado atual que não deve ser priorizada na primeira carga

**Fato + inferência**

- `app_config` existe no BigQuery atual
- porém o schema D1 aprovado não inclui tabela equivalente

Logo, `app_config` não deve entrar automaticamente na carga inicial para o D1 sem validação adicional.

## Quais fontes BigQuery aparentam ser relevantes

### Fonte principal esperada

**Fato**

As fontes mais relevantes no BigQuery atual são:

- `acoes`
- `fundos`
- `previdencia`
- `pre_ordens`
- `aportes`

### Relação provável entre origem atual e destino D1

**Inferência forte**

Mapeamento macro mais provável:

- `acoes` → `portfolio_positions` + apoio de `assets`, `platforms`, `asset_types`
- `fundos` → `portfolio_positions` + apoio de `assets`, `platforms`, `asset_types`
- `previdencia` → `portfolio_positions` + apoio de `assets`, `platforms`, `asset_types`
- `pre_ordens` → `planned_orders` + apoio de `assets`, `platforms`
- `aportes` → `portfolio_contributions` + apoio de `platforms`

### Estruturas auxiliares a serem criadas antes da carga principal

**Inferência**

Para respeitar o schema D1, a carga provavelmente precisará criar ou garantir previamente:

- um `user` base da migração
- um `portfolio` principal associado a esse usuário
- catálogo mínimo de `platforms`
- catálogo mínimo de `asset_types`
- registros de `assets` derivados dos dados atuais

## Quais campos e mapeamentos já estão claros

### BigQuery atual: campos claramente identificados

**Fato**

Campos atuais documentados no BigQuery:

#### `acoes`
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
- `mes_ano`
- `destino`
- `categoria`
- `plataforma`
- `valor`
- `acumulado`
- `status`

### Mapping já razoavelmente claro para o D1

**Inferência forte**

Os seguintes mapeamentos já estão suficientemente claros para implementação inicial:

#### Origens para `portfolio_positions`
- ativo/fundo/plano → nome principal do `asset`
- plataforma → `platforms.name`
- tipo/categoria/estrategia → apoio para `asset_types`, `category_label`, `strategy` ou classificação derivada
- status, situacao, datas, quantidades, preços, valores e observação → campos operacionais da posição

#### Origens para `planned_orders`
- `pre_ordens.tipo`
- `pre_ordens.ativo`
- `pre_ordens.plataforma`
- `pre_ordens.tipo_ordem`
- `pre_ordens.quantidade`
- `pre_ordens.preco_alvo`
- `pre_ordens.validade`
- `pre_ordens.valor_potencial`
- `pre_ordens.cotacao_atual`
- `pre_ordens.status`
- `pre_ordens.observacao`

#### Origens para `portfolio_contributions`
- `aportes.mes_ano`
- `aportes.destino`
- `aportes.categoria`
- `aportes.plataforma`
- `aportes.valor`
- `aportes.acumulado`
- `aportes.status`

## Quais credenciais, IDs, endpoints ou configurações serão necessários

### Para ler do BigQuery no AppsScript

**Fato**

O AppsScript já usa BigQuery Advanced Service no projeto atual.

**Inferência**

Para a carga inicial, será necessário garantir:

- permissão do projeto AppsScript para usar BigQuery
- projeto/dataset corretos
- tabelas de origem corretas

### Para enviar ao D1

**Fato + inferência**

Se a estratégia escolhida for AppsScript chamando a API REST do D1, serão necessários pelo menos:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_D1_DATABASE_ID`
- `CLOUDFLARE_API_TOKEN`
- endpoint da API do D1 no formato de conta e database

### Para controle da migração

**Inferência**

Também é recomendável ter configurações explícitas para:

- modo dry-run ou execução real
- tamanho de lote
- limite por tabela
- opção de truncar/limpar antes da carga ou só inserir
- logs resumidos de execução

## O que já foi encontrado

### Encontrado com boa segurança

- projeto e dataset BigQuery atuais
- tabelas atuais do BigQuery
- colunas obrigatórias das tabelas operacionais atuais
- schema D1 aprovado
- índices e views de compatibilidade aprovados
- papel do AppsScript na transição
- evidência oficial de que o D1 possui REST API apta para query/import ([developers.cloudflare.com](https://developers.cloudflare.com/d1/best-practices/query-d1/?utm_source=chatgpt.com))

## O que ainda está faltando confirmar comigo

### Lacunas realmente necessárias antes do código final

**Hipótese / pendência operacional**

Ainda falta confirmar:

- qual banco D1 exato receberá a carga inicial
- qual credencial do Cloudflare será usada no AppsScript
- se a carga será feita diretamente via REST API do D1 ou via endpoint intermediário já existente no projeto
- se a carga deve limpar dados antes de inserir ou apenas inserir/atualizar
- qual identificador inicial deve ser usado para `users` e `portfolios` na primeira carga

## Perguntas pendentes

1. O AppsScript deve enviar a carga **diretamente para a API REST do D1** ou já existe **um endpoint intermediário** no projeto de migração que deve ser usado no lugar dela?

2. Você já tem estes três dados do Cloudflare para a carga?
   - `account_id`
   - `database_id` do D1
   - `api_token`

3. Na carga inicial, a estratégia desejada é qual?
   - **apagar e recarregar tudo** nas tabelas de destino da carga inicial
   - **inserir sem apagar**
   - **upsert/mesclar**, se possível

## Ordem sugerida das próximas decisões

1. confirmar estratégia de envio ao D1
2. confirmar credenciais e identificadores do Cloudflare
3. confirmar política da carga inicial: truncate, insert ou merge
4. gerar o AppsScript final
5. gerar template de Script Properties
6. gerar guia operacional de configuração e execução

