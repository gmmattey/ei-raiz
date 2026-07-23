export interface ImportOperationalFacts {
  importable: boolean;
  parserMode: string | null;
  documentConfidence: number | null;
  totalRows: number;
  lowConfidenceRows: number;
  blockedRows: number;
  failedRows: number;
  duplicateRows: number;
  manualDecisionRows: number;
  fallbackRows: number;
  aiAssistedRows: number;
}

export interface ImportEngineStatusSummary {
  code: 'recebido' | 'processando' | 'concluido' | 'baixa_confianca' | 'fallback' | 'nao_importavel' | 'pronto_para_revisao';
  label: string;
  body: string;
  readyForReview: boolean;
  readyToCommit: boolean;
}

export function buildImportOperationalFacts(
  rows: Array<{ normalized_payload_json: string | null; resolution_status: string }>,
  importOrigin: string
): ImportOperationalFacts {
  const firstNormalized = rows.length ? parseJson(rows[0].normalized_payload_json, {}) : {};
  const firstDocumentMeta = asRecord(firstNormalized.documentMeta);
  const parserMode = normalizeText(firstDocumentMeta.parserMode);
  const documentConfidence = normalizeNumber(firstDocumentMeta.confidence);
  let importable = rows.length ? Boolean(firstNormalized.importable ?? true) : true;
  let lowConfidenceRows = 0;
  let blockedRows = 0;
  let failedRows = 0;
  let duplicateRows = 0;
  let manualDecisionRows = 0;
  let fallbackRows = 0;

  for (const row of rows) {
    const normalized = parseJson(row.normalized_payload_json, {});
    const reviewMeta = asRecord(normalized.reviewMeta);
    const documentMeta = asRecord(normalized.documentMeta);
    const fieldConfidences = asRecord(normalized.fieldConfidences);
    const hasLowConfidence = row.resolution_status === 'PENDING_CRITICAL' || hasCriticalLowConfidence(fieldConfidences);
    const rowImportable = Boolean(normalized.importable ?? true);
    const rowParserMode = normalizeText(documentMeta.parserMode);

    if (!rowImportable) importable = false;
    if (row.resolution_status === 'BLOCKED_NON_IMPORTABLE') blockedRows += 1;
    if (row.resolution_status === 'FAILED') failedRows += 1;
    if (row.resolution_status === 'PENDING') duplicateRows += 1;
    if (hasLowConfidence) lowConfidenceRows += 1;
    if (reviewMeta.edited === true || normalizeText(reviewMeta.duplicateResolution) !== '') manualDecisionRows += 1;
    if (rowParserMode.includes('fallback') || reviewMeta.fallbackUsed === true) fallbackRows += 1;
  }

  return {
    importable,
    parserMode: parserMode || null,
    documentConfidence: documentConfidence > 0 ? documentConfidence : null,
    totalRows: rows.length,
    lowConfidenceRows,
    blockedRows,
    failedRows,
    duplicateRows,
    manualDecisionRows,
    fallbackRows,
    aiAssistedRows: importOrigin === 'DOCUMENT_AI_PARSE' ? rows.length : 0
  };
}

export function deriveImportEngineStatus(
  importStatus: string,
  facts: ImportOperationalFacts
): ImportEngineStatusSummary {
  const readyToCommit =
    importStatus !== 'COMMITTED' &&
    facts.totalRows > 0 &&
    facts.blockedRows === 0 &&
    facts.failedRows === 0 &&
    facts.duplicateRows === 0 &&
    facts.lowConfidenceRows === 0;

  if (importStatus === 'COMMITTED') {
    return {
      code: 'concluido',
      label: 'Concluído',
      body: 'O processamento operacional terminou e a importação já foi commitada na carteira.',
      readyForReview: false,
      readyToCommit: false
    };
  }

  if (!facts.importable || facts.blockedRows > 0) {
    return {
      code: 'nao_importavel',
      label: 'Não importável',
      body: 'O motor identificou que este documento não pode ser tratado como posição importável de carteira.',
      readyForReview: true,
      readyToCommit: false
    };
  }

  if (facts.lowConfidenceRows > 0) {
    return {
      code: 'baixa_confianca',
      label: 'Baixa confiança',
      body: 'O processamento encontrou campos críticos com baixa confiança e exige revisão humana.',
      readyForReview: true,
      readyToCommit: false
    };
  }

  if (facts.fallbackRows > 0) {
    return {
      code: 'fallback',
      label: 'Fallback',
      body: 'O motor precisou usar caminho de fallback em parte do processamento e requer validação operacional.',
      readyForReview: true,
      readyToCommit: readyToCommit
    };
  }

  if (readyToCommit || importStatus === 'PREVIEW_READY') {
    return {
      code: 'pronto_para_revisao',
      label: 'Pronto para revisão',
      body: 'O processamento terminou e o resultado operacional já pode ser revisado antes do commit.',
      readyForReview: true,
      readyToCommit: readyToCommit
    };
  }

  if (importStatus === 'PROCESSING' || facts.failedRows > 0 || facts.duplicateRows > 0) {
    return {
      code: 'processando',
      label: 'Processando',
      body: 'O motor ainda tem pendências operacionais para resolver antes de chegar a um estado final.',
      readyForReview: facts.totalRows > 0,
      readyToCommit: false
    };
  }

  return {
    code: 'recebido',
    label: 'Recebido',
    body: 'O documento foi recebido pelo fluxo, mas ainda não há processamento suficiente para classificação final.',
    readyForReview: false,
    readyToCommit: false
  };
}

function hasCriticalLowConfidence(fieldConfidences: Record<string, unknown>): boolean {
  for (const [key, value] of Object.entries(fieldConfidences)) {
    if (!['sourceKind', 'name', 'quantity', 'investedAmount', 'currentAmount'].includes(key)) continue;
    const confidence = normalizeNumber(value);
    if (confidence > 0 && confidence < 0.6) return true;
  }
  return false;
}

function parseJson(value: unknown, fallback: Record<string, any>) {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
}
