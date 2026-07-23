/**
 * BACKEND CORE
 * Orquestracao principal do backend para Google Apps Script.
 * BigQuery opera como fonte principal, com fallback seguro para a planilha.
 */

function doGet(e) {
  if (isMobileApiRequest_(e)) {
    return buildMobileApiResponse_(e);
  }

  return HtmlService.createTemplateFromFile(APP_CONFIG_.templateName)
    .evaluate()
    .setTitle('Esquilo Invest - Base Operacional')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Orquestra a carga completa do dashboard.
 * Entrada: nenhuma.
 * Saida: payload compatível com o frontend atual, sem alterar os contratos existentes.
 */
function getDashboardData() {
  const dashboardContext = buildDashboardContext_();
  return buildDashboardPayload_(dashboardContext);
}

/**
 * Contexto unico para calculos e payloads do dashboard.
 * Reaproveitado por dashboard, leitura auxiliar e builders de IA.
 */
function buildDashboardContext_() {
  const spreadsheetContext = getSpreadsheetContext_();
  const dataContext = getPrimaryDashboardDataContext_(spreadsheetContext);
  const domainData = collectDashboardDomainData_(dataContext);
  const insights = buildDashboardInsights_(domainData, dataContext);

  return {
    spreadsheet: dataContext.spreadsheet,
    sheets: dataContext.sheets,
    dataSource: dataContext.dataSource,
    sourceWarning: dataContext.sourceWarning,
    domainData,
    insights
  };
}

/**
 * PATCH para apps_script/backend/Backend_Core.gs
 *
 * Substitua a função getPrimaryDashboardDataContext_ inteira por esta versão.
 *
 * Comportamento:
 * - fonte principal: D1
 * - fallback 1: BigQuery
 * - fallback 2: planilha
 */

function getPrimaryDashboardDataContext_(spreadsheetContext) {
  var dataContext = {
    spreadsheet: spreadsheetContext.spreadsheet,
    sheets: spreadsheetContext.sheets,
    rawData: null,
    dataSource: 'd1',
    sourceWarning: ''
  };

  try {
    dataContext.rawData = getD1StructuredPortfolioData_();
    dataContext.dataSource = 'd1';
    return dataContext;
  } catch (d1Error) {
    try {
      dataContext.rawData = getBigQueryStructuredPortfolioData_();
      dataContext.dataSource = 'bigquery-fallback';
      dataContext.sourceWarning = 'D1 indisponivel. Fallback para BigQuery: ' + String(d1Error && d1Error.message ? d1Error.message : d1Error);
      return dataContext;
    } catch (bigQueryError) {
      dataContext.rawData = readSpreadsheetData_(spreadsheetContext);
      dataContext.dataSource = 'spreadsheet-fallback';
      dataContext.sourceWarning = [
        'D1 indisponivel: ' + String(d1Error && d1Error.message ? d1Error.message : d1Error),
        'BigQuery indisponivel: ' + String(bigQueryError && bigQueryError.message ? bigQueryError.message : bigQueryError)
      ].join(' | ');
      return dataContext;
    }
  }
}


function getSpreadsheetContext_() {
  const spreadsheet = openOperationalSpreadsheet_();

  return {
    spreadsheet,
    sheets: {
      actions: spreadsheet.getSheetByName(APP_CONFIG_.sheetNames.actions),
      preOrders: spreadsheet.getSheetByName(APP_CONFIG_.sheetNames.preOrders),
      funds: spreadsheet.getSheetByName(APP_CONFIG_.sheetNames.funds),
      previdencia: spreadsheet.getSheetByName(APP_CONFIG_.sheetNames.previdencia),
      aportes: spreadsheet.getSheetByName(APP_CONFIG_.sheetNames.aportes),
      config: spreadsheet.getSheetByName(APP_CONFIG_.sheetNames.config),
      dashboardVisual: spreadsheet.getSheetByName(APP_CONFIG_.sheetNames.dashboardVisual),
      exportAuxiliar: spreadsheet.getSheetByName(APP_CONFIG_.sheetNames.exportAuxiliar)
    }
  };
}

/**
 * Coleta os blocos de dados brutos consumidos pelo dashboard.
 * Mantem leitura de planilha separada das transformacoes e recomendacoes.
 */
function collectDashboardDomainData_(dataContext) {
  const rawData = dataContext?.rawData || {};
  const spreadsheet = dataContext?.spreadsheet || null;
  const sheets = dataContext?.sheets || {};
  const mappedActions = mapStocks_(rawData.actions);
  const actions = enrichActionsWithMarketData_(
    mappedActions,
    safeGetActionMarketData_(mappedActions, spreadsheet)
  );
  const mappedInvestments = mapFunds_(rawData.funds, spreadsheet, sheets.funds || null);
  const mappedPrevidencias = mapPension_(rawData.previdencia, spreadsheet, sheets.previdencia || null);
  const preOrders = mapPreOrders_(rawData.preOrders);
  const summary = buildPortfolioSummaryFromDomains_(actions, mappedInvestments, mappedPrevidencias, preOrders);
  const normalizedCollections = buildNormalizedPortfolioCollections_(summary, actions, mappedInvestments, mappedPrevidencias);
  const investments = normalizedCollections.investments;
  const previdencias = normalizedCollections.previdencias;

  return {
    summary: summary,
    actions: normalizedCollections.actions,
    preOrders: preOrders,
    fundosTop: buildFundsTopFromMappedItems_(investments),
    investments: investments,
    previdencias: previdencias,
    previdenciaInfo: buildPrevidenciaInfoFromMappedItems_(previdencias),
    tip: ''
  };
}

/**
 * Calcula blocos analiticos do dashboard sem misturar leitura de planilha com payload final.
 */
function buildDashboardInsights_(domainData, dataContext) {
  const engine = buildPortfolioDecisionEngine_(domainData);
  const alert = getPrimaryAlert_(engine.alerts);
  const orders = buildOrdersPayload_(domainData.actions, domainData.preOrders);
  const messaging = buildPortfolioMessagingFromEngine_(engine);
  const actionPlan = getActionPlan_(engine);
  const spreadsheet = dataContext?.spreadsheet || openOperationalSpreadsheet_();
  const decisionHistory = buildDecisionHistory_(spreadsheet, domainData.actions, engine, actionPlan);
  const intelligentAlerts = buildIntelligentAlerts_(engine, actionPlan, decisionHistory);

  return {
    alerts: engine.alerts,
    alert,
    orders,
    metrics: engine.metrics,
    score: engine.score,
    profile: engine.profile,
    generalAdvice: engine.generalAdvice,
    messaging: messaging,
    actionPlan: actionPlan,
    decisionHistory: decisionHistory,
    intelligentAlerts: intelligentAlerts,
    assetRanking: engine.assetRanking,
    decisionEngine: engine,
    dataSource: dataContext?.dataSource || 'bigquery'
  };
}

function buildDashboardPayload_(dashboardContext) {
  const domainData = dashboardContext?.domainData || {};
  const insights = dashboardContext?.insights || {};
  const categories = insights.decisionEngine ? insights.decisionEngine.categories : {};

  return {
    summary: domainData.summary,
    actions: domainData.actions,
    alert: insights.alert,
    alerts: insights.alerts,
    orders: insights.orders,
    fundosTop: domainData.fundosTop,
    investments: domainData.investments,
    previdencias: domainData.previdencias,
    previdenciaInfo: domainData.previdenciaInfo,
    tip: domainData.tip,
    profile: insights.profile,
    score: insights.score,
    generalAdvice: insights.generalAdvice,
    messaging: insights.messaging,
    actionPlan: insights.actionPlan,
    decisionHistory: insights.decisionHistory,
    intelligentAlerts: insights.intelligentAlerts,
    assetRanking: insights.assetRanking,
    dataSource: insights.dataSource || 'bigquery',
    sourceWarning: dashboardContext?.sourceWarning || '',
    categorySnapshots: buildCategorySnapshots_(domainData.summary, categories),
    dataProfiles: buildDashboardDataProfiles_(),
    operations: {
      canChangeStatus: true,
      canDelete: true,
      canUpdate: true,
      canCreate: true,
      financialExecutionEnabled: false
    },
    categories: categories,
    portfolioDecision: insights.decisionEngine ? insights.decisionEngine.portfolioDecision : {},
    updatedAt: new Date().toISOString()
  };
}

function buildDashboardDataProfiles_() {
  return {
    actions: {
      sourceType: 'cotacao-mercado',
      description: 'Acoes usam a leitura normalizada da carteira com enriquecimento de cotacao e contexto de mercado.'
    },
    funds: {
      sourceType: 'registro-fundo',
      description: 'Fundos usam payload normalizado do backend, pronto para integrar fonte regulatoria sem expor resposta bruta na UI.'
    },
    previdencia: {
      sourceType: 'registro-plano',
      description: 'Previdencia usa modelagem propria de plano e nao replica a estrutura de fundos no frontend.'
    }
  };
}

function getDashboardActionsSnapshot() {
  const dashboardContext = buildDashboardContext_();
  const domainData = dashboardContext?.domainData || {};
  const insights = dashboardContext?.insights || {};
  const categories = insights?.decisionEngine ? insights.decisionEngine.categories : {};

  return {
    actions: domainData.actions || [],
    summary: {
      acoes: domainData?.summary?.acoes || '',
      acoesRaw: domainData?.summary?.acoesRaw || 0,
      totalRaw: domainData?.summary?.totalRaw || 0
    },
    orders: insights.orders || {},
    categories: {
      actions: categories?.actions || {}
    },
    assetRanking: insights.assetRanking || {},
    dataSource: insights.dataSource || dashboardContext?.dataSource || 'bigquery',
    sourceWarning: dashboardContext?.sourceWarning || '',
    updatedAt: new Date().toISOString()
  };
}

