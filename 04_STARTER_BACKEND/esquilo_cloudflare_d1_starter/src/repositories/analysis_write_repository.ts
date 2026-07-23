import type { Env } from '../types/env';
import { d1 } from '../lib/d1';

export async function insertPortfolioAnalysis(env: Env, input: {
  analysisId: string;
  portfolioId: string;
  snapshotId: string;
  scoreValue: number;
  scoreStatus: string;
  primaryProblem: string;
  primaryAction: string;
  portfolioDecision: string;
  actionPlanText: string;
  summaryText: string;
  messagingJson: string | null;
}): Promise<void> {
  await d1(env).run(
    `INSERT INTO portfolio_analyses (
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
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [
      input.analysisId,
      input.portfolioId,
      input.snapshotId,
      input.scoreValue,
      input.scoreStatus,
      input.primaryProblem,
      input.primaryAction,
      input.portfolioDecision,
      input.actionPlanText,
      input.summaryText,
      input.messagingJson
    ]
  );
}

export async function replaceAnalysisInsights(env: Env, analysisId: string, insights: Array<{
  id: string;
  insightType: string;
  title: string;
  message: string;
  priority: number;
}>): Promise<void> {
  await d1(env).run(`DELETE FROM analysis_insights WHERE analysis_id = ?`, [analysisId]);
  for (const item of insights) {
    await d1(env).run(
      `INSERT INTO analysis_insights (id, analysis_id, insight_type, title, message, priority, created_at)
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [item.id, analysisId, item.insightType, item.title, item.message, item.priority]
    );
  }
}

export async function updateAnalysisMessaging(env: Env, analysisId: string, messagingJson: string | null): Promise<void> {
  await d1(env).run(
    `UPDATE portfolio_analyses
     SET messaging_json = ?,
         generated_at = generated_at
     WHERE id = ?`,
    [messagingJson, analysisId]
  );
}

