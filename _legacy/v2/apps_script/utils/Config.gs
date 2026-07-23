/**
 * CONFIG
 * Base operacional do Esquilo Invest preparada para Google Apps Script.
 * Este arquivo concentra configuracoes gerais, nomes de abas, release
 * e helpers compartilhados entre os arquivos .gs.
 */

const APP_CONFIG_ = {
  templateName: 'Dashboard',
  releaseName: 'Esquilo Invest',
  versionNumber: '2.0.0',
  spreadsheetId: '119enzesF7j5g7Cd1uBgjiu-YSlTKHpubfc_ZSv1M3Lk',
  spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/119enzesF7j5g7Cd1uBgjiu-YSlTKHpubfc_ZSv1M3Lk/edit',
  spreadsheetFileName: 'Esquilo_Invest_Operacional.xlsx',
  actionTable: {
    headerRow: 1,
    startRow: 2,
    startCol: 1
  },
  portfolioTable: {
    startRow: 2,
    startCol: 1,
    columnCount: 9
  },
  preOrdersTable: {
    startRow: 2,
    startCol: 1,
    columnCount: 12
  },
  defaultOpenAIModel: 'gpt-4o-mini',
  geminiModel: 'gemini-2.5-flash',
  marketData: {
    enabledByDefault: true,
    provider: 'google-finance',
    cacheSheetName: '_esquilo_market_cache',
    cacheTtlSeconds: 1800,
    fetchWaitMs: 1500,
    maxBatchSize: 8,
    maxFetchRuntimeMs: 4000,
    exchangePrefix: 'BVMF'
  },
  decisionHistory: {
    sheetName: '_esquilo_decision_history',
    maxItems: 20
  },
  sheetNames: {
    actions: 'Acoes',
    funds: 'Fundos',
    previdencia: 'Previdencia',
    preOrders: 'PreOrdens',
    aportes: 'Aportes',
    config: 'Config',
    dashboardVisual: 'Dashboard_Visual',
    exportAuxiliar: 'Export_Auxiliar'
  },
  internalSheets: {
    marketCache: '_esquilo_market_cache',
    decisionHistory: '_esquilo_decision_history'
  },
  scriptProperties: {
    geminiApiKey: 'GEMINI_API_KEY',
    openAiApiKey: 'OPENAI_API_KEY',
    openAiModel: 'OPENAI_MODEL',
    externalMarketDataEnabled: 'EXTERNAL_MARKET_DATA_ENABLED',
    mobileAppApiToken: 'MOBILE_APP_API_TOKEN'
  }
};

const SCRIPT_PROPERTY_KEYS_ = APP_CONFIG_.scriptProperties;

const ALERT_PRIORITY_ = {
  'Crítico': 0,
  'Atenção': 1,
  'Informativo': 2
};

function getScriptProperty_(key) {
  return PropertiesService.getScriptProperties().getProperty(key) || '';
}

function setScriptProperty_(key, value) {
  PropertiesService.getScriptProperties().setProperty(key, value);
}

function getOpenAIKey_() {
  return getScriptProperty_(SCRIPT_PROPERTY_KEYS_.openAiApiKey);
}

function getOpenAIModel_() {
  return getScriptProperty_(SCRIPT_PROPERTY_KEYS_.openAiModel) || APP_CONFIG_.defaultOpenAIModel;
}

function isExternalMarketDataEnabled_() {
  const rawValue = getScriptProperty_(SCRIPT_PROPERTY_KEYS_.externalMarketDataEnabled);
  if (!rawValue) return APP_CONFIG_.marketData.enabledByDefault;
  return String(rawValue).toLowerCase() === 'true';
}

function getOperationalSpreadsheetId_() {
  return APP_CONFIG_.spreadsheetId;
}

function getOperationalSpreadsheetUrl_() {
  return APP_CONFIG_.spreadsheetUrl;
}

function openOperationalSpreadsheet_() {
  return SpreadsheetApp.openById(getOperationalSpreadsheetId_());
}

// -----------------------------------------------------------------------------
// Helpers compartilhados
// -----------------------------------------------------------------------------
function getInstitutionIcon_(name) {
  const key = normalizeInstitution_(name);
  if (key.indexOf('ion') >= 0) return 'https://raw.githubusercontent.com/serealdemanga/esquilo-invest/main/icons/ion.png';
  if (key.indexOf('itau') >= 0) return 'https://raw.githubusercontent.com/serealdemanga/esquilo-invest/main/icons/itau.png';
  if (key.indexOf('xp') >= 0) return 'https://raw.githubusercontent.com/serealdemanga/esquilo-invest/main/icons/xp.png';
  return '';
}

function normalizeInstitution_(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .trim();
}

function getChartUrl_(ticker) {
  const cleanTicker = String(ticker || '').trim().toUpperCase();
  if (!cleanTicker) return '';
  if (cleanTicker.indexOf(':') >= 0) return 'https://www.google.com/finance/quote/' + encodeURIComponent(cleanTicker);
  return 'https://www.google.com/finance/quote/' + encodeURIComponent(cleanTicker) + ':BVMF';
}

function getSheetLink_(spreadsheet, sheet, row, col) {
  if (!spreadsheet || !sheet) return '';
  const gid = sheet.getSheetId();
  const a1 = columnToLetter_(col) + row;
  return 'https://docs.google.com/spreadsheets/d/' + spreadsheet.getId() + '/edit#gid=' + gid + '&range=' + a1;
}

function columnToLetter_(col) {
  let temp = col;
  let letter = '';

  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }

  return letter;
}

function getHeaderIndex_(header, names) {
  if (!header) return -1;
  const normalizedHeader = header.map(function (item) { return normalizeText_(item); });

  for (let index = 0; index < names.length; index++) {
    const headerIndex = normalizedHeader.indexOf(normalizeText_(names[index]));
    if (headerIndex >= 0) return headerIndex;
  }

  return -1;
}

function idxOrDefault_(value, fallback) {
  return value >= 0 ? value : fallback;
}

function normalizeText_(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function formatMoney_(value) {
  if (value === null || value === undefined || value === '') return 'Sem dados';
  const numericValue = Number(value);
  if (isNaN(numericValue)) return 'Sem dados';
  return 'R$ ' + numericValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatQty_(value) {
  if (value === null || value === undefined || value === '') return 'Sem dados';
  const numericValue = Number(value);
  if (isNaN(numericValue)) return 'Sem dados';
  if (Math.abs(numericValue - Math.round(numericValue)) < 0.0000001) return String(Math.round(numericValue));
  return numericValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPct_(value) {
  if (value === null || value === undefined || value === '') return 'Sem dados';
  const numericValue = Number(value);
  if (isNaN(numericValue)) return 'Sem dados';
  return (numericValue * 100).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
}

function isBlank_(value) {
  return value === null || value === undefined || value === '';
}

function toNumber_(value) {
  if (isBlank_(value)) return 0;
  const numericValue = Number(value);
  return isNaN(numericValue) ? 0 : numericValue;
}

function sumBy_(items, key) {
  if (!items || !items.length) return 0;
  return items.reduce(function (total, item) {
    return total + (Number(item[key]) || 0);
  }, 0);
}

