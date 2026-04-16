import { httpJson } from "../utils/http";

type BrapiQuoteResponse = {
  results?: unknown[];
};

type BrapiHistoryResponse = {
  results?: unknown[];
};

type BrapiProviderDeps = {
  baseUrl: string;
  token: string;
};

export class BrapiProvider {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(deps: BrapiProviderDeps) {
    this.baseUrl = deps.baseUrl.replace(/\/+$/, "");
    this.token = deps.token;
  }

  async fetchQuotes(tickers: string[]): Promise<unknown[]> {
    const unique = Array.from(new Set(tickers.map((item) => item.trim().toUpperCase()).filter(Boolean)));
    const path = `${this.baseUrl}/quote/${encodeURIComponent(unique.join(","))}?token=${encodeURIComponent(this.token)}`;
    const response = await httpJson<BrapiQuoteResponse>(
      path,
      { method: "GET", headers: { Accept: "application/json" } },
      { timeoutMs: 8000, source: "brapi" },
    );
    return response.results ?? [];
  }

  async fetchHistory(ticker: string, range: string, interval: string): Promise<unknown> {
    const path = `${this.baseUrl}/quote/${encodeURIComponent(ticker)}?range=${encodeURIComponent(range)}&interval=${encodeURIComponent(interval)}&token=${encodeURIComponent(this.token)}`;
    const response = await httpJson<BrapiHistoryResponse>(
      path,
      { method: "GET", headers: { Accept: "application/json" } },
      { timeoutMs: 8000, source: "brapi" },
    );
    return (response.results ?? [])[0] ?? null;
  }
}
