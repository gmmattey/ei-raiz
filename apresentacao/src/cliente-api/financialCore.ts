import { apiRequest } from "./http";

export type QualityFlag = {
  code: string;
  severity: "info" | "warning" | "critical";
  message: string;
};

export type FinancialCoreSummary = {
  portfolio: {
    totalValue: number;
    investedValue: number;
    otherAssetsValue: number;
    cashValue: number;
    returnSinceInception: number | null;
    returnAvailable: boolean;
    assetCount: number;
    lastCalculatedAt: string | null;
  };
  allocation: {
    byClass: Array<{ id: string; label: string; value: number; percent: number }>;
    largestPositions: Array<{ id: string; ticker: string; name: string; value: number; percent: number }>;
  };
  benchmark: {
    periodMonths: number;
    portfolioReturn: number;
    cdiReturn: number;
    excessReturn: number;
    source: string;
    status: "atualizado" | "atrasado" | "indisponivel";
    updatedAt: string | null;
  };
  score: {
    official: number;
    band: "critical" | "fragile" | "stable" | "good" | "strong";
    version: string;
  } | null;
  marketData: {
    coveragePercent: number;
    status: "atualizado" | "atrasado" | "indisponivel";
    updatedAt: string | null;
    sources: Array<{ source: string; count: number }>;
  };
  qualityFlags: QualityFlag[];
};

export type FinancialCoreAsset = {
  id: string;
  ticker: string;
  name: string;
  class: string;
  quantity: number | null;
  averagePrice: number | null;
  averagePriceStatus: "trusted" | "adjusted" | "inconsistent" | "unknown";
  currentPrice: number | null;
  currentValue: number;
  gainLoss: number | null;
  gainLossPercent: number | null;
  returnSinceInception: number | null;
  marketSource: string;
  marketStatus: "atualizado" | "atrasado" | "indisponivel";
  updatedAt: string | null;
  qualityFlags: QualityFlag[];
};

export type FinancialCoreHistory = {
  range: string;
  series: Array<{
    date: string;
    portfolioBase100: number;
    cdiBase100: number;
    officialScore: number | null;
  }>;
};

export function obterSummary(): Promise<FinancialCoreSummary> {
  return apiRequest<FinancialCoreSummary>("/api/financial-core/summary", { method: "GET" });
}

export function listarAssets(filtros: { class?: string; source?: string; status?: string } = {}): Promise<FinancialCoreAsset[]> {
  const qs = new URLSearchParams();
  if (filtros.class) qs.set("class", filtros.class);
  if (filtros.source) qs.set("source", filtros.source);
  if (filtros.status) qs.set("status", filtros.status);
  const suffix = qs.toString() ? `?${qs}` : "";
  return apiRequest<FinancialCoreAsset[]>(`/api/financial-core/assets${suffix}`, { method: "GET" });
}

export function obterAsset(id: string): Promise<FinancialCoreAsset> {
  return apiRequest<FinancialCoreAsset>(`/api/financial-core/assets/${encodeURIComponent(id)}`, { method: "GET" });
}

export function obterHistorico(range = "12m"): Promise<FinancialCoreHistory> {
  return apiRequest<FinancialCoreHistory>(`/api/financial-core/history?range=${encodeURIComponent(range)}`, { method: "GET" });
}
