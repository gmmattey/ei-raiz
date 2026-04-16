import { MarketDataService } from "./market-data.service";

type AssetRow = {
  id: string;
  ticker: string | null;
  quantidade: number | null;
  preco_medio: number | null;
  categoria: string | null;
};

export class SessionMarketService {
  constructor(private readonly db: D1Database, private readonly market: MarketDataService) {}

  async refreshUserListedAssets(usuarioId: string): Promise<{ refreshed: number; timestamp: string }> {
    const rows = await this.db
      .prepare("SELECT id, ticker, quantidade, preco_medio, categoria FROM ativos WHERE usuario_id = ? AND ticker IS NOT NULL AND ticker <> ''")
      .bind(usuarioId)
      .all<AssetRow>();

    const assets = (rows.results || []).filter((item) => {
      const ticker = String(item.ticker ?? "").trim().toUpperCase();
      if (!ticker || ticker.includes("_")) return false;
      if (!/^[A-Z]{4,6}\d{1,2}$/.test(ticker)) return false;
      const categoria = String(item.categoria ?? "").toLowerCase();
      return categoria === "acao" || categoria === "fundo";
    });
    if (assets.length === 0) return { refreshed: 0, timestamp: new Date().toISOString() };

    const tickers = Array.from(new Set(assets.map((item) => String(item.ticker).toUpperCase())));
    const quoteMap = new Map<string, Awaited<ReturnType<MarketDataService["getQuote"]>>>();
    try {
      const quotes = await this.market.getQuotes(tickers);
      quotes.forEach((q) => quoteMap.set(q.ticker, q));
    } catch {
      for (const ticker of tickers) {
        try {
          const quote = await this.market.getQuote(ticker);
          quoteMap.set(quote.ticker, quote);
        } catch {
          // ignora ticker individual com erro upstream
        }
      }
    }

    const updates = assets
      .map((asset) => {
        const ticker = String(asset.ticker).toUpperCase();
        const quote = quoteMap.get(ticker);
        if (!quote || quote.price === null) return null;
        const quantidade = Number(asset.quantidade ?? 0);
        const precoMedio = Number(asset.preco_medio ?? 0);
        const valorAtual = quantidade > 0 ? quantidade * quote.price : quote.price;
        const retorno12m = precoMedio > 0 ? ((quote.price - precoMedio) / precoMedio) * 100 : 0;
        return this.db
          .prepare("UPDATE ativos SET valor_atual = ?, retorno_12m = ? WHERE id = ?")
          .bind(Number(valorAtual.toFixed(4)), Number(retorno12m.toFixed(4)), asset.id);
      })
      .filter((stmt): stmt is D1PreparedStatement => stmt !== null);

    if (updates.length > 0) await this.db.batch(updates);
    return { refreshed: updates.length, timestamp: new Date().toISOString() };
  }
}
