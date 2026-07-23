import type { Env } from '../types/env';
import { ok, fail, readJson } from './http';
import { buildEntityId, hashToken } from './auth_crypto';
import { recordOperationalEvent } from './operational_events_service';
import { generateDeterministicAnalysisForSnapshot } from './analysis_generation_service';
import { findImportSessionStateByTokenHash, createImportRecord, updateImportRecord, replaceImportRows, findOwnedImportById, findImportRows, findManualDuplicateCandidates, findAssetTypeByCode, findAssetByNormalizedNameOrCode, createAsset, createPortfolioPosition, createPortfolioSnapshot, createSnapshotPosition } from '../repositories/import_repository';

const AUTH_COOKIE_NAME = 'esquilo_session';
// Release 0.1: um unico layout CSV v1 (template proprio).
const ORIGIN_CUSTOM_TEMPLATE = 'CUSTOM_TEMPLATE';
const ORIGIN_CSV_V1 = 'CSV_V1';
// Constantes para fluxos futuros (ainda não expostos via rota pública).
const ORIGIN_MANUAL_ENTRY = 'MANUAL_ENTRY';
const ORIGIN_B3_CSV = 'B3_CSV';
const ORIGIN_DOCUMENT_AI_PARSE = 'DOCUMENT_AI_PARSE';
const IMPORTABLE_DOCUMENT_TYPES = ['extrato_b3', 'extrato_xp', 'extrato_rico', 'nota_corretagem'];
const B3_REQUIRED_HEADERS = ['codigo', 'produto', 'quantidade', 'preco_medio', 'valor_atual'];
const VALID_SOURCE_KINDS = ['ACOES', 'FUNDOS', 'PREVIDENCIA'];
const TEMPLATE_HEADERS = ['tipo', 'codigo', 'nome', 'quantidade', 'valor_investido', 'valor_atual', 'categoria', 'observacoes'];
const COMMIT_ALLOWED_STATUSES = ['NORMALIZED', 'RESOLVED_REPLACE', 'RESOLVED_CONSOLIDATE', 'IGNORED'];

export async function startImport(request: Request, env: Env): Promise<Response> {
  const payload = await readJson<Record<string, unknown>>(request).catch((): Record<string, unknown> => ({}));
  const origin = typeof payload.origin === 'string' ? payload.origin : '';
  if (origin !== ORIGIN_CUSTOM_TEMPLATE && origin !== ORIGIN_CSV_V1) {
    return fail(
      env.API_VERSION,
      'unsupported_import_origin',
      'Nesta release, aceitamos apenas o template CSV v1 oficial. Use o botão "Baixar template oficial".',
      400,
      { acceptedOrigin: ORIGIN_CUSTOM_TEMPLATE, acceptedHeaders: TEMPLATE_HEADERS }
    );
  }
  return await startCustomTemplateImport(request, env, payload);
}

export async function startManualImport(request: Request, env: Env): Promise<Response> {
  // Rota legada/externa (se usada em algum momento) fica explicitamente bloqueada na Release 0.1.
  void request;
  return fail(env.API_VERSION, 'manual_import_disabled', 'Entrada manual está desabilitada nesta release. Use o template CSV v1.', 400);
}

export async function patchImportPreviewRow(request: Request, env: Env, params: Record<string, string>): Promise<Response> {
  const session = await requireImportSession(request, env);
  if (session instanceof Response) return session;
  const importRecord = await findOwnedImport(env, session.userId, params.importId);
  if (importRecord instanceof Response) return importRecord;
  if (importRecord.status === 'COMMITTED') return fail(env.API_VERSION, 'import_already_committed', 'Esta importação já foi commitada.', 409);

  const body = await readJson<Record<string, unknown>>(request).catch((): Record<string, unknown> => ({}));
  const fields = typeof body.fields === 'object' && body.fields !== null ? body.fields as Record<string, unknown> : {};
  const rows = await findImportRows(env, params.importId);
  const targetRow = rows.find((row) => row.id === params.rowId);
  if (!targetRow) return fail(env.API_VERSION, 'row_not_found', 'Linha do preview não encontrada.', 404);

  const source = parseJson(targetRow.source_payload_json, {});
  const normalized = parseJson(targetRow.normalized_payload_json, {});
  const editable = mapNormalizedToEditablePayload(normalized, source);
  const merged = { ...editable, ...fields };
  const reparsed = normalizeManualEntry(merged, targetRow.row_number);
  const updatedFieldSources = { ...(normalized.fieldSources || {}) } as Record<string, unknown>;
  const updatedFieldConfidences = { ...(normalized.fieldConfidences || {}) } as Record<string, unknown>;
  for (const key of Object.keys(fields)) {
    const canonicalKey = mapEditableKeyToNormalizedKey(key);
    if (canonicalKey) {
      updatedFieldSources[canonicalKey] = 'manual';
      updatedFieldConfidences[canonicalKey] = 1;
    }
  }
  const warnings = Array.isArray(normalized.warnings) ? normalized.warnings.filter((item: unknown) => !String(item).toLowerCase().includes('critical')) : [];
  const updatedRows = await rebuildRowsAfterMutation(env, params.importId, session.portfolioId, rows, params.rowId, {
    rowId: targetRow.id,
    rowNumber: targetRow.row_number,
    sourcePayloadJson: JSON.stringify(merged),
    normalizedPayloadJson: JSON.stringify({
      ...normalized,
      sourceKind: reparsed.sourceKind,
      code: reparsed.code,
      name: reparsed.name,
      normalizedName: reparsed.normalizedName,
      quantity: reparsed.quantity,
      investedAmount: reparsed.investedAmount,
      currentAmount: reparsed.currentAmount,
      averagePrice: reparsed.averagePrice,
      currentPrice: reparsed.currentPrice,
      categoryLabel: reparsed.categoryLabel,
      notes: reparsed.notes,
      fieldSources: updatedFieldSources,
      fieldConfidences: updatedFieldConfidences,
      warnings,
      reviewMeta: {
        ...(typeof normalized.reviewMeta === 'object' && normalized.reviewMeta !== null ? normalized.reviewMeta : {}),
        edited: true,
        beforeResolutionStatus: targetRow.resolution_status,
        editedAt: new Date().toISOString()
      }
    }),
    parsed: reparsed,
    fieldSources: updatedFieldSources,
    fieldConfidences: updatedFieldConfidences,
    warnings,
    forcedResolutionStatus: undefined,
    forcedErrorMessage: undefined
  });

  return ok(env.API_VERSION, {
    importId: params.importId,
    rowId: params.rowId,
    status: 'row_updated',
    beforeStatus: targetRow.resolution_status,
    afterStatus: updatedRows.previewRowMap[params.rowId]?.resolutionStatus || targetRow.resolution_status,
    nextStep: `/v1/imports/${params.importId}/preview`
  });
}

export async function postImportResolveDuplicate(request: Request, env: Env, params: Record<string, string>): Promise<Response> {
  const session = await requireImportSession(request, env);
  if (session instanceof Response) return session;
  const importRecord = await findOwnedImport(env, session.userId, params.importId);
  if (importRecord instanceof Response) return importRecord;
  if (importRecord.status === 'COMMITTED') return fail(env.API_VERSION, 'import_already_committed', 'Esta importação já foi commitada.', 409);

  const body = await readJson<Record<string, unknown>>(request).catch((): Record<string, unknown> => ({}));
  const action = String(body.action || '');
  if (!['keep_current', 'replace_existing', 'consolidate', 'ignore_import'].includes(action)) {
    return fail(env.API_VERSION, 'invalid_duplicate_action', 'Ação de duplicidade inválida.', 400);
  }

  const rows = await findImportRows(env, params.importId);
  const targetRow = rows.find((row) => row.id === params.rowId);
  if (!targetRow) return fail(env.API_VERSION, 'row_not_found', 'Linha do preview não encontrada.', 404);

  const normalized = parseJson(targetRow.normalized_payload_json, {});
  const warnings = Array.isArray(normalized.warnings) ? normalized.warnings : [];
  const reparsed = normalizeManualEntry(mapNormalizedToEditablePayload(normalized, parseJson(targetRow.source_payload_json, {})), targetRow.row_number);
  const forcedResolutionStatus = action === 'replace_existing' ? 'RESOLVED_REPLACE' : action === 'consolidate' ? 'RESOLVED_CONSOLIDATE' : 'IGNORED';

  const updatedRows = await rebuildRowsAfterMutation(env, params.importId, session.portfolioId, rows, params.rowId, {
    rowId: targetRow.id,
    rowNumber: targetRow.row_number,
    sourcePayloadJson: targetRow.source_payload_json || '{}',
    normalizedPayloadJson: JSON.stringify({
      ...normalized,
      sourceKind: reparsed.sourceKind,
      code: reparsed.code,
      name: reparsed.name,
      normalizedName: reparsed.normalizedName,
      quantity: reparsed.quantity,
      investedAmount: reparsed.investedAmount,
      currentAmount: reparsed.currentAmount,
      averagePrice: reparsed.averagePrice,
      currentPrice: reparsed.currentPrice,
      categoryLabel: reparsed.categoryLabel,
      notes: reparsed.notes,
      reviewMeta: {
        ...(typeof normalized.reviewMeta === 'object' && normalized.reviewMeta !== null ? normalized.reviewMeta : {}),
        duplicateResolution: action,
        beforeResolutionStatus: targetRow.resolution_status,
        resolvedAt: new Date().toISOString()
      }
    }),
    parsed: reparsed,
    fieldSources: normalized.fieldSources || {},
    fieldConfidences: normalized.fieldConfidences || {},
    warnings,
    forcedResolutionStatus,
    forcedErrorMessage: null
  });

  return ok(env.API_VERSION, {
    importId: params.importId,
    rowId: params.rowId,
    status: 'duplicate_resolved',
    action,
    beforeStatus: targetRow.resolution_status,
    afterStatus: updatedRows.previewRowMap[params.rowId]?.resolutionStatus || forcedResolutionStatus,
    nextStep: `/v1/imports/${params.importId}/preview`
  });
}

async function startManualImportWithPayload(request: Request, env: Env, payload: Record<string, unknown>): Promise<Response> {
  const session = await requireImportSession(request, env);
  if (session instanceof Response) return session;
  const origin = typeof payload.origin === 'string' ? payload.origin : ORIGIN_MANUAL_ENTRY;
  if (origin !== ORIGIN_MANUAL_ENTRY) return fail(env.API_VERSION, 'unsupported_origin', 'Nesta etapa só MANUAL_ENTRY é suportado neste fluxo.', 400);
  const entries = Array.isArray(payload.entries) ? payload.entries : [];
  if (!entries.length) return fail(env.API_VERSION, 'missing_entries', 'Envie ao menos um ativo manual.', 400);
  return await persistNormalizedImport(env, session, origin, { entries: entries.map((entry, index) => ({ raw: entry, rowNumber: index + 1, parsed: normalizeManualEntry(entry, index + 1), fieldSources: {}, fieldConfidences: {}, warnings: [] })), documentMeta: null, importable: true });
}

async function startCustomTemplateImport(request: Request, env: Env, payload?: Record<string, unknown>): Promise<Response> {
  const session = await requireImportSession(request, env);
  if (session instanceof Response) return session;
  const body = payload || await readJson<Record<string, unknown>>(request).catch((): Record<string, unknown> => ({}));
  const csvContent = typeof body.csvContent === 'string' ? body.csvContent : '';
  const fileName = normalizeText(body.fileName);
  const mimeType = normalizeText(body.mimeType);
  if (!csvContent.trim()) return fail(env.API_VERSION, 'missing_csv_content', 'Envie o conteúdo CSV do template próprio.', 400);
  const parsed = parseCsv(csvContent);
  if (!parsed.headers.length) return fail(env.API_VERSION, 'invalid_csv', 'CSV vazio ou inválido.', 400);
  const headerError = validateTemplateHeaders(parsed.headers);
  if (headerError) return fail(env.API_VERSION, 'invalid_template_headers', headerError, 400);
  if (!parsed.rows.length) return fail(env.API_VERSION, 'missing_template_rows', 'O template não possui linhas de ativos.', 400);
  return await persistNormalizedImport(env, session, ORIGIN_CUSTOM_TEMPLATE, {
    entries: parsed.rows.map((row, index) => {
      const raw = mapTemplateRowToRawEntry(row);
      return { raw, rowNumber: index + 1, parsed: normalizeManualEntry(raw, index + 1), fieldSources: {}, fieldConfidences: {}, warnings: [] };
    }),
    documentMeta: fileName || mimeType ? { fileName, mimeType } : null,
    importable: true,
    fileName: fileName || null,
    mimeType: mimeType || null
  });
}

async function startB3CsvImport(request: Request, env: Env, payload?: Record<string, unknown>): Promise<Response> {
  const session = await requireImportSession(request, env);
  if (session instanceof Response) return session;
  const body = payload || await readJson<Record<string, unknown>>(request).catch((): Record<string, unknown> => ({}));
  const csvContent = typeof body.csvContent === 'string' ? body.csvContent : '';
  const fileName = normalizeText(body.fileName);
  const mimeType = normalizeText(body.mimeType);
  if (!csvContent.trim()) return fail(env.API_VERSION, 'missing_csv_content', 'Envie o conteúdo CSV da B3.', 400);
  const parsed = parseCsv(csvContent);
  if (!parsed.headers.length) return fail(env.API_VERSION, 'invalid_csv', 'CSV B3 vazio ou inválido.', 400);
  const headerMap = buildHeaderMap(parsed.headers);
  const headerError = validateB3Headers(headerMap);
  if (headerError) return fail(env.API_VERSION, 'invalid_b3_headers', headerError, 400);
  if (!parsed.rows.length) return fail(env.API_VERSION, 'missing_b3_rows', 'O CSV da B3 não possui linhas de posição.', 400);
  return await persistNormalizedImport(env, session, ORIGIN_B3_CSV, {
    entries: parsed.rows.map((row, index) => {
      const raw = mapB3RowToRawEntry(row, headerMap);
      return { raw, rowNumber: index + 1, parsed: normalizeManualEntry(raw, index + 1), fieldSources: {}, fieldConfidences: {}, warnings: [] };
    }),
    documentMeta: fileName || mimeType ? { fileName, mimeType } : null,
    importable: true,
    fileName: fileName || null,
    mimeType: mimeType || null
  });
}

async function startDocumentAiImport(request: Request, env: Env, payload?: Record<string, unknown>): Promise<Response> {
  const session = await requireImportSession(request, env);
  if (session instanceof Response) return session;
  const body = payload || await readJson<Record<string, unknown>>(request).catch((): Record<string, unknown> => ({}));
  const fileName = normalizeText(body.fileName);
  const mimeType = normalizeText(body.mimeType);
  const documentType = normalizeText(body.documentType);
  const parserMode = normalizeText(body.parserMode) || 'hybrid';
  const documentConfidence = normalizeNumber(body.confidence);
  const extractedEntries = Array.isArray(body.entries) ? body.entries : [];
  const importable = IMPORTABLE_DOCUMENT_TYPES.includes(documentType);
  if (!fileName || !mimeType) return fail(env.API_VERSION, 'missing_document_metadata', 'Envie fileName e mimeType do documento.', 400);
  if (!['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(mimeType)) return fail(env.API_VERSION, 'unsupported_document_type', 'Tipo de arquivo não suportado nesta etapa.', 400);
  if (!documentType) return fail(env.API_VERSION, 'missing_document_type', 'O extrator deve identificar o tipo do documento.', 400);
  if (!extractedEntries.length) return fail(env.API_VERSION, 'missing_extracted_entries', 'O extrator não devolveu entradas estruturadas.', 400);
  return await persistNormalizedImport(env, session, ORIGIN_DOCUMENT_AI_PARSE, { entries: extractedEntries.map((entry, index) => { const row = typeof entry === 'object' && entry !== null ? entry as Record<string, unknown> : {}; const raw = { tipo: row.sourceKind, codigo: row.code, nome: row.name, quantidade: row.quantity, valor_investido: row.investedAmount, valor_atual: row.currentAmount, categoria: row.categoryLabel, observacoes: row.notes }; return { raw, rowNumber: index + 1, parsed: normalizeManualEntry(raw, index + 1), fieldSources: normalizeFieldMap(row.sourceTrace, 'source'), fieldConfidences: normalizeFieldMap(row.sourceTrace, 'confidence'), warnings: Array.isArray(row.warnings) ? row.warnings.map((item) => String(item)) : [] }; }), documentMeta: { fileName, mimeType, documentType, parserMode, confidence: documentConfidence }, importable });
}

async function persistNormalizedImport(
  env: Env,
  session: { userId: string; portfolioId: string },
  origin: string,
  input: {
    entries: Array<{
      raw: unknown;
      rowNumber: number;
      parsed: ReturnType<typeof normalizeManualEntry>;
      fieldSources: Record<string, unknown>;
      fieldConfidences: Record<string, unknown>;
      warnings: string[];
    }>;
    documentMeta: Record<string, unknown> | null;
    importable: boolean;
    fileName?: string | null;
    mimeType?: string | null;
  }
): Promise<Response> {
  const previewRows = await buildPreviewRows(env, session.portfolioId, input.entries.map((entry) => ({ id: buildEntityId('imr'), rowNumber: entry.rowNumber, sourcePayloadJson: JSON.stringify(entry.raw), normalizedPayloadJson: JSON.stringify({ sourceKind: entry.parsed.sourceKind, code: entry.parsed.code, name: entry.parsed.name, normalizedName: entry.parsed.normalizedName, quantity: entry.parsed.quantity, investedAmount: entry.parsed.investedAmount, currentAmount: entry.parsed.currentAmount, averagePrice: entry.parsed.averagePrice, currentPrice: entry.parsed.currentPrice, categoryLabel: entry.parsed.categoryLabel, notes: entry.parsed.notes, fieldSources: entry.fieldSources, fieldConfidences: entry.fieldConfidences, warnings: entry.warnings, documentMeta: input.documentMeta, importable: input.importable }), parsed: entry.parsed, fieldSources: entry.fieldSources, fieldConfidences: entry.fieldConfidences, warnings: entry.warnings })), input.importable);
  const importId = buildEntityId('imp');
  const status = previewRows.totals.invalidRows === 0 && previewRows.totals.duplicateRows === 0 ? 'PREVIEW_READY' : 'PROCESSING';
  await createImportRecord(env, {
    importId,
    userId: session.userId,
    portfolioId: session.portfolioId,
    status,
    origin,
    fileName: input.fileName ?? null,
    mimeType: input.mimeType ?? null,
    totalRows: previewRows.totals.totalRows,
    validRows: previewRows.totals.validRows,
    invalidRows: previewRows.totals.invalidRows,
    duplicateRows: previewRows.totals.duplicateRows
  });
  await replaceImportRows(env, importId, previewRows.rows.map((row) => ({ id: row.id, rowNumber: row.rowNumber, sourcePayloadJson: row.sourcePayloadJson, normalizedPayloadJson: row.normalizedPayloadJson, resolutionStatus: row.resolutionStatus, errorMessage: row.errorMessage })));

  await recordOperationalEvent(env, {
    userId: session.userId,
    portfolioId: session.portfolioId,
    eventType: 'import_created',
    status: 'ok',
    message: 'Importacao criada.',
    details: {
      importId,
      origin,
      status,
      totals: previewRows.totals,
      importable: input.importable
    }
  });

  return ok(env.API_VERSION, { importId, status: 'pending_preview', nextStep: `/v1/imports/${importId}/preview`, totals: previewRows.totals, document: input.documentMeta, importable: input.importable });
}

export async function getManualImportPreview(request: Request, env: Env, params: Record<string, string>): Promise<Response> {
  const session = await requireImportSession(request, env); if (session instanceof Response) return session;
  const importRecord = await findOwnedImport(env, session.userId, params.importId); if (importRecord instanceof Response) return importRecord;
  const rows = await findImportRows(env, params.importId);
  const hasCriticalPending = rows.some((row) => row.resolution_status === 'PENDING_CRITICAL' || row.resolution_status === 'BLOCKED_NON_IMPORTABLE');
  const documentMeta = rows.length ? parseJson(rows[0].normalized_payload_json, {}).documentMeta || null : null;
  const importable = rows.length ? Boolean(parseJson(rows[0].normalized_payload_json, {}).importable ?? true) : true;
  return ok(env.API_VERSION, { importId: params.importId, status: importRecord.status, origin: importRecord.origin, totals: { totalRows: importRecord.total_rows, validRows: importRecord.valid_rows, invalidRows: importRecord.invalid_rows, duplicateRows: importRecord.duplicate_rows }, readyToCommit: importRecord.status !== 'COMMITTED' && !hasCriticalPending && importRecord.invalid_rows === 0 && importRecord.duplicate_rows === 0, document: documentMeta, importable, rows: rows.map((row) => { const normalized = parseJson(row.normalized_payload_json, {}); return { id: row.id, rowNumber: row.row_number, source: parseJson(row.source_payload_json, {}), normalized, resolutionStatus: row.resolution_status, errorMessage: row.error_message, fieldSources: normalized.fieldSources || {}, fieldConfidences: normalized.fieldConfidences || {}, warnings: normalized.warnings || [], reviewMeta: normalized.reviewMeta || {} }; }) });
}

export async function commitManualImport(request: Request, env: Env, params: Record<string, string>): Promise<Response> {
  const session = await requireImportSession(request, env); if (session instanceof Response) return session;
  const importRecord = await findOwnedImport(env, session.userId, params.importId); if (importRecord instanceof Response) return importRecord;
  if (importRecord.status === 'COMMITTED') return fail(env.API_VERSION, 'import_already_committed', 'Esta importação já foi commitada.', 409);
  const rows = await findImportRows(env, params.importId);
  const hasBlockingIssue = rows.some((row) => !COMMIT_ALLOWED_STATUSES.includes(row.resolution_status));
  if (hasBlockingIssue || importRecord.invalid_rows > 0 || importRecord.duplicate_rows > 0) return fail(env.API_VERSION, 'preview_not_consistent', 'O preview ainda possui pendências e não pode ser commitado.', 409);
  const createdAssets: Array<{ assetId: string; quantity: number; currentPrice: number | null; currentValue: number }> = [];
  let totalEquity = 0; let totalInvested = 0;
  for (const row of rows) {
    if (row.resolution_status === 'IGNORED') continue;
    const normalized = parseJson(row.normalized_payload_json, {}) as Record<string, unknown>;
    const sourceKind = String(normalized.sourceKind || ''); const code = String(normalized.code || ''); const name = String(normalized.name || ''); const normalizedName = String(normalized.normalizedName || ''); let quantity = Number(normalized.quantity || 0); let investedAmount = Number(normalized.investedAmount || 0); let currentAmount = Number(normalized.currentAmount || 0); let averagePrice = Number(normalized.averagePrice || 0); let currentPrice = normalized.currentPrice == null ? null : Number(normalized.currentPrice); const categoryLabel = String(normalized.categoryLabel || ''); const notes = String(normalized.notes || '');
    const assetType = await findAssetTypeByCode(env, mapSourceKindToAssetTypeCode(sourceKind)); if (!assetType) return fail(env.API_VERSION, 'asset_type_not_found', 'Tipo de ativo não encontrado para commit manual.', 500);
    let asset = await findAssetByNormalizedNameOrCode(env, normalizedName, code);
    if (!asset) { const assetId = buildEntityId('ast'); await createAsset(env, { assetId, assetTypeId: assetType.id, code, name, normalizedName }); asset = { id: assetId, code, name }; }
    if (row.resolution_status === 'RESOLVED_REPLACE' || row.resolution_status === 'RESOLVED_CONSOLIDATE') {
      const duplicates = await findActivePositionDuplicates(env, session.portfolioId, normalizedName, code);
      if (duplicates.length) {
        if (row.resolution_status === 'RESOLVED_CONSOLIDATE') {
          quantity += duplicates.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
          investedAmount += duplicates.reduce((sum, item) => sum + Number(item.invested_amount || 0), 0);
          currentAmount += duplicates.reduce((sum, item) => sum + Number(item.current_amount || 0), 0);
          averagePrice = quantity > 0 ? investedAmount / quantity : averagePrice;
          currentPrice = quantity > 0 ? currentAmount / quantity : currentPrice;
        }
        await archivePortfolioPositions(env, duplicates.map((item) => item.id), row.resolution_status === 'RESOLVED_REPLACE' ? 'replaced_by_import' : 'consolidated_by_import');
      }
    }
    const positionId = buildEntityId('pos'); await createPortfolioPosition(env, { positionId, portfolioId: session.portfolioId, assetId: asset.id, sourceKind, quantity, averagePrice, currentPrice, investedAmount, currentAmount, categoryLabel, notes });
    createdAssets.push({ assetId: asset.id, quantity, currentPrice, currentValue: currentAmount }); totalEquity += currentAmount; totalInvested += investedAmount;
  }
  const totalProfitLoss = totalEquity - totalInvested; const totalProfitLossPct = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0; const snapshotId = buildEntityId('snp'); const referenceDate = new Date().toISOString().slice(0, 10);
  await createPortfolioSnapshot(env, { snapshotId, portfolioId: session.portfolioId, importId: params.importId, referenceDate, totalEquity, totalInvested, totalProfitLoss, totalProfitLossPct });
  for (const asset of createdAssets) await createSnapshotPosition(env, { snapshotPositionId: buildEntityId('sps'), snapshotId, assetId: asset.assetId, quantity: asset.quantity, unitPrice: asset.currentPrice, currentValue: asset.currentValue });
  await updateImportRecord(env, { importId: params.importId, status: 'COMMITTED', totalRows: importRecord.total_rows, validRows: importRecord.valid_rows, invalidRows: importRecord.invalid_rows, duplicateRows: importRecord.duplicate_rows, finishedAt: true });

  // Release 0.1: gera analise deterministica imediatamente apos o commit (sem IA).
  const analysisResult = await generateDeterministicAnalysisForSnapshot(env, {
    userId: session.userId,
    portfolioId: session.portfolioId,
    snapshotId,
    importId: params.importId,
    totals: { totalEquity, totalInvested, totalProfitLoss, totalProfitLossPct },
    createdAssets
  });

  await recordOperationalEvent(env, {
    userId: session.userId,
    portfolioId: session.portfolioId,
    eventType: 'import_committed',
    status: 'ok',
    message: 'Importacao commitada e snapshot criado.',
    details: {
      importId: params.importId,
      snapshotId,
      analysisId: analysisResult.analysisId,
      affectedPositions: createdAssets.length,
      totals: { totalEquity, totalInvested, totalProfitLoss, totalProfitLossPct }
    }
  });

  return ok(env.API_VERSION, { importId: params.importId, status: 'committed', createdSnapshotId: snapshotId, affectedPositions: createdAssets.length, nextStep: '/history/snapshots' });
}

export async function downloadCustomTemplate(_request: Request): Promise<Response> {
  const csv = [
    TEMPLATE_HEADERS.join(','),
    'ACOES,PETR4,Petrobras PN,100,3200.00,3510.00,Ações,Exemplo',
    'FUNDOS,,XP Selection Multimercado,1,42022.73,43810.20,Fundos,Exemplo'
  ].join('\n');
  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': 'attachment; filename="esquilo_template_csv_v1.csv"'
    }
  });
}

async function requireImportSession(request: Request, env: Env): Promise<{ userId: string; portfolioId: string } | Response> {
  const token = readCookie(request.headers.get('cookie') || '', AUTH_COOKIE_NAME); if (!token) return fail(env.API_VERSION, 'unauthorized', 'Sessão não encontrada.', 401);
  const tokenHash = await hashToken(token); const session = await findImportSessionStateByTokenHash(env, tokenHash); if (!session) return fail(env.API_VERSION, 'unauthorized', 'Sessão inválida.', 401); if (!session.hasContext) return ok(env.API_VERSION, { screenState: 'redirect_onboarding', redirectTo: '/onboarding' }); if (!session.portfolioId) return fail(env.API_VERSION, 'portfolio_not_found', 'Carteira principal não encontrada.', 404); return { userId: session.userId, portfolioId: session.portfolioId };
}

async function findOwnedImport(env: Env, userId: string, importId: string) { const importRecord = await findOwnedImportById(env, userId, importId); if (!importRecord) return fail(env.API_VERSION, 'import_not_found', 'Importação não encontrada.', 404); return importRecord; }

async function buildPreviewRows(env: Env, portfolioId: string, entries: Array<{ id: string; rowNumber: number; sourcePayloadJson: string; normalizedPayloadJson: string; parsed: ReturnType<typeof normalizeManualEntry>; fieldSources: Record<string, unknown>; fieldConfidences: Record<string, unknown>; warnings: string[] }>, importable: boolean) {
  const rows: Array<{ id: string; rowNumber: number; sourcePayloadJson: string; normalizedPayloadJson: string; resolutionStatus: string; errorMessage: string | null }> = [];
  let validRows = 0; let invalidRows = 0; let duplicateRows = 0; let criticalRows = 0;
  for (const entry of entries) {
    const normalized = parseJson(entry.normalizedPayloadJson, {});
    const duplicates = entry.parsed.normalizedName ? await findManualDuplicateCandidates(env, portfolioId, entry.parsed.normalizedName, entry.parsed.code) : [];
    const criticalWarnings = entry.warnings.filter((item) => item.toLowerCase().includes('critical') || item.toLowerCase().includes('pendencia critica'));
    const lowConfidenceCritical = Object.entries(entry.fieldConfidences).some(([key, value]) => ['sourceKind', 'name', 'quantity', 'investedAmount', 'currentAmount'].includes(key) && Number(value) > 0 && Number(value) < 0.6);
    let resolutionStatus = 'NORMALIZED'; let errorMessage: string | null = null;
    if (!importable) { resolutionStatus = 'BLOCKED_NON_IMPORTABLE'; errorMessage = 'Documento identificado como não importável para posição de carteira.'; criticalRows += 1; }
    else if (entry.parsed.errors.length) { resolutionStatus = 'FAILED'; errorMessage = entry.parsed.errors.join(' | '); invalidRows += 1; }
    else if (criticalWarnings.length || lowConfidenceCritical) { resolutionStatus = 'PENDING_CRITICAL'; errorMessage = criticalWarnings[0] || 'Há campos críticos com baixa confiança.'; criticalRows += 1; }
    else if (duplicates.length) { resolutionStatus = 'PENDING'; errorMessage = 'Possível duplicidade com ativo já existente na carteira.'; duplicateRows += 1; }
    else { validRows += 1; }
    rows.push({ id: entry.id, rowNumber: entry.rowNumber, sourcePayloadJson: entry.sourcePayloadJson, normalizedPayloadJson: JSON.stringify({ ...normalized, duplicateCandidates: duplicates, importable }), resolutionStatus, errorMessage });
  }
  return { rows, totals: { totalRows: rows.length, validRows, invalidRows: invalidRows + criticalRows, duplicateRows } };
}

async function rebuildRowsAfterMutation(env: Env, importId: string, portfolioId: string, rows: Array<{ id: string; row_number: number; source_payload_json: string | null; normalized_payload_json: string | null; resolution_status: string; error_message: string | null }>, targetRowId: string, replacement: { rowId: string; rowNumber: number; sourcePayloadJson: string; normalizedPayloadJson: string; parsed: ReturnType<typeof normalizeManualEntry>; fieldSources: Record<string, unknown>; fieldConfidences: Record<string, unknown>; warnings: string[]; forcedResolutionStatus?: string; forcedErrorMessage?: string | null }) {
  const importable = rows.length ? Boolean(parseJson(rows[0].normalized_payload_json, {}).importable ?? true) : true;
  const entries = rows.map((row) => {
    if (row.id === targetRowId) {
      return { id: replacement.rowId, rowNumber: replacement.rowNumber, sourcePayloadJson: replacement.sourcePayloadJson, normalizedPayloadJson: replacement.normalizedPayloadJson, parsed: replacement.parsed, fieldSources: replacement.fieldSources, fieldConfidences: replacement.fieldConfidences, warnings: replacement.warnings, forcedResolutionStatus: replacement.forcedResolutionStatus, forcedErrorMessage: replacement.forcedErrorMessage };
    }
    const normalized = parseJson(row.normalized_payload_json, {});
    const source = parseJson(row.source_payload_json, {});
    const parsed = normalizeManualEntry(mapNormalizedToEditablePayload(normalized, source), row.row_number);
    return { id: row.id, rowNumber: row.row_number, sourcePayloadJson: row.source_payload_json || '{}', normalizedPayloadJson: row.normalized_payload_json || '{}', parsed, fieldSources: normalized.fieldSources || {}, fieldConfidences: normalized.fieldConfidences || {}, warnings: Array.isArray(normalized.warnings) ? normalized.warnings : [], forcedResolutionStatus: undefined, forcedErrorMessage: undefined };
  });
  const rebuilt = await buildPreviewRows(env, portfolioId, entries.map((entry) => ({ id: entry.id, rowNumber: entry.rowNumber, sourcePayloadJson: entry.sourcePayloadJson, normalizedPayloadJson: entry.normalizedPayloadJson, parsed: entry.parsed, fieldSources: entry.fieldSources, fieldConfidences: entry.fieldConfidences, warnings: entry.warnings })), importable);
  const finalRows = rebuilt.rows.map((row) => {
    const matching = entries.find((entry) => entry.id === row.id);
    if (matching?.forcedResolutionStatus) {
      row.resolutionStatus = matching.forcedResolutionStatus;
      row.errorMessage = matching.forcedErrorMessage ?? null;
    }
    return row;
  });
  const totals = recomputeTotals(finalRows);
  const status = totals.invalidRows === 0 && totals.duplicateRows === 0 ? 'PREVIEW_READY' : 'PROCESSING';
  await replaceImportRows(env, importId, finalRows.map((row) => ({ id: row.id, rowNumber: row.rowNumber, sourcePayloadJson: row.sourcePayloadJson, normalizedPayloadJson: row.normalizedPayloadJson, resolutionStatus: row.resolutionStatus, errorMessage: row.errorMessage })));
  await updateImportRecord(env, { importId, status, totalRows: totals.totalRows, validRows: totals.validRows, invalidRows: totals.invalidRows, duplicateRows: totals.duplicateRows });
  return { rows: finalRows, totals, previewRowMap: Object.fromEntries(finalRows.map((row) => [row.id, row])) as Record<string, { resolutionStatus: string }> };
}

function recomputeTotals(rows: Array<{ resolutionStatus: string }>) { let validRows = 0; let invalidRows = 0; let duplicateRows = 0; for (const row of rows) { if (row.resolutionStatus === 'PENDING') duplicateRows += 1; else if (['FAILED', 'PENDING_CRITICAL', 'BLOCKED_NON_IMPORTABLE'].includes(row.resolutionStatus)) invalidRows += 1; else validRows += 1; } return { totalRows: rows.length, validRows, invalidRows, duplicateRows }; }

async function findActivePositionDuplicates(env: Env, portfolioId: string, normalizedName: string, code: string) {
  const result = await env.DB.prepare(`SELECT pp.id, pp.asset_id, pp.quantity, pp.invested_amount, pp.current_amount FROM portfolio_positions pp JOIN assets a ON a.id = pp.asset_id WHERE pp.portfolio_id = ? AND pp.status = 'active' AND (a.normalized_name = ? OR (? <> '' AND a.code = ?))`).bind(portfolioId, normalizedName, code, code).all<{ id: string; asset_id: string; quantity: number | null; invested_amount: number | null; current_amount: number | null }>();
  return result.results || [];
}

async function archivePortfolioPositions(env: Env, positionIds: string[], status: string) { for (const id of positionIds) await env.DB.prepare(`UPDATE portfolio_positions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).bind(status, id).run(); }

function mapNormalizedToEditablePayload(normalized: Record<string, any>, source: Record<string, unknown>) { return { tipo: normalized.sourceKind ?? source.tipo ?? '', codigo: normalized.code ?? source.codigo ?? '', nome: normalized.name ?? source.nome ?? '', quantidade: normalized.quantity ?? source.quantidade ?? '', valor_investido: normalized.investedAmount ?? source.valor_investido ?? '', valor_atual: normalized.currentAmount ?? source.valor_atual ?? '', categoria: normalized.categoryLabel ?? source.categoria ?? '', observacoes: normalized.notes ?? source.observacoes ?? '' }; }
function mapEditableKeyToNormalizedKey(key: string): string { if (key === 'tipo' || key === 'sourceKind') return 'sourceKind'; if (key === 'codigo' || key === 'code') return 'code'; if (key === 'nome' || key === 'name') return 'name'; if (key === 'quantidade' || key === 'quantity') return 'quantity'; if (key === 'valor_investido' || key === 'investedAmount') return 'investedAmount'; if (key === 'valor_atual' || key === 'currentAmount') return 'currentAmount'; if (key === 'categoria' || key === 'categoryLabel') return 'categoryLabel'; if (key === 'observacoes' || key === 'notes') return 'notes'; return ''; }
function normalizeManualEntry(value: unknown, rowNumber: number) { const source = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}; const sourceKind = normalizeSourceKind(source.sourceKind ?? source.tipo); const code = normalizeText(source.code ?? source.codigo).toUpperCase(); const name = normalizeText(source.name ?? source.nome ?? source.produto); const normalizedName = normalizeName(name || code); const quantity = normalizeNumber(source.quantity ?? source.quantidade); const explicitInvestedAmount = normalizeNumber(source.investedAmount ?? source.valor_investido); const averagePriceFromSource = normalizeNumber(source.preco_medio); const investedAmount = explicitInvestedAmount > 0 ? explicitInvestedAmount : quantity > 0 ? averagePriceFromSource * quantity : 0; const currentAmount = normalizeNumber(source.currentAmount ?? source.valor_atual); const averagePrice = quantity > 0 ? investedAmount / quantity : averagePriceFromSource; const currentPrice = quantity > 0 ? currentAmount / quantity : null; const categoryLabel = normalizeText(source.categoryLabel ?? source.categoria) || mapCategoryLabel(sourceKind); const notes = normalizeText(source.notes ?? source.observacoes); const errors: string[] = []; if (!sourceKind) errors.push(`Linha ${rowNumber}: tipo inválido.`); if (!name && !code) errors.push(`Linha ${rowNumber}: informe nome ou código.`); if (quantity <= 0) errors.push(`Linha ${rowNumber}: quantidade deve ser maior que zero.`); if (investedAmount <= 0) errors.push(`Linha ${rowNumber}: valor investido deve ser maior que zero.`); if (currentAmount < 0) errors.push(`Linha ${rowNumber}: valor atual não pode ser negativo.`); return { sourceKind, code, name: name || code, normalizedName, quantity, investedAmount, currentAmount, averagePrice, currentPrice, categoryLabel, notes, errors }; }
function normalizeFieldMap(sourceTrace: unknown, mode: 'source' | 'confidence'): Record<string, unknown> { if (typeof sourceTrace !== 'object' || sourceTrace === null) return {}; const trace = sourceTrace as Record<string, unknown>; const fieldMap = trace.fieldMap; if (typeof fieldMap !== 'object' || fieldMap === null) return {}; const result: Record<string, unknown> = {}; for (const [key, value] of Object.entries(fieldMap as Record<string, unknown>)) { if (typeof value === 'object' && value !== null) { const record = value as Record<string, unknown>; result[key] = record[mode] ?? (mode === 'source' ? 'manual' : 0); } } return result; }
function parseCsv(csvContent: string): { headers: string[]; rows: string[][] } { const lines = csvContent.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim() !== ''); if (!lines.length) return { headers: [], rows: [] }; const rows = lines.map(parseCsvLine); return { headers: rows[0].map((item) => item.trim()), rows: rows.slice(1) }; }
function parseCsvLine(line: string): string[] { const result: string[] = []; let current = ''; let inQuotes = false; for (let i = 0; i < line.length; i += 1) { const char = line[i]; if (char === '"') { if (inQuotes && line[i + 1] === '"') { current += '"'; i += 1; } else { inQuotes = !inQuotes; } } else if (char === ',' && !inQuotes) { result.push(current); current = ''; } else { current += char; } } result.push(current); return result; }
function validateTemplateHeaders(headers: string[]): string { const normalized = headers.map((item) => item.trim().toLowerCase()); if (normalized.length !== TEMPLATE_HEADERS.length) return `Cabeçalho inválido. Esperado: ${TEMPLATE_HEADERS.join(',')}`; for (let index = 0; index < TEMPLATE_HEADERS.length; index += 1) { if (normalized[index] !== TEMPLATE_HEADERS[index]) return `Cabeçalho inválido. Esperado: ${TEMPLATE_HEADERS.join(',')}`; } return '' }
function buildHeaderMap(headers: string[]): Record<string, number> { const map: Record<string, number> = {}; headers.forEach((header, index) => { map[header.trim().toLowerCase()] = index; }); return map; }
function validateB3Headers(headerMap: Record<string, number>): string { const missing = B3_REQUIRED_HEADERS.filter((header) => !(header in headerMap)); return missing.length ? `Layout B3 inválido. Colunas obrigatórias ausentes: ${missing.join(',')}` : ''; }
function mapTemplateRowToRawEntry(row: string[]): Record<string, unknown> { const values = [...row]; while (values.length < TEMPLATE_HEADERS.length) values.push(''); return { tipo: values[0] || '', codigo: values[1] || '', nome: values[2] || '', quantidade: values[3] || '', valor_investido: values[4] || '', valor_atual: values[5] || '', categoria: values[6] || '', observacoes: values[7] || '' }; }
function mapB3RowToRawEntry(row: string[], headerMap: Record<string, number>): Record<string, unknown> { const codigo = getCsvValue(row, headerMap, 'codigo'); const produto = getCsvValue(row, headerMap, 'produto'); const quantidade = getCsvValue(row, headerMap, 'quantidade'); const precoMedio = getCsvValue(row, headerMap, 'preco_medio'); const valorAtual = getCsvValue(row, headerMap, 'valor_atual'); const tipo = inferB3SourceKind({ codigo, produto, tipo: getCsvValue(row, headerMap, 'tipo'), categoria: getCsvValue(row, headerMap, 'categoria') }); return { tipo, codigo, nome: produto, quantidade, preco_medio: precoMedio, valor_atual: valorAtual, categoria: mapCategoryLabel(tipo), observacoes: 'Importado de CSV B3' }; }
function getCsvValue(row: string[], headerMap: Record<string, number>, key: string): string { const index = headerMap[key]; return index == null ? '' : (row[index] || '').trim(); }
function inferB3SourceKind(input: { codigo: string; produto: string; tipo: string; categoria: string }): string { const explicit = normalizeSourceKind(input.tipo || input.categoria); if (explicit) return explicit; const raw = `${input.codigo} ${input.produto}`.toLowerCase(); if (raw.includes('previd') || raw.includes('vgbl') || raw.includes('pgbl')) return 'PREVIDENCIA'; if (raw.includes('fundo') || raw.includes('fic') || raw.includes('fia') || raw.includes('multimercado') || raw.includes('di ')) return 'FUNDOS'; return 'ACOES'; }
function normalizeSourceKind(value: unknown): string { const raw = normalizeText(value).toUpperCase(); return VALID_SOURCE_KINDS.includes(raw) ? raw : ''; }
function normalizeText(value: unknown): string { return typeof value === 'string' ? value.trim() : ''; }
function normalizeNumber(value: unknown): number { if (typeof value === 'number' && Number.isFinite(value)) return value; if (typeof value === 'string' && value.trim() !== '') { const sanitized = value.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, ''); const parsed = Number(sanitized); if (!Number.isNaN(parsed)) return parsed; } return 0; }
function normalizeName(value: string): string { return value.trim().toLowerCase(); }
function mapSourceKindToAssetTypeCode(sourceKind: string): string { if (sourceKind === 'ACOES') return 'STOCK'; if (sourceKind === 'FUNDOS') return 'FUND'; return 'PENSION'; }
function mapCategoryLabel(sourceKind: string): string { if (sourceKind === 'ACOES') return 'Ações'; if (sourceKind === 'FUNDOS') return 'Fundos'; return 'Previdência'; }
function parseJson(value: unknown, fallback: Record<string, any>) { if (typeof value !== 'string' || !value.trim()) return fallback; try { return JSON.parse(value); } catch { return fallback; } }
function readCookie(cookieHeader: string, cookieName: string): string { const prefix = `${cookieName}=`; const match = cookieHeader.split(';').map((item) => item.trim()).find((item) => item.startsWith(prefix)); return match ? decodeURIComponent(match.slice(prefix.length)) : ''; }
