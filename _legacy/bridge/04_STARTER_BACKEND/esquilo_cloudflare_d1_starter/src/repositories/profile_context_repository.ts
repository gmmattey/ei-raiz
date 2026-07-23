import type { Env } from '../types/env';
import { d1 } from '../lib/d1';

export interface ProfileContextRow {
  id: string;
  user_id: string;
  financial_goal: string | null;
  monthly_income_range: string | null;
  monthly_investment_target: number | null;
  available_to_invest: number | null;
  risk_profile: string | null;
  risk_profile_self_declared: string | null;
  risk_profile_quiz_result: string | null;
  risk_profile_effective: string | null;
  investment_horizon: string | null;
  platforms_used_json: string | null;
  display_preferences_json: string | null;
  onboarding_step: string | null;
  onboarding_completed_at: string | null;
}

export interface UpsertProfileContextInput {
  contextId: string;
  userId: string;
  financialGoal: string;
  monthlyIncomeRange: string;
  monthlyInvestmentTarget: number | null;
  availableToInvest: number | null;
  riskProfileSelfDeclared: string;
  riskProfileQuizResult: string;
  riskProfileEffective: string;
  investmentHorizon: string;
  platformsUsedJson: string;
  displayPreferencesJson: string;
  onboardingStep: string;
  onboardingCompletedAt: string | null;
}

export async function findProfileContextByUserId(env: Env, userId: string): Promise<ProfileContextRow | null> {
  return await d1(env).first<ProfileContextRow>(
    `SELECT
       id,
       user_id,
       financial_goal,
       monthly_income_range,
       monthly_investment_target,
       available_to_invest,
       risk_profile,
       risk_profile_self_declared,
       risk_profile_quiz_result,
       risk_profile_effective,
       investment_horizon,
       platforms_used_json,
       display_preferences_json,
       onboarding_step,
       onboarding_completed_at
     FROM user_financial_context
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );
}

export async function upsertProfileContext(env: Env, input: UpsertProfileContextInput): Promise<void> {
  await d1(env).run(
    `INSERT INTO user_financial_context (
      id,
      user_id,
      financial_goal,
      monthly_income_range,
      monthly_investment_target,
      available_to_invest,
      risk_profile,
      risk_profile_self_declared,
      risk_profile_quiz_result,
      risk_profile_effective,
      investment_horizon,
      platforms_used_json,
      display_preferences_json,
      onboarding_step,
      onboarding_completed_at,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET
      financial_goal = excluded.financial_goal,
      monthly_income_range = excluded.monthly_income_range,
      monthly_investment_target = excluded.monthly_investment_target,
      available_to_invest = excluded.available_to_invest,
      risk_profile = excluded.risk_profile,
      risk_profile_self_declared = excluded.risk_profile_self_declared,
      risk_profile_quiz_result = excluded.risk_profile_quiz_result,
      risk_profile_effective = excluded.risk_profile_effective,
      investment_horizon = excluded.investment_horizon,
      platforms_used_json = excluded.platforms_used_json,
      display_preferences_json = excluded.display_preferences_json,
      onboarding_step = excluded.onboarding_step,
      onboarding_completed_at = excluded.onboarding_completed_at,
      updated_at = CURRENT_TIMESTAMP`,
    [
      input.contextId,
      input.userId,
      input.financialGoal || null,
      input.monthlyIncomeRange || null,
      input.monthlyInvestmentTarget,
      input.availableToInvest,
      input.riskProfileEffective || null,
      input.riskProfileSelfDeclared || null,
      input.riskProfileQuizResult || null,
      input.riskProfileEffective || null,
      input.investmentHorizon || null,
      input.platformsUsedJson || null,
      input.displayPreferencesJson || null,
      input.onboardingStep || null,
      input.onboardingCompletedAt
    ]
  );
}
