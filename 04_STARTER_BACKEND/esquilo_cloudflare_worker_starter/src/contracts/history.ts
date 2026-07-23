export interface HistoryPayload {
  snapshots: Array<{
    snapshotId: string;
    referenceDate: string;
    totalEquity?: number;
    totalInvested?: number;
    totalProfitLoss?: number;
    totalProfitLossPct?: number;
  }>;
  recommendations: Array<{
    analysisId: string;
    generatedAt: string;
    primaryProblem?: string;
    primaryAction?: string;
    scoreValue?: number;
    scoreStatus?: string;
  }>;
  events: Array<{
    id: string;
    eventType: string;
    eventStatus: string;
    message?: string;
    occurredAt: string;
  }>;
}
