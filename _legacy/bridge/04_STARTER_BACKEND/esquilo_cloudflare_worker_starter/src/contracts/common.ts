export interface HealthPayload {
  service: string;
  environment: string;
  version: string;
  database: "ok" | "unavailable";
  timestamp: string;
}

export interface SourceStatus {
  dataSource: string;
  sourceWarning?: string;
  updatedAt?: string;
}

export interface UserContextPayload {
  userId: string;
  financialGoal?: string;
  monthlyIncomeRange?: string;
  monthlyInvestmentTarget?: number;
  availableToInvest?: number;
  riskProfile?: string;
  investmentHorizon?: string;
  platformsUsed?: string[];
  ghostModeEnabled?: boolean;
}
