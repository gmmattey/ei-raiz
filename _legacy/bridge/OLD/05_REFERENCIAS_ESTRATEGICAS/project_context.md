# Project Context

Este documento e a fonte principal de contexto atual do projeto.

## 1. Visao geral do sistema

O Esquilo Invest e um dashboard operacional em Google Apps Script com interface HTML, BigQuery como fonte primaria de leitura e escrita operacional e planilha Google Sheets mantida como fallback, apoio de mercado e trilha historica.

O sistema:
- le `acoes`, `fundos`, `previdencia`, `pre_ordens`, `aportes` e `app_config` do BigQuery
- converte esses dados para o mesmo contrato que o dashboard ja consumia
- calcula metricas, score, perfil, ranking, alertas e plano de acao
- permite CRUD controlado no backend para manipulacao dos registros
- usa IA para resumo executivo, analise da carteira, recomendacoes e plano de acao
- agora expoe um endpoint JSON minimo para o app Flutter em `mobile_app/`
- preserva a planilha operacional como contingencia e base auxiliar

O sistema nao executa ordens em corretora. Toda recomendacao continua apenas analitica.

## 2. Arquitetura

Camadas principais:
- `frontend/html/Dashboard.html`: arquivo unico do frontend, concentrando HTML, CSS e JavaScript do dashboard em blocos internos organizados
- `mobile_app/lib/`: shell Flutter, telas mobile, widgets, modelos e service layer HTTP
- `apps_script/backend/Backend_Core.gs`: entrada do web app, escolha da fonte principal e montagem do payload
- `apps_script/backend/Mobile_Api.gs`: roteamento JSON para o app mobile sem quebrar o HTML legado
- `apps_script/backend/Operational_CRUD.gs`: facade publica para CRUD controlado no backend
- `apps_script/services/BigQueryService.gs`: leitura e escrita centralizada no BigQuery
- `apps_script/services/Sheet_Readers.gs`: normalizacao compatível com o contrato historico do dashboard
- `apps_script/services/Portfolio_Metrics.gs`: metricas consolidadas, score e mensagens
- `apps_script/services/Decision_Engine.gs`: score por ativo, ranking, plano e historico
- `apps_script/services/AI_Service.gs`: contexto da IA, prompt, validacao, fallback e providers
- `apps_script/integrations/BigQuery_Sync.gs`: fluxo administrativo legado de push/pull planilha <-> BigQuery
- `apps_script/integrations/Api_Keys.gs`: leitura/escrita da chave Gemini em `Script Properties`
- `apps_script/utils/Config.gs`: configuracao global, helpers e contrato de runtime

## 3. Fluxo de dados

Fluxo principal do dashboard:
1. `doGet()` entrega `Dashboard.html`.
2. O frontend chama `google.script.run.getDashboardData()`.
3. `Backend_Core.gs` abre a planilha por `SpreadsheetApp.openById(...)` para manter fallback, cache de mercado e historico de decisao.
4. `getPrimaryDashboardDataContext_()` tenta carregar a carteira pelo `BigQueryService.gs`.
5. `BigQueryService.gs` consulta o BigQuery e devolve colecoes compativeis com o formato esperado por `Sheet_Readers.gs`.
6. Se o BigQuery falhar, o backend cai para `readSpreadsheetData_()` e marca `dataSource = spreadsheet-fallback`.
7. `Sheet_Readers.gs` transforma os blocos brutos em itens de dominio.
8. `Sheet_Readers.gs` ainda enriquece acoes com `GOOGLEFINANCE`, usando cache em aba interna e `CacheService`.
9. `Portfolio_Metrics.gs` consolida patrimonio, score, perfil, alertas e mensagens.
10. `Decision_Engine.gs` calcula score por ativo, ranking, plano de acao, historico e alertas inteligentes.
11. `Backend_Core.gs` devolve um payload unico para o frontend renderizar, incluindo `dataSource`, `sourceWarning` e capacidades operacionais.
12. Sob demanda, o frontend chama `getPortfolioAIAnalysis()`.
13. `AI_Service.gs` reutiliza o mesmo contexto consolidado do dashboard, chama Gemini, usa OpenAI como fallback e valida o formato final.

Fluxo principal do app mobile:
1. O Flutter inicia em `mobile_app/lib/main.dart`.
2. O app monta `MaterialApp`, tema e roteamento simples para home, carteira e detalhe por categoria.
3. `AppScriptDashboardService` chama o mesmo deploy do Apps Script com `format=json`.
4. `Mobile_Api.gs` valida token opcional, resolve o recurso e reaproveita `getDashboardData()` ou `getPortfolioAIAnalysis()`.
5. O app transforma o payload em modelos Dart e renderiza os cards mobile por bloco independente.

Fluxo de CRUD controlado:
1. O backend expoe `updateStatusAtivo()`, `removerAtivo()`, `adicionarAtivo()` e `atualizarAtivo()`.
2. `Operational_CRUD.gs` valida tipo, chave e payload antes da operacao.
3. `BigQueryService.gs` executa `INSERT`, `UPDATE` e `DELETE` apenas nas tabelas operacionais suportadas.
4. Nenhuma funcao aciona ordem financeira, corretora ou automacao de compra e venda.

Fluxo administrativo de sync:
1. `BigQuery_Sync.gs` segue como utilitario de push/pull tabular.
2. Esse fluxo ainda usa `SpreadsheetApp.getActiveSpreadsheet()`.
3. Ele nao participa do carregamento principal do dashboard.

## 3.1 Atualizacoes relevantes do frontend

Nesta fase, o frontend passou a operar com os seguintes principios:
- o grafico principal e a lista de representatividade usam macroclasses da carteira, sempre fechando a leitura em acoes, fundos de investimento e previdencia
- `Backend_Core.gs` devolve `categorySnapshots`, enquanto `Portfolio_Metrics.gs` expande metricas de participacao e performance por categoria e por item
- o frontend usa `getDashboardActionsSnapshot()` para atualizar apenas a leitura de acoes sem reload global, preservando scroll, filtros e estados expandidos
- fundos de investimento e previdencia agora usam tabelas comparativas com detalhamento inline
- o CTA da Esquilo IA usa leitura local baseada em regras quando a resposta remota nao estiver disponivel
- o mesmo `Dashboard.html` agora entrega uma camada mobile propria abaixo do header, com home enxuta, radar, missao do mes, detalhe por categoria e trilha curta de insights sem duplicar a logica do desktop

## 4. Estrutura de pastas atual

```text
.
|-- apps_script
|   |-- backend
|   |   |-- Backend_Core.gs
|   |   |-- Export_Import.gs
|   |   `-- Operational_CRUD.gs
|   |-- integrations
|   |   |-- Api_Keys.gs
|   |   `-- BigQuery_Sync.gs
|   |-- services
|   |   |-- AI_Service.gs
|   |   |-- BigQueryService.gs
|   |   |-- Decision_Engine.gs
|   |   |-- Portfolio_Metrics.gs
|   |   `-- Sheet_Readers.gs
|   `-- utils
|       `-- Config.gs
|-- data
|   |-- bigquery
|   |   `-- table_schemas.md
|   |-- mappings
|   |   `-- operational_sheet_headers.md
|   `-- spreadsheets
|       `-- Esquilo_Invest_Operacional.xlsx
|-- docs
|   |-- functional
|   |   `-- functional_overview_legacy.md
|   |-- release_notes
|   |   `-- release_notes.md
|   |-- sprints
|   |   `-- sprint_history.md
|   |-- technical
|   |   |-- operational_data_update_report.md
|   |   `-- technical_overview_legacy.md
|   `-- project_context.md
|-- frontend
|   `-- html
|       `-- Dashboard.html
|-- mobile_app
|   |-- android
|   |-- ios
|   |-- lib
|   |-- docs
|   `-- pubspec.yaml
|-- plans
|   |-- roadmap
|   |   `-- evolution_tracks.md
|   `-- sprints
|       `-- backlog.md
|-- README.md
`-- .gitattributes
```

## 5. Mapeamento dos principais arquivos

| Arquivo | Tipo | Funcao principal | Classificacao |
|---|---|---|---|
| `.gitattributes` | meta | normalizacao de atributos do repositorio | util |
| `README.md` | documentacao | ponto de entrada rapido do projeto | util |
| `apps_script/backend/Backend_Core.gs` | backend | entrega do web app e payload do dashboard | essencial |
| `apps_script/backend/Operational_CRUD.gs` | backend | CRUD controlado para os registros operacionais | essencial |
| `apps_script/backend/Export_Import.gs` | backend | pontos de entrada futuros de import/export | util |
| `apps_script/integrations/Api_Keys.gs` | integracao | acesso a chave Gemini | essencial |
| `apps_script/integrations/BigQuery_Sync.gs` | integracao | sincronizacao administrativa planilha <-> BigQuery | util |
| `apps_script/services/BigQueryService.gs` | servico | leitura e escrita centralizada no BigQuery | essencial |
| `apps_script/services/AI_Service.gs` | servico | leitura por IA, providers e fallback | essencial |
| `apps_script/services/Decision_Engine.gs` | servico | score por ativo, ranking e plano | essencial |
| `apps_script/services/Portfolio_Metrics.gs` | servico | metricas, score geral, perfil e mensagens | essencial |
| `apps_script/services/Sheet_Readers.gs` | servico | mapeamento de dados para o contrato historico do dashboard | essencial |
| `apps_script/utils/Config.gs` | utilitario | configuracao central e helpers compartilhados | essencial |
| `data/bigquery/table_schemas.md` | dados | contrato das tabelas do sync e referencia da base | util |
| `data/mappings/operational_sheet_headers.md` | dados | contrato dos cabecalhos da planilha | util |
| `data/spreadsheets/Esquilo_Invest_Operacional.xlsx` | dados | base operacional local e referencia estrutural | essencial |
| `docs/functional/functional_overview_legacy.md` | documentacao | contexto funcional legado preservado | util |
| `docs/release_notes/release_notes.md` | documentacao | historico incremental da base | util |
| `docs/sprints/sprint_history.md` | documentacao | historico consolidado das sprints | util |
| `docs/technical/operational_data_update_report.md` | documentacao | relatorio de migracao da planilha | util |
| `docs/technical/technical_overview_legacy.md` | documentacao | contexto tecnico legado preservado | util |
| `docs/project_context.md` | documentacao | fonte principal de contexto atual | essencial |
| `frontend/html/Dashboard.html` | frontend | arquivo unico do dashboard com blocos internos de layout, estado, renderizacao e eventos | essencial |
| `plans/roadmap/evolution_tracks.md` | planejamento | trilhas macro de evolucao | util |
| `plans/sprints/backlog.md` | planejamento | backlog priorizado para proximas sprints | util |

## 6. Integracoes

### BigQuery
- projeto: `esquilo-invest`
- dataset: `esquilo_invest`
- fonte principal do dashboard: `BigQueryService.gs`
- tabelas operacionais usadas: `acoes`, `fundos`, `previdencia`, `pre_ordens`, `aportes`, `app_config`
- operacoes disponiveis no backend: leitura estruturada, `insertRegistro`, `updateRegistro` e `deleteRegistro`
- compatibilidade: o servico monta aliases para manter o contrato atual de `Sheet_Readers.gs`

### Planilha operacional
- papel atual: fallback do dashboard, cache de mercado, historico de decisoes e base administrativa de sync
- planilha local de referencia: `data/spreadsheets/Esquilo_Invest_Operacional.xlsx`
- abas operacionais: `Acoes`, `Fundos`, `Previdencia`, `PreOrdens`, `Aportes`, `Config`
- abas auxiliares esperadas: `Dashboard_Visual`, `Export_Auxiliar`
- abas internas criadas em runtime: `_esquilo_market_cache`, `_esquilo_decision_history`

### IA
- provider principal: Gemini `gemini-2.5-flash`
- fallback: OpenAI `gpt-4o-mini` ou valor em `OPENAI_MODEL`
- chaves esperadas:
  - `GEMINI_API_KEY`
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL`
  - `EXTERNAL_MARKET_DATA_ENABLED`
- comportamento: a IA consome o mesmo contexto consolidado do dashboard, portanto opera sobre dados reais do BigQuery quando a fonte principal estiver disponivel
- seguranca funcional: a IA apenas resume, analisa e recomenda; nao executa ordens

## 7. Como evoluir o sistema

Diretrizes para proximas sprints:
- trate o BigQuery como fonte primaria de leitura e escrita operacional
- preserve a planilha como contingencia e apoio enquanto o fluxo de transicao nao for encerrado
- mantenha o contrato do payload do dashboard antes de modularizar o frontend
- ligue os botoes do frontend ao CRUD apenas com formularios/controladores explicitamente validados
- altere schemas e aliases de forma sincronizada entre `BigQueryService.gs`, `Sheet_Readers.gs`, `BigQuery_Sync.gs` e `data/bigquery/table_schemas.md`
- remova a chave Gemini hardcoded e concentre segredos apenas em `Script Properties`
- use `docs/project_context.md`, `data/` e `plans/` como base de qualquer sprint nova
- preserve a organizacao interna do `Dashboard.html` por blocos claros ao evoluir a interface

## 8. Dependencias criticas

- Google Apps Script:
  - `HtmlService`
  - `SpreadsheetApp`
  - `PropertiesService`
  - `CacheService`
  - `UrlFetchApp`
  - `BigQuery` advanced service
- BigQuery com dataset `esquilo_invest` e tabelas operacionais existentes
- Google Sheets com nomes de aba e cabecalhos esperados
- `GOOGLEFINANCE` habilitado para enriquecimento de mercado
- Script Properties corretamente configuradas

## 9. Arquivos removidos na reorganizacao

Os arquivos abaixo foram classificados como redundantes ou obsoletos porque representavam checkpoints intermediarios ja consolidados em `docs/project_context.md`, `docs/sprints/sprint_history.md` e `docs/release_notes/release_notes.md`:

- `Stage_4_Operational_Spreadsheet.md`
- `Stage_5_Data_Migration.md`
- `Stage_6_File_Reorganization.md`
- `Stage_7_Backend_Operational_Adaptation.md`
- `Stage_8_Final_Validation.md`
- `Standalone_Stage_1_Spreadsheet_Audit.md`
- `Standalone_Stage_2_Config_Centralization.md`
- `Standalone_Stage_3_Backend_OpenById.md`

## 10. Riscos tecnicos atuais

- existe uma chave Gemini hardcoded em `apps_script/integrations/Api_Keys.gs`; isso deve ser removido antes de ampliar distribuicao do projeto
- o frontend voltou a um unico `Dashboard.html`; isso reduz risco de escopo, mas o arquivo continua grande e exige disciplina interna por blocos
- `apps_script/integrations/BigQuery_Sync.gs` segue um modelo bound a planilha, diferente do restante da base
- `apps_script/services/BigQueryService.gs` ainda duplica `projectId`, `datasetId` e mapeamento das tabelas para evitar dependencia de ordem de carga no Apps Script
- o mapeamento de previdencia usa `valor_investido` como ponte para `total_aportado`, porque o schema atual nao expoe esse campo de forma dedicada
- os botoes de CRUD do frontend ainda estao em modo guiado e nao chamam o backend diretamente
- `apps_script/backend/Export_Import.gs` ainda contem apenas stubs
