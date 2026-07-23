import { ScoreResult, ScoreClassification, ScoreProblemKey, ScoreActionKey } from "./score.types";
import { PortfolioSnapshot } from "../alerts/alerts.types";

export type ScoreRuleInput = {
  profile?: {
    incomeRange?: "<2k" | "2k-5k" | "5k-10k" | "10k+";
    monthlyCapacity?: number;
    goal?: "organize" | "grow" | "income" | "protect";
    horizon?: "short" | "mid" | "long";
    riskReaction?: "keep" | "reduce" | "panic";
  };
  snapshot: PortfolioSnapshot;
};

function getClassification(score: number): ScoreClassification {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "attention";
  return "critical";
}

function getMainAction(problem: ScoreProblemKey): ScoreActionKey {
  switch (problem) {
    case "concentration_high":
      return "rebalance_next_contributions";
    case "fund_under_cdi":
      return "review_underperforming_fund";
    case "no_contribution":
      return "resume_contributions";
    case "asset_drawdown":
      return "review_asset";
    default:
      return "keep_current_strategy";
  }
}

function getIncomeWeight(incomeRange?: string): number {
  switch (incomeRange) {
    case "10k+":
      return 1;
    case "5k-10k":
      return 0.8;
    case "2k-5k":
      return 0.6;
    case "<2k":
      return 0.4;
    default:
      return 0.6;
  }
}

export function calculateScore(input: ScoreRuleInput): ScoreResult {
  const categoriesCount = input.snapshot.categories.length;
  const highestCategoryWeight = Math.max(...input.snapshot.categories.map(c => c.weight), 0);
  const incomeWeight = getIncomeWeight(input.profile?.incomeRange);

  // 1. Structure (0-40)
  let structure = 0;
  if (categoriesCount >= 3) structure += 20;
  else if (categoriesCount === 2) structure += 12;
  else if (categoriesCount === 1) structure += 5;

  if (highestCategoryWeight < 0.25) structure += 20;
  else if (highestCategoryWeight <= 0.5) structure += 12;
  else structure += 5;

  // 2. Reality fit (0-30)
  let realityFit = 30;
  if (input.profile?.riskReaction === "panic" && highestCategoryWeight > 0.5) realityFit = 10;
  if (input.profile?.goal === "organize" && categoriesCount > 4) realityFit = 15;
  if (input.profile?.goal === "protect" && highestCategoryWeight > 0.5) realityFit = 10;

  // 3. Financial capacity (0-20)
  let financialCapacity = 20;
  if (incomeWeight <= 0.4 && highestCategoryWeight > 0.5) financialCapacity = 5;
  else if (incomeWeight <= 0.6 && highestCategoryWeight > 0.5) financialCapacity = 10;

  // 4. Behavior (0-10)
  let behavior = 10;
  const lastContributionAt = input.snapshot.contributions?.lastContributionAt;
  if (lastContributionAt) {
    const daysWithoutContribution =
      (Date.now() - new Date(lastContributionAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysWithoutContribution > 60) behavior = 0;
    else if (daysWithoutContribution > 30) behavior = 5;
  }

  const score = Math.max(0, Math.min(100, structure + realityFit + financialCapacity + behavior));

  // Main problem priority
  let mainProblem: ScoreProblemKey = "none";
  if (highestCategoryWeight > 0.5) {
    mainProblem = "concentration_high";
  } else if (
    input.snapshot.funds?.some(f => f.performancePct < f.benchmarkPct)
  ) {
    mainProblem = "fund_under_cdi";
  } else if (behavior === 0 || behavior === 5) {
    mainProblem = "no_contribution";
  }

  return {
    score,
    classification: getClassification(score),
    main_problem: mainProblem,
    main_action: getMainAction(mainProblem),
    breakdown: {
      structure,
      reality_fit: realityFit,
      financial_capacity: financialCapacity,
      behavior,
    } as any,
  } as ScoreResult;
}
