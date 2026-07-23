/**
 * BIGQUERY SERVICE
 * Fonte principal de leitura e escrita operacional da base.
 * Mantem o contrato do dashboard sem espalhar SQL pela aplicacao.
 */

const BIGQUERY_SERVICE_PROJECT_ID_ = 'esquilo-invest';
const BIGQUERY_SERVICE_DATASET_ID_ = 'esquilo_invest';
const BIGQUERY_SERVICE_TABLES_ = {
  ACOES: 'acoes',
  FUNDOS: 'fundos',
  PREVIDENCIA: 'previdencia',
  PRE_ORDENS: 'pre_ordens',
  APORTES: 'aportes',
  APP_CONFIG: 'app_config'
};

const BIGQUERY_SERVICE_TABLE_CONFIG_ = {
  [BIGQUERY_SERVICE_TABLES_.ACOES]: {
    label: 'Acoes',
    keyField: 'ativo',
    orderBy: 'ativo',
    fields: {
      tipo: 'STRING',
      ativo: 'STRING',
      plataforma: 'STRING',
      status: 'STRING',
      situacao: 'STRING',
      data_entrada: 'DATE',
      quantidade: 'FLOAT64',
      preco_medio: 'FLOAT64',
      cotacao_atual: 'FLOAT64',
      valor_investido: 'FLOAT64',
      valor_atual: 'FLOAT64',
      stop_loss: 'FLOAT64',
      alvo: 'FLOAT64',
      rentabilidade: 'FLOAT64',
      observacao: 'STRING',
      atualizado_em: 'TIMESTAMP'
    },
    aliases: {
      entrada: 'data_entrada',
      qtd: 'quantidade',
      stop: 'stop_loss'
    }
  },
  [BIGQUERY_SERVICE_TABLES_.FUNDOS]: {
    label: 'Fundos',
    keyField: 'fundo',
    orderBy: 'fundo',
    fields: {
      fundo: 'STRING',
      plataforma: 'STRING',
      categoria: 'STRING',
      estrategia: 'STRING',
      status: 'STRING',
      situacao: 'STRING',
      data_inicio: 'DATE',
      valor_investido: 'FLOAT64',
      valor_atual: 'FLOAT64',
      rentabilidade: 'FLOAT64',
      observacao: 'STRING',
      atualizado_em: 'TIMESTAMP'
    },
    aliases: {
      inicio: 'data_inicio'
    }
  },
  [BIGQUERY_SERVICE_TABLES_.PREVIDENCIA]: {
    label: 'Previdencia',
    keyField: 'plano',
    orderBy: 'plano',
    fields: {
      plano: 'STRING',
      plataforma: 'STRING',
      tipo: 'STRING',
      estrategia: 'STRING',
      status: 'STRING',
      situacao: 'STRING',
      data_inicio: 'DATE',
      valor_investido: 'FLOAT64',
      valor_atual: 'FLOAT64',
      rentabilidade: 'FLOAT64',
      observacao: 'STRING',
      atualizado_em: 'TIMESTAMP'
    },
    aliases: {
      plano_fundo: 'plano',
      inicio: 'data_inicio',
      total_aportado: 'valor_investido'
    }
  },
  [BIGQUERY_SERVICE_TABLES_.PRE_ORDENS]: {
    label: 'PreOrdens',
    keyField: 'ativo',
    orderBy: 'ativo',
    fields: {
      tipo: 'STRING',
      ativo: 'STRING',
      plataforma: 'STRING',
      tipo_ordem: 'STRING',
      quantidade: 'FLOAT64',
      preco_alvo: 'FLOAT64',
      validade: 'DATE',
      valor_potencial: 'FLOAT64',
      cotacao_atual: 'FLOAT64',
      status: 'STRING',
      observacao: 'STRING'
    },
    aliases: {
      qtd: 'quantidade'
    }
  },
  [BIGQUERY_SERVICE_TABLES_.APORTES]: {
    label: 'Aportes',
    keyField: 'mes_ano',
    orderBy: 'mes_ano',
    fields: {
      mes_ano: 'DATE',
      destino: 'STRING',
      categoria: 'STRING',
      plataforma: 'STRING',
      valor: 'FLOAT64',
      acumulado: 'FLOAT64',
      status: 'STRING'
    },
    aliases: {}
  },
  [BIGQUERY_SERVICE_TABLES_.APP_CONFIG]: {
    label: 'Config',
    keyField: 'chave',
    orderBy: 'chave',
    fields: {
      chave: 'STRING',
      valor: 'STRING',
      descricao: 'STRING',
      atualizado_em: 'TIMESTAMP'
    },
    aliases: {}
  }
};

function getAcoes() {
  return getBigQueryTableRows_(BIGQUERY_SERVICE_TABLES_.ACOES);
}

function getFundos() {
  return getBigQueryTableRows_(BIGQUERY_SERVICE_TABLES_.FUNDOS);
}

function getPrevidencia() {
  return getBigQueryTableRows_(BIGQUERY_SERVICE_TABLES_.PREVIDENCIA);
}

function getAportes() {
  return getBigQueryTableRows_(BIGQUERY_SERVICE_TABLES_.APORTES);
}

function getPreOrdens() {
  return getBigQueryTableRows_(BIGQUERY_SERVICE_TABLES_.PRE_ORDENS);
}

function getBigQueryStructuredPortfolioData_() {
  return {
    actions: buildBigQueryStructuredCollection_(BIGQUERY_SERVICE_TABLES_.ACOES, getAcoes()),
    funds: buildBigQueryStructuredCollection_(BIGQUERY_SERVICE_TABLES_.FUNDOS, getFundos()),
    previdencia: buildBigQueryStructuredCollection_(BIGQUERY_SERVICE_TABLES_.PREVIDENCIA, getPrevidencia()),
    preOrders: buildBigQueryStructuredCollection_(BIGQUERY_SERVICE_TABLES_.PRE_ORDENS, getPreOrdens()),
    aportes: buildBigQueryStructuredCollection_(BIGQUERY_SERVICE_TABLES_.APORTES, getAportes()),
    config: buildBigQueryStructuredCollection_(BIGQUERY_SERVICE_TABLES_.APP_CONFIG, getBigQueryTableRows_(BIGQUERY_SERVICE_TABLES_.APP_CONFIG))
  };
}

function getBigQueryOperationalInventory_() {
  return {
    Acoes: getAcoes(),
    Fundos: getFundos(),
    Previdencia: getPrevidencia(),
    PreOrdens: getPreOrdens(),
    Aportes: getAportes()
  };
}

function insertRegistro(tabela, dados) {
  const config = getBigQueryServiceTableConfig_(tabela);
  const payload = sanitizeBigQueryMutationPayload_(config, dados, { requireAllRequiredFields: true, includeKeyField: true });
  const columns = Object.keys(payload);
  if (!columns.length) throw new Error('Nenhum campo valido recebido para insercao em ' + config.label + '.');

  const query = [
    'INSERT INTO `' + getBigQueryQualifiedTableName_(config) + '`',
    '(' + columns.join(', ') + ')',
    'VALUES',
    '(' + columns.map(function (fieldName) {
      return toBigQuerySqlLiteral_(config.fields[fieldName], payload[fieldName]);
    }).join(', ') + ')'
  ].join(' ');

  const result = runBigQueryQuery_(query);
  return {
    ok: true,
    operation: 'insert',
    table: config.label,
    keyField: config.keyField,
    keyValue: payload[config.keyField] || '',
    affectedRows: Number(result.numDmlAffectedRows || 0)
  };
}

function updateRegistro(tabela, chave, dados) {
  const config = getBigQueryServiceTableConfig_(tabela);
  const keyValue = normalizeBigQueryKeyValue_(chave);
  if (!keyValue) throw new Error('Chave obrigatoria ausente para atualizar ' + config.label + '.');

  const payload = sanitizeBigQueryMutationPayload_(config, dados, { requireAllRequiredFields: false, includeKeyField: false });
  if (config.fields.atualizado_em && payload.atualizado_em === undefined) {
    payload.atualizado_em = new Date().toISOString();
  }

  const fields = Object.keys(payload);
  if (!fields.length) throw new Error('Nenhum campo valido recebido para atualizar ' + config.label + '.');

  const query = [
    'UPDATE `' + getBigQueryQualifiedTableName_(config) + '`',
    'SET ' + fields.map(function (fieldName) {
      return fieldName + ' = ' + toBigQuerySqlLiteral_(config.fields[fieldName], payload[fieldName]);
    }).join(', '),
    'WHERE ' + config.keyField + ' = ' + toBigQuerySqlLiteral_(config.fields[config.keyField], keyValue)
  ].join(' ');

  const result = runBigQueryQuery_(query);
  return {
    ok: true,
    operation: 'update',
    table: config.label,
    keyField: config.keyField,
    keyValue: keyValue,
    affectedRows: Number(result.numDmlAffectedRows || 0)
  };
}

function deleteRegistro(tabela, chave) {
  const config = getBigQueryServiceTableConfig_(tabela);
  const keyValue = normalizeBigQueryKeyValue_(chave);
  if (!keyValue) throw new Error('Chave obrigatoria ausente para excluir em ' + config.label + '.');

  const query = [
    'DELETE FROM `' + getBigQueryQualifiedTableName_(config) + '`',
    'WHERE ' + config.keyField + ' = ' + toBigQuerySqlLiteral_(config.fields[config.keyField], keyValue)
  ].join(' ');

  const result = runBigQueryQuery_(query);
  return {
    ok: true,
    operation: 'delete',
    table: config.label,
    keyField: config.keyField,
    keyValue: keyValue,
    affectedRows: Number(result.numDmlAffectedRows || 0)
  };
}

function getBigQueryServiceTableConfig_(tableName) {
  const normalizedToken = normalizeBigQueryTableToken_(tableName);
  const config = Object.keys(BIGQUERY_SERVICE_TABLE_CONFIG_).reduce(function (found, key) {
    if (found) return found;
    const currentConfig = BIGQUERY_SERVICE_TABLE_CONFIG_[key];
    const tokens = [
      key,
      currentConfig.label,
      currentConfig.label.replace(/_/g, ' '),
      currentConfig.label.replace(/s$/i, ''),
      currentConfig.keyField === 'ativo' ? 'acao' : ''
    ].filter(Boolean);

    const hasMatch = tokens.some(function (token) {
      return normalizeBigQueryTableToken_(token) === normalizedToken;
    });
    return hasMatch ? currentConfig : null;
  }, null);

  if (!config) throw new Error('Tabela BigQuery nao suportada: ' + tableName + '.');
  return config;
}

function getBigQueryTableRows_(tableName) {
  const config = getBigQueryServiceTableConfig_(tableName);
  const fieldNames = Object.keys(config.fields);
  const query = [
    'SELECT ' + fieldNames.join(', '),
    'FROM `' + getBigQueryQualifiedTableName_(config) + '`',
    config.orderBy ? ('ORDER BY ' + config.orderBy) : ''
  ].filter(Boolean).join(' ');

  const result = runBigQueryQuery_(query);
  return mapBigQueryRowsToObjects_(result, config);
}

function runBigQueryQuery_(queryText) {
  const request = {
    query: queryText,
    useLegacySql: false
  };
  let result = BigQuery.Jobs.query(request, BIGQUERY_SERVICE_PROJECT_ID_);
  if (!result) {
    throw new Error('BigQuery nao retornou resposta para a consulta.');
  }
  const jobId = result?.jobReference?.jobId || '';

  while (jobId && !result.jobComplete) {
    Utilities.sleep(300);
    result = BigQuery.Jobs.getQueryResults(BIGQUERY_SERVICE_PROJECT_ID_, jobId, { maxResults: 1000 });
  }

  if (result?.errors && result.errors.length) {
    throw new Error(result.errors.map(function (item) { return item.message || String(item); }).join(' | '));
  }

  if (!jobId) return result;

  const allRows = (result.rows || []).slice();
  let pageToken = result.pageToken || '';
  while (pageToken) {
    const page = BigQuery.Jobs.getQueryResults(BIGQUERY_SERVICE_PROJECT_ID_, jobId, { pageToken: pageToken, maxResults: 1000 });
    if (page?.rows && page.rows.length) {
      Array.prototype.push.apply(allRows, page.rows);
    }
    pageToken = page.pageToken || '';
  }

  result.rows = allRows;
  return result;
}

function mapBigQueryRowsToObjects_(queryResult, config) {
  const schemaFields = ((queryResult || {}).schema || {}).fields || [];
  const fieldNames = schemaFields.length
    ? schemaFields.map(function (field) { return field.name; })
    : Object.keys(config.fields);

  return ((queryResult || {}).rows || []).map(function (row) {
    const item = {};
    fieldNames.forEach(function (fieldName, index) {
      item[fieldName] = extractBigQueryCellValue_(row?.f?.[index]?.v);
    });
    return item;
  });
}

function extractBigQueryCellValue_(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object' && value.v !== undefined) return extractBigQueryCellValue_(value.v);
  return value;
}

function buildBigQueryStructuredCollection_(tableName, rows) {
  const config = getBigQueryServiceTableConfig_(tableName);
  const header = Object.keys(config.fields).concat(Object.keys(config.aliases || {}));
  return {
    header: header,
    rows: (rows || []).map(function (row, index) {
      const compatibleRecord = buildBigQueryCompatibleRecord_(config, row);
      return {
        rowNumber: index + 2,
        values: header.map(function (fieldName) {
          if (Object.prototype.hasOwnProperty.call(row || {}, fieldName)) return row[fieldName];
          const sourceField = config.aliases?.[fieldName];
          return sourceField ? row?.[sourceField] : '';
        }),
        record: compatibleRecord
      };
    })
  };
}

function buildBigQueryCompatibleRecord_(config, row) {
  const baseRecord = Object.keys(config.fields).reduce(function (record, fieldName) {
    const value = row?.[fieldName];
    record[fieldName] = value;
    record[normalizeSheetKey_(fieldName)] = value;
    return record;
  }, {});

  Object.keys(config.aliases || {}).forEach(function (aliasName) {
    const sourceField = config.aliases[aliasName];
    const value = row?.[sourceField];
    baseRecord[aliasName] = value;
    baseRecord[normalizeSheetKey_(aliasName)] = value;
  });

  return baseRecord;
}

function sanitizeBigQueryMutationPayload_(config, input, options) {
  const source = input || {};
  const settings = options || {};
  const payload = {};
  const fieldNames = Object.keys(config.fields);

  fieldNames.forEach(function (fieldName) {
    if (!settings.includeKeyField && fieldName === config.keyField) return;
    const aliasEntry = findBigQueryAliasForField_(config, fieldName);
    const hasDirectValue = Object.prototype.hasOwnProperty.call(source, fieldName);
    const hasAliasValue = aliasEntry && Object.prototype.hasOwnProperty.call(source, aliasEntry.aliasName);
    if (!hasDirectValue && !hasAliasValue) return;

    const rawValue = hasDirectValue ? source[fieldName] : source[aliasEntry.aliasName];
    payload[fieldName] = normalizeBigQueryFieldValue_(config.fields[fieldName], rawValue);
  });

  if (config.fields.atualizado_em && !Object.prototype.hasOwnProperty.call(payload, 'atualizado_em')) {
    payload.atualizado_em = new Date().toISOString();
  }

  if (settings.requireAllRequiredFields) {
    const keyValue = payload[config.keyField];
    if (keyValue === null || keyValue === undefined || keyValue === '') {
      throw new Error('Chave obrigatoria ausente para inserir em ' + config.label + '.');
    }
  }

  return payload;
}

function findBigQueryAliasForField_(config, fieldName) {
  const aliases = config.aliases || {};
  const aliasName = Object.keys(aliases).find(function (currentAlias) {
    return aliases[currentAlias] === fieldName;
  });

  if (!aliasName) return null;
  return {
    aliasName: aliasName,
    fieldName: fieldName
  };
}

function normalizeBigQueryFieldValue_(fieldType, value) {
  if (value === null || value === undefined) return '';

  switch (fieldType) {
    case 'FLOAT64': {
      const numericValue = Number(value);
      if (!isFinite(numericValue)) throw new Error('Valor numerico invalido recebido para o BigQuery.');
      return numericValue;
    }
    case 'DATE': {
      const normalizedDate = toDateOnly_(value);
      if (!normalizedDate) throw new Error('Data invalida recebida para o BigQuery.');
      return normalizedDate;
    }
    case 'TIMESTAMP': {
      const normalizedTimestamp = toTimestamp_(value) || nowIso_();
      if (!normalizedTimestamp) throw new Error('Timestamp invalido recebido para o BigQuery.');
      return normalizedTimestamp;
    }
    case 'STRING':
    default:
      return String(value).trim();
  }
}

function toBigQuerySqlLiteral_(fieldType, value) {
  if (value === null || value === undefined || value === '') {
    return fieldType === 'STRING' ? "''" : 'NULL';
  }

  switch (fieldType) {
    case 'FLOAT64':
      return String(Number(value));
    case 'DATE':
      return "DATE '" + escapeBigQuerySqlString_(String(value)) + "'";
    case 'TIMESTAMP':
      return "TIMESTAMP '" + escapeBigQuerySqlString_(String(value)) + "'";
    case 'STRING':
    default:
      return "'" + escapeBigQuerySqlString_(String(value)) + "'";
  }
}

function escapeBigQuerySqlString_(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''");
}

function getBigQueryQualifiedTableName_(config) {
  const tableName = Object.keys(BIGQUERY_SERVICE_TABLE_CONFIG_).find(function (key) {
    return BIGQUERY_SERVICE_TABLE_CONFIG_[key] === config;
  });
  return BIGQUERY_SERVICE_PROJECT_ID_ + '.' + BIGQUERY_SERVICE_DATASET_ID_ + '.' + tableName;
}

function normalizeBigQueryTableToken_(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function normalizeBigQueryKeyValue_(value) {
  return String(value || '').trim();
}
