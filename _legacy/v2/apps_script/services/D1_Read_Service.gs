/**
 * D1 READ SERVICE
 * Fonte principal de leitura do dashboard usando Cloudflare D1.
 * Usa as views de compatibilidade para preservar o contrato legado do Apps Script.
 *
 * Requisitos:
 * - Script Properties:
 *   - CLOUDFLARE_ACCOUNT_ID
 *   - CLOUDFLARE_D1_DATABASE_ID
 *   - CLOUDFLARE_API_TOKEN
 */

var D1_SERVICE_BASE_URL_ = 'https://api.cloudflare.com/client/v4';

var D1_SERVICE_SOURCES_ = {
  actions: {
    viewName: 'vw_legacy_acoes',
    orderBy: 'ativo',
    header: [
      'tipo', 'ativo', 'plataforma', 'status', 'situacao', 'data_entrada',
      'quantidade', 'preco_medio', 'cotacao_atual', 'valor_investido',
      'valor_atual', 'stop_loss', 'alvo', 'rentabilidade', 'observacao',
      'atualizado_em', 'entrada', 'qtd', 'stop'
    ]
  },
  funds: {
    viewName: 'vw_legacy_fundos',
    orderBy: 'fundo',
    header: [
      'fundo', 'plataforma', 'categoria', 'estrategia', 'status', 'situacao',
      'data_inicio', 'valor_investido', 'valor_atual', 'rentabilidade',
      'observacao', 'atualizado_em', 'inicio'
    ]
  },
  previdencia: {
    viewName: 'vw_legacy_previdencia',
    orderBy: 'plano',
    header: [
      'plano', 'plataforma', 'tipo', 'estrategia', 'status', 'situacao',
      'data_inicio', 'valor_investido', 'valor_atual', 'rentabilidade',
      'observacao', 'atualizado_em', 'plano_fundo', 'inicio', 'total_aportado'
    ]
  },
  preOrders: {
    viewName: 'vw_legacy_pre_ordens',
    orderBy: 'ativo',
    header: [
      'tipo', 'ativo', 'plataforma', 'tipo_ordem', 'quantidade', 'preco_alvo',
      'validade', 'valor_potencial', 'cotacao_atual', 'status', 'observacao', 'qtd'
    ]
  },
  aportes: {
    viewName: 'vw_legacy_aportes',
    orderBy: 'mes_ano',
    header: [
      'mes_ano', 'destino', 'categoria', 'plataforma', 'valor', 'acumulado', 'status'
    ]
  },
  config: {
    viewName: '',
    orderBy: '',
    header: []
  }
};

function getD1StructuredPortfolioData_() {
  assertD1ReadConfig_();

  var actions = getD1ViewRows_('actions');
  var funds = getD1ViewRows_('funds');
  var previdencia = getD1ViewRows_('previdencia');
  var preOrders = getD1ViewRows_('preOrders');
  var aportes = getD1ViewRows_('aportes');

  return {
    actions: buildD1StructuredCollection_('actions', actions),
    funds: buildD1StructuredCollection_('funds', funds),
    previdencia: buildD1StructuredCollection_('previdencia', previdencia),
    preOrders: buildD1StructuredCollection_('preOrders', preOrders),
    aportes: buildD1StructuredCollection_('aportes', aportes),
    config: buildD1StructuredCollection_('config', [])
  };
}

function getD1ViewRows_(sourceKey) {
  var source = D1_SERVICE_SOURCES_[sourceKey];
  if (!source || !source.viewName) return [];

  var sql = [
    'SELECT *',
    'FROM ' + source.viewName,
    source.orderBy ? ('ORDER BY ' + source.orderBy) : ''
  ].filter(Boolean).join(' ');

  return runD1SelectQuery_(sql);
}

function buildD1StructuredCollection_(sourceKey, rows) {
  var source = D1_SERVICE_SOURCES_[sourceKey] || { header: [] };
  var header = (source.header || []).slice();

  return {
    header: header,
    rows: (rows || []).map(function (row, index) {
      var record = buildD1CompatibleRecord_(header, row);
      return {
        rowNumber: index + 2,
        values: header.map(function (fieldName) {
          return Object.prototype.hasOwnProperty.call(record, fieldName) ? record[fieldName] : '';
        }),
        record: record
      };
    })
  };
}

function buildD1CompatibleRecord_(header, row) {
  var record = {};
  (header || []).forEach(function (fieldName) {
    var value = row && Object.prototype.hasOwnProperty.call(row, fieldName) ? row[fieldName] : '';
    record[fieldName] = value;
    record[normalizeSheetKey_(fieldName)] = value;
  });
  return record;
}

function runD1SelectQuery_(sql) {
  var body = callD1QueryApi_(sql);

  if (!body || !body.success) {
    throw new Error('D1 nao retornou sucesso para a consulta.');
  }

  var resultList = body.result || [];
  if (!resultList.length) return [];

  var first = resultList[0] || {};
  var rows = first.results || [];
  return Array.isArray(rows) ? rows : [];
}

function callD1QueryApi_(sql) {
  var url = getD1QueryApiUrl_();
  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + getD1ApiToken_()
    },
    payload: JSON.stringify({
      sql: sql
    }),
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

function getD1QueryApiUrl_() {
  return D1_SERVICE_BASE_URL_
    + '/accounts/' + encodeURIComponent(getD1AccountId_())
    + '/d1/database/' + encodeURIComponent(getD1DatabaseId_())
    + '/query';
}

function assertD1ReadConfig_() {
  if (!getD1AccountId_()) throw new Error('Script Property obrigatoria ausente: CLOUDFLARE_ACCOUNT_ID');
  if (!getD1DatabaseId_()) throw new Error('Script Property obrigatoria ausente: CLOUDFLARE_D1_DATABASE_ID');
  if (!getD1ApiToken_()) throw new Error('Script Property obrigatoria ausente: CLOUDFLARE_API_TOKEN');
}

function getD1AccountId_() {
  return PropertiesService.getScriptProperties().getProperty('CLOUDFLARE_ACCOUNT_ID') || '';
}

function getD1DatabaseId_() {
  return PropertiesService.getScriptProperties().getProperty('CLOUDFLARE_D1_DATABASE_ID') || '';
}

function getD1ApiToken_() {
  return PropertiesService.getScriptProperties().getProperty('CLOUDFLARE_API_TOKEN') || '';
}

function normalizeSheetKey_(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}