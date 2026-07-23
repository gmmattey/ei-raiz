/**
 * SHEET READERS
 * Leitura e normalizacao da nova planilha operacional.
 * A base agora assume cabecalho em linha 1 e dados a partir da linha 2.
 */

function readSpreadsheetData_(spreadsheetContext) {
  const sheets = spreadsheetContext.sheets;

  return {
    actions: readActionRows_(sheets.actions),
    funds: readPassivePortfolioRows_(sheets.funds),
    previdencia: readPassivePortfolioRows_(sheets.previdencia),
    preOrders: readPreOrderRows_(sheets.preOrders),
    aportes: readStructuredSheet_(sheets.aportes),
    config: readStructuredSheet_(sheets.config)
  };
}

function readActionRows_(sheet) {
  return readStructuredSheet_(sheet);
}

function readPassivePortfolioRows_(sheet) {
  return readStructuredSheet_(sheet);
}

function readPreOrderRows_(sheet) {
  return readStructuredSheet_(sheet);
}

function readStructuredSheet_(sheet) {
  if (!sheet) return { header: [], rows: [] };

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 1 || lastCol < 1) return { header: [], rows: [] };

  const header = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0] || [];
  if (lastRow < 2) return { header: header, rows: [] };

  const values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const rows = values.reduce(function (items, row, index) {
    if (!row.some(function (cell) { return !isBlank_(cell); })) return items;
    items.push(buildStructuredSheetRow_(header, row, index + 2));
    return items;
  }, []);

  return {
    header: header,
    rows: rows
  };
}

function buildStructuredSheetRow_(header, row, rowNumber) {
  return {
    rowNumber: rowNumber,
    values: row,
    record: buildSheetRecord_(header, row)
  };
}

function buildSheetRecord_(header, row) {
  return (header || []).reduce(function (record, label, index) {
    const key = normalizeSheetKey_(label);
    if (!key) return record;
    record[key] = row[index];
    return record;
  }, {});
}

function normalizeSheetKey_(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function getRecordValue_(record, keys) {
  const source = record || {};
  for (let index = 0; index < (keys || []).length; index++) {
    const key = normalizeSheetKey_(keys[index]);
    if (Object.prototype.hasOwnProperty.call(source, key)) return source[key];
  }
  return '';
}

function mapStocks_(rawActionsData) {
  return (rawActionsData?.rows || []).reduce(function (items, rawRow) {
    const action = buildActionItem_(rawRow);
    if (action) items.push(action);
    return items;
  }, []);
}

function mapFunds_(rawRows, spreadsheet, sheet) {
  return mapPassivePortfolioCategory_(rawRows, spreadsheet, sheet, {
    sourceKey: 'funds',
    nameFields: ['fundo'],
    classificationFields: ['categoria'],
    investedFields: ['valorinvestido'],
    investedField: 'valorInvestidoRaw',
    recommendationResolver: getFundRecommendation_
  });
}

function mapPension_(rawRows, spreadsheet, sheet) {
  return mapPassivePortfolioCategory_(rawRows, spreadsheet, sheet, {
    sourceKey: 'previdencia',
    nameFields: ['planofundo'],
    classificationFields: ['tipo'],
    investedFields: ['totalaportado'],
    investedField: 'totalAportadoRaw',
    recommendationResolver: getPensionRecommendation_
  });
}

function mapPreOrders_(rawData) {
  return (rawData?.rows || []).reduce(function (items, rawRow) {
    const item = buildPreOrderMappedItem_(rawRow);
    if (item) items.push(item);
    return items;
  }, []);
}

function mapPassivePortfolioCategory_(rawData, spreadsheet, sheet, config) {
  return (rawData?.rows || []).reduce(function (items, rawRow) {
    const detailUrl = getSheetLink_(spreadsheet, sheet, rawRow.rowNumber, 1);
    const item = buildPassivePortfolioMappedItem_(rawRow, detailUrl, config);
    if (item) items.push(item);
    return items;
  }, []);
}

function buildPassivePortfolioMappedItem_(rawRow, detailUrl, config) {
  const record = rawRow?.record || {};
  const name = String(getRecordValue_(record, config.nameFields) || '').trim();
  const institution = getRecordValue_(record, ['plataforma', 'instituicao']);
  const classification = getRecordValue_(record, config.classificationFields);
  const strategy = getRecordValue_(record, ['estrategia', 'classe']);
  const benchmark = getRecordValue_(record, ['benchmark', 'indice', 'indexador']);
  const profile = getRecordValue_(record, ['perfil', 'perfilrisco', 'publicoalvo']);
  const fee = getRecordValue_(record, ['taxa', 'taxaadm', 'taxaadministracao', 'taxaperformance']);
  const cotization = getRecordValue_(record, ['cotizacao', 'cotizacaoresgate', 'prazoaplicacao']);
  const liquidity = getRecordValue_(record, ['liquidez', 'carencia', 'resgate', 'prazoresgate']);
  const risk = getRecordValue_(record, ['risco', 'nivelrisco']);
  const status = getRecordValue_(record, ['status']);
  const startedAt = getRecordValue_(record, ['inicio', 'entrada']);
  const investedCell = getRecordValue_(record, config.investedFields);
  const currentCell = getRecordValue_(record, ['valoratual']);
  const rentCell = getRecordValue_(record, ['rent', 'rentabilidade']);
  const observation = getRecordValue_(record, ['observacao']);

  if (shouldSkipPassivePortfolioRecord_(name, status)) return null;

  const rentData = calculateRentData_(rentCell, investedCell, currentCell);
  const recommendation = config.recommendationResolver(rentData.rentNumeric);
  const item = {
    name: name,
    institution: String(institution || ''),
    institutionIcon: getInstitutionIcon_(institution),
    classification: String(classification || ''),
    strategy: String(strategy || ''),
    benchmark: String(benchmark || ''),
    profileLabel: String(profile || ''),
    feeLabel: String(fee || ''),
    cotizationLabel: String(cotization || ''),
    liquidityLabel: String(liquidity || ''),
    riskLabel: String(risk || ''),
    statusLabel: String(status || ''),
    startedAt: String(startedAt || ''),
    observation: String(observation || ''),
    valorAtual: formatMoney_(currentCell),
    rentPct: formatPct_(rentData.rentPct),
    rentRaw: rentData.rentNumeric,
    recommendation: recommendation,
    detailUrl: detailUrl,
    urlDetalhe: detailUrl,
    valorAtualRaw: rentData.currentRaw,
    sourceProfile: buildPassiveCategorySourceProfile_(config?.sourceKey)
  };

  item[config.investedField] = rentData.investedRaw;
  return item;
}

function buildPassiveCategorySourceProfile_(sourceKey) {
  if (sourceKey === 'funds') {
    return {
      key: 'funds',
      label: 'Fundos',
      sourceType: 'registro-fundo',
      description: 'Os fundos usam estrutura normalizada de carteira e ficam prontos para integrar fontes regulatorias sem expor resposta bruta ao frontend.'
    };
  }

  return {
    key: 'previdencia',
    label: 'Previdencia',
    sourceType: 'registro-plano',
    description: 'A previdencia usa modelagem propria de plano e nao e tratada como fundo CVM no frontend.'
  };
}

function buildPreOrderMappedItem_(rawRow) {
  const record = rawRow?.record || {};
  const ticker = String(getRecordValue_(record, ['ativo']) || '').trim().toUpperCase();
  const status = getRecordValue_(record, ['status']);

  if (shouldSkipPreOrderRecord_(ticker, status)) return null;

  return {
    ticker: ticker,
    type: String(getRecordValue_(record, ['tipo']) || ''),
    lot: String(getRecordValue_(record, ['lote']) || ''),
    institution: String(getRecordValue_(record, ['plataforma', 'instituicao']) || ''),
    orderType: String(getRecordValue_(record, ['tipoordem']) || ''),
    qtyRaw: toNumber_(getRecordValue_(record, ['qtd'])),
    targetPriceRaw: toNumber_(getRecordValue_(record, ['precoalvo'])),
    validity: String(getRecordValue_(record, ['validade']) || ''),
    valorPotencialRaw: toNumber_(getRecordValue_(record, ['valorpotencial'])),
    currentPriceRaw: toNumber_(getRecordValue_(record, ['cotacaoatual'])),
    status: String(status || ''),
    observation: String(getRecordValue_(record, ['observacao']) || '')
  };
}

function buildActionItem_(rawRow) {
  const record = rawRow?.record || {};
  const ticker = String(getRecordValue_(record, ['ativo', 'sigla']) || '').trim().toUpperCase();
  const status = getRecordValue_(record, ['status']);

  if (shouldSkipActionRecord_(ticker, status)) return null;

  const name = String(getRecordValue_(record, ['nomedoativo', 'empresa', 'nome', 'observacao', 'tipo']) || '').trim();
  const institution = getRecordValue_(record, ['plataforma', 'instituicao']);
  const qtyCell = getRecordValue_(record, ['qtd', 'cotas']);
  const avgPriceCell = getRecordValue_(record, ['pmedior', 'pmedio', 'precomedio']);
  const currentPriceCell = getRecordValue_(record, ['cotacaoatual']);
  const valorInvestidoCell = getRecordValue_(record, ['valorinvestido']);
  const valorAtualCell = getRecordValue_(record, ['valoratual']);
  const stopCell = getRecordValue_(record, ['stop15', 'stop']);
  const rentCell = getRecordValue_(record, ['rent', 'rentabilidade']);
  const observation = getRecordValue_(record, ['observacao']);
  const entryLabel = getRecordValue_(record, ['entrada']);

  const rentData = calculateRentData_(rentCell, valorInvestidoCell, valorAtualCell);
  const currentPriceRaw = toNumber_(currentPriceCell);
  const stopRaw = toNumber_(stopCell);
  const recommendation = getRecommendation_(rentData.rentNumeric, currentPriceCell, stopRaw);
  const hasValores = !isBlank_(valorInvestidoCell) && !isBlank_(valorAtualCell);
  const rendimentoAbs = hasValores ? (rentData.currentRaw - rentData.investedRaw) : null;

  return {
    ticker: ticker,
    name: name,
    institution: String(institution || ''),
    institutionIcon: getInstitutionIcon_(institution),
    statusLabel: String(status || ''),
    observation: String(observation || ''),
    entryLabel: String(entryLabel || ''),
    qty: formatQty_(qtyCell),
    avgPrice: formatMoney_(avgPriceCell),
    currentPrice: formatMoney_(currentPriceCell),
    currentPriceRaw: currentPriceRaw,
    positionValue: formatMoney_(valorAtualCell),
    rendimentoAbs: formatMoney_(rendimentoAbs),
    rendimentoPct: formatPct_(rentData.rentPct),
    recommendation: recommendation,
    chartUrl: getChartUrl_(ticker),
    rent: rentData.rentNumeric,
    stopRaw: stopRaw,
    valorInvestidoRaw: rentData.investedRaw,
    valorAtualRaw: rentData.currentRaw,
    qtyRaw: toNumber_(qtyCell),
    avgPriceRaw: toNumber_(avgPriceCell)
  };
}

function getFundRecommendation_(rentPct) {
  if (rentPct <= -0.10) return 'Revisar';
  if (rentPct < 0) return 'Monitorar';
  return 'Manter';
}

function getPensionRecommendation_(rentPct) {
  if (rentPct <= -0.08) return 'Revisar';
  if (rentPct < 0) return 'Monitorar';
  return 'Manter';
}

function shouldSkipPassivePortfolioRecord_(name, status) {
  if (!name) return true;

  const normalizedName = normalizeText_(name);
  const normalizedStatus = normalizeText_(status);

  if (normalizedName.indexOf('total') >= 0) return true;
  if (normalizedName.indexOf('adicionar') >= 0) return true;
  if (normalizedStatus === 'inativo') return true;
  return false;
}

function shouldSkipActionRecord_(ticker, status) {
  if (!ticker) return true;

  const normalizedTicker = normalizeText_(ticker);
  const normalizedStatus = normalizeText_(status);

  if (normalizedTicker.indexOf('total') >= 0) return true;
  if (normalizedStatus && normalizedStatus !== 'comprado') return true;
  return false;
}

function shouldSkipPreOrderRecord_(ticker, status) {
  if (!ticker) return true;

  const normalizedTicker = normalizeText_(ticker);
  const normalizedStatus = normalizeText_(status);

  if (normalizedTicker.indexOf('total') >= 0) return true;
  if (normalizedStatus === 'inativo' || normalizedStatus === 'cancelado') return true;
  return false;
}

function calculateRentData_(rentCell, investedCell, currentCell) {
  const explicitRent = isBlank_(rentCell) ? null : Number(rentCell);
  const investedRaw = toNumber_(investedCell);
  const currentRaw = toNumber_(currentCell);
  let rentPct = null;

  if (explicitRent !== null && !isNaN(explicitRent)) {
    rentPct = explicitRent;
  } else if (!isBlank_(investedCell) && !isBlank_(currentCell) && investedRaw) {
    rentPct = currentRaw / investedRaw - 1;
  } else if (!isBlank_(investedCell) && !isBlank_(currentCell) && !investedRaw) {
    rentPct = 0;
  }

  return {
    investedRaw: investedRaw,
    currentRaw: currentRaw,
    rentPct: rentPct,
    rentNumeric: rentPct === null || isNaN(rentPct) ? 0 : rentPct
  };
}
// -----------------------------------------------------------------------------
// Dados externos de mercado
// -----------------------------------------------------------------------------

/**
 * Busca dados publicos complementares de mercado sem misturar com a planilha.
 * Entrada: lista de tickers e, opcionalmente, a planilha ativa.
 * Saida: mapa por ticker com dados externos normalizados ou objeto vazio.
 */
function getExternalMarketData_(tickers, spreadsheet) {
  if (!isExternalMarketDataEnabled_()) return {};

  const normalizedTickers = dedupeMarketTickers_(tickers);
  if (!normalizedTickers.length) return {};

  const cachedMap = {};
  const missingTickers = [];

  normalizedTickers.forEach(function (ticker) {
    const cached = getCachedExternalMarketData_(ticker);
    if (cached) cachedMap[ticker] = cached;
    else missingTickers.push(ticker);
  });

  if (!missingTickers.length) return cachedMap;

  let fetchedMap = {};
  try {
    fetchedMap = fetchExternalStockMarketData_(missingTickers, spreadsheet);
  } catch (error) {
    logMarketDataDebug_('external-fetch-failed', {
      tickers: missingTickers,
      message: String(error && error.message ? error.message : error)
    });
    return cachedMap;
  }

  missingTickers.forEach(function (ticker) {
    if (!fetchedMap[ticker]) return;
    cachedMap[ticker] = fetchedMap[ticker];
    setCachedExternalMarketData_(ticker, fetchedMap[ticker]);
  });

  return cachedMap;
}

function fetchExternalStockMarketData_(tickers, spreadsheet) {
  const batches = chunkArray_(tickers, APP_CONFIG_.marketData.maxBatchSize);
  const result = {};
  const startedAt = Date.now();

  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];

    if (Date.now() - startedAt >= APP_CONFIG_.marketData.maxFetchRuntimeMs) {
      logMarketDataDebug_('external-time-budget-reached', {
        remainingTickers: batch,
        collected: Object.keys(result).length
      });
      break;
    }

    let batchResult = {};
    try {
      batchResult = readGoogleFinanceMarketBatch_(batch, spreadsheet);
    } catch (error) {
      logMarketDataDebug_('external-batch-failed', {
        tickers: batch,
        message: String(error && error.message ? error.message : error)
      });
      continue;
    }

    Object.keys(batchResult).forEach(function (ticker) {
      result[ticker] = batchResult[ticker];
    });
  }

  return result;
}

function readGoogleFinanceMarketBatch_(tickers, spreadsheet) {
  if (!tickers || !tickers.length) return {};

  const targetSpreadsheet = spreadsheet || openOperationalSpreadsheet_();
  if (!targetSpreadsheet) return {};

  try {
    const sheet = getOrCreateMarketCacheSheet_(targetSpreadsheet);
    const startRow = 2;
    const rowCount = tickers.length;
    const formulas = tickers.map(function (ticker, index) {
      const rowNumber = startRow + index;
      return [
        ticker,
        buildGoogleFinanceSymbol_(ticker),
        '=IFERROR(GOOGLEFINANCE(B' + rowNumber + ',"price"),"")',
        '=IFERROR(GOOGLEFINANCE(B' + rowNumber + ',"changepct"),"")',
        '=IFERROR((C' + rowNumber + '/INDEX(GOOGLEFINANCE(B' + rowNumber + ',"close",TODAY()-30,TODAY()),2,2))-1,"")'
      ];
    });

    sheet.getRange(startRow, 1, Math.max(sheet.getMaxRows() - startRow + 1, rowCount), 5).clearContent();
    sheet.getRange(startRow, 1, rowCount, 5).setValues(formulas);

    SpreadsheetApp.flush();
    Utilities.sleep(APP_CONFIG_.marketData.fetchWaitMs);

    const values = sheet.getRange(startRow, 1, rowCount, 5).getValues();
    const result = {};

    values.forEach(function (row) {
      const ticker = normalizeMarketTicker_(row[0]);
      if (!ticker) return;

      const marketData = extractGoogleFinanceRowMarketData_(row);
      if (!marketData) return;
      result[ticker] = marketData;
    });

    return result;
  } catch (error) {
    logMarketDataDebug_('external-read-failed', {
      tickers: tickers,
      message: String(error && error.message ? error.message : error)
    });
    return {};
  }
}

function getOrCreateMarketCacheSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(APP_CONFIG_.marketData.cacheSheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(APP_CONFIG_.marketData.cacheSheetName);
    sheet.getRange(1, 1, 1, 5).setValues([['Ticker', 'Symbol', 'Price', 'Daily Change', '30d Change']]);
    sheet.hideSheet();
  }

  return sheet;
}

function buildGoogleFinanceSymbol_(ticker) {
  return APP_CONFIG_.marketData.exchangePrefix + ':' + normalizeMarketTicker_(ticker);
}

function extractGoogleFinanceRowMarketData_(row) {
  const currentPrice = toNullableNumber_(row[2]);
  const dailyChangePct = normalizeMarketPercent_(row[3]);
  const monthlyChangePct = toNullableNumber_(row[4]);

  if (currentPrice === null && dailyChangePct === null && monthlyChangePct === null) {
    return null;
  }

  return {
    provider: APP_CONFIG_.marketData.provider,
    currentPrice: currentPrice,
    dailyChangePct: dailyChangePct,
    monthlyChangePct: monthlyChangePct,
    sector: '',
    fetchedAt: new Date().toISOString()
  };
}

function getCachedExternalMarketData_(ticker) {
  const cache = CacheService.getScriptCache();
  const cacheKey = buildExternalMarketCacheKey_(ticker);
  const cachedRaw = cache.get(cacheKey);
  if (!cachedRaw) return null;

  try {
    return JSON.parse(cachedRaw);
  } catch (error) {
    return null;
  }
}

function setCachedExternalMarketData_(ticker, marketData) {
  const cache = CacheService.getScriptCache();
  const cacheKey = buildExternalMarketCacheKey_(ticker);
  cache.put(cacheKey, JSON.stringify(marketData), APP_CONFIG_.marketData.cacheTtlSeconds);
}

function buildExternalMarketCacheKey_(ticker) {
  return 'market:' + normalizeMarketTicker_(ticker);
}

function dedupeMarketTickers_(tickers) {
  const seen = {};
  return (tickers || []).reduce(function (items, ticker) {
    const normalized = normalizeMarketTicker_(ticker);
    if (!normalized || seen[normalized]) return items;
    seen[normalized] = true;
    items.push(normalized);
    return items;
  }, []);
}

function normalizeMarketTicker_(ticker) {
  if (!ticker) return '';
  return String(ticker).trim().toUpperCase();
}

function normalizeMarketPercent_(value) {
  const numericValue = toNullableNumber_(value);
  if (numericValue === null) return null;
  return Math.abs(numericValue) > 1 ? numericValue / 100 : numericValue;
}

function toNullableNumber_(value) {
  if (isBlank_(value)) return null;
  const numericValue = Number(value);
  return isNaN(numericValue) ? null : numericValue;
}

function chunkArray_(items, chunkSize) {
  const safeSize = Math.max(1, chunkSize || 1);
  const chunks = [];

  for (let index = 0; index < (items || []).length; index += safeSize) {
    chunks.push(items.slice(index, index + safeSize));
  }

  return chunks;
}

function safeGetActionMarketData_(actions, spreadsheet) {
  try {
    const tickers = (actions || []).map(function (action) {
      return action?.ticker || '';
    });

    return getExternalMarketData_(tickers, spreadsheet);
  } catch (error) {
    logMarketDataDebug_('action-enrich-disabled', {
      message: String(error && error.message ? error.message : error)
    });
    return {};
  }
}

function enrichActionsWithMarketData_(actions, marketDataMap) {
  return (actions || []).map(function (action) {
    const ticker = normalizeMarketTicker_(action?.ticker);
    const marketData = ticker ? (marketDataMap?.[ticker] || null) : null;

    if (!marketData) return action;
    return Object.assign({}, action, { marketData: marketData });
  });
}

function logMarketDataDebug_(stage, details) {
  try {
    Logger.log('[MarketData][' + stage + '] ' + JSON.stringify(details || {}));
  } catch (error) {
    Logger.log('[MarketData][' + stage + ']');
  }
}

