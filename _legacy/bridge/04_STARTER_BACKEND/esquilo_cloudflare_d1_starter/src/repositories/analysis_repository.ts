import type { Env } from '../types/env';
import { d1 } from '../lib/d1';

export interface AnalysisSessionState {
  userId: string;
  portfolioId: string | null;
  hasContext: number;
}

export interface AnalysisRow {
  id: string;
  portfolio_id: string;
  snapshot_id: string;
  score_value: number | null;
  score_status: string | null;
  primary_problem: string | null;
  primary_action: string | null;
  portfolio_decision: string | null;
  action_plan_text: string | null;
  summary_text: string | null;
  messaging_json: string | null;
  generated_at: string;
}

export interface AnalysisInsightRow {
  insight_type: string;
  title: string | null;
  message: string;
  priority: number | null;
}

export async function findAnalysisSessionStateByTokenHash(env: Env, tokenHash: string): Promise<AnalysisSessionState | null> {
  return await d1(env).first<AnalysisSessionState>(
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

export async function findLatestPortfolioAnalysis(env: Env, portfolioId: string): Promise<AnalysisRow | null> {
  return await d1(env).first<AnalysisRow>(
    `SELECT
       id,
       portfolio_id,
       snapshot_id,
       score_value,
       score_status,
       primary_problem,
       primary_action,
       portfolio_decision,
       action_plan_text,
       summary_text,
       messaging_json,
       generated_at
     FROM portfolio_analyses
     WHERE portfolio_id = ?
     ORDER BY generated_at DESC
     LIMIT 1`,
    [portfolioId]
  );
}

export async function findInsightsByAnalysisId(env: Env, analysisId: string): Promise<AnalysisInsightRow[]> {
  return await d1(env).all<AnalysisInsightRow>(
    `SELECT
       insight_type,
       title,
       message,
       priority
     FROM analysis_insights
     WHERE analysis_id = ?
     ORDER BY priority ASC, created_at ASC`,
    [analysisId]
  );
}
