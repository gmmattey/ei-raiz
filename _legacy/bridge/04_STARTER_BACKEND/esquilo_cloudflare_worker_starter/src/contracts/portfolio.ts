import type { SourceStatus } from "./common";

export interface PortfolioHolding {
  id: string;
  assetId: string;
  assetCode?: string;
  assetName: string;
  assetTypeCode: string;
  platformCode?: string;
  platformName?: string;
  quantity: number;
  averagePrice?: number;
  currentPrice?: number;
  investedAmount?: number;
  currentValue?: number;
  allocationPct?: number;
  performancePct?: number;
  recommendation?: string;
  riskLabel?: string;
  externalUrl?: string;
}

export interface PortfolioPayload extends SourceStatus {
  filters: {
    availableAssetTypes: string[];
    availablePlatforms: string[];
  };
  groups: Array<{
    categoryKey: string;
    categoryLabel: string;
    totalValue: number;
    allocationPct: number;
    holdings: PortfolioHolding[];
  }>;
  plannedOrders: Array<{
    id: string;
    orderKind: string;
    suggestedAmount?: number;
    suggestedQuantity?: number;
    reason?: string;
    priority?: string;
  }>;
}
