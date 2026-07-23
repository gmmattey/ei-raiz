import type { SourceStatus } from "./common";

export interface HomeHero {
  totalEquity: number;
  totalInvested: number;
  totalProfitLoss: number;
  totalProfitLossPct: number;
  statusLabel: string;
}

export interface PrimaryAction {
  title: string;
  reason: string;
  priority: string;
  targetCategoryKey?: string;
  targetAssetId?: string;
}

export interface ScoreExplanation {
  value: number;
  status: string;
  summary: string;
  problem: string;
}

export interface DistributionItem {
  categoryKey: string;
  label: string;
  currentValue: number;
  allocationPct: number;
  performancePct?: number;
  platformBreakdown?: Array<{
    platformCode: string;
    platformName: string;
    currentValue: number;
    allocationPct: number;
  }>;
}

export interface DashboardPayload extends SourceStatus {
  hero: HomeHero;
  primaryProblem: {
    title: string;
    body: string;
  };
  primaryAction: PrimaryAction;
  score: ScoreExplanation;
  distribution: DistributionItem[];
  insights: Array<{
    title: string;
    body: string;
    severity?: string;
  }>;
}
