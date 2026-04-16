export type ListedAssetType = "stock" | "fii" | "etf" | "bdr" | "index" | "unknown";

export interface ListedAssetQuote {
  source: "brapi";
  ticker: string;
  name: string | null;
  type: ListedAssetType;
  currency: string | null;
  exchange: string | null;
  price: number | null;
  change: number | null;
  changePercent: number | null;
  previousClose: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  marketCap: number | null;
  updatedAt: string | null;
  fetchedAt: string;
}

export interface ListedAssetHistoryPoint {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
}

export interface ListedAssetHistoryResponse {
  source: "brapi";
  ticker: string;
  range: string;
  interval: string;
  points: ListedAssetHistoryPoint[];
  fetchedAt: string;
}

export interface InvestmentFundSummary {
  source: "cvm";
  cnpj: string;
  name: string;
  status: string | null;
  className: string | null;
  administrator: string | null;
  manager: string | null;
  startDate: string | null;
  benchmark: string | null;
  exclusive: boolean | null;
  qualifiedInvestor: boolean | null;
  professionalInvestor: boolean | null;
  openFund: boolean | null;
  latestQuotaDate: string | null;
  latestQuotaValue: number | null;
  latestNetWorth: number | null;
  latestFundraising: number | null;
  latestRedemption: number | null;
  latestShareholders: number | null;
  fetchedAt: string;
}

export interface InvestmentFundDailyReport {
  source: "cvm";
  cnpj: string;
  date: string;
  quotaValue: number | null;
  netWorth: number | null;
  portfolioValue: number | null;
  fundraising: number | null;
  redemption: number | null;
  shareholders: number | null;
  fetchedAt: string;
}

export interface FundSearchItem {
  cnpj: string;
  name: string;
  status: string | null;
  className: string | null;
}

export interface FundSearchResponse {
  query: string;
  items: FundSearchItem[];
  fetchedAt: string;
}

export type FundDocumentType =
  | "prospectus"
  | "regulation"
  | "fact_sheet"
  | "supplementary_info"
  | "financial_statement"
  | "report"
  | "other";

export interface FundDocumentItem {
  cnpj: string;
  fundName: string | null;
  type: FundDocumentType;
  title: string;
  documentDate: string | null;
  referenceDate: string | null;
  source: "cvm";
  url: string | null;
  fetchedAt: string;
}

export interface FundDocumentsResponse {
  cnpj: string;
  items: FundDocumentItem[];
  fetchedAt: string;
}

export interface UserAssetPosition {
  ticker: string;
  quantity: number;
  averagePrice: number;
  totalInvested: number;
}

export type DecisionSignal = "buy" | "hold" | "sell";

export interface PositionDecisionAnalysis {
  ticker: string;
  currentPrice: number | null;
  averagePrice: number | null;
  quantity: number | null;
  investedAmount: number | null;
  marketValue: number | null;
  profitLossValue: number | null;
  profitLossPercent: number | null;
  historicalTrend: "up" | "down" | "sideways" | "unknown";
  signal: DecisionSignal;
  confidence: "low" | "medium" | "high";
  rationale: string[];
  updatedAt: string;
  source: "brapi" | "google_finance" | "mixed";
  disclaimer: string;
}

export interface FipeBrand {
  code: string;
  label: string;
}

export interface FipeModel {
  code: string;
  label: string;
}

export interface FipeYearVersion {
  code: string;
  label: string;
}

export interface FipePriceReference {
  referencePrice: number | null;
  referencePriceLabel: string | null;
  fipeCode: string | null;
  brand: string | null;
  model: string | null;
  modelYear: number | null;
  fuel: string | null;
  source: "fipe";
  fetchedAt: string;
}

export interface ApiErrorResponse {
  error: {
    code: "BAD_REQUEST" | "NOT_FOUND" | "UPSTREAM_ERROR" | "TIMEOUT" | "RATE_LIMIT" | "INTERNAL_ERROR";
    message: string;
    details?: unknown;
    source?: "brapi" | "cvm" | "fipe" | "internal";
  };
  fetchedAt: string;
}
