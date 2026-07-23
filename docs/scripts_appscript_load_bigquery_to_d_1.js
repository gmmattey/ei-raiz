/**
 * Carga inicial BigQuery -> Cloudflare D1
 *
 * Objetivo:
 * - ler dados do BigQuery atual
 * - transformar para o schema D1 aprovado
 * - enviar lotes SQL para a REST API do D1
 * - inserir sem apagar, usando INSERT OR IGNORE
 *
 * Requisitos:
 * - BigQuery Advanced Service habilitado no Apps Script
 * - Script Properties configuradas
 * - schema do D1 já executado antes da carga
 */

const MIGRATION_DEFAULTS_ = {
  bigQueryProjectId: 'esquilo-invest',
  bigQueryDatasetId: 'esquilo_invest',
  d1ApiBaseUrl: 'https://api.cloudflare.com/client/v4',
  d1BatchSize: 50,
  dryRun: false,
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

function runInitialBigQueryToD1Load() {
  const config = getMigrationConfig_();
  const startedAt = new Date();

  logInfo_('Inicio da carga BigQuery -> D1');
  logInfo_(JSON.stringify({
    bigQueryProjectId: config.bigQueryProjectId,
    bigQueryDatasetId: config.bigQueryDatasetId,
    d1DatabaseId: maskValue_(config.cloudflareD1DatabaseId),
    dryRun: config.dryRun,
    batchSize: config.d1BatchSize
  }));

  const acoes = fetchBigQueryRows_(config, config.sourceTables.acoes, [
    'tipo', 'ativo', 'plataforma', 'status', 'situacao', 'data_entrada', 'quantidade',
    'preco_medio', 'cotacao_atual', 'valor_investido', 'valor_atual', 'stop_loss',
    'alvo', 'rentabilidade', 'observacao', 'atualizado_em'
  ]);

  const fundos = fetchBigQueryRows_(config, config.sourceTables.fundos, [
    'fundo', 'plataforma', 'categoria', 'estrategia', 'status', 'situacao', 'data_inicio',
    'valor_investido', 'valor_atual', 'rentabilidade', 'observacao', 'atualizado_em'
  ]);

  const previdencia = fetchBigQueryRows_(config, config.sourceTables.previdencia, [
    'plano', 'plataforma', 'tipo', 'estrategia', 'status', 'situacao', 'data_inicio',
    'valor_investido', 'valor_atual', 'rentabilidade', 'observacao', 'atualizado_em'
  ]);

  const preOrdens = fetchBigQueryRows_(config, config.sourceTables.preOrdens, [
    'tipo', 'ativo', 'plataforma', 'tipo_ordem', 'quantidade', 'preco_alvo', 'validade',
    'valor_potencial', 'cotacao_atual', 'status', 'observacao'
  ]);

  const aportes = fetchBigQueryRows_(config, config.sourceTables.aportes, [
    'mes_ano', 'destino', 'categoria', 'plataforma', 'valor', 'acumulado', 'status'
  ]);

  const prepared = prepareMigrationPayload_(config, {
    acoes: acoes,
    fundos: fundos,
    previdencia: previdencia,
    preOrdens: preOrdens,
    aportes: aportes
  });

  const statements = [];
  Array.prototype.push.apply(statements, buildBootstrapStatements_(config));
  Array.prototype.push.apply(statements, buildPlatformStatements_(prepared.platforms));
  Array.prototype.push.apply(statements, buildAssetStatements_(prepared.assets));
  Array.prototype.push.apply(statements, buildPortfolioPositionStatements_(prepared.positions));
  Array.prototype.push.apply(statements, buildPlannedOrderStatements_(prepared.plannedOrders));
  Array.prototype.push.apply(statements, buildContributionStatements_(prepared.contributions));

  const summary = {
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

  const finishedAt = new Date();
  logInfo_('Carga concluida em ' + ((finishedAt.getTime() - startedAt.getTime()) / 1000).toFixed(2) + 's');
  return summary;
}

function prepareMigrationPayload_(config, source) {
  const platformsMap = {};
  const assetsMap = {};
  const positionsMap = {};
  const plannedOrdersMap = {};
  const contributionsMap = {};

  (source.acoes || []).forEach(function (row) {
    const platform = buildPlatformRecord_(row.plataforma);
    if (platform) platformsMap[platform.id] = platform;

    const asset = buildAssetRecord_('STOCK', row.ativo, row.ativo);
    assetsMap[asset.id] = asset;

    const position = {
      id: buildStableId_('position', [config.migrationPortfolioId, 'ACOES', asset.id, platform ? platform.id : '', '']),
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

    positionsMap[position.id] = position;
  });

  (source.fundos || []).forEach(function (row) {
    const platform = buildPlatformRecord_(row.plataforma);
    if (platform) platformsMap[platform.id] = platform;

    const asset = buildAssetRecord_('FUND', null, row.fundo);
    assetsMap[asset.id] = asset;

    const position = {
      id: buildStableId_('position', [config.migrationPortfolioId, 'FUNDOS', asset.id, platform ? platform.id : '', '']),
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

    positionsMap[position.id] = position;
  });

  (source.previdencia || []).forEach(function (row) {
    const platform = buildPlatformRecord_(row.plataforma);
    if (platform) platformsMap[platform.id] = platform;

    const asset = buildAssetRecord_('PENSION', null, row.plano);
    assetsMap[asset.id] = asset;

    const position = {
      id: buildStableId_('position', [config.migrationPortfolioId, 'PREVIDENCIA', asset.id, platform ? platform.id : '', '']),
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

    positionsMap[position.id] = position;
  });

  (source.preOrdens || []).forEach(function (row) {
    const platform = buildPlatformRecord_(row.plataforma);
    if (platform) platformsMap[platform.id] = platform;

    const asset = isBlank_(row.ativo) ? null : buildAssetRecord_('STOCK', row.ativo, row.ativo);
    if (asset) assetsMap[asset.id] = asset;

    const order = {
      id: buildStableId_('planned_order', [
        config.migrationPortfolioId,
        toTextOrEmpty_(row.ativo),
        toTextOrEmpty_(row.plataforma),
        toTextOrEmpty_(row.tipo_ordem),
        toTextOrEmpty_(row.validade),
        toTextOrEmpty_(row.preco_alvo)
      ]),
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

    plannedOrdersMap[order.id] = order;
  });

  (source.aportes || []).forEach(function (row) {
    const platform = buildPlatformRecord_(row.plataforma);
    if (platform) platformsMap[platform.id] = platform;

    const contribution = {
      id: buildStableId_('contribution', [
        config.migrationPortfolioId,
        toTextOrEmpty_(row.mes_ano),
        toTextOrEmpty_(row.destino),
        toTextOrEmpty_(row.plataforma),
        toTextOrEmpty_(row.valor)
      ]),
      portfolioId: config.migrationPortfolioId,
      platformId: platform ? platform.id : null,
      contributionMonth: toIsoDateOrNull_(row.mes_ano),
      destinationLabel: toTextOrNull_(row.destino),
      categoryLabel: toTextOrNull_(row.categoria),
      amount: toNumberOrNull_(row.valor),
      accumulatedAmount: toNumberOrNull_(row.acumulado),
      status: toTextOrNull_(row.status)
    };

    contributionsMap[contribution.id] = contribution;
  });

  return {
    platforms: Object.keys(platformsMap).map(function (key) { return platformsMap[key]; }).sort(sortByName_),
    assets: Object.keys(assetsMap).map(function (key) { return assetsMap[key]; }).sort(sortByDisplayName_),
    positions: Object.keys(positionsMap).map(function (key) { return positionsMap[key]; }),
    plannedOrders: Object.keys(plannedOrdersMap).map(function (key) { return plannedOrdersMap[key]; }),
    contributions: Object.keys(contributionsMap).map(function (key) { return contributionsMap[key]; })
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
  const chunks = chunkArray_(statements, config.d1BatchSize);

  chunks.forEach(function (chunk, index) {
    const response = callD1BatchQuery_(config, chunk);
    const hasErrors = !response.success || (response.errors && response.errors.length);
    if (hasErrors) {
      throw new Error('Falha no lote ' + (index + 1) + ': ' + JSON.stringify(response));
    }
    logInfo_('Lote ' + (index + 1) + '/' + chunks.length + ' enviado com sucesso.');
  });
}

function callD1BatchQuery_(config, statements) {
  const url = config.d1ApiBaseUrl + '/accounts/' + encodeURIComponent(config.cloudflareAccountId) + '/d1/database/' + encodeURIComponent(config.cloudflareD1DatabaseId) + '/query';
  const payload = {
    batch: statements.map(function (sql) {
      return { sql: sql };
    })
  };

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + config.cloudflareApiToken
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const statusCode = response.getResponseCode();
  const bodyText = response.getContentText();
  let body;

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
  const query = 'SELECT ' + columns.join(', ') + ' FROM `' + config.bigQueryProjectId + '.' + config.bigQueryDatasetId + '.' + tableName + '`';
  const result = runBigQueryQuery_(config.bigQueryProjectId, query);
  return mapBigQueryResultToObjects_(result, columns);
}

function runBigQueryQuery_(projectId, queryText) {
  const request = {
    query: queryText,
    useLegacySql: false
  };

  let result = BigQuery.Jobs.query(request, projectId);
  if (!result) throw new Error('BigQuery nao retornou resposta.');

  const jobId = result.jobReference && result.jobReference.jobId ? result.jobReference.jobId : '';
  while (jobId && !result.jobComplete) {
    Utilities.sleep(300);
    result = BigQuery.Jobs.getQueryResults(projectId, jobId, { maxResults: 1000 });
  }

  if (result.errors && result.errors.length) {
    throw new Error(result.errors.map(function (item) { return item.message || String(item); }).join(' | '));
  }

  if (!jobId) return result;

  const allRows = (result.rows || []).slice();
  let pageToken = result.pageToken || '';
  while (pageToken) {
    const page = BigQuery.Jobs.getQueryResults(projectId, jobId, { pageToken: pageToken, maxResults: 1000 });
    if (page.rows && page.rows.length) {
      Array.prototype.push.apply(allRows, page.rows);
    }
    pageToken = page.pageToken || '';
  }

  result.rows = allRows;
  return result;
}

function mapBigQueryResultToObjects_(queryResult, fieldNames) {
  return ((queryResult || {}).rows || []).map(function (row) {
    const obj = {};
    fieldNames.forEach(function (fieldName, index) {
      obj[fieldName] = extractBigQueryValue_(row && row.f && row.f[index] ? row.f[index].v : null);
    });
    return obj;
  });
}

function extractBigQueryValue_(value) {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value === 'object' && value.v !== undefined) return extractBigQueryValue_(value.v);
  return value;
}

function buildPlatformRecord_(platformName) {
  const name = toTextOrNull_(platformName);
  if (!name) return null;
  const normalizedName = normalizeToken_(name);
  return {
    id: buildStableId_('platform', [normalizedName]),
    name: name,
    normalizedName: normalizedName
  };
}

function buildAssetRecord_(assetTypeCode, code, displayName) {
  const cleanCode = toTextOrNull_(code);
  const cleanDisplayName = toTextOrEmpty_(displayName);
  const identity = cleanCode || cleanDisplayName;
  const normalizedName = normalizeToken_(identity);
  return {
    id: buildStableId_('asset', [assetTypeCode, identity]),
    assetTypeId: MIGRATION_DEFAULTS_.assetTypeIds[assetTypeCode],
    code: cleanCode,
    displayName: cleanDisplayName,
    normalizedName: normalizedName,
    isCustom: !cleanCode
  };
}

function buildInsertOrIgnoreStatement_(tableName, payload) {
  const keys = Object.keys(payload);
  return 'INSERT OR IGNORE INTO ' + tableName + ' (' + keys.join(', ') + ') VALUES (' + keys.map(function (key) {
    return toSqlLiteral_(payload[key]);
  }).join(', ') + ');';
}

function toSqlLiteral_(value) {
  if (value === null || value === undefined || value === '') return 'NULL';
  if (typeof value === 'number') return isFinite(value) ? String(value) : 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  return '\'' + String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''") + '\'';
}

function buildStableId_(prefix, parts) {
  const base = prefix + '|' + (parts || []).map(function (item) {
    return String(item || '').trim();
  }).join('|');
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, base);
  const hex = digest.map(function (b) {
    const value = (b < 0 ? b + 256 : b).toString(16);
    return value.length === 1 ? '0' + value : value;
  }).join('');
  return prefix + '_' + hex.slice(0, 24);
}

function normalizeToken_(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
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
  const normalized = String(value)
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const numericValue = Number(normalized);
  return isNaN(numericValue) ? null : numericValue;
}

function toIsoDateOrNull_(value) {
  const parsed = parseDateValue_(value);
  if (!parsed) return null;
  return Utilities.formatDate(parsed, 'GMT', 'yyyy-MM-dd');
}

function toIsoTimestampOrNull_(value) {
  const parsed = parseDateValue_(value);
  if (!parsed) return null;
  return Utilities.formatDate(parsed, 'GMT', "yyyy-MM-dd'T'HH:mm:ss'Z'");
}

function parseDateValue_(value) {
  if (value === null || value === undefined || value === '') return null;
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) return value;

  const text = String(value).trim();
  if (!text || text === '-' || text === '—') return null;

  let match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    return new Date(Date.UTC(year, month, day));
  }

  match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (match) {
    let year = Number(match[3]);
    if (year < 100) year += 2000;
    return new Date(Date.UTC(year, Number(match[2]) - 1, Number(match[1])));
  }

  match = text.match(/^([A-Za-zçÇ]{3})\/(\d{4})$/i);
  if (match) {
    const monthKey = normalizeMonthKey_(match[1]);
    const monthMap = { jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5, jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11 };
    if (monthMap[monthKey] === undefined) return null;
    return new Date(Date.UTC(Number(match[2]), monthMap[monthKey], 1));
  }

  const nativeDate = new Date(text);
  return isNaN(nativeDate.getTime()) ? null : nativeDate;
}

function normalizeMonthKey_(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .slice(0, 3);
}

function isBlank_(value) {
  return value === null || value === undefined || String(value).trim() === '';
}

function chunkArray_(items, size) {
  const output = [];
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }
  return output;
}

function sortByName_(a, b) {
  return String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR');
}

function sortByDisplayName_(a, b) {
  return String(a.displayName || '').localeCompare(String(b.displayName || ''), 'pt-BR');
}

function logInfo_(message) {
  console.log('[BQ->D1] ' + message);
}

function maskValue_(value) {
  const text = String(value || '');
  if (text.length <= 8) return '***';
  return text.slice(0, 4) + '***' + text.slice(-4);
}

function getMigrationConfig_() {
  const props = PropertiesService.getScriptProperties();

  const config = {
    bigQueryProjectId: props.getProperty('BIGQUERY_PROJECT_ID') || MIGRATION_DEFAULTS_.bigQueryProjectId,
    bigQueryDatasetId: props.getProperty('BIGQUERY_DATASET_ID') || MIGRATION_DEFAULTS_.bigQueryDatasetId,
    cloudflareAccountId: requireProperty_(props, 'CLOUDFLARE_ACCOUNT_ID'),
    cloudflareD1DatabaseId: requireProperty_(props, 'CLOUDFLARE_D1_DATABASE_ID'),
    cloudflareApiToken: requireProperty_(props, 'CLOUDFLARE_API_TOKEN'),
    migrationUserId: requireProperty_(props, 'MIGRATION_USER_ID'),
    migrationPortfolioId: requireProperty_(props, 'MIGRATION_PORTFOLIO_ID'),
    migrationPortfolioName: props.getProperty('MIGRATION_PORTFOLIO_NAME') || 'Carteira Principal',
    migrationUserDeviceId: props.getProperty('MIGRATION_USER_DEVICE_ID') || '',
    d1ApiBaseUrl: props.getProperty('D1_API_BASE_URL') || MIGRATION_DEFAULTS_.d1ApiBaseUrl,
    d1BatchSize: Number(props.getProperty('D1_BATCH_SIZE') || MIGRATION_DEFAULTS_.d1BatchSize),
    dryRun: String(props.getProperty('MIGRATION_DRY_RUN') || String(MIGRATION_DEFAULTS_.dryRun)).toLowerCase() === 'true',
    sourceTables: MIGRATION_DEFAULTS_.sourceTables
  };

  if (!config.d1BatchSize || config.d1BatchSize < 1) {
    throw new Error('D1_BATCH_SIZE invalido.');
  }

  return config;
}

function requireProperty_(props, key) {
  const value = props.getProperty(key);
  if (!value) throw new Error('Script Property obrigatoria ausente: ' + key);
  return value;
}
