import { apiRequest } from "./http";

export type PositionDecisionAnalysis = {
  ticker: string;
  signal: "buy" | "hold" | "sell";
  confidence: "low" | "medium" | "high";
  rationale: string[];
  updatedAt: string;
  source: "brapi" | "google_finance" | "mixed";
  disclaimer: string;
  currentPrice: number | null;
  marketValue: number | null;
  investedAmount: number | null;
  profitLossValue: number | null;
  profitLossPercent: number | null;
};

export function analisarPosicao(payload: { ticker: string; quantity: number; averagePrice: number }): Promise<PositionDecisionAnalysis> {
  return apiRequest<PositionDecisionAnalysis>("/api/portfolio/analyze-position", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function analisarPosicoes(payload: { items: Array<{ ticker: string; quantity: number; averagePrice: number }> }): Promise<{ items: PositionDecisionAnalysis[]; updatedAt: string }> {
  return apiRequest<{ items: PositionDecisionAnalysis[]; updatedAt: string }>("/api/portfolio/analyze-positions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
