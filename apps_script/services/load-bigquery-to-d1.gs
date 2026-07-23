/**
 * Carga inicial BigQuery -> Cloudflare D1
 * Versão temporária com credenciais no código para destravar a execução.
 * Ajustada para diagnosticar dependências do Apps Script.
 * Apague esta versão depois de usar.
 */

var MIGRATION_DEFAULTS_ = {
  bigQueryProjectId: 'esquilo-invest',
  bigQueryDatasetId: 'esquilo_invest',
  d1ApiBaseUrl: 'https://api.cloudflare.com/client/v4',
  d1BatchSize: 50,
  sourceTables: {
    acoes: 'acoes',
    fundos: 'fundos',
    previdencia: 'previdencia',
    preOrdens: 'pre_ordens',
    aportes: 'aportes'
  },
  assetTypeIds: {
    STOCK: 'asset_type_stock',
    FUND: 'asset_type_fund',
    PENSION: 'asset_type_pension'
  }
};

var HARD_CODED_MIGRATION_CONFIG_ = {
  CLOUDFLARE_ACCOUNT_ID: '2f38f7354f204d7b3f7d6c750b3e43ff',
  CLOUDFLARE_D1_DATABASE_ID: 'f7ee1506-ae01-45e4-875d-781042ea3f00',
  CLOUDFLARE_API_TOKEN: 'cfut_11HoBXPDcjXPjwpZenqBRaYRuZETYSl21Rk9JsYtcf523cd8',
  MIGRATION_USER_ID: 'user_migracao_inicial',
  MIGRATION_PORTFOLIO_ID: 'portfolio_principal_inicial',
  MIGRATION_PORTFOLIO_NAME: 'Carteira Principal',
  MIGRATION_USER_DEVICE_ID: '',
  MIGRATION_DRY_RUN: 'false',
  BIGQUERY_PROJECT_ID: 'esquilo-invest',
  BIGQUERY_DATASET_ID: 'esquilo_invest',
  D1_API_BASE_URL: 'https://api.cloudflare.com/client/v4',
  D1_BATCH_SIZE: '50'
};

function diagnosticarDependenciasMigracao() {
  var info = {
    hasUrlFetchApp: typeof UrlFetchApp !== 'undefined',
    hasPropertiesService: typeof PropertiesService !== 'undefined',
    hasUtilities: typeof Utilities !== 'undefined',
    hasBigQueryAdvancedService: typeof BigQuery !== 'undefined'
  };
  Logger.log(JSON.stringify(info));

  if (typeof BigQuery === 'undefined') {
    throw new Error(
      'BigQuery não está habilitado neste projeto Apps Script. ' +
      'Ative o Advanced Google Service BigQuery antes de executar a migração.'
    );
  }

  return info;
}

function executarCargaBigQueryParaD1() {
  return runInitialBigQueryToD1Load_(false);
}

function testarCargaBigQueryParaD1() {
  return runInitialBigQueryToD1Load_(true);
}

function runInitialBigQueryToD1Load_(forceDryRun) {
  assertMigrationDependencies_();

  var config = getMigrationConfig_(forceDryRun);
  var startedAt = new Date();

  logInfo_('Inicio da carga BigQuery -> D1');
  logInfo_(JSON.stringify({
    bigQueryProjectId: config.bigQueryProjectId,
    bigQueryDatasetId: config.bigQueryDatasetId,
    d1DatabaseId: maskValue_(config.cloudflareD1DatabaseId),
    dryRun: config.dryRun,
    batchSize: config.d1BatchSize
  }));

  var acoes = fetchBigQueryRows_(config, config.sourceTables.acoes, [
    'tipo', 'ativo', 'plataforma', 'status', 'situacao', 'data_entrada', 'quantidade',
    'preco_medio', 'cotacao_atual', 'valor_investido', 'valor_atual', 'stop_loss',
    'alvo', 'rentabilidade', 'observacao', 'atualizado_em'
  ]);

  var fundos = fetchBigQueryRows_(config, config.sourceTables.fundos, [
    'fundo', 'plataforma', 'categoria', 'estrategia', 'status', 'situacao', 'data_inicio',
    'valor_investido', 'valor_atual', 'rentabilidade', 'observacao', 'atualizado_em'
  ]);

  var previdencia = fetchBigQueryRows_(config, config.sourceTables.previdencia, [
    'plano', 'plataforma', 'tipo', 'estrategia', 'status', 'situacao', 'data_inicio',
    'valor_investido', 'valor_atual', 'rentabilidade', 'observacao', 'atualizado_em'
  ]);

  var preOrdens = fetchBigQueryRows_(config, config.sourceTables.preOrdens, [
    'tipo', 'ativo', 'plataforma', 'tipo_ordem', 'quantidade', 'preco_alvo', 'validade',
    'valor_potencial', 'cotacao_atual', 'status', 'observacao'
  ]);

  var aportes = fetchBigQueryRows_(config, config.sourceTables.aportes, [
    'mes_ano', 'destino', 'categoria', 'plataforma', 'valor', 'acumulado', 'status'
  ]);

  var prepared = prepareMigrationPayload_(config, {
    acoes: acoes,
    fundos: fundos,
    previdencia: previdencia,
    preOrdens: preOrdens,
    aportes: aportes
  });

  var statements = [];
  statements = statements.concat(buildBootstrapStatements_(config));
  statements = statements.concat(buildPlatformStatements_(prepared.platforms));
  statements = statements.concat(buildAssetStatements_(prepared.assets));
  statements = statements.concat(buildPortfolioPositionStatements_(prepared.positions));
  statements = statements.concat(buildPlannedOrderStatements_(prepared.plannedOrders));
  statements = statements.concat(buildContributionStatements_(prepared.contributions));

  var summary = {
    source: {
      acoes: acoes.length,
      fundos: fundos.length,
      previdencia: previdencia.length,
      preOrdens: preOrdens.length,
      aportes: aportes.length
    },
    destination: {
      platforms: prepared.platforms.length,
      assets: prepared.assets.length,
      positions: prepared.positions.length,
      plannedOrders: prepared.plannedOrders.length,
      contributions: prepared.contributions.length
    },
    sqlStatements: statements.length,
    dryRun: config.dryRun
  };

  logInfo_('Resumo da carga: ' + JSON.stringify(summary));

  if (config.dryRun) {
    logInfo_('Dry-run ativo. Nenhum comando foi enviado ao D1.');
    return summary;
  }

  executeD1StatementsInBatches_(config, statements);

  logInfo_('Carga concluida em ' + ((new Date().getTime() - startedAt.getTime()) / 1000).toFixed(2) + 's');
  return summary;
}

function assertMigrationDependencies_() {
  if (typeof Utilities === 'undefined') {
    throw new Error('Utilities não está disponível no Apps Script.');
  }
  if (typeof UrlFetchApp === 'undefined') {
    throw new Error('UrlFetchApp não está disponível no Apps Script.');
  }
  if (typeof PropertiesService === 'undefined') {
    throw new Error('PropertiesService não está disponível no Apps Script.');
  }
  if (typeof BigQuery === 'undefined') {
    throw new Error(
      'BigQuery não está habilitado neste projeto Apps Script. ' +
      'Abra: Serviços > adicionar serviço > BigQuery API > ativar. ' +
      'Sem isso, o script não consegue ler as tabelas de origem.'
    );
  }
}

function prepareMigrationPayload_(config, source) {
  var platformsMap = {};
  var assetsMap = {};
  var positionsMap = {};
  var plannedOrdersMap = {};
  var contributionsMap = {};

  (source.acoes || []).forEach(function (row) {
    var platform = buildPlatformRecord_(row.plataforma);
    if (platform) platformsMap[platform.id] = platform;

    var asset = buildAssetRecord_('STOCK', row.ativo, row.ativo);
    assetsMap[asset.id] = asset;

    positionsMap[buildStableId_('position', [config.migrationPortfolioId, 'ACOES', asset.id, platform ? platform.id : ''])] = {
      id: buildStableId_('position', [config.migrationPortfolioId, 'ACOES', asset.id, platform ? platform.id : '']),
      portfolioId: config.migrationPortfolioId,
      assetId: asset.id,
      platformId: platform ? platform.id : null,
      sourceKind: 'ACOES',
      status: toTextOrNull_(row.status),
      situacao: toTextOrNull_(row.situacao),
      openedAt: toIsoDateOrNull_(row.data_entrada),
      quantity: toNumberOrNull_(row.quantidade),
      averagePrice: toNumberOrNull_(row.preco_medio),
      currentPrice: toNumberOrNull_(row.cotacao_atual),
      investedAmount: toNumberOrNull_(row.valor_investido),
      currentAmount: toNumberOrNull_(row.valor_atual),
      stopLoss: toNumberOrNull_(row.stop_loss),
      targetPrice: toNumberOrNull_(row.alvo),
      profitability: toNumberOrNull_(row.rentabilidade),
      strategy: null,
      categoryLabel: toTextOrNull_(row.tipo),
      notes: toTextOrNull_(row.observacao),
      sourceUpdatedAt: toIsoTimestampOrNull_(row.atualizado_em)
    };
  });

  (source.fundos || []).forEach(function (row) {
    var platform = buildPlatformRecord_(row.plataforma);
    if (platform) platformsMap[platform.id] = platform;

    var asset = buildAssetRecord_('FUND', null, row.fundo);
    assetsMap[asset.id] = asset;

    positionsMap[buildStableId_('position', [config.migrationPortfolioId, 'FUNDOS', asset.id, platform ? platform.id : ''])] = {
      id: buildStableId_('position', [config.migrationPortfolioId, 'FUNDOS', asset.id, platform ? platform.id : '']),
      portfolioId: config.migrationPortfolioId,
      assetId: asset.id,
      platformId: platform ? platform.id : null,
      sourceKind: 'FUNDOS',
      status: toTextOrNull_(row.status),
      situacao: toTextOrNull_(row.situacao),
      openedAt: toIsoDateOrNull_(row.data_inicio),
      quantity: null,
      averagePrice: null,
      currentPrice: null,
      investedAmount: toNumberOrNull_(row.valor_investido),
      currentAmount: toNumberOrNull_(row.valor_atual),
      stopLoss: null,
      targetPrice: null,
      profitability: toNumberOrNull_(row.rentabilidade),
      strategy: toTextOrNull_(row.estrategia),
      categoryLabel: toTextOrNull_(row.categoria),
      notes: toTextOrNull_(row.observacao),
      sourceUpdatedAt: toIsoTimestampOrNull_(row.atualizado_em)
    };
  });

  (source.previdencia || []).forEach(function (row) {
    var platform = buildPlatformRecord_(row.plataforma);
    if (platform) platformsMap[platform.id] = platform;

    var asset = buildAssetRecord_('PENSION', null, row.plano);
    assetsMap[asset.id] = asset;

    positionsMap[buildStableId_('position', [config.migrationPortfolioId, 'PREVIDENCIA', asset.id, platform ? platform.id : ''])] = {
      id: buildStableId_('position', [config.migrationPortfolioId, 'PREVIDENCIA', asset.id, platform ? platform.id : '']),
      portfolioId: config.migrationPortfolioId,
      assetId: asset.id,
      platformId: platform ? platform.id : null,
      sourceKind: 'PREVIDENCIA',
      status: toTextOrNull_(row.status),
      situacao: toTextOrNull_(row.situacao),
      openedAt: toIsoDateOrNull_(row.data_inicio),
      quantity: null,
      averagePrice: null,
      currentPrice: null,
      investedAmount: toNumberOrNull_(row.valor_investido),
      currentAmount: toNumberOrNull_(row.valor_atual),
      stopLoss: null,
      targetPrice: null,
      profitability: toNumberOrNull_(row.rentabilidade),
      strategy: toTextOrNull_(row.estrategia),
      categoryLabel: toTextOrNull_(row.tipo),
      notes: toTextOrNull_(row.observacao),
      sourceUpdatedAt: toIsoTimestampOrNull_(row.atualizado_em)
    };
  });

  (source.preOrdens || []).forEach(function (row) {
    var platform = buildPlatformRecord_(row.plataforma);
    if (platform) platformsMap[platform.id] = platform;

    var asset = isBlank_(row.ativo) ? null : buildAssetRecord_('STOCK', row.ativo, row.ativo);
    if (asset) assetsMap[asset.id] = asset;

    plannedOrdersMap[buildStableId_('planned_order', [config.migrationPortfolioId, toTextOrEmpty_(row.ativo), toTextOrEmpty_(row.plataforma), toTextOrEmpty_(row.tipo_ordem), toTextOrEmpty_(row.validade), toTextOrEmpty_(row.preco_alvo)])] = {
      id: buildStableId_('planned_order', [config.migrationPortfolioId, toTextOrEmpty_(row.ativo), toTextOrEmpty_(row.plataforma), toTextOrEmpty_(row.tipo_ordem), toTextOrEmpty_(row.validade), toTextOrEmpty_(row.preco_alvo)]),
      portfolioId: config.migrationPortfolioId,
      assetId: asset ? asset.id : null,
      platformId: platform ? platform.id : null,
      tipo: toTextOrNull_(row.tipo),
      rawAssetName: toTextOrNull_(row.ativo),
      tipoOrdem: toTextOrEmpty_(row.tipo_ordem),
      quantity: toNumberOrNull_(row.quantidade),
      targetPrice: toNumberOrNull_(row.preco_alvo),
      validityDate: toIsoDateOrNull_(row.validade),
      potentialValue: toNumberOrNull_(row.valor_potencial),
      currentPrice: toNumberOrNull_(row.cotacao_atual),
      status: toTextOrNull_(row.status),
      notes: toTextOrNull_(row.observacao)
    };
  });

  (source.aportes || []).forEach(function (row) {
    var platform = buildPlatformRecord_(row.plataforma);
    if (platform) platformsMap[platform.id] = platform;

    contributionsMap[buildStableId_('contribution', [config.migrationPortfolioId, toTextOrEmpty_(row.mes_ano), toTextOrEmpty_(row.destino), toTextOrEmpty_(row.plataforma), toTextOrEmpty_(row.valor)])] = {
      id: buildStableId_('contribution', [config.migrationPortfolioId, toTextOrEmpty_(row.mes_ano), toTextOrEmpty_(row.destino), toTextOrEmpty_(row.plataforma), toTextOrEmpty_(row.valor)]),
      portfolioId: config.migrationPortfolioId,
      platformId: platform ? platform.id : null,
      contributionMonth: toIsoDateOrNull_(row.mes_ano),
      destinationLabel: toTextOrNull_(row.destino),
      categoryLabel: toTextOrNull_(row.categoria),
      amount: toNumberOrNull_(row.valor),
      accumulatedAmount: toNumberOrNull_(row.acumulado),
      status: toTextOrNull_(row.status)
    };
  });

  return {
    platforms: mapValues_(platformsMap).sort(sortByName_),
    assets: mapValues_(assetsMap).sort(sortByDisplayName_),
    positions: mapValues_(positionsMap),
    plannedOrders: mapValues_(plannedOrdersMap),
    contributions: mapValues_(contributionsMap)
  };
}

function buildBootstrapStatements_(config) {
  return [
    buildInsertOrIgnoreStatement_('users', {
      id: config.migrationUserId,
      auth_provider_id: null,
      device_id: config.migrationUserDeviceId || null
    }),
    buildInsertOrIgnoreStatement_('portfolios', {
      id: config.migrationPortfolioId,
      user_id: config.migrationUserId,
      name: config.migrationPortfolioName,
      is_primary: 1
    }),
    buildInsertOrIgnoreStatement_('asset_types', {
      id: MIGRATION_DEFAULTS_.assetTypeIds.STOCK,
      code: 'STOCK',
      name: 'Acoes'
    }),
    buildInsertOrIgnoreStatement_('asset_types', {
      id: MIGRATION_DEFAULTS_.assetTypeIds.FUND,
      code: 'FUND',
      name: 'Fundos'
    }),
    buildInsertOrIgnoreStatement_('asset_types', {
      id: MIGRATION_DEFAULTS_.assetTypeIds.PENSION,
      code: 'PENSION',
      name: 'Previdencia'
    })
  ];
}

function buildPlatformStatements_(platforms) {
  return (platforms || []).map(function (item) {
    return buildInsertOrIgnoreStatement_('platforms', {
      id: item.id,
      name: item.name,
      normalized_name: item.normalizedName
    });
  });
}

function buildAssetStatements_(assets) {
  return (assets || []).map(function (item) {
    return buildInsertOrIgnoreStatement_('assets', {
      id: item.id,
      asset_type_id: item.assetTypeId,
      code: item.code,
      display_name: item.displayName,
      normalized_name: item.normalizedName,
      is_custom: item.isCustom ? 1 : 0
    });
  });
}

function buildPortfolioPositionStatements_(positions) {
  return (positions || []).map(function (item) {
    return buildInsertOrIgnoreStatement_('portfolio_positions', {
      id: item.id,
      portfolio_id: item.portfolioId,
      asset_id: item.assetId,
      platform_id: item.platformId,
      source_kind: item.sourceKind,
      status: item.status,
      situacao: item.situacao,
      opened_at: item.openedAt,
      quantity: item.quantity,
      average_price: item.averagePrice,
      current_price: item.currentPrice,
      invested_amount: item.investedAmount,
      current_amount: item.currentAmount,
      stop_loss: item.stopLoss,
      target_price: item.targetPrice,
      profitability: item.profitability,
      strategy: item.strategy,
      category_label: item.categoryLabel,
      notes: item.notes,
      source_updated_at: item.sourceUpdatedAt
    });
  });
}

function buildPlannedOrderStatements_(orders) {
  return (orders || []).map(function (item) {
    return buildInsertOrIgnoreStatement_('planned_orders', {
      id: item.id,
      portfolio_id: item.portfolioId,
      asset_id: item.assetId,
      platform_id: item.platformId,
      tipo: item.tipo,
      raw_asset_name: item.rawAssetName,
      tipo_ordem: item.tipoOrdem,
      quantity: item.quantity,
      target_price: item.targetPrice,
      validity_date: item.validityDate,
      potential_value: item.potentialValue,
      current_price: item.currentPrice,
      status: item.status,
      notes: item.notes
    });
  });
}

function buildContributionStatements_(contributions) {
  return (contributions || []).map(function (item) {
    return buildInsertOrIgnoreStatement_('portfolio_contributions', {
      id: item.id,
      portfolio_id: item.portfolioId,
      platform_id: item.platformId,
      contribution_month: item.contributionMonth,
      destination_label: item.destinationLabel,
      category_label: item.categoryLabel,
      amount: item.amount,
      accumulated_amount: item.accumulatedAmount,
      status: item.status
    });
  });
}

function executeD1StatementsInBatches_(config, statements) {
  var chunks = chunkArray_(statements, config.d1BatchSize);
  chunks.forEach(function (chunk, index) {
    var response = callD1BatchQuery_(config, chunk);
    var hasErrors = !response.success || (response.errors && response.errors.length);
    if (hasErrors) {
      throw new Error('Falha no lote ' + (index + 1) + ': ' + JSON.stringify(response));
    }
    logInfo_('Lote ' + (index + 1) + '/' + chunks.length + ' enviado com sucesso.');
  });
}

function callD1BatchQuery_(config, statements) {
  var url = config.d1ApiBaseUrl + '/accounts/' + encodeURIComponent(config.cloudflareAccountId) + '/d1/database/' + encodeURIComponent(config.cloudflareD1DatabaseId) + '/query';
  var payload = {
    batch: statements.map(function (sql) {
      return { sql: sql };
    })
  };

  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + config.cloudflareApiToken
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  var statusCode = response.getResponseCode();
  var bodyText = response.getContentText();
  var body;

  try {
    body = JSON.parse(bodyText);
  } catch (error) {
    throw new Error('Resposta invalida da API do D1. HTTP ' + statusCode + ': ' + bodyText);
  }

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error('Erro HTTP na API do D1. HTTP ' + statusCode + ': ' + bodyText);
  }

  return body;
}

function fetchBigQueryRows_(config, tableName, columns) {
  var query = 'SELECT ' + columns.join(', ') + ' FROM `' + config.bigQueryProjectId + '.' + config.bigQueryDatasetId + '.' + tableName + '`';
  var result = runBigQueryQuery_(config.bigQueryProjectId, query);
  return mapBigQueryResultToObjects_(result, columns);
}

function runBigQueryQuery_(projectId, queryText) {
  var request = { query: queryText, useLegacySql: false };
  var result = BigQuery.Jobs.query(request, projectId);
  if (!result) throw new Error('BigQuery nao retornou resposta.');

  var jobId = result.jobReference && result.jobReference.jobId ? result.jobReference.jobId : '';
  while (jobId && !result.jobComplete) {
    Utilities.sleep(300);
    result = BigQuery.Jobs.getQueryResults(projectId, jobId, { maxResults: 1000 });
  }

  if (result.errors && result.errors.length) {
    throw new Error(result.errors.map(function (item) { return item.message || String(item); }).join(' | '));
  }

  if (!jobId) return result;

  var allRows = (result.rows || []).slice();
  var pageToken = result.pageToken || '';
  while (pageToken) {
    var page = BigQuery.Jobs.getQueryResults(projectId, jobId, { pageToken: pageToken, maxResults: 1000 });
    if (page.rows && page.rows.length) Array.prototype.push.apply(allRows, page.rows);
    pageToken = page.pageToken || '';
  }

  result.rows = allRows;
  return result;
}

function mapBigQueryResultToObjects_(queryResult, fieldNames) {
  return ((queryResult || {}).rows || []).map(function (row) {
    var obj = {};
    fieldNames.forEach(function (fieldName, index) {
      obj[fieldName] = extractBigQueryValue_(row && row.f && row.f[index] ? row.f[index].v : null);
    });
    return obj;
  });
}

function extractBigQueryValue_(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'object' && value.v !== undefined) return extractBigQueryValue_(value.v);
  return value;
}

function buildPlatformRecord_(platformName) {
  var name = toTextOrNull_(platformName);
  if (!name) return null;
  return { id: buildStableId_('platform', [normalizeToken_(name)]), name: name, normalizedName: normalizeToken_(name) };
}

function buildAssetRecord_(assetTypeCode, code, displayName) {
  var cleanCode = toTextOrNull_(code);
  var cleanDisplayName = toTextOrEmpty_(displayName);
  var identity = cleanCode || cleanDisplayName;
  return {
    id: buildStableId_('asset', [assetTypeCode, identity]),
    assetTypeId: MIGRATION_DEFAULTS_.assetTypeIds[assetTypeCode],
    code: cleanCode,
    displayName: cleanDisplayName,
    normalizedName: normalizeToken_(identity),
    isCustom: !cleanCode
  };
}

function buildInsertOrIgnoreStatement_(tableName, payload) {
  var keys = Object.keys(payload);
  return 'INSERT OR IGNORE INTO ' + tableName + ' (' + keys.join(', ') + ') VALUES (' + keys.map(function (key) { return toSqlLiteral_(payload[key]); }).join(', ') + ');';
}

function toSqlLiteral_(value) {
  if (value === null || value === undefined || value === '') return 'NULL';
  if (typeof value === 'number') return isFinite(value) ? String(value) : 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  return '\'' + String(value).replace(/\\/g, '\\\\').replace(/'/g, "''") + '\'';
}

function buildStableId_(prefix, parts) {
  var base = prefix + '|' + (parts || []).map(function (item) { return String(item || '').trim(); }).join('|');
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, base);
  var hex = digest.map(function (b) {
    var value = (b < 0 ? b + 256 : b).toString(16);
    return value.length === 1 ? '0' + value : value;
  }).join('');
  return prefix + '_' + hex.slice(0, 24);
}

function normalizeToken_(value) {
  return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function toTextOrNull_(value) {
  if (isBlank_(value)) return null;
  return String(value).replace(/\s+/g, ' ').trim();
}

function toTextOrEmpty_(value) {
  return toTextOrNull_(value) || '';
}

function toNumberOrNull_(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return isNaN(value) ? null : value;

  var text = String(value).trim();

  if (/^-?\d+(\.\d+)?$/.test(text)) {
    var direct = Number(text);
    return isNaN(direct) ? null : direct;
  }

  var normalized = text
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  var numericValue = Number(normalized);
  return isNaN(numericValue) ? null : numericValue;
}

function toIsoDateOrNull_(value) {
  var parsed = parseDateValue_(value);
  if (!parsed) return null;
  return Utilities.formatDate(parsed, 'GMT', 'yyyy-MM-dd');
}

function toIsoTimestampOrNull_(value) {
  var parsed = parseDateValue_(value);
  if (!parsed) return null;
  return Utilities.formatDate(parsed, 'GMT', "yyyy-MM-dd'T'HH:mm:ss'Z'");
}

function parseDateValue_(value) {
  if (value === null || value === undefined || value === '') return null;
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) return value;
  var text = String(value).trim();
  if (!text || text === '-' || text === '—') return null;

  var match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));

  match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (match) {
    var year = Number(match[3]);
    if (year < 100) year += 2000;
    return new Date(Date.UTC(year, Number(match[2]) - 1, Number(match[1])));
  }

  match = text.match(/^([A-Za-zçÇ]{3})\/(\d{4})$/i);
  if (match) {
    var monthKey = normalizeMonthKey_(match[1]);
    var monthMap = { jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5, jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11 };
    if (monthMap[monthKey] === undefined) return null;
    return new Date(Date.UTC(Number(match[2]), monthMap[monthKey], 1));
  }

  var nativeDate = new Date(text);
  return isNaN(nativeDate.getTime()) ? null : nativeDate;
}

function normalizeMonthKey_(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').slice(0, 3);
}

function isBlank_(value) {
  return value === null || value === undefined || String(value).trim() === '';
}

function chunkArray_(items, size) {
  var output = [];
  for (var i = 0; i < items.length; i += size) output.push(items.slice(i, i + size));
  return output;
}

function mapValues_(obj) {
  return Object.keys(obj).map(function (key) { return obj[key]; });
}

function sortByName_(a, b) {
  return String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR');
}

function sortByDisplayName_(a, b) {
  return String(a.displayName || '').localeCompare(String(b.displayName || ''), 'pt-BR');
}

function logInfo_(message) {
  Logger.log('[BQ->D1] ' + message);
}

function maskValue_(value) {
  var text = String(value || '');
  if (text.length <= 8) return '***';
  return text.slice(0, 4) + '***' + text.slice(-4);
}

function getMigrationConfig_(forceDryRun) {
  return {
    bigQueryProjectId: getConfigValue_('BIGQUERY_PROJECT_ID', MIGRATION_DEFAULTS_.bigQueryProjectId),
    bigQueryDatasetId: getConfigValue_('BIGQUERY_DATASET_ID', MIGRATION_DEFAULTS_.bigQueryDatasetId),
    cloudflareAccountId: getConfigValue_('CLOUDFLARE_ACCOUNT_ID'),
    cloudflareD1DatabaseId: getConfigValue_('CLOUDFLARE_D1_DATABASE_ID'),
    cloudflareApiToken: getConfigValue_('CLOUDFLARE_API_TOKEN'),
    migrationUserId: getConfigValue_('MIGRATION_USER_ID', 'user_migracao_inicial'),
    migrationPortfolioId: getConfigValue_('MIGRATION_PORTFOLIO_ID', 'portfolio_principal_inicial'),
    migrationPortfolioName: getConfigValue_('MIGRATION_PORTFOLIO_NAME', 'Carteira Principal'),
    migrationUserDeviceId: getConfigValue_('MIGRATION_USER_DEVICE_ID', ''),
    d1ApiBaseUrl: getConfigValue_('D1_API_BASE_URL', MIGRATION_DEFAULTS_.d1ApiBaseUrl),
    d1BatchSize: Number(getConfigValue_('D1_BATCH_SIZE', String(MIGRATION_DEFAULTS_.d1BatchSize))),
    dryRun: forceDryRun === true ? true : String(getConfigValue_('MIGRATION_DRY_RUN', 'false')).toLowerCase() === 'true',
    sourceTables: MIGRATION_DEFAULTS_.sourceTables
  };
}

function getConfigValue_(key, fallback) {
  var props = PropertiesService.getScriptProperties();
  var fromProps = props.getProperty(key);
  if (fromProps !== null && fromProps !== '') return fromProps;
  if (Object.prototype.hasOwnProperty.call(HARD_CODED_MIGRATION_CONFIG_, key) && HARD_CODED_MIGRATION_CONFIG_[key] !== '') return HARD_CODED_MIGRATION_CONFIG_[key];
  if (fallback !== undefined) return fallback;
  throw new Error('Configuracao obrigatoria ausente: ' + key);
}
