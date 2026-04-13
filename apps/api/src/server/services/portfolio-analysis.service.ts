import { GoogleFinanceProvider } from "../providers/google-finance.provider";
import { MarketDataService } from "./market-data.service";
import type { PositionDecisionAnalysis, UserAssetPosition } from "../types/financial-contracts";

type PortfolioAnalysisServiceDeps = {
  market: MarketDataService;
  googleFinance?: GoogleFinanceProvider;
};

const DISCLAIMER =
  "Este sinal é automatizado e baseado em regras objetivas de preço, histórico e preço médio da posição. Não constitui recomendação financeira profissional.";

const toNum = (value: number): number => Number(value.toFixed(4));

export class PortfolioAnalysisService {
  private readonly market: MarketDataService;
  private readonly googleFinance?: GoogleFinanceProvider;

  constructor(deps: PortfolioAnalysisServiceDeps) {
    this.market = deps.market;
    this.googleFinance = deps.googleFinance;
  }

  async analyzePosition(input: UserAssetPosition): Promise<PositionDecisionAnalysis> {
    const ticker = input.ticker.trim().toUpperCase();
    const quote = await this.market.getQuote(ticker);
    const history = await this.market.getHistory(ticker, "3mo", "1d");
    let source: PositionDecisionAnalysis["source"] = "brapi";

    let currentPrice = quote.price;
    if (currentPrice === null && this.googleFinance) {
      const gf = await this.googleFinance.fetchQuote(ticker);
      if (gf?.price !== null && gf?.price !== undefined) {
        currentPrice = gf.price;
        source = "google_finance";
      }
    }

    const averagePrice = Number.isFinite(input.averagePrice) ? input.averagePrice : null;
    const quantity = Number.isFinite(input.quantity) ? input.quantity : null;
    const investedAmount = averagePrice !== null && quantity !== null ? toNum(averagePrice * quantity) : null;
    const marketValue = currentPrice !== null && quantity !== null ? toNum(currentPrice * quantity) : null;
    const profitLossValue = investedAmount !== null && marketValue !== null ? toNum(marketValue - investedAmount) : null;
    const profitLossPercent =
      currentPrice !== null && averagePrice !== null && averagePrice > 0 ? toNum(((currentPrice - averagePrice) / averagePrice) * 100) : null;

    const historicalTrend = this.computeTrend(history.points.map((point) => point.close).filter((v): v is number => typeof v === "number"));
    const signalResult = this.computeSignal({
      currentPrice,
      averagePrice,
      profitLossPercent,
      historicalTrend,
    });

    return {
      ticker,
      currentPrice,
      averagePrice,
      quantity,
      investedAmount,
      marketValue,
      profitLossValue,
      profitLossPercent,
      historicalTrend,
      signal: signalResult.signal,
      confidence: signalResult.confidence,
      rationale: signalResult.rationale,
      updatedAt: new Date().toISOString(),
      source,
      disclaimer: DISCLAIMER,
    };
  }

  async analyzePositions(items: UserAssetPosition[]): Promise<PositionDecisionAnalysis[]> {
    return Promise.all(items.map((item) => this.analyzePosition(item)));
  }

  private computeTrend(prices: number[]): PositionDecisionAnalysis["historicalTrend"] {
    if (prices.length < 7) return "unknown";
    const window = prices.slice(-15);
    const first = window[0];
    const last = window[window.length - 1];
    if (!Number.isFinite(first) || !Number.isFinite(last) || first <= 0) return "unknown";
    const change = ((last - first) / first) * 100;
    if (change >= 2.5) return "up";
    if (change <= -2.5) return "down";
    return "sideways";
  }

  private computeSignal(input: {
    currentPrice: number | null;
    averagePrice: number | null;
    profitLossPercent: number | null;
    historicalTrend: PositionDecisionAnalysis["historicalTrend"];
  }): Pick<PositionDecisionAnalysis, "signal" | "confidence" | "rationale"> {
    const rationale: string[] = [];
    if (input.currentPrice === null || input.averagePrice === null || input.profitLossPercent === null) {
      return {
        signal: "hold",
        confidence: "low",
        rationale: ["Dados insuficientes de preço ou posição para emitir sinal forte."],
      };
    }

    if (input.profitLossPercent >= 12 && (input.historicalTrend === "down" || input.historicalTrend === "sideways")) {
      rationale.push("Lucro relevante acima de 12%.", "Tendência recente perdeu força após valorização.");
      return { signal: "sell", confidence: input.historicalTrend === "down" ? "high" : "medium", rationale };
    }

    if (input.profitLossPercent <= -6 && input.historicalTrend === "up") {
      rationale.push("Preço atual abaixo do preço médio.", "Tendência recente de recuperação.");
      return { signal: "buy", confidence: "medium", rationale };
    }

    if (input.historicalTrend === "up" && input.profitLossPercent < 4) {
      rationale.push("Tendência de alta no histórico curto.", "Gap para o preço médio ainda controlado.");
      return { signal: "buy", confidence: "low", rationale };
    }

    rationale.push("Sem gatilho claro de compra ou venda.", "Tendência e resultado atual pedem acompanhamento.");
    return { signal: "hold", confidence: "medium", rationale };
  }
}
