export type AlertType =
  | "asset_drawdown"
  | "fund_under_cdi"
  | "concentration_high"
  | "no_contribution";

export type AlertSeverity = "low" | "medium" | "high";

export type AlertStatus = "active" | "resolved" | "ignored";

export type Alert = {
  id: string;
  userId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  context: string;
  action: string;
  dedupKey: string;
  status: AlertStatus;
  createdAt: string;
};

export type PortfolioSnapshot = {
  totalValue: number;
  categories: Array<{
    name: string;
    value: number;
    weight: number;
  }>;
  funds?: Array<{
    name: string;
    performancePct: number;
    benchmarkPct: number;
  }>;
  contributions?: {
    lastContributionAt?: string;
  };
};

export type AlertRuleInput = {
  userId: string;
  snapshot: PortfolioSnapshot;
  referenceDate: string;
};

export type AlertCheckResult = {
  alerts: Alert[];
};
