import { apiRequest } from "./http";

export type ListedAssetQuote = {
  source: "brapi";
  ticker: string;
  name: string | null;
  price: number | null;
  changePercent: number | null;
  updatedAt: string | null;
  fetchedAt: string;
};

export function obterCotacao(ticker: string): Promise<ListedAssetQuote> {
  return apiRequest<ListedAssetQuote>(`/api/market/quote/${encodeURIComponent(ticker)}`, { method: "GET" });
}

export function obterCotacoes(tickers: string[]): Promise<{ items: ListedAssetQuote[]; fetchedAt: string }> {
  const query = tickers.join(",");
  return apiRequest<{ items: ListedAssetQuote[]; fetchedAt: string }>(`/api/market/quotes?tickers=${encodeURIComponent(query)}`, { method: "GET" });
}
