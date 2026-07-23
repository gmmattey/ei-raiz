/**
 * BIGQUERY SYNC
 * Sincronizacao entre a planilha operacional e o BigQuery.
 * Leitura por nome exato de cabecalho, sem depender da ordem fisica das colunas.
 */

const PROJECT_ID = 'esquilo-invest';
const DATASET_ID = 'esquilo_invest';

const TABLES = {
  ACOES: 'acoes',
  FUNDOS: 'fundos',
  PREVIDENCIA: 'previdencia',
  PRE_ORDENS: 'pre_ordens',
  APORTES: 'aportes',
  APP_CONFIG: 'app_config'
};

const ABAS_MAPEADAS = {
  Acoes: TABLES.ACOES,
  Fundos: TABLES.FUNDOS,
  Previdencia: TABLES.PREVIDENCIA,
  PreOrdens: TABLES.PRE_ORDENS,
  Aportes: TABLES.APORTES,
  Config: TABLES.APP_CONFIG
};

const ABAS_PARA_IGNORAR = [
  'Capa',
  'Dashboard',
  'Configuracoes',
  'Menu',
  'Dashboard_Visual',
  'Export_Auxiliar',
  '_esquilo_decision_history',
  '_esquilo_market_cache'
];

const TABLE_SCHEMAS = {
  [TABLES.ACOES]: {
    required: [
      'tipo',
      'ativo',
      'plataforma',
      'status',
      'situacao',
      'data_entrada',
      'quantidade',
      'preco_medio',
      'cotacao_atual',
      'valor_investido',
      'valor_atual',
      'stop_loss',
      'alvo',
      'rentabilidade',
      'observacao',
      'atualizado_em'
    ]
  },
  [TABLES.FUNDOS]: {
    required: [
      'fundo',
      'plataforma',
      'categoria',
      'estrategia',
      'status',
      'situacao',
      'data_inicio',
      'valor_investido',
      'valor_atual',
      'rentabilidade',
      'observacao',
      'atualizado_em'
    ]
  },
  [TABLES.PREVIDENCIA]: {
    required: [
      'plano',
      'plataforma',
      'tipo',
      'estrategia',
      'status',
      'situacao',
      'data_inicio',
      'valor_investido',
      'valor_atual',
      'rentabilidade',
      'observacao',
      'atualizado_em'
    ]
  },
  [TABLES.PRE_ORDENS]: {
    required: [
      'tipo',
      'ativo',
      'plataforma',
      'tipo_ordem',
      'quantidade',
      'preco_alvo',
      'validade',
      'valor_potencial',
      'cotacao_atual',
      'status',
      'observacao'
    ]
  },
  [TABLES.APORTES]: {
    required: [
      'mes_ano',
      'destino',
      'categoria',
      'plataforma',
      'valor',
      'acumulado',
      'status'
    ]
  },
  [TABLES.APP_CONFIG]: {
    required: [
      'chave',
      'valor',
      'descricao',
      'atualizado_em'
    ]
  }
};

const MONTH_MAP_ = {
  jan: 0,
  fev: 1,
  mar: 2,
  abr: 3,
  mai: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  set: 8,
  out: 9,
  nov: 10,
  dez: 11
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Cloud Sync')
    .addItem('Enviar Dados (Push)', 'syncSheetToBigQuery')
    .addItem('Puxar Dados (Pull)', 'pullDataFromBigQuery')
    .addToUi();
}

function syncSheetToBigQuery() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logs = [];

  ss.getSheets().forEach(function (sheet) {
    const nomeAba = sheet.getName();

    if (ABAS_PARA_IGNORAR.indexOf(nomeAba) >= 0 || sheet.isSheetHidden()) return;
    if (!ABAS_MAPEADAS[nomeAba]) return;

    const tableId = ABAS_MAPEADAS[nomeAba];

    try {
      const jsonRows = extractRowsForTable_(sheet, tableId);

      if (!jsonRows.length) {
        logs.push('[' + nomeAba + '] sem linhas validas.');
        return;
      }

      loadRowsToBigQuery_(tableId, jsonRows);
      logs.push('[' + nomeAba + '] ' + jsonRows.length + ' linha(s) enviada(s) para ' + tableId + '.');
    } catch (error) {
      logs.push('[' + nomeAba + '] ERRO: ' + error.message);
    }
  });

  SpreadsheetApp.getUi().alert(logs.join('\n') || 'Nenhuma aba valida encontrada.');
}

function pullDataFromBigQuery() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logs = [];

  Object.keys(ABAS_MAPEADAS).forEach(function (nomeAba) {
    const tableId = ABAS_MAPEADAS[nomeAba];

    try {
      const rows = fetchRowsFromBigQuery_(tableId);
      const header = getHeaderForTable_(tableId);

      let sheet = ss.getSheetByName(nomeAba);
      if (!sheet) {
        sheet = ss.insertSheet(nomeAba);
        logs.push('Aba criada: ' + nomeAba);
      }

      sheet.clearContents();

      if (header.length) {
        sheet.getRange(1, 1, 1, header.length).setValues([header]);
      }

      if (rows.length) {
        sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
        logs.push('[' + nomeAba + '] ' + rows.length + ' linha(s) puxada(s) de ' + tableId + '.');
      } else {
        logs.push('[' + nomeAba + '] tabela ' + tableId + ' sem dados.');
      }
    } catch (error) {
      logs.push('[' + nomeAba + '] ERRO: ' + error.message);
    }
  });

  SpreadsheetApp.getUi().alert(logs.join('\n'));
}

function extractRowsForTable_(sheet, tableId) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headerRow = data[0];
  const rows = data.slice(1);
  const headerMap = buildHeaderMap_(headerRow);

  validateHeaders_(tableId, headerMap);

  switch (tableId) {
    case TABLES.ACOES:
      return rows.map(function (row) { return mapAcaoRow_(row, headerMap); }).filter(Boolean);
    case TABLES.FUNDOS:
      return rows.map(function (row) { return mapFundoRow_(row, headerMap); }).filter(Boolean);
    case TABLES.PREVIDENCIA:
      return rows.map(function (row) { return mapPrevidenciaRow_(row, headerMap); }).filter(Boolean);
    case TABLES.PRE_ORDENS:
      return rows.map(function (row) { return mapPreOrdemRow_(row, headerMap); }).filter(Boolean);
    case TABLES.APORTES:
      return rows.map(function (row) { return mapAporteRow_(row, headerMap); }).filter(Boolean);
    case TABLES.APP_CONFIG:
      return rows.map(function (row) { return mapConfigRow_(row, headerMap); }).filter(Boolean);
    default:
      return [];
  }
}

function buildHeaderMap_(headerRow) {
  const map = {};
  (headerRow || []).forEach(function (cell, index) {
    const key = String(cell || '').trim();
    if (key) map[key] = index;
  });
  return map;
}

function validateHeaders_(tableId, headerMap) {
  const schema = TABLE_SCHEMAS[tableId];
  if (!schema) throw new Error('Schema nao encontrado para tabela ' + tableId + '.');

  const missing = schema.required.filter(function (col) {
    return headerMap[col] === undefined;
  });

  if (missing.length) {
    throw new Error('Colunas obrigatorias ausentes: ' + missing.join(', '));
  }
}

function getValueByHeader_(row, headerMap, columnName) {
  const index = headerMap[columnName];
  if (index === undefined) return null;
  return row[index];
}

function loadRowsToBigQuery_(tableId, jsonRows) {
  const loadJob = {
    configuration: {
      load: {
        destinationTable: {
          projectId: PROJECT_ID,
          datasetId: DATASET_ID,
          tableId: tableId
        },
        writeDisposition: 'WRITE_TRUNCATE',
        sourceFormat: 'NEWLINE_DELIMITED_JSON'
      }
    }
  };

  const dataBlob = Utilities.newBlob(
    jsonRows.map(JSON.stringify).join('\n'),
    'application/octet-stream'
  );

  BigQuery.Jobs.insert(loadJob, PROJECT_ID, dataBlob);
}

function fetchRowsFromBigQuery_(tableId) {
  const queryRequest = {
    query: 'SELECT * FROM `' + PROJECT_ID + '.' + DATASET_ID + '.' + tableId + '`',
    useLegacySql: false
  };

  const queryResults = BigQuery.Jobs.query(queryRequest, PROJECT_ID);
  if (!queryResults.rows) return [];

  return queryResults.rows.map(function (row) {
    return row.f.map(function (field) { return field.v; });
  });
}

function getHeaderForTable_(tableId) {
  const schema = TABLE_SCHEMAS[tableId];
  return schema ? schema.required.slice() : [];
}

function mapAcaoRow_(row, headerMap) {
  const ativo = getValueByHeader_(row, headerMap, 'ativo');
  if (isBlankValue_(ativo)) return null;

  return {
    tipo: toStr_(getValueByHeader_(row, headerMap, 'tipo')),
    ativo: toStr_(ativo),
    plataforma: toStr_(getValueByHeader_(row, headerMap, 'plataforma')),
    status: toStr_(getValueByHeader_(row, headerMap, 'status')),
    situacao: toStr_(getValueByHeader_(row, headerMap, 'situacao')),
    data_entrada: toDateOnly_(getValueByHeader_(row, headerMap, 'data_entrada')),
    quantidade: toFloat_(getValueByHeader_(row, headerMap, 'quantidade')),
    preco_medio: toFloat_(getValueByHeader_(row, headerMap, 'preco_medio')),
    cotacao_atual: toFloat_(getValueByHeader_(row, headerMap, 'cotacao_atual')),
    valor_investido: toFloat_(getValueByHeader_(row, headerMap, 'valor_investido')),
    valor_atual: toFloat_(getValueByHeader_(row, headerMap, 'valor_atual')),
    stop_loss: toFloat_(getValueByHeader_(row, headerMap, 'stop_loss')),
    alvo: toFloat_(getValueByHeader_(row, headerMap, 'alvo')),
    rentabilidade: toFloat_(getValueByHeader_(row, headerMap, 'rentabilidade')),
    observacao: toStr_(getValueByHeader_(row, headerMap, 'observacao')),
    atualizado_em: toTimestamp_(getValueByHeader_(row, headerMap, 'atualizado_em')) || nowIso_()
  };
}

function mapFundoRow_(row, headerMap) {
  const fundo = getValueByHeader_(row, headerMap, 'fundo');
  if (isBlankValue_(fundo)) return null;

  return {
    fundo: toStr_(fundo),
    plataforma: toStr_(getValueByHeader_(row, headerMap, 'plataforma')),
    categoria: toStr_(getValueByHeader_(row, headerMap, 'categoria')),
    estrategia: toStr_(getValueByHeader_(row, headerMap, 'estrategia')),
    status: toStr_(getValueByHeader_(row, headerMap, 'status')),
    situacao: toStr_(getValueByHeader_(row, headerMap, 'situacao')),
    data_inicio: toDateOnly_(getValueByHeader_(row, headerMap, 'data_inicio')),
    valor_investido: toFloat_(getValueByHeader_(row, headerMap, 'valor_investido')),
    valor_atual: toFloat_(getValueByHeader_(row, headerMap, 'valor_atual')),
    rentabilidade: toFloat_(getValueByHeader_(row, headerMap, 'rentabilidade')),
    observacao: toStr_(getValueByHeader_(row, headerMap, 'observacao')),
    atualizado_em: toTimestamp_(getValueByHeader_(row, headerMap, 'atualizado_em')) || nowIso_()
  };
}

function mapPrevidenciaRow_(row, headerMap) {
  const plano = getValueByHeader_(row, headerMap, 'plano');
  if (isBlankValue_(plano)) return null;

  return {
    plano: toStr_(plano),
    plataforma: toStr_(getValueByHeader_(row, headerMap, 'plataforma')),
    tipo: toStr_(getValueByHeader_(row, headerMap, 'tipo')),
    estrategia: toStr_(getValueByHeader_(row, headerMap, 'estrategia')),
    status: toStr_(getValueByHeader_(row, headerMap, 'status')),
    situacao: toStr_(getValueByHeader_(row, headerMap, 'situacao')),
    data_inicio: toDateOnly_(getValueByHeader_(row, headerMap, 'data_inicio')),
    valor_investido: toFloat_(getValueByHeader_(row, headerMap, 'valor_investido')),
    valor_atual: toFloat_(getValueByHeader_(row, headerMap, 'valor_atual')),
    rentabilidade: toFloat_(getValueByHeader_(row, headerMap, 'rentabilidade')),
    observacao: toStr_(getValueByHeader_(row, headerMap, 'observacao')),
    atualizado_em: toTimestamp_(getValueByHeader_(row, headerMap, 'atualizado_em')) || nowIso_()
  };
}

function mapPreOrdemRow_(row, headerMap) {
  const ativo = getValueByHeader_(row, headerMap, 'ativo');
  if (isBlankValue_(ativo)) return null;

  return {
    tipo: toStr_(getValueByHeader_(row, headerMap, 'tipo')),
    ativo: toStr_(ativo),
    plataforma: toStr_(getValueByHeader_(row, headerMap, 'plataforma')),
    tipo_ordem: toStr_(getValueByHeader_(row, headerMap, 'tipo_ordem')),
    quantidade: toFloat_(getValueByHeader_(row, headerMap, 'quantidade')),
    preco_alvo: toFloat_(getValueByHeader_(row, headerMap, 'preco_alvo')),
    validade: toDateOnly_(getValueByHeader_(row, headerMap, 'validade')),
    valor_potencial: toFloat_(getValueByHeader_(row, headerMap, 'valor_potencial')),
    cotacao_atual: toFloat_(getValueByHeader_(row, headerMap, 'cotacao_atual')),
    status: toStr_(getValueByHeader_(row, headerMap, 'status')),
    observacao: toStr_(getValueByHeader_(row, headerMap, 'observacao'))
  };
}

function mapAporteRow_(row, headerMap) {
  const mesAno = getValueByHeader_(row, headerMap, 'mes_ano');
  if (isBlankValue_(mesAno)) return null;

  return {
    mes_ano: toDateOnly_(mesAno),
    destino: toStr_(getValueByHeader_(row, headerMap, 'destino')),
    categoria: toStr_(getValueByHeader_(row, headerMap, 'categoria')),
    plataforma: toStr_(getValueByHeader_(row, headerMap, 'plataforma')),
    valor: toFloat_(getValueByHeader_(row, headerMap, 'valor')),
    acumulado: toFloat_(getValueByHeader_(row, headerMap, 'acumulado')),
    status: toStr_(getValueByHeader_(row, headerMap, 'status'))
  };
}

function mapConfigRow_(row, headerMap) {
  const chave = getValueByHeader_(row, headerMap, 'chave');
  if (isBlankValue_(chave)) return null;

  return {
    chave: toStr_(chave),
    valor: toStr_(getValueByHeader_(row, headerMap, 'valor')),
    descricao: toStr_(getValueByHeader_(row, headerMap, 'descricao')),
    atualizado_em: toTimestamp_(getValueByHeader_(row, headerMap, 'atualizado_em')) || nowIso_()
  };
}

function isBlankValue_(value) {
  return value === null || value === undefined || String(value).trim() === '';
}

function toStr_(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\s+/g, ' ').trim();
}

function toFloat_(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return isNaN(value) ? null : value;

  const normalized = String(value)
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const numericValue = Number(normalized);
  return isNaN(numericValue) ? null : numericValue;
}

function toDateOnly_(value) {
  const dateValue = parseDateValue_(value);
  if (!dateValue) return null;
  return Utilities.formatDate(dateValue, 'GMT', 'yyyy-MM-dd');
}

function toTimestamp_(value) {
  const dateValue = parseDateValue_(value);
  if (!dateValue) return null;
  return Utilities.formatDate(dateValue, 'GMT', "yyyy-MM-dd'T'HH:mm:ss'Z'");
}

function parseDateValue_(value) {
  if (!value) return null;
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return value;
  }

  const text = String(value).trim();
  if (!text || text === '-' || text === '—' || /^sem prazo$/i.test(text)) return null;

  let match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    let year = Number(match[3]);
    if (year < 100) year += 2000;
    const parsed = new Date(Date.UTC(year, month, day));
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  match = text.match(/^([A-Za-zçÇ]{3})\/(\d{4})$/i);
  if (match) {
    const monthKey = normalizeMonthToken_(match[1]);
    const monthIndex = MONTH_MAP_[monthKey];
    const year = Number(match[2]);
    if (monthIndex === undefined || isNaN(year)) return null;
    return new Date(Date.UTC(year, monthIndex, 1));
  }

  return null;
}

function normalizeMonthToken_(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .slice(0, 3);
}

function nowIso_() {
  return Utilities.formatDate(new Date(), 'GMT', "yyyy-MM-dd'T'HH:mm:ss'Z'");
}
