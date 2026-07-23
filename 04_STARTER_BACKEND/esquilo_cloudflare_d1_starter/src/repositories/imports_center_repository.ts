import type { Env } from '../types/env';
import { d1 } from '../lib/d1';

export interface ImportsCenterSessionState {
  userId: string;
  portfolioId: string | null;
  hasContext: number;
}

export interface ImportCenterRow {
  id: string;
  origin: string;
  status: string;
  file_name: string | null;
  mime_type: string | null;
  total_rows: number | null;
  valid_rows: number | null;
  invalid_rows: number | null;
  duplicate_rows: number | null;
  created_at: string;
  updated_at: string | null;
  snapshot_id: string | null;
  reference_date: string | null;
}

export async function findImportsCenterSessionStateByTokenHash(env: Env, tokenHash: string): Promise<ImportsCenterSessionState | null> {
  return await d1(env).first<ImportsCenterSessionState>(
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

export async function findImportsCenterRows(env: Env, userId: string): Promise<ImportCenterRow[]> {
  return await d1(env).all<ImportCenterRow>(
    `SELECT
       i.id,
       i.origin,
       i.status,
       i.file_name,
       i.mime_type,
       i.total_rows,
       i.valid_rows,
       i.invalid_rows,
       i.duplicate_rows,
       i.created_at,
       i.updated_at,
       ps.id AS snapshot_id,
       ps.reference_date
     FROM imports i
     LEFT JOIN portfolio_snapshots ps ON ps.import_id = i.id
     WHERE i.user_id = ?
     ORDER BY i.created_at DESC`,
    [userId]
  );
}
