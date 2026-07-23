import type { Env } from '../types/env';
import { d1 } from '../lib/d1';

export interface HoldingDetailSessionState {
  userId: string;
  portfolioId: string | null;
  hasContext: number;
}

export interface HoldingDetailRow {
  id: string;
  portfolio_id: string;
  asset_id: string;
  asset_type_code: string | null;
  asset_type_name: string | null;
  source_kind: string;
  code: string | null;
  name: string;
  category_label: string | null;
  platform_id: string | null;
  platform_name: string | null;
  quantity: number | null;
  average_price: number | null;
  current_price: number | null;
  current_amount: number | null;
  invested_amount: number | null;
  notes: string | null;
  stop_loss: number | null;
  target_price: number | null;
  profitability: number | null;
  created_at: string;
}

export interface CategoryAggregateRow {
  category_key: string;
  category_label: string;
  total_current: number | null;
  total_invested: number | null;
  holdings_count: number;
}

export interface PortfolioAggregateRow {
  total_current: number | null;
}

export interface LatestAnalysisRow {
  id: string;
  score_status: string | null;
  primary_problem: string | null;
  primary_action: string | null;
  summary_text: string | null;
}

export async function findHoldingSessionStateByTokenHash(env: Env, tokenHash: string): Promise<HoldingDetailSessionState | null> {
  return await d1(env).first<HoldingDetailSessionState>(
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

export async function findHoldingDetailById(env: Env, portfolioId: string, holdingId: string): Promise<HoldingDetailRow | null> {
  return await d1(env).first<HoldingDetailRow>(
    `SELECT
       pp.id,
       pp.portfolio_id,
       pp.asset_id,
       at.code AS asset_type_code,
       at.name AS asset_type_name,
       pp.source_kind,
       a.code,
       a.name,
       pp.category_label,
       p.id AS platform_id,
       p.name AS platform_name,
       pp.quantity,
       pp.average_price,
       pp.current_price,
       pp.current_amount,
       pp.invested_amount,
       pp.notes,
       pp.stop_loss,
       pp.target_price,
       pp.profitability,
       pp.created_at
     FROM portfolio_positions pp
     JOIN assets a ON a.id = pp.asset_id
     JOIN asset_types at ON at.id = a.asset_type_id
     LEFT JOIN platforms p ON p.id = pp.platform_id
     WHERE pp.portfolio_id = ?
       AND pp.id = ?
       AND pp.status = 'active'
     LIMIT 1`,
    [portfolioId, holdingId]
  );
}

export async function findCategoryAggregate(env: Env, portfolioId: string, categoryKey: string): Promise<CategoryAggregateRow | null> {
  return await d1(env).first<CategoryAggregateRow>(
    `SELECT
       COALESCE(NULLIF(LOWER(TRIM(pp.category_label)), ''), LOWER(TRIM(at.code)), 'outros') AS category_key,
       COALESCE(NULLIF(pp.category_label, ''), at.name, at.code, 'Outros') AS category_label,
       SUM(pp.current_amount) AS total_current,
       SUM(pp.invested_amount) AS total_invested,
       COUNT(*) AS holdings_count
     FROM portfolio_positions pp
     JOIN assets a ON a.id = pp.asset_id
     JOIN asset_types at ON at.id = a.asset_type_id
     WHERE pp.portfolio_id = ?
       AND pp.status = 'active'
     GROUP BY category_key, category_label
     HAVING category_key = ?
     LIMIT 1`,
    [portfolioId, categoryKey]
  );
}

export async function findPortfolioAggregate(env: Env, portfolioId: string): Promise<PortfolioAggregateRow | null> {
  return await d1(env).first<PortfolioAggregateRow>(
    `SELECT SUM(current_amount) AS total_current
     FROM portfolio_positions
     WHERE portfolio_id = ?
       AND status = 'active'`,
    [portfolioId]
  );
}

export async function findLatestPortfolioAnalysis(env: Env, portfolioId: string): Promise<LatestAnalysisRow | null> {
  return await d1(env).first<LatestAnalysisRow>(
    `SELECT
       pa.id,
       pa.score_status,
       pa.primary_problem,
       pa.primary_action,
       pa.summary_text
     FROM portfolio_analyses pa
     WHERE pa.portfolio_id = ?
     ORDER BY pa.generated_at DESC
     LIMIT 1`,
    [portfolioId]
  );
}
