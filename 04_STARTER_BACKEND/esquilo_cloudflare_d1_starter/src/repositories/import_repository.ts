import type { Env } from '../types/env';
import { d1 } from '../lib/d1';

export interface ImportSessionState {
  userId: string;
  portfolioId: string | null;
  hasContext: number;
}

export interface ImportRecordRow {
  id: string;
  user_id: string;
  portfolio_id: string | null;
  status: string;
  origin: string;
  file_name?: string | null;
  mime_type?: string | null;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  duplicate_rows: number;
  created_at?: string;
  started_at?: string;
  updated_at?: string | null;
  finished_at?: string | null;
}

export interface ImportPreviewRow {
  id: string;
  row_number: number;
  source_payload_json: string | null;
  normalized_payload_json: string | null;
  resolution_status: string;
  error_message: string | null;
}

export interface DuplicateCandidateRow {
  asset_id: string;
  asset_code: string | null;
  asset_name: string;
  quantity: number | null;
  invested_amount: number | null;
  current_amount: number | null;
}

export async function findImportSessionStateByTokenHash(env: Env, tokenHash: string): Promise<ImportSessionState | null> {
  return await d1(env).first<ImportSessionState>(
    `SELECT
       s.user_id AS userId,
       p.id AS portfolioId,
       CASE
         WHEN c.onboarding_completed_at IS NOT NULL THEN 1
         ELSE 0
       END AS hasContext
     FROM auth_sessions s
     LEFT JOIN portfolios p ON p.user_id = s.user_id AND p.is_primary = 1
     LEFT JOIN user_financial_context c ON c.user_id = s.user_id
     WHERE s.session_token_hash = ?
       AND s.revoked_at IS NULL
       AND s.expires_at > CURRENT_TIMESTAMP
     LIMIT 1`,
    [tokenHash]
  );
}

export async function createImportRecord(env: Env, input: {
  importId: string;
  userId: string;
  portfolioId: string;
  status: string;
  origin: string;
  fileName?: string | null;
  mimeType?: string | null;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
}): Promise<void> {
  await d1(env).run(
    `INSERT INTO imports (
      id, user_id, portfolio_id, status, origin, file_name, mime_type, total_rows, valid_rows, invalid_rows, duplicate_rows, created_at, started_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      input.importId,
      input.userId,
      input.portfolioId,
      input.status,
      input.origin,
      input.fileName ?? null,
      input.mimeType ?? null,
      input.totalRows,
      input.validRows,
      input.invalidRows,
      input.duplicateRows
    ]
  );
}

export async function updateImportRecord(env: Env, input: {
  importId: string;
  status: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  finishedAt?: boolean;
}): Promise<void> {
  await d1(env).run(
    `UPDATE imports
     SET status = ?,
         total_rows = ?,
         valid_rows = ?,
         invalid_rows = ?,
         duplicate_rows = ?,
         finished_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE finished_at END
     WHERE id = ?`,
    [input.status, input.totalRows, input.validRows, input.invalidRows, input.duplicateRows, input.finishedAt ? 1 : 0, input.importId]
  );
}

export async function cancelImportRecord(env: Env, importId: string): Promise<void> {
  await d1(env).run(
    `UPDATE imports
     SET status = 'CANCELLED',
         updated_at = CURRENT_TIMESTAMP,
         finished_at = COALESCE(finished_at, CURRENT_TIMESTAMP)
     WHERE id = ?
       AND status <> 'COMMITTED'`,
    [importId]
  );
}

export async function replaceImportRows(env: Env, importId: string, rows: Array<{
  id: string;
  rowNumber: number;
  sourcePayloadJson: string;
  normalizedPayloadJson: string;
  resolutionStatus: string;
  errorMessage: string | null;
}>): Promise<void> {
  await d1(env).run(`DELETE FROM import_rows WHERE import_id = ?`, [importId]);
  for (const row of rows) {
    await d1(env).run(
      `INSERT INTO import_rows (
        id, import_id, row_number, source_payload_json, normalized_payload_json, resolution_status, error_message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [row.id, importId, row.rowNumber, row.sourcePayloadJson, row.normalizedPayloadJson, row.resolutionStatus, row.errorMessage]
    );
  }
}

export async function findImportById(env: Env, importId: string): Promise<ImportRecordRow | null> {
  return await d1(env).first<ImportRecordRow>(
    `SELECT id,
            user_id,
            portfolio_id,
            status,
            origin,
            file_name,
            mime_type,
            total_rows,
            valid_rows,
            invalid_rows,
            duplicate_rows,
            created_at,
            started_at,
            updated_at,
            finished_at
     FROM imports
     WHERE id = ?
     LIMIT 1`,
    [importId]
  );
}

export async function findOwnedImportById(env: Env, userId: string, importId: string): Promise<ImportRecordRow | null> {
  return await d1(env).first<ImportRecordRow>(
    `SELECT id,
            user_id,
            portfolio_id,
            status,
            origin,
            file_name,
            mime_type,
            total_rows,
            valid_rows,
            invalid_rows,
            duplicate_rows,
            created_at,
            started_at,
            updated_at,
            finished_at
     FROM imports
     WHERE id = ?
       AND user_id = ?
     LIMIT 1`,
    [importId, userId]
  );
}

export async function findLatestSnapshotByOwnedImportId(env: Env, userId: string, importId: string) {
  return await d1(env).first<{
    id: string;
    reference_date: string;
    total_equity: number | null;
    total_invested: number | null;
    total_profit_loss: number | null;
    total_profit_loss_pct: number | null;
  }>(
    `SELECT ps.id,
            ps.reference_date,
            ps.total_equity,
            ps.total_invested,
            ps.total_profit_loss,
            ps.total_profit_loss_pct
     FROM portfolio_snapshots ps
     JOIN imports i
       ON i.id = ps.import_id
      AND i.user_id = ?
     WHERE ps.import_id = ?
     ORDER BY ps.created_at DESC
     LIMIT 1`,
    [userId, importId]
  );
}

export async function findImportRows(env: Env, importId: string): Promise<ImportPreviewRow[]> {
  return await d1(env).all<ImportPreviewRow>(
    `SELECT id, row_number, source_payload_json, normalized_payload_json, resolution_status, error_message
     FROM import_rows
     WHERE import_id = ?
     ORDER BY row_number ASC`,
    [importId]
  );
}

export async function findManualDuplicateCandidates(env: Env, portfolioId: string, normalizedName: string, code: string): Promise<DuplicateCandidateRow[]> {
  return await d1(env).all<DuplicateCandidateRow>(
    `SELECT
       pp.asset_id,
       a.code AS asset_code,
       a.name AS asset_name,
       pp.quantity,
       pp.invested_amount,
       pp.current_amount
     FROM portfolio_positions pp
     JOIN assets a ON a.id = pp.asset_id
     WHERE pp.portfolio_id = ?
       AND pp.status = 'active'
       AND (
         a.normalized_name = ?
         OR (? <> '' AND a.code = ?)
       )`,
    [portfolioId, normalizedName, code, code]
  );
}

export async function findAssetTypeByCode(env: Env, code: string): Promise<{ id: string; code: string; name: string } | null> {
  return await d1(env).first<{ id: string; code: string; name: string }>(
    `SELECT id, code, name FROM asset_types WHERE code = ? LIMIT 1`,
    [code]
  );
}

export async function findAssetByNormalizedNameOrCode(env: Env, normalizedName: string, code: string): Promise<{ id: string; code: string | null; name: string } | null> {
  return await d1(env).first<{ id: string; code: string | null; name: string }>(
    `SELECT id, code, name
     FROM assets
     WHERE normalized_name = ? OR (? <> '' AND code = ?)
     LIMIT 1`,
    [normalizedName, code, code]
  );
}

export async function createAsset(env: Env, input: { assetId: string; assetTypeId: string; code: string; name: string; normalizedName: string }): Promise<void> {
  await d1(env).run(
    // Schema Release 0.1: nao existe coluna `is_custom` (evitar mismatch com D1).
    `INSERT INTO assets (id, asset_type_id, code, name, normalized_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [input.assetId, input.assetTypeId, input.code || null, input.name, input.normalizedName]
  );
}

export async function createPortfolioPosition(env: Env, input: {
  positionId: string;
  portfolioId: string;
  assetId: string;
  sourceKind: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number | null;
  investedAmount: number;
  currentAmount: number;
  categoryLabel: string;
  notes: string;
}): Promise<void> {
  await d1(env).run(
    `INSERT INTO portfolio_positions (
      id, portfolio_id, asset_id, source_kind, status, quantity, average_price, current_price, invested_amount, current_amount, category_label, notes, created_at, updated_at
     ) VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      input.positionId,
      input.portfolioId,
      input.assetId,
      input.sourceKind,
      input.quantity,
      input.averagePrice,
      input.currentPrice,
      input.investedAmount,
      input.currentAmount,
      input.categoryLabel,
      input.notes || null
    ]
  );
}

export async function createPortfolioSnapshot(env: Env, input: {
  snapshotId: string;
  portfolioId: string;
  importId: string;
  referenceDate: string;
  totalEquity: number;
  totalInvested: number;
  totalProfitLoss: number;
  totalProfitLossPct: number;
}): Promise<void> {
  await d1(env).run(
    `INSERT INTO portfolio_snapshots (
      id, portfolio_id, import_id, reference_date, total_equity, total_invested, total_profit_loss, total_profit_loss_pct, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [input.snapshotId, input.portfolioId, input.importId, input.referenceDate, input.totalEquity, input.totalInvested, input.totalProfitLoss, input.totalProfitLossPct]
  );
}

export async function createSnapshotPosition(env: Env, input: {
  snapshotPositionId: string;
  snapshotId: string;
  assetId: string;
  quantity: number;
  unitPrice: number | null;
  currentValue: number;
}): Promise<void> {
  await d1(env).run(
    `INSERT INTO portfolio_snapshot_positions (
      id, snapshot_id, asset_id, quantity, unit_price, current_value, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [input.snapshotPositionId, input.snapshotId, input.assetId, input.quantity, input.unitPrice, input.currentValue]
  );
}
