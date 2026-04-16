import type { ListedAssetHistoryPoint, ListedAssetHistoryResponse, ListedAssetQuote, ListedAssetType } from "../types/financial-contracts";

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(",", "."));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const asString = (value: unknown): string | null => (typeof value === "string" && value.trim() ? value.trim() : null);

const mapType = (value: unknown): ListedAssetType => {
  const normalized = (asString(value) ?? "").toLowerCase();
  if (normalized.includes("stock")) return "stock";
  if (normalized.includes("fii") || normalized.includes("fund")) return "fii";
  if (normalized.includes("etf")) return "etf";
  if (normalized.includes("bdr")) return "bdr";
  if (normalized.includes("index")) return "index";
  return "unknown";
};

export const mapBrapiQuote = (input: unknown, requestedTicker: string, fetchedAt: string): ListedAssetQuote => {
  const item = (input ?? {}) as Record<string, unknown>;
  return {
    source: "brapi",
    ticker: requestedTicker.toUpperCase(),
    name: asString(item.longName) ?? asString(item.shortName),
    type: mapType(item.quoteType),
    currency: asString(item.currency),
    exchange: asString(item.exchange) ?? asString(item.exchangeName),
    price: asNumber(item.regularMarketPrice) ?? asNumber(item.price),
    change: asNumber(item.regularMarketChange),
    changePercent: asNumber(item.regularMarketChangePercent),
    previousClose: asNumber(item.regularMarketPreviousClose),
    open: asNumber(item.regularMarketOpen),
    high: asNumber(item.regularMarketDayHigh),
    low: asNumber(item.regularMarketDayLow),
    volume: asNumber(item.regularMarketVolume),
    marketCap: asNumber(item.marketCap),
    updatedAt: asString(item.regularMarketTime) ?? asString(item.updatedAt),
    fetchedAt,
  };
};

export const mapBrapiHistory = (
  input: unknown,
  ticker: string,
  range: string,
  interval: string,
  fetchedAt: string,
): ListedAssetHistoryResponse => {
  const item = (input ?? {}) as Record<string, unknown>;
  const pointsRaw = (Array.isArray(item.historicalDataPrice) ? item.historicalDataPrice : Array.isArray(item.historicalData) ? item.historicalData : []) as Array<
    Record<string, unknown>
  >;
  const points: ListedAssetHistoryPoint[] = pointsRaw.map((point) => ({
    date: typeof point.date === "number" ? new Date(point.date * 1000).toISOString().slice(0, 10) : asString(point.date) ?? "",
    open: asNumber(point.open),
    high: asNumber(point.high),
    low: asNumber(point.low),
    close: asNumber(point.close),
    volume: asNumber(point.volume),
  }));
  return {
    source: "brapi",
    ticker: ticker.toUpperCase(),
    range,
    interval,
    points: points.filter((point) => point.date.length > 0),
    fetchedAt,
  };
};
