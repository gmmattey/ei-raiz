import type { Env } from '../types/env';
import { d1 } from '../lib/d1';

export interface DashboardSessionState {
  userId: string;
  portfolioId: string | null;
  hasContext: number;
}

export interface SnapshotRow {
  id: string;
  portfolio_id: string;
  reference_date: string;
  total_equity: number | null;
  total_invested: number | null;
  total_profit_loss: number | null;
  total_profit_loss_pct: number | null;
  created_at: string;
}

export interface DistributionRow {
  category_code: string;
  category_name: string;
  total_value: number | null;
}

export interface AnalysisRow {
  id: string;
  score_value: number | null;
  score_status: string | null;
  primary_problem: string | null;
  primary_action: string | null;
  summary_text: string | null;
  messaging_json: string | null;
  generated_at: string;
}

export interface InsightRow {
  insight_type: string;
  title: string | null;
  message: string;
}

export async function findDashboardSessionStateByTokenHash(env: Env, tokenHash: string): Promise<DashboardSessionState | null> {
  return await d1(env).first<DashboardSessionState>(
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

export async function findLatestSnapshotByPortfolioId(env: Env, portfolioId: string): Promise<SnapshotRow | null> {
  return await d1(env).first<SnapshotRow>(
    `SELECT
       id,
       portfolio_id,
       reference_date,
       total_equity,
       total_invested,
       total_profit_loss,
       total_profit_loss_pct,
       created_at
     FROM portfolio_snapshots
     WHERE portfolio_id = ?
     ORDER BY reference_date DESC, created_at DESC
     LIMIT 1`,
    [portfolioId]
  );
}

export async function findDistributionBySnapshotId(env: Env, snapshotId: string): Promise<DistributionRow[]> {
  return await d1(env).all<DistributionRow>(
    `SELECT
       at.code AS category_code,
       at.name AS category_name,
       SUM(sp.current_value) AS total_value
     FROM portfolio_snapshot_positions sp
     JOIN assets a ON a.id = sp.asset_id
     JOIN asset_types at ON at.id = a.asset_type_id
     WHERE sp.snapshot_id = ?
     GROUP BY at.code, at.name
     ORDER BY total_value DESC`,
    [snapshotId]
  );
}

export async function findLatestAnalysisBySnapshotId(env: Env, snapshotId: string): Promise<AnalysisRow | null> {
  return await d1(env).first<AnalysisRow>(
    `SELECT
       id,
       score_value,
       score_status,
       primary_problem,
       primary_action,
       summary_text,
       messaging_json,
       generated_at
     FROM portfolio_analyses
     WHERE snapshot_id = ?
     ORDER BY generated_at DESC
     LIMIT 1`,
    [snapshotId]
  );
}

export async function findInsightsByAnalysisId(env: Env, analysisId: string): Promise<InsightRow[]> {
  return await d1(env).all<InsightRow>(
    `SELECT
       insight_type,
       title,
       message
     FROM analysis_insights
     WHERE analysis_id = ?
     ORDER BY priority ASC, created_at ASC`,
    [analysisId]
  );
}
