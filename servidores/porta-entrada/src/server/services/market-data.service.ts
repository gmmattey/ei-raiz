import { mapBrapiHistory, mapBrapiQuote } from "../mappers/brapi.mapper";
import { BrapiProvider } from "../providers/brapi.provider";
import type { ListedAssetHistoryResponse, ListedAssetQuote } from "../types/financial-contracts";
import { readCache, writeCache } from "../utils/cache";

type MarketDataServiceDeps = {
  provider: BrapiProvider;
  db: D1Database;
};

const TTL_QUOTE_MS = 30 * 1000;
const TTL_HISTORY_MS = 30 * 60 * 1000;

export class MarketDataService {
  private readonly provider: BrapiProvider;
  private readonly db: D1Database;

  constructor(deps: MarketDataServiceDeps) {
    this.provider = deps.provider;
    this.db = deps.db;
  }

  async getQuote(ticker: string): Promise<ListedAssetQuote> {
    const cacheKey = `quote:${ticker.toUpperCase()}`;
    const cached = await readCache<ListedAssetQuote>(this.db, "brapi", cacheKey);
    if (cached) return cached;

    const items = await this.provider.fetchQuotes([ticker]);
    const found = items.find((item) => String((item as Record<string, unknown>).symbol ?? "").toUpperCase() === ticker.toUpperCase()) ?? items[0];
    const mapped = mapBrapiQuote(found, ticker, new Date().toISOString());
    await writeCache(this.db, "brapi", cacheKey, mapped, TTL_QUOTE_MS);
    return mapped;
  }

  async getQuotes(tickers: string[]): Promise<ListedAssetQuote[]> {
    const normalized = Array.from(new Set(tickers.map((item) => item.trim().toUpperCase()).filter(Boolean)));
    const cacheReads = await Promise.all(normalized.map((ticker) => readCache<ListedAssetQuote>(this.db, "brapi", `quote:${ticker}`)));
    const fromCache = new Map<string, ListedAssetQuote>();
    cacheReads.forEach((item) => {
      if (item) fromCache.set(item.ticker, item);
    });
    const missing = normalized.filter((ticker) => !fromCache.has(ticker));
    if (missing.length > 0) {
      let mappedMissing: ListedAssetQuote[] = [];
      try {
        const fetchedAt = new Date().toISOString();
        const raw = await this.provider.fetchQuotes(missing);
        mappedMissing = missing.map((ticker) => {
          const found = raw.find((item) => String((item as Record<string, unknown>).symbol ?? "").toUpperCase() === ticker);
          return mapBrapiQuote(found, ticker, fetchedAt);
        });
      } catch {
        mappedMissing = await Promise.all(
          missing.map(async (ticker) => {
            try {
              return await this.getQuote(ticker);
            } catch {
              return mapBrapiQuote(null, ticker, new Date().toISOString());
            }
          }),
        );
      }
      await Promise.all(mappedMissing.map((item) => writeCache(this.db, "brapi", `quote:${item.ticker}`, item, TTL_QUOTE_MS)));
      mappedMissing.forEach((item) => fromCache.set(item.ticker, item));
    }
    return normalized.map((ticker) => fromCache.get(ticker) ?? mapBrapiQuote(null, ticker, new Date().toISOString()));
  }

  async getHistory(ticker: string, range: string, interval: string): Promise<ListedAssetHistoryResponse> {
    const cacheKey = `history:${ticker.toUpperCase()}:${range}:${interval}`;
    const cached = await readCache<ListedAssetHistoryResponse>(this.db, "brapi", cacheKey);
    if (cached) return cached;

    const raw = await this.provider.fetchHistory(ticker, range, interval);
    const mapped = mapBrapiHistory(raw, ticker, range, interval, new Date().toISOString());
    await writeCache(this.db, "brapi", cacheKey, mapped, TTL_HISTORY_MS);
    return mapped;
  }
}
