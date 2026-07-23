# Esquilo Invest - Documento Técnico

## Escopo considerado

Esta documentação foi reconstruída a partir dos arquivos atuais do projeto.

O runtime operacional atual está concentrado em:

- `EsquiloInvest_BaseOperacional/`

A raiz do repositório ainda contém:

- a base anterior em `backend/`, `frontend/` e `config/`
- anotações de auditoria
- documentação de sprints anteriores
- planilhas fonte e relatórios de migração

Portanto, o projeto hoje possui duas camadas de contexto:

- base operacional atual
- artefatos legados e históricos

## 1. Arquitetura geral

### Camadas principais

#### Apps Script standalone

O backend principal da base operacional foi estruturado para rodar em um projeto Google Apps Script standalone.

Ele:

- abre a planilha por `SpreadsheetApp.openById(...)`
- monta o payload do dashboard
- executa o motor de decisão
- chama a IA
- entrega HTML pelo `doGet()`

#### Frontend HTML

O frontend está concentrado em um único arquivo HTML:

- `EsquiloInvest_BaseOperacional/Dashboard.html`

Ele contém:

- estrutura visual
- estilos
- JavaScript de renderização
- chamadas `google.script.run`

#### Planilha operacional

A planilha operacional é a fonte primária de dados:

- `EsquiloInvest_BaseOperacional/Esquilo_Invest_Operacional.xlsx`

Na execução real do Apps Script, a fonte principal é a planilha Google Sheets apontada por `APP_CONFIG_.spreadsheetId`.

#### BigQuery

O BigQuery é tratado como camada auxiliar de sincronização.

Ele não é a fonte principal do dashboard. Seu uso atual é:

- push da planilha para tabelas separadas
- pull do banco para a planilha
- estrutura baseada em cabeçalhos exatos

## 2. Fluxo de dados detalhado

### Planilha -> Backend -> Frontend

1. `Backend_Core.gs` abre a planilha operacional por ID
2. `Sheet_Readers.gs` lê e normaliza as abas
3. `Portfolio_Metrics.gs` consolida resumo, score, alertas e mensagens
4. `Decision_Engine.gs` calcula score por ativo, ranking, plano, histórico e alertas inteligentes
5. `AI_Service.gs` monta contexto, prompt e resposta da Esquilo IA
6. `Dashboard.html` consome o payload por `google.script.run.getDashboardData()`

### Planilha -> BigQuery

1. `BigQuery_Sync.gs` lê a aba ativa da planilha vinculada
2. valida cabeçalhos por nome exato
3. mapeia cada aba para uma tabela do dataset
4. envia JSON para BigQuery via `WRITE_TRUNCATE`

### BigQuery -> Planilha

1. `BigQuery_Sync.gs` consulta cada tabela
2. recria ou limpa a aba correspondente
3. grava cabeçalho e linhas recebidas

### IA

1. `AI_Service.gs` chama `buildDashboardContext_()`
2. extrai score, métricas, categorias, ranking, alertas e contexto de mercado
3. monta um `system prompt` e um `user prompt`
4. tenta Gemini primeiro
5. tenta OpenAI como fallback
6. valida o formato da resposta
7. se necessário, monta um fallback textual determinístico a partir do contexto já calculado

## 3. Mapeamento de arquivos

## 3.1 Base operacional atual

| Arquivo | Localização | Responsabilidade | Principais funções | Dependências |
|---|---|---|---|---|
| `Config.gs` | `EsquiloInvest_BaseOperacional/Config.gs` | Configuração global, nomes de abas, `Spreadsheet ID`, helpers compartilhados | `openOperationalSpreadsheet_`, `getOperationalSpreadsheetId_`, `formatMoney_`, `formatPct_`, `getSheetLink_` | `PropertiesService`, `SpreadsheetApp`, usado por praticamente todos os `.gs` |
| `API KEY.gs` | `EsquiloInvest_BaseOperacional/API KEY.gs` | Leitura e gravação da chave Gemini em `Script Properties` | `getGeminiKey_`, `setGeminiKey`, `testarGeminiKey` | `PropertiesService`, `Logger`, usado por `AI_Service.gs` |
| `Backend_Core.gs` | `EsquiloInvest_BaseOperacional/Backend_Core.gs` | Orquestração do dashboard e montagem do payload | `doGet`, `getDashboardData`, `buildDashboardContext_`, `buildDashboardInsights_` | `Config.gs`, `Sheet_Readers.gs`, `Portfolio_Metrics.gs`, `Decision_Engine.gs`, `AI_Service.gs` |
| `Sheet_Readers.gs` | `EsquiloInvest_BaseOperacional/Sheet_Readers.gs` | Leitura da planilha, normalização de registros e enriquecimento externo de mercado | `readSpreadsheetData_`, `mapStocks_`, `mapFunds_`, `mapPension_`, `mapPreOrders_`, `getExternalMarketData_`, `enrichActionsWithMarketData_` | `Config.gs`, planilha operacional, `GOOGLEFINANCE`, cache em aba interna |
| `Portfolio_Metrics.gs` | `EsquiloInvest_BaseOperacional/Portfolio_Metrics.gs` | Métricas consolidadas, score geral, perfil, alertas e mensagens executivas | `buildPortfolioDecisionEngine_`, `buildPortfolioMetricsFromDomains_`, `evaluateStocks_`, `buildPortfolioAlerts_`, `buildPortfolioMessagingFromEngine_` | dados normalizados de `Sheet_Readers.gs`, `Decision_Engine.gs` |
| `Decision_Engine.gs` | `EsquiloInvest_BaseOperacional/Decision_Engine.gs` | Score por ativo, ranking, recomendação contextual, plano de ação, histórico e alertas inteligentes | `getAssetScore_`, `getAssetRanking_`, `getSmartRecommendation_`, `getActionPlan_`, `buildDecisionHistory_`, `buildIntelligentAlerts_` | `Portfolio_Metrics.gs`, `Config.gs`, planilha operacional |
| `AI_Service.gs` | `EsquiloInvest_BaseOperacional/AI_Service.gs` | Construção do contexto da IA, prompts, chamadas a Gemini/OpenAI, validação e fallback textual | `buildStrategyContext_`, `buildStrategyPrompt_`, `getPortfolioAIAnalysis`, `callGeminiRequest_`, `callChatGPT_`, `buildFallbackStrategyResponse_` | `Backend_Core.gs`, `API KEY.gs`, `Config.gs`, `UrlFetchApp` |
| `Export_Import.gs` | `EsquiloInvest_BaseOperacional/Export_Import.gs` | Pontos de entrada futuros para exportação/importação | `exportDashboardPdf`, `exportPortfolioCsv`, `importOperationalCsv` | atualmente sem integração concluída; todas as funções lançam erro |
| `BigQuery_Sync.gs` | `EsquiloInvest_BaseOperacional/BigQuery_Sync.gs` | Sincronização entre planilha e BigQuery por cabeçalho exato | `syncSheetToBigQuery`, `pullDataFromBigQuery`, `extractRowsForTable_`, `validateHeaders_`, `mapAcaoRow_` etc. | `BigQuery` advanced service, planilha vinculada, schemas fixos |
| `Dashboard.html` | `EsquiloInvest_BaseOperacional/Dashboard.html` | Interface do dashboard, filtros, popups, renderização e chamadas ao backend | `loadDashboardData`, `requestStrategyAnalysis`, `renderApp`, `renderActionPlanCard`, `renderAIAnalysisCard` | `google.script.run`, payload de `getDashboardData()` e `getPortfolioAIAnalysis()` |
| `Esquilo_Invest_Operacional.xlsx` | `EsquiloInvest_BaseOperacional/Esquilo_Invest_Operacional.xlsx` | Estrutura local da planilha operacional, referência de abas e cabeçalhos | não aplicável | lida por `Sheet_Readers.gs` e `BigQuery_Sync.gs` |
| `Release_Notes.md` | `EsquiloInvest_BaseOperacional/Release_Notes.md` | Histórico incremental da base operacional | não aplicável | documentação interna |

## 3.2 Artefatos legados ainda presentes na raiz

| Arquivo | Localização | Papel atual |
|---|---|---|
| `portfolio-dashboard-service.gs` | `backend/services/portfolio-dashboard-service.gs` | Base anterior monolítica do backend. Ainda serve como referência histórica, mas não é o runtime principal da base operacional atual. |
| `dashboard-app.html` | `frontend/layout/dashboard-app.html` | Frontend anterior da base legada. Importante como referência visual e histórica. |
| `dashboard-preview.html` | `frontend/layout/dashboard-preview.html` | Preview local da interface legada. |
| `header-preview.html` | `frontend/layout/header-preview.html` | Preview isolado de cabeçalho da base legada. |
| `webapp-manifest.webmanifest` | `config/webapp-manifest.webmanifest` | Artefato da estrutura anterior. Não participa do fluxo principal da base operacional atual. |

## 4. Estrutura do BigQuery

O script local de sincronização define o seguinte projeto e dataset:

- projeto: `esquilo-invest`
- dataset: `esquilo_invest`

Tabelas esperadas:

| Tabela | Origem | Finalidade |
|---|---|---|
| `acoes` | aba `Acoes` | posições de ações |
| `fundos` | aba `Fundos` | posições em fundos |
| `previdencia` | aba `Previdencia` | posições de previdência |
| `pre_ordens` | aba `PreOrdens` | ordens planejadas |
| `aportes` | aba `Aportes` | histórico de aportes |
| `app_config` | aba `Config` | parâmetros simples da base |

Como os dados são alimentados:

- `BigQuery_Sync.gs` lê a planilha por aba
- valida os cabeçalhos obrigatórios por tabela
- monta linhas JSON tipadas
- carrega os dados no BigQuery com `WRITE_TRUNCATE`

Observação importante:

`BigQuery_Sync.gs` usa `SpreadsheetApp.getActiveSpreadsheet()`, então ele foi desenhado para um Apps Script vinculado à planilha de sincronização, não para o backend standalone do dashboard.

## 5. Estrutura da planilha

### Abas operacionais

| Aba | Papel no sistema |
|---|---|
| `Acoes` | carteira de ações, com score por ativo, recomendação e enriquecimento de mercado |
| `Fundos` | carteira de fundos de investimento |
| `Previdencia` | carteira de previdência |
| `PreOrdens` | ordens planejadas sem execução automática |
| `Aportes` | histórico de aportes |
| `Config` | parâmetros da base, release, versionamento e chaves descritivas |

### Abas auxiliares visíveis

| Aba | Papel |
|---|---|
| `Dashboard_Visual` | apoio visual, não é a base primária do cálculo |
| `Export_Auxiliar` | apoio para futuras rotinas de exportação |

### Abas internas ocultas

| Aba | Papel |
|---|---|
| `_esquilo_market_cache` | cache curto de dados públicos de mercado |
| `_esquilo_decision_history` | persistência leve do histórico de decisões |

### Cabeçalhos esperados

As abas principais já foram preparadas com os cabeçalhos que o sistema e o `BigQuery_Sync.gs` esperam. Há também algumas colunas legadas extras preservadas no fim de certas abas para compatibilidade da base operacional atual.

## 6. Integração com IA

### Onde a IA é chamada

- backend: `AI_Service.gs`
- frontend: `Dashboard.html`, via `google.script.run.getPortfolioAIAnalysis()`

### Quais dados a IA usa

A IA trabalha sobre o contexto consolidado produzido pelo próprio backend:

- resumo financeiro
- métricas
- score geral
- perfil
- categorias
- decisão consolidada
- ranking de ativos
- alertas
- contexto de mercado

### Como responde

Formato esperado:

- `Diagnóstico geral`
- `Ações prioritárias`
- `Risco principal`
- `Oportunidade`

Providers:

- Gemini como principal
- OpenAI como fallback

Proteções:

- sanitização de texto
- validação estrutural
- logs de debug
- fallback textual local quando o provider responde fora do formato

## 7. Pontos críticos do sistema

- a base atual depende fortemente de consistência entre cabeçalhos da planilha e leitores do Apps Script
- `BigQuery_Sync.gs` e o backend standalone seguem modelos de execução diferentes
- `Export_Import.gs` ainda não foi migrado de fato; hoje só expõe stubs com erro explícito
- a integração de mercado depende de `GOOGLEFINANCE` e de uma aba de cache interna
- a IA depende de `Script Properties`, chave válida e cota do provider
- a raiz do repositório ainda mistura base operacional nova com base legada, o que pode causar leitura errada do escopo por quem entra no projeto
- há um desalinhamento de versionamento: `Release_Notes.md` já foi além de `v1.1.1`, enquanto `Config.gs` e `Dashboard.html` ainda exibem `1.1.1`

## 8. Melhorias estruturais recomendadas

- alinhar versionamento entre `Release_Notes.md`, `Config.gs` e `Dashboard.html`
- decidir explicitamente se a raiz antiga seguirá como legado ou será arquivada
- migrar ou remover os stubs de `Export_Import.gs`
- separar melhor os scripts que exigem Apps Script standalone dos scripts que exigem vínculo direto com planilha
- documentar formalmente o procedimento de publicação no Apps Script e de configuração do BigQuery
