import type { Env } from '../types/env';
import { ok, fail } from './http';
import { hashToken } from './auth_crypto';
import { findImportSessionStateByTokenHash, findOwnedImportById, findImportRows, findLatestSnapshotByOwnedImportId } from '../repositories/import_repository';
import { buildImportOperationalFacts, deriveImportEngineStatus } from './import_operational_helpers';

const AUTH_COOKIE_NAME = 'esquilo_session';

export async function getImportDetailData(request: Request, env: Env, params: Record<string, string>): Promise<Response> {
  const session = await requireImportSession(request, env);
  if (session instanceof Response) return session;

  const importRecord = await findOwnedImportById(env, session.userId, params.importId);
  if (!importRecord) {
    return fail(env.API_VERSION, 'import_not_found', 'Importação não encontrada.', 404);
  }

  const rows = await findImportRows(env, params.importId);
  const snapshot = await findLatestSnapshotByOwnedImportId(env, session.userId, params.importId);
  const facts = buildImportOperationalFacts(rows, importRecord.origin);
  const engineStatus = deriveImportEngineStatus(importRecord.status, facts);
  const detailedRows = rows.map((row) => mapImportDetailRow(row));
  const issueSummary = summarizeOperationalIssues(detailedRows);
  const decisionSummary = summarizeOperationalDecisions(detailedRows);
  const documentMeta = detailedRows.length ? detailedRows[0].documentMeta : null;

  return ok(env.API_VERSION, {
    screenState: 'ready',
    importId: params.importId,
    importMeta: {
      origin: importRecord.origin,
      originLabel: mapOriginLabel(importRecord.origin),
      status: importRecord.status,
      statusLabel: mapStatusLabel(importRecord.status),
      totalRows: Number(importRecord.total_rows || 0),
      validRows: Number(importRecord.valid_rows || 0),
      invalidRows: Number(importRecord.invalid_rows || 0),
      duplicateRows: Number(importRecord.duplicate_rows || 0),
      createdAt: importRecord.created_at,
      updatedAt: importRecord.updated_at || importRecord.created_at,
      finishedAt: importRecord.finished_at || null,
      fileName: importRecord.file_name || null,
      mimeType: importRecord.mime_type || null
    },
    operationalSummary: {
      engineStatus,
      document: {
        fileName: importRecord.file_name || documentMeta?.fileName || null,
        mimeType: importRecord.mime_type || documentMeta?.mimeType || null,
        documentType: documentMeta?.documentType || null,
        parserMode: documentMeta?.parserMode || facts.parserMode,
        confidence: documentMeta?.confidence ?? facts.documentConfidence,
        importable: facts.importable
      },
      counts: {
        totalRows: facts.totalRows,
        validRows: Number(importRecord.valid_rows || 0),
        invalidRows: Number(importRecord.invalid_rows || 0),
        duplicateRows: Number(importRecord.duplicate_rows || 0),
        lowConfidenceRows: facts.lowConfidenceRows,
        blockedRows: facts.blockedRows,
        failedRows: facts.failedRows,
        fallbackRows: facts.fallbackRows,
        manualDecisionRows: facts.manualDecisionRows
      },
      targets: {
        engineStatus: `/v1/imports/${params.importId}/engine-status`,
        preview: `/v1/imports/${params.importId}/preview`,
        conflicts: issueSummary.conflictRows > 0 ? `/v1/imports/${params.importId}/conflicts` : null
      }
    },
    issueSummary,
    decisionSummary,
    snapshot: snapshot ? {
      id: snapshot.id,
      referenceDate: snapshot.reference_date,
      totalEquity: Number(snapshot.total_equity || 0),
      totalInvested: Number(snapshot.total_invested || 0),
      totalProfitLoss: Number(snapshot.total_profit_loss || 0),
      totalProfitLossPct: Number(snapshot.total_profit_loss_pct || 0),
      target: '/history/snapshots'
    } : null,
    rows: detailedRows
  });
}

async function requireImportSession(request: Request, env: Env): Promise<{ userId: string; portfolioId: string } | Response> {
  const token = readCookie(request.headers.get('cookie') || '', AUTH_COOKIE_NAME);
  if (!token) return fail(env.API_VERSION, 'unauthorized', 'Sessão não encontrada.', 401);
  const tokenHash = await hashToken(token);
  const session = await findImportSessionStateByTokenHash(env, tokenHash);
  if (!session) return fail(env.API_VERSION, 'unauthorized', 'Sessão inválida.', 401);
  if (!session.hasContext) return ok(env.API_VERSION, { screenState: 'redirect_onboarding', redirectTo: '/onboarding' });
  if (!session.portfolioId) return fail(env.API_VERSION, 'portfolio_not_found', 'Carteira principal não encontrada.', 404);
  return { userId: session.userId, portfolioId: session.portfolioId };
}

function mapImportDetailRow(row: {
  id: string;
  row_number: number;
  source_payload_json: string | null;
  normalized_payload_json: string | null;
  resolution_status: string;
  error_message: string | null;
}) {
  const source = parseJson(row.source_payload_json, {});
  const normalized = parseJson(row.normalized_payload_json, {});
  const fieldSources = asRecord(normalized.fieldSources);
  const fieldConfidences = asRecord(normalized.fieldConfidences);
  const warnings = Array.isArray(normalized.warnings) ? normalized.warnings.map((item: unknown) => String(item)) : [];
  const reviewMeta = asRecord(normalized.reviewMeta);
  const documentMeta = asRecord(normalized.documentMeta);
  const duplicateCandidates = Array.isArray(normalized.duplicateCandidates) ? normalized.duplicateCandidates : [];
  const lowConfidenceFields = buildLowConfidenceFields(fieldSources, fieldConfidences);
  const decision = buildDecisionSummary(row.resolution_status, reviewMeta, documentMeta);

  return {
    rowId: row.id,
    rowNumber: row.row_number,
    resolutionStatus: row.resolution_status,
    errorMessage: row.error_message,
    source,
    normalized: {
      sourceKind: String(normalized.sourceKind || ''),
      code: String(normalized.code || ''),
      name: String(normalized.name || ''),
      normalizedName: String(normalized.normalizedName || ''),
      quantity: Number(normalized.quantity || 0),
      investedAmount: Number(normalized.investedAmount || 0),
      currentAmount: Number(normalized.currentAmount || 0),
      averagePrice: normalized.averagePrice == null ? null : Number(normalized.averagePrice || 0),
      currentPrice: normalized.currentPrice == null ? null : Number(normalized.currentPrice || 0),
      categoryLabel: String(normalized.categoryLabel || ''),
      notes: String(normalized.notes || '')
    },
    fieldSources,
    fieldConfidences,
    lowConfidenceFields,
    warnings,
    reviewMeta,
    documentMeta,
    duplicateCandidates,
    operationalFlags: {
      hasError: Boolean(row.error_message),
      hasConflict: row.resolution_status === 'PENDING' || duplicateCandidates.length > 0,
      hasLowConfidence: row.resolution_status === 'PENDING_CRITICAL' || lowConfidenceFields.length > 0,
      usedFallback: decision.origin === 'fallback',
      usedAi: decision.origin === 'ia',
      usedManualDecision: decision.origin === 'manual',
      nonImportable: row.resolution_status === 'BLOCKED_NON_IMPORTABLE'
    },
    decision
  };
}

function summarizeOperationalIssues(rows: Array<ReturnType<typeof mapImportDetailRow>>) {
  const errorRows = rows.filter((row) => row.operationalFlags.hasError).length;
  const conflictRows = rows.filter((row) => row.operationalFlags.hasConflict).length;
  const lowConfidenceRows = rows.filter((row) => row.operationalFlags.hasLowConfidence).length;
  const nonImportableRows = rows.filter((row) => row.operationalFlags.nonImportable).length;

  return {
    errorRows,
    conflictRows,
    lowConfidenceRows,
    nonImportableRows,
    items: rows
      .filter((row) => row.operationalFlags.hasError || row.operationalFlags.hasConflict || row.operationalFlags.hasLowConfidence || row.operationalFlags.nonImportable)
      .map((row) => ({
        rowId: row.rowId,
        rowNumber: row.rowNumber,
        resolutionStatus: row.resolutionStatus,
        errorMessage: row.errorMessage,
        issueKinds: [
          ...(row.operationalFlags.hasError ? ['erro'] : []),
          ...(row.operationalFlags.hasConflict ? ['conflito'] : []),
          ...(row.operationalFlags.hasLowConfidence ? ['baixa_confianca'] : []),
          ...(row.operationalFlags.nonImportable ? ['nao_importavel'] : [])
        ]
      }))
  };
}

function summarizeOperationalDecisions(rows: Array<ReturnType<typeof mapImportDetailRow>>) {
  const manualRows = rows.filter((row) => row.decision.origin === 'manual').length;
  const fallbackRows = rows.filter((row) => row.decision.origin === 'fallback').length;
  const aiRows = rows.filter((row) => row.decision.origin === 'ia').length;
  const systemRows = rows.filter((row) => row.decision.origin === 'system').length;

  return {
    manualRows,
    fallbackRows,
    aiRows,
    systemRows,
    items: rows
      .filter((row) => row.decision.code !== 'none')
      .map((row) => ({
        rowId: row.rowId,
        rowNumber: row.rowNumber,
        code: row.decision.code,
        label: row.decision.label,
        origin: row.decision.origin,
        details: row.decision.details
      }))
  };
}

function buildDecisionSummary(
  resolutionStatus: string,
  reviewMeta: Record<string, unknown>,
  documentMeta: Record<string, unknown>
) {
  const duplicateResolution = normalizeText(reviewMeta.duplicateResolution);
  const parserMode = normalizeText(documentMeta.parserMode);

  if (duplicateResolution) {
    return {
      code: duplicateResolution,
      label: mapDuplicateResolutionLabel(duplicateResolution),
      origin: 'manual' as const,
      details: 'A linha recebeu uma decisão manual durante a revisão de duplicidade.'
    };
  }

  if (reviewMeta.edited === true) {
    return {
      code: 'manual_edit',
      label: 'Edição manual',
      origin: 'manual' as const,
      details: 'A linha foi editada manualmente durante a revisão operacional.'
    };
  }

  if (parserMode.includes('fallback') || reviewMeta.fallbackUsed === true) {
    return {
      code: 'fallback',
      label: 'Fallback operacional',
      origin: 'fallback' as const,
      details: 'O processamento usou caminho de fallback para estruturar ou manter esta linha.'
    };
  }

  if (normalizeText(documentMeta.parserMode) !== '') {
    return {
      code: 'ai_parse',
      label: 'Leitura assistida por IA',
      origin: 'ia' as const,
      details: 'A linha veio de um fluxo de documento assistido.'
    };
  }

  if (['NORMALIZED', 'RESOLVED_REPLACE', 'RESOLVED_CONSOLIDATE', 'IGNORED', 'COMMITTED'].includes(resolutionStatus)) {
    return {
      code: 'system',
      label: 'Processamento padrão',
      origin: 'system' as const,
      details: 'A linha seguiu o fluxo padrão de normalização sem decisão manual explícita.'
    };
  }

  return {
    code: 'none',
    label: 'Sem decisão registrada',
    origin: 'system' as const,
    details: 'Ainda não há uma decisão operacional consolidada para esta linha.'
  };
}

function buildLowConfidenceFields(fieldSources: Record<string, unknown>, fieldConfidences: Record<string, unknown>) {
  const result: Array<{ field: string; confidence: number; source: string }> = [];
  for (const [field, rawConfidence] of Object.entries(fieldConfidences)) {
    const confidence = normalizeNumber(rawConfidence);
    if (confidence <= 0 || confidence >= 0.6) continue;
    result.push({
      field,
      confidence,
      source: normalizeText(fieldSources[field]) || 'unknown'
    });
  }
  return result;
}

function mapOriginLabel(origin: string): string {
  if (origin === 'MANUAL_ENTRY') return 'Manual';
  if (origin === 'CUSTOM_TEMPLATE') return 'Template próprio';
  if (origin === 'B3_CSV') return 'CSV da B3';
  if (origin === 'DOCUMENT_AI_PARSE') return 'Documento assistido';
  return origin;
}

function mapStatusLabel(status: string): string {
  if (status === 'COMMITTED') return 'Concluída';
  if (status === 'PREVIEW_READY') return 'Pronta para commit';
  if (status === 'PROCESSING') return 'Em revisão';
  if (status === 'FAILED') return 'Falhou';
  return status;
}

function mapDuplicateResolutionLabel(code: string): string {
  if (code === 'keep_current') return 'Manter atual';
  if (code === 'replace_existing') return 'Substituir existente';
  if (code === 'consolidate') return 'Consolidar posições';
  if (code === 'ignore_import') return 'Ignorar linha importada';
  return code;
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

function normalizeNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readCookie(cookieHeader: string, cookieName: string): string {
  const prefix = `${cookieName}=`;
  const match = cookieHeader.split(';').map((item) => item.trim()).find((item) => item.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : '';
}
