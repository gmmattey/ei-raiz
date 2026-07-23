interface StockQuote {
  ticker: string;
  currentPrice: number;
  previousClose: number;
  priceChange: number;
  percentChange: number;
  dividendYield: number;
  volatility: number;
  volume: number;
  marketCap?: number;
  updatedAt: string;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class BrapiClient {
  private apiUrl = 'https://brapi.dev/api';
  private cache: Map<string, CacheEntry<StockQuote>> = new Map();
  private readonly cacheTTL = 5 * 60 * 1000; // 5 minutes

  async getStockPrice(ticker: string): Promise<StockQuote | null> {
    // Check memory cache
    const cached = this.cache.get(ticker);
    if (cached && !this.isExpired(cached)) {
      return cached.data;
    }

    try {
      const response = await fetch(
        `${this.apiUrl}/quote/${ticker}?range=1mo&interval=1d`
      );

      if (!response.ok) {
        console.warn(`BRAPI request failed for ${ticker}: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        return null;
      }

      const quote = this.parseQuote(data.results[0], ticker);

      // Store in memory cache
      this.cache.set(ticker, {
        data: quote,
        expiresAt: Date.now() + this.cacheTTL,
      });

      return quote;
    } catch (error) {
      console.error(`Error fetching stock ${ticker}:`, error);
      return null;
    }
  }

  async getBatchPrices(tickers: string[]): Promise<Map<string, StockQuote>> {
    const results = new Map<string, StockQuote>();
    const cacheMisses: string[] = [];

    // Check cache first
    for (const ticker of tickers) {
      const cached = this.cache.get(ticker);
      if (cached && !this.isExpired(cached)) {
        results.set(ticker, cached.data);
      } else {
        cacheMisses.push(ticker);
      }
    }

    // Fetch missing tickers
    if (cacheMisses.length > 0) {
      const fetched = await Promise.all(
        cacheMisses.map((t) => this.getStockPrice(t))
      );
      cacheMisses.forEach((t, i) => {
        if (fetched[i]) {
          results.set(t, fetched[i]!);
        }
      });
    }

    return results;
  }

  private parseQuote(data: any, ticker: string): StockQuote {
    return {
      ticker,
      currentPrice: data.price || 0,
      previousClose: data.previousClose || 0,
      priceChange: (data.price || 0) - (data.previousClose || 0),
      percentChange: data.change || 0,
      dividendYield: (data.dividendYield || 0) / 100, // Convert to decimal
      volatility: data.volatility || 0.15, // Default 15% if not available
      volume: data.volume || 0,
      marketCap: data.marketCap,
      updatedAt: new Date().toISOString(),
    };
  }

  private isExpired<T>(entry: CacheEntry<T>): boolean {
    return Date.now() > entry.expiresAt;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
