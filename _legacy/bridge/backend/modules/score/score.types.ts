export type ScoreClassification = "excellent" | "good" | "attention" | "critical";

export type ScoreProblemKey =
  | "asset_drawdown"
  | "fund_under_cdi"
  | "concentration_high"
  | "no_contribution"
  | "none";

export type ScoreActionKey =
  | "review_asset"
  | "review_underperforming_fund"
  | "rebalance_next_contributions"
  | "resume_contributions"
  | "keep_current_strategy";

export type ScoreResult = {
  score: number;
  classification: ScoreClassification;
  main_problem: ScoreProblemKey;
  main_action: ScoreActionKey;
  breakdown?: {
    structure?: number;
    reality_fit?: number;
    financial_capacity?: number;
    behavior?: number;
  };
};
