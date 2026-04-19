import { MarketDataService } from "../services/market-data.service";
import { BrapiProvider } from "../providers/brapi.provider";
import type { Env } from "../types/gateway";

type AssetRow = {
  id: string;
  usuario_id: string;
  ticker: string | null;
  quantidade: number | null;
  preco_medio: number | null;
  categoria: string | null;
};

function buildMarketService(env: Env): MarketDataService | null {
  const token = env.BRAPI_TOKEN?.trim();
  if (!token) return null;
  return new MarketDataService({
    db: env.DB,
    provider: new BrapiProvider({
      token,
      baseUrl: env.BRAPI_BASE_URL?.trim() || "https://brapi.dev/api",
    }),
  });
}

function isValidListedTicker(asset: AssetRow): boolean {
  const ticker = String(asset.ticker ?? "").trim().toUpperCase();
  if (!ticker || ticker.includes("_")) return false;
  if (!/^[A-Z]{4,6}\d{1,2}$/.test(ticker)) return false;
  const categoria = String(asset.categoria ?? "").toLowerCase();
  return categoria === "acao" || categoria === "fundo";
}

async function applyQuoteUpdates(
  assets: AssetRow[],
  market: MarketDataService,
  db: D1Database,
): Promise<number> {
  const tickers = Array.from(new Set(assets.map((a) => String(a.ticker).toUpperCase())));
  const quoteMap = new Map<string, number>();

  try {
    const quotes = await market.getQuotes(tickers);
    quotes.forEach((q) => {
      if (q.price !== null) quoteMap.set(q.ticker, q.price);
    });
  } catch {
    for (const ticker of tickers) {
      try {
        const quote = await market.getQuote(ticker);
        if (quote.price !== null) quoteMap.set(quote.ticker, quote.price);
      } catch {
        // ignora ticker individual com erro
      }
    }
  }

  const updates = assets
    .map((asset) => {
      const ticker = String(asset.ticker).toUpperCase();
      const price = quoteMap.get(ticker);
      if (price === undefined) return null;
      const quantidade = Number(asset.quantidade ?? 0);
      const precoMedio = Number(asset.preco_medio ?? 0);
      const valorAtual = quantidade > 0 ? quantidade * price : price;
      const rentabilidade = precoMedio > 0 ? ((price - precoMedio) / precoMedio) * 100 : 0;
      return db
        .prepare("UPDATE ativos SET valor_atual = ?, rentabilidade_desde_aquisicao_pct = ? WHERE id = ?")
        .bind(Number(valorAtual.toFixed(4)), Number(rentabilidade.toFixed(4)), asset.id);
    })
    .filter((stmt): stmt is D1PreparedStatement => stmt !== null);

  if (updates.length > 0) await db.batch(updates);
  return updates.length;
}

/**
 * Atualiza cotações de mercado para os ativos listados de um usuário específico.
 * Chamado via ctx.waitUntil() após escritas (aporte, importação, exclusão).
 */
export async function refreshMarketQuotesForUser(
  userId: string,
  env: Env,
): Promise<{ refreshed: number; timestamp: string }> {
  const market = buildMarketService(env);
  if (!market) return { refreshed: 0, timestamp: new Date().toISOString() };

  const rows = await env.DB
    .prepare(
      "SELECT id, usuario_id, ticker, quantidade, preco_medio, categoria FROM ativos WHERE usuario_id = ? AND ticker IS NOT NULL AND ticker <> ''",
    )
    .bind(userId)
    .all<AssetRow>();

  const assets = (rows.results ?? []).filter(isValidListedTicker);
  if (assets.length === 0) return { refreshed: 0, timestamp: new Date().toISOString() };

  const refreshed = await applyQuoteUpdates(assets, market, env.DB);
  return { refreshed, timestamp: new Date().toISOString() };
}

/**
 * Atualiza cotações de mercado para todos os ativos listados de todos os usuários.
 * Chamado pelo Cron Trigger do Cloudflare Workers (scheduled handler).
 * Faz um único batch de BRAPI para todos os tickers distintos — eficiente.
 */
export async function refreshAllUsersMarketQuotes(
  env: Env,
): Promise<{ refreshed: number; users: number; tickers: number; timestamp: string }> {
  const market = buildMarketService(env);
  if (!market) {
    return { refreshed: 0, users: 0, tickers: 0, timestamp: new Date().toISOString() };
  }

  const rows = await env.DB
    .prepare(
      "SELECT id, usuario_id, ticker, quantidade, preco_medio, categoria FROM ativos WHERE ticker IS NOT NULL AND ticker <> ''",
    )
    .all<AssetRow>();

  const assets = (rows.results ?? []).filter(isValidListedTicker);
  if (assets.length === 0) {
    return { refreshed: 0, users: 0, tickers: 0, timestamp: new Date().toISOString() };
  }

  const users = new Set(assets.map((a) => a.usuario_id)).size;
  const tickers = new Set(assets.map((a) => String(a.ticker).toUpperCase())).size;
  const refreshed = await applyQuoteUpdates(assets, market, env.DB);
  return { refreshed, users, tickers, timestamp: new Date().toISOString() };
}
