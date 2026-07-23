/**
 * D1 OPERATIONAL CRUD SERVICE
 *
 * Substitui as operações de escrita do legado BigQuery por escrita direta no D1,
 * preservando a semântica operacional do Apps Script atual.
 *
 * Requisitos:
 * - Script Properties:
 *   - CLOUDFLARE_ACCOUNT_ID
 *   - CLOUDFLARE_D1_DATABASE_ID
 *   - CLOUDFLARE_API_TOKEN
 *   - MIGRATION_PORTFOLIO_ID
 */

var D1_CRUD_BASE_URL_ = 'https://api.cloudflare.com/client/v4';

function d1UpdateOperationalStatus_(tipo, codigo, novoStatus) {
  var target = d1ResolveOperationalTarget_(tipo, codigo);
  var status = String(novoStatus || '').trim();
  if (!status) throw new Error('Novo status obrigatorio.');

  d1ExecuteWrite_(buildD1UpdateStatement_(target.tableName, target.id, { status: status }));
  return {
    ok: true,
    operation: 'update',
    table: target.tableName,
    keyField: 'id',
    keyValue: target.id,
    affectedRows: 1
  };
}

function d1DeleteOperationalRecord_(tipo, codigo) {
  var target = d1ResolveOperationalTarget_(tipo, codigo);
  var sql = 'DELETE FROM ' + target.tableName + ' WHERE id = ' + d1ToSqlLiteral_(target.id) + ';';
  d1ExecuteWrite_(sql);
  return {
    ok: true,
    operation: 'delete',
    table: target.tableName,
    keyField: 'id',
    keyValue: target.id,
    affectedRows: 1
  };
}

function d1InsertOperationalRecord_(tipo, dados) {
  var normalizedType = d1NormalizeOperationalCrudType_(tipo);
  var payload = d1BuildInsertPayload_(normalizedType, dados || {});
  var sql = buildD1InsertStatement_(payload.tableName, payload.data);
  d1ExecuteWrite_(sql);
  return {
    ok: true,
    operation: 'insert',
    table: payload.tableName,
    keyField: 'id',
    keyValue: payload.data.id,
    affectedRows: 1
  };
}

function d1UpdateOperationalRecord_(tipo, codigo, dados) {
  var target = d1ResolveOperationalTarget_(tipo, codigo);
  var normalizedType = d1NormalizeOperationalCrudType_(tipo);
  var payload = d1BuildUpdatePayload_(normalizedType, dados || {});
  var sql = buildD1UpdateStatement_(target.tableName, target.id, payload);
  d1ExecuteWrite_(sql);
  return {
    ok: true,
    operation: 'update',
    table: target.tableName,
    keyField: 'id',
    keyValue: target.id,
    affectedRows: 1
  };
}

function d1ResolveOperationalTarget_(tipo, codigo) {
  var normalizedType = d1NormalizeOperationalCrudType_(tipo);
  var key = String(codigo || '').trim();
  if (!key) throw new Error('Codigo ou chave do registro obrigatorio.');

  if (normalizedType === 'acoes' || normalizedType === 'fundos' || normalizedType === 'previdencia') {
    return d1ResolvePortfolioPositionTarget_(normalizedType, key);
  }

  if (normalizedType === 'preordens') {
    return d1ResolvePlannedOrderTarget_(key);
  }

  if (normalizedType === 'aportes') {
    return d1ResolveContributionTarget_(key);
  }

  throw new Error('Tipo operacional nao suportado para D1 CRUD.');
}

function d1ResolvePortfolioPositionTarget_(normalizedType, key) {
  var sourceKindMap = {
    acoes: 'ACOES',
    fundos: 'FUNDOS',
    previdencia: 'PREVIDENCIA'
  };

  var sql = [
    'SELECT pp.id AS id',
    'FROM portfolio_positions pp',
    'JOIN assets a ON a.id = pp.asset_id',
    'WHERE pp.portfolio_id = ' + d1ToSqlLiteral_(getMigrationPortfolioIdForCrud_()),
    'AND pp.source_kind = ' + d1ToSqlLiteral_(sourceKindMap[normalizedType]),
    'AND (a.code = ' + d1ToSqlLiteral_(key),
    'OR a.display_name = ' + d1ToSqlLiteral_(key) + ')',
    'LIMIT 1'
  ].join(' ');

  var rows = d1SelectRows_(sql);
  if (!rows.length || !rows[0].id) {
    throw new Error('Registro nao encontrado no D1 para tipo ' + normalizedType + ' e chave ' + key + '.');
  }

  return {
    tableName: 'portfolio_positions',
    id: rows[0].id
  };
}

function d1ResolvePlannedOrderTarget_(key) {
  var sql = [
    'SELECT po.id AS id',
    'FROM planned_orders po',
    'LEFT JOIN assets a ON a.id = po.asset_id',
    'WHERE po.portfolio_id = ' + d1ToSqlLiteral_(getMigrationPortfolioIdForCrud_()),
    'AND (po.raw_asset_name = ' + d1ToSqlLiteral_(key),
    'OR a.code = ' + d1ToSqlLiteral_(key),
    'OR a.display_name = ' + d1ToSqlLiteral_(key) + ')',
    'LIMIT 1'
  ].join(' ');

  var rows = d1SelectRows_(sql);
  if (!rows.length || !rows[0].id) {
    throw new Error('Pre-ordem nao encontrada no D1 para chave ' + key + '.');
  }

  return {
    tableName: 'planned_orders',
    id: rows[0].id
  };
}

function d1ResolveContributionTarget_(key) {
  var sql = [
    'SELECT id',
    'FROM portfolio_contributions',
    'WHERE portfolio_id = ' + d1ToSqlLiteral_(getMigrationPortfolioIdForCrud_()),
    'AND contribution_month = ' + d1ToSqlLiteral_(key),
    'LIMIT 1'
  ].join(' ');

  var rows = d1SelectRows_(sql);
  if (!rows.length || !rows[0].id) {
    throw new Error('Aporte nao encontrado no D1 para chave ' + key + '.');
  }

  return {
    tableName: 'portfolio_contributions',
    id: rows[0].id
  };
}

function d1BuildInsertPayload_(normalizedType, dados) {
  if (normalizedType === 'acoes' || normalizedType === 'fundos' || normalizedType === 'previdencia') {
    return d1BuildPortfolioPositionInsertPayload_(normalizedType, dados);
  }
  if (normalizedType === 'preordens') {
    return d1BuildPlannedOrderInsertPayload_(dados);
  }
  if (normalizedType === 'aportes') {
    return d1BuildContributionInsertPayload_(dados);
  }
  throw new Error('Tipo operacional nao suportado para insercao no D1.');
}

function d1BuildUpdatePayload_(normalizedType, dados) {
  if (normalizedType === 'acoes' || normalizedType === 'fundos' || normalizedType === 'previdencia') {
    return d1MapPortfolioPositionFields_(normalizedType, dados);
  }
  if (normalizedType === 'preordens') {
    return d1MapPlannedOrderFields_(dados);
  }
  if (normalizedType === 'aportes') {
    return d1MapContributionFields_(dados);
  }
  throw new Error('Tipo operacional nao suportado para atualizacao no D1.');
}

function d1BuildPortfolioPositionInsertPayload_(normalizedType, dados) {
  var sourceKindMap = {
    acoes: 'ACOES',
    fundos: 'FUNDOS',
    previdencia: 'PREVIDENCIA'
  };
  var assetTypeCodeMap = {
    acoes: 'STOCK',
    fundos: 'FUND',
    previdencia: 'PENSION'
  };

  var rawName = d1ResolveLegacyNameField_(normalizedType, dados);
  if (!rawName) throw new Error('Nome principal obrigatorio para inserir registro no D1.');

  var platformName = d1FirstNonBlank_(dados.plataforma, dados.platform);
  var platform = platformName ? d1EnsurePlatformRecord_(platformName) : null;
  var asset = d1EnsureAssetRecord_(assetTypeCodeMap[normalizedType], dados.ativo || null, rawName);

  var mapped = d1MapPortfolioPositionFields_(normalizedType, dados);
  mapped.id = buildStableId_('position', [getMigrationPortfolioIdForCrud_(), sourceKindMap[normalizedType], asset.id, platform ? platform.id : '', rawName]);
  mapped.portfolio_id = getMigrationPortfolioIdForCrud_();
  mapped.asset_id = asset.id;
  mapped.platform_id = platform ? platform.id : null;
  mapped.source_kind = sourceKindMap[normalizedType];

  return {
    tableName: 'portfolio_positions',
    data: mapped
  };
}

function d1BuildPlannedOrderInsertPayload_(dados) {
  var rawName = d1FirstNonBlank_(dados.ativo, dados.raw_asset_name);
  if (!rawName) throw new Error('Ativo obrigatorio para inserir pre-ordem no D1.');

  var platformName = d1FirstNonBlank_(dados.plataforma, dados.platform);
  var platform = platformName ? d1EnsurePlatformRecord_(platformName) : null;
  var asset = d1EnsureAssetRecord_('STOCK', dados.ativo || null, rawName);

  var mapped = d1MapPlannedOrderFields_(dados);
  mapped.id = buildStableId_('planned_order', [getMigrationPortfolioIdForCrud_(), rawName, platform ? platform.id : '', d1FirstNonBlank_(dados.tipo_ordem, ''), d1FirstNonBlank_(dados.validade, ''), d1FirstNonBlank_(dados.preco_alvo, '')]);
  mapped.portfolio_id = getMigrationPortfolioIdForCrud_();
  mapped.asset_id = asset ? asset.id : null;
  mapped.platform_id = platform ? platform.id : null;
  mapped.raw_asset_name = rawName;

  return {
    tableName: 'planned_orders',
    data: mapped
  };
}

function d1BuildContributionInsertPayload_(dados) {
  var month = d1NormalizeDateLike_(dados.mes_ano || dados.contribution_month);
  if (!month) throw new Error('mes_ano obrigatorio para inserir aporte no D1.');

  var platformName = d1FirstNonBlank_(dados.plataforma, dados.platform);
  var platform = platformName ? d1EnsurePlatformRecord_(platformName) : null;

  var mapped = d1MapContributionFields_(dados);
  mapped.id = buildStableId_('contribution', [getMigrationPortfolioIdForCrud_(), month, d1FirstNonBlank_(dados.destino, ''), platform ? platform.id : '', d1FirstNonBlank_(dados.valor, '')]);
  mapped.portfolio_id = getMigrationPortfolioIdForCrud_();
  mapped.platform_id = platform ? platform.id : null;
  mapped.contribution_month = month;

  return {
    tableName: 'portfolio_contributions',
    data: mapped
  };
}

function d1MapPortfolioPositionFields_(normalizedType, dados) {
  var payload = {};

  d1AssignIfPresent_(payload, 'status', dados.status);
  d1AssignIfPresent_(payload, 'situacao', dados.situacao);
  d1AssignDateIfPresent_(payload, 'opened_at', d1FirstNonBlank_(dados.data_entrada, dados.data_inicio, dados.opened_at));
  d1AssignNumberIfPresent_(payload, 'quantity', d1FirstNonBlank_(dados.quantidade, dados.qtd, dados.quantity));
  d1AssignNumberIfPresent_(payload, 'average_price', d1FirstNonBlank_(dados.preco_medio, dados.average_price));
  d1AssignNumberIfPresent_(payload, 'current_price', d1FirstNonBlank_(dados.cotacao_atual, dados.current_price));
  d1AssignNumberIfPresent_(payload, 'invested_amount', d1FirstNonBlank_(dados.valor_investido, dados.invested_amount));
  d1AssignNumberIfPresent_(payload, 'current_amount', d1FirstNonBlank_(dados.valor_atual, dados.current_amount));
  d1AssignNumberIfPresent_(payload, 'stop_loss', d1FirstNonBlank_(dados.stop_loss, dados.stop, dados.stopLoss));
  d1AssignNumberIfPresent_(payload, 'target_price', d1FirstNonBlank_(dados.alvo, dados.target_price));
  d1AssignNumberIfPresent_(payload, 'profitability', d1FirstNonBlank_(dados.rentabilidade, dados.profitability));
  d1AssignIfPresent_(payload, 'notes', d1FirstNonBlank_(dados.observacao, dados.notes));
  d1AssignTimestampIfPresent_(payload, 'source_updated_at', d1FirstNonBlank_(dados.atualizado_em, dados.source_updated_at));

  if (normalizedType === 'acoes') {
    d1AssignIfPresent_(payload, 'category_label', d1FirstNonBlank_(dados.tipo, dados.category_label));
  }
  if (normalizedType === 'fundos') {
    d1AssignIfPresent_(payload, 'category_label', d1FirstNonBlank_(dados.categoria, dados.category_label));
    d1AssignIfPresent_(payload, 'strategy', d1FirstNonBlank_(dados.estrategia, dados.strategy));
  }
  if (normalizedType === 'previdencia') {
    d1AssignIfPresent_(payload, 'category_label', d1FirstNonBlank_(dados.tipo, dados.category_label));
    d1AssignIfPresent_(payload, 'strategy', d1FirstNonBlank_(dados.estrategia, dados.strategy));
  }

  return payload;
}

function d1MapPlannedOrderFields_(dados) {
  var payload = {};
  d1AssignIfPresent_(payload, 'tipo', dados.tipo);
  d1AssignIfPresent_(payload, 'tipo_ordem', dados.tipo_ordem);
  d1AssignNumberIfPresent_(payload, 'quantity', d1FirstNonBlank_(dados.quantidade, dados.qtd, dados.quantity));
  d1AssignNumberIfPresent_(payload, 'target_price', d1FirstNonBlank_(dados.preco_alvo, dados.target_price));
  d1AssignDateIfPresent_(payload, 'validity_date', d1FirstNonBlank_(dados.validade, dados.validity_date));
  d1AssignNumberIfPresent_(payload, 'potential_value', d1FirstNonBlank_(dados.valor_potencial, dados.potential_value));
  d1AssignNumberIfPresent_(payload, 'current_price', d1FirstNonBlank_(dados.cotacao_atual, dados.current_price));
  d1AssignIfPresent_(payload, 'status', dados.status);
  d1AssignIfPresent_(payload, 'notes', d1FirstNonBlank_(dados.observacao, dados.notes));
  return payload;
}

function d1MapContributionFields_(dados) {
  var payload = {};
  d1AssignDateIfPresent_(payload, 'contribution_month', d1FirstNonBlank_(dados.mes_ano, dados.contribution_month));
  d1AssignIfPresent_(payload, 'destination_label', d1FirstNonBlank_(dados.destino, dados.destination_label));
  d1AssignIfPresent_(payload, 'category_label', d1FirstNonBlank_(dados.categoria, dados.category_label));
  d1AssignNumberIfPresent_(payload, 'amount', d1FirstNonBlank_(dados.valor, dados.amount));
  d1AssignNumberIfPresent_(payload, 'accumulated_amount', d1FirstNonBlank_(dados.acumulado, dados.accumulated_amount));
  d1AssignIfPresent_(payload, 'status', dados.status);
  return payload;
}

function d1EnsurePlatformRecord_(platformName) {
  var cleanName = String(platformName || '').trim();
  var normalizedName = normalizeToken_(cleanName);
  var id = buildStableId_('platform', [normalizedName]);

  d1ExecuteWrite_(buildD1InsertOrIgnoreStatement_('platforms', {
    id: id,
    name: cleanName,
    normalized_name: normalizedName
  }));

  return {
    id: id,
    name: cleanName,
    normalizedName: normalizedName
  };
}

function d1EnsureAssetRecord_(assetTypeCode, code, displayName) {
  var cleanCode = d1BlankToNull_(code);
  var cleanDisplayName = d1FirstNonBlank_(displayName, code);
  var identity = d1FirstNonBlank_(cleanCode, cleanDisplayName);
  var normalizedName = normalizeToken_(identity);
  var assetTypeIdMap = {
    STOCK: 'asset_type_stock',
    FUND: 'asset_type_fund',
    PENSION: 'asset_type_pension'
  };
  var id = buildStableId_('asset', [assetTypeCode, identity]);

  d1ExecuteWrite_(buildD1InsertOrIgnoreStatement_('assets', {
    id: id,
    asset_type_id: assetTypeIdMap[assetTypeCode],
    code: cleanCode,
    display_name: cleanDisplayName,
    normalized_name: normalizedName,
    is_custom: cleanCode ? 0 : 1
  }));

  return {
    id: id,
    code: cleanCode,
    displayName: cleanDisplayName
  };
}

function buildD1InsertStatement_(tableName, payload) {
  var keys = Object.keys(payload);
  return 'INSERT INTO ' + tableName + ' (' + keys.join(', ') + ') VALUES (' + keys.map(function (key) {
    return d1ToSqlLiteral_(payload[key]);
  }).join(', ') + ');';
}

function buildD1InsertOrIgnoreStatement_(tableName, payload) {
  var keys = Object.keys(payload);
  return 'INSERT OR IGNORE INTO ' + tableName + ' (' + keys.join(', ') + ') VALUES (' + keys.map(function (key) {
    return d1ToSqlLiteral_(payload[key]);
  }).join(', ') + ');';
}

function buildD1UpdateStatement_(tableName, id, payload) {
  var keys = Object.keys(payload || {}).filter(function (key) {
    return payload[key] !== undefined;
  });
  if (!keys.length) throw new Error('Nenhum campo valido recebido para atualizacao no D1.');
  return 'UPDATE ' + tableName + ' SET ' + keys.map(function (key) {
    return key + ' = ' + d1ToSqlLiteral_(payload[key]);
  }).join(', ') + ' WHERE id = ' + d1ToSqlLiteral_(id) + ';';
}

function d1SelectRows_(sql) {
  var body = d1CallQueryApi_(sql);
  if (!body || !body.success) {
    throw new Error('D1 nao retornou sucesso para a consulta.');
  }
  var resultList = body.result || [];
  if (!resultList.length) return [];
  return resultList[0].results || [];
}

function d1ExecuteWrite_(sql) {
  var body = d1CallQueryApi_(sql);
  if (!body || !body.success) {
    throw new Error('D1 nao retornou sucesso para a escrita.');
  }
  return body;
}

function d1CallQueryApi_(sql) {
  var url = D1_CRUD_BASE_URL_
    + '/accounts/' + encodeURIComponent(getD1AccountId_())
    + '/d1/database/' + encodeURIComponent(getD1DatabaseId_())
    + '/query';

  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + getD1ApiToken_()
    },
    payload: JSON.stringify({ sql: sql }),
    muteHttpExceptions: true
  });

  var statusCode = response.getResponseCode();
  var text = response.getContentText();
  var body;

  try {
    body = JSON.parse(text);
  } catch (error) {
    throw new Error('Resposta invalida da API D1. HTTP ' + statusCode + ': ' + text);
  }

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error('Erro HTTP na API D1. HTTP ' + statusCode + ': ' + text);
  }

  if (body && body.errors && body.errors.length) {
    throw new Error(body.errors.map(function (item) {
      return item.message || String(item);
    }).join(' | '));
  }

  return body;
}

function getMigrationPortfolioIdForCrud_() {
  var value = PropertiesService.getScriptProperties().getProperty('MIGRATION_PORTFOLIO_ID') || '';
  if (!value) throw new Error('Script Property obrigatoria ausente: MIGRATION_PORTFOLIO_ID');
  return value;
}

function d1NormalizeOperationalCrudType_(tipo) {
  var normalized = String(tipo || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');

  var supported = {
    acoes: 'acoes',
    acao: 'acoes',
    fundos: 'fundos',
    fundo: 'fundos',
    previdencia: 'previdencia',
    previdencias: 'previdencia',
    preordens: 'preordens',
    preordem: 'preordens',
    aportes: 'aportes',
    aporte: 'aportes'
  };

  if (!supported[normalized]) throw new Error('Tipo operacional nao suportado para D1 CRUD.');
  return supported[normalized];
}

function d1ResolveLegacyNameField_(normalizedType, dados) {
  if (normalizedType === 'acoes') return d1FirstNonBlank_(dados.ativo, dados.display_name);
  if (normalizedType === 'fundos') return d1FirstNonBlank_(dados.fundo, dados.display_name);
  if (normalizedType === 'previdencia') return d1FirstNonBlank_(dados.plano, dados.plano_fundo, dados.display_name);
  return '';
}

function d1AssignIfPresent_(payload, key, value) {
  if (value === undefined) return;
  payload[key] = d1BlankToNull_(value);
}

function d1AssignNumberIfPresent_(payload, key, value) {
  if (value === undefined) return;
  payload[key] = d1ToNumberOrNull_(value);
}

function d1AssignDateIfPresent_(payload, key, value) {
  if (value === undefined) return;
  payload[key] = d1NormalizeDateLike_(value);
}

function d1AssignTimestampIfPresent_(payload, key, value) {
  if (value === undefined) return;
  payload[key] = d1NormalizeTimestampLike_(value);
}

function d1NormalizeDateLike_(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  if (typeof toIsoDateOrNull_ === 'function') return toIsoDateOrNull_(value);
  return String(value).trim();
}

function d1NormalizeTimestampLike_(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  if (typeof toIsoTimestampOrNull_ === 'function') return toIsoTimestampOrNull_(value);
  return String(value).trim();
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
}

function d1BlankToNull_(value) {
  if (value === null || value === undefined) return null;
  var text = String(value).trim();
  return text ? text : null;
}

function d1FirstNonBlank_() {
  for (var index = 0; index < arguments.length; index++) {
    var value = arguments[index];
    if (value !== null && value !== undefined && String(value).trim() !== '') return value;
  }
  return '';
}

function d1ToSqlLiteral_(value) {
  if (value === null || value === undefined || value === '') return 'NULL';
  if (typeof value === 'number') return isFinite(value) ? String(value) : 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  return '\'' + String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''") + '\'';
}
