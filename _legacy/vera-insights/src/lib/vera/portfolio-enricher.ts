import { BrapiClient } from './data-clients/brapi-client.js';
import { CvmClient } from './data-clients/cvm-client.js';
import { FipeClient } from './data-clients/fipe-client.js';
import { CacheManager } from './cache-manager.js';

export interface PortfolioPosition {
  id: string;
  ticker?: string;
  assetClass: 'stocks' | 'funds' | 'vehicles' | 'fixed_income' | 'other';
  quantity: number;
  purchasePrice: number;
  currentPrice?: number;
  name: string;
  metadata?: any;
}

export interface EnrichedPosition extends PortfolioPosition {
  currentValue: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  dividend?: { yield: number; annualDividend: number };
  metrics: { volatility: number; volume?: number; beta?: number };
  dataSource: 'brapi' | 'cvm' | 'fipe' | 'manual';
  updatedAt: string;
}

export interface PortfolioSnapshot {
  userId: string;
  timestamp: string;
  positions: EnrichedPosition[];
  summary: {
    totalValue: number;
    totalCost: number;
    unrealizedGain: number;
    diversification: { count: number; concentration: 'high' | 'moderate' | 'low' };
    riskScore: number;
  };
}

export class PortfolioEnricher {
  constructor(
    private brapi: BrapiClient,
    private cvm: CvmClient,
    private fipe: FipeClient,
    private cache: CacheManager
  ) {}

  async enrichPositions(
    positions: PortfolioPosition[],
    options: { includeHistorical?: boolean; useCache?: boolean } = {}
  ): Promise<EnrichedPosition[]> {
    const useCache = options.useCache !== false;
    const enriched: EnrichedPosition[] = [];

    // Group by asset class for efficient processing
    const byClass = this.groupBy(positions, (p) => p.assetClass);

    // Process stocks
    if (byClass['stocks']) {
      const tickers = byClass['stocks']
        .filter((p) => p.ticker)
        .map((p) => p.ticker!);

      const quotes = await this.brapi.getBatchPrices(tickers);

      for (const stock of byClass['stocks']) {
        const quote = quotes.get(stock.ticker || '');
        if (quote) {
          enriched.push(this.enrichStock(stock, quote));
        } else {
          enriched.push(this.enrichStockManual(stock));
        }
      }
    }

    // Process funds
    if (byClass['funds']) {
      for (const fund of byClass['funds']) {
        const fundData = await this.cvm.getFundData(fund.ticker || '');
        const performance = await this.cvm.getFundPerformance(fund.ticker || '');

        if (fundData && performance) {
          enriched.push(this.enrichFund(fund, fundData, performance));
        } else {
          enriched.push(this.enrichFundManual(fund));
        }
      }
    }

    // Process vehicles
    if (byClass['vehicles']) {
      for (const vehicle of byClass['vehicles']) {
        const metadata = vehicle.metadata || {};
        const carValue = await this.fipe.getCarValue(
          metadata.brand || 'Unknown',
          metadata.model || 'Unknown',
          metadata.year || new Date().getFullYear()
        );

        if (carValue) {
          enriched.push(this.enrichVehicle(vehicle, carValue));
        } else {
          enriched.push(this.enrichVehicleManual(vehicle));
        }
      }
    }

    // Pass through fixed income and other assets
    if (byClass['fixed_income']) {
      enriched.push(
        ...byClass['fixed_income'].map((p) => this.enrichFixedIncome(p))
      );
    }
    if (byClass['other']) {
      enriched.push(...byClass['other'].map((p) => this.enrichOther(p)));
    }

    return enriched;
  }

  async refreshSnapshot(
    userId: string,
    positions: PortfolioPosition[]
  ): Promise<PortfolioSnapshot> {
    const enriched = await this.enrichPositions(positions);

    const totalValue = enriched.reduce((sum, p) => sum + p.currentValue, 0);
    const totalCost = enriched.reduce((sum, p) => sum + p.purchasePrice * p.quantity, 0);
    const unrealizedGain = enriched.reduce((sum, p) => sum + p.unrealizedGain, 0);

    const snapshot: PortfolioSnapshot = {
      userId,
      timestamp: new Date().toISOString(),
      positions: enriched,
      summary: {
        totalValue,
        totalCost,
        unrealizedGain,
        diversification: this.calculateDiversification(enriched),
        riskScore: this.calculateRiskScore(enriched),
      },
    };

    return snapshot;
  }

  private enrichStock(
    position: PortfolioPosition,
    quote: any
  ): EnrichedPosition {
    const currentValue = position.quantity * quote.currentPrice;
    const unrealizedGain = (quote.currentPrice - position.purchasePrice) * position.quantity;

    return {
      ...position,
      currentPrice: quote.currentPrice,
      currentValue,
      unrealizedGain,
      unrealizedGainPercent: (unrealizedGain / (position.purchasePrice * position.quantity)) * 100,
      dividend: {
        yield: quote.dividendYield,
        annualDividend: currentValue * quote.dividendYield,
      },
      metrics: {
        volatility: quote.volatility,
        volume: quote.volume,
        beta: quote.beta || 1.0,
      },
      dataSource: 'brapi',
      updatedAt: quote.updatedAt,
    };
  }

  private enrichStockManual(position: PortfolioPosition): EnrichedPosition {
    const currentPrice = position.currentPrice || position.purchasePrice;
    const currentValue = position.quantity * currentPrice;
    const unrealizedGain = (currentPrice - position.purchasePrice) * position.quantity;

    return {
      ...position,
      currentPrice,
      currentValue,
      unrealizedGain,
      unrealizedGainPercent: (unrealizedGain / (position.purchasePrice * position.quantity)) * 100,
      dividend: {
        yield: 0.04,
        annualDividend: currentValue * 0.04,
      },
      metrics: { volatility: 0.18, volume: 0 },
      dataSource: 'manual',
      updatedAt: new Date().toISOString(),
    };
  }

  private enrichFund(position: PortfolioPosition, fundData: any, performance: any): EnrichedPosition {
    const currentValue = position.quantity * (position.currentPrice || position.purchasePrice);
    const unrealizedGain =
      ((position.currentPrice || position.purchasePrice) - position.purchasePrice) *
      position.quantity;

    return {
      ...position,
      currentValue,
      unrealizedGain,
      unrealizedGainPercent: (unrealizedGain / (position.purchasePrice * position.quantity)) * 100,
      dividend: {
        yield: performance.return12m,
        annualDividend: currentValue * performance.return12m,
      },
      metrics: {
        volatility: performance.volatility,
        volume: 0,
      },
      dataSource: 'cvm',
      updatedAt: new Date().toISOString(),
    };
  }

  private enrichFundManual(position: PortfolioPosition): EnrichedPosition {
    const currentValue = position.quantity * (position.currentPrice || position.purchasePrice);
    const unrealizedGain =
      ((position.currentPrice || position.purchasePrice) - position.purchasePrice) *
      position.quantity;

    return {
      ...position,
      currentValue,
      unrealizedGain,
      unrealizedGainPercent: (unrealizedGain / (position.purchasePrice * position.quantity)) * 100,
      dividend: {
        yield: 0.08,
        annualDividend: currentValue * 0.08,
      },
      metrics: { volatility: 0.12, volume: 0 },
      dataSource: 'manual',
      updatedAt: new Date().toISOString(),
    };
  }

  private enrichVehicle(position: PortfolioPosition, carValue: any): EnrichedPosition {
    const unrealizedGain = carValue.currentValue - position.purchasePrice * position.quantity;

    return {
      ...position,
      currentPrice: carValue.currentValue / position.quantity,
      currentValue: carValue.currentValue,
      unrealizedGain,
      unrealizedGainPercent: (unrealizedGain / (position.purchasePrice * position.quantity)) * 100,
      metrics: {
        volatility: 0.05,
        volume: 0,
      },
      dataSource: 'fipe',
      updatedAt: carValue.updatedAt,
    };
  }

  private enrichVehicleManual(position: PortfolioPosition): EnrichedPosition {
    const currentPrice = position.currentPrice || position.purchasePrice;
    const currentValue = currentPrice * position.quantity;
    const unrealizedGain = (currentPrice - position.purchasePrice) * position.quantity;

    return {
      ...position,
      currentPrice,
      currentValue,
      unrealizedGain,
      unrealizedGainPercent: (unrealizedGain / (position.purchasePrice * position.quantity)) * 100,
      metrics: { volatility: 0.08, volume: 0 },
      dataSource: 'manual',
      updatedAt: new Date().toISOString(),
    };
  }

  private enrichFixedIncome(position: PortfolioPosition): EnrichedPosition {
    const currentValue = position.quantity * (position.currentPrice || position.purchasePrice);
    const unrealizedGain =
      ((position.currentPrice || position.purchasePrice) - position.purchasePrice) *
      position.quantity;

    return {
      ...position,
      currentValue,
      unrealizedGain,
      unrealizedGainPercent: (unrealizedGain / (position.purchasePrice * position.quantity)) * 100,
      dividend: {
        yield: 0.05,
        annualDividend: currentValue * 0.05,
      },
      metrics: { volatility: 0.02, volume: 0 },
      dataSource: 'manual',
      updatedAt: new Date().toISOString(),
    };
  }

  private enrichOther(position: PortfolioPosition): EnrichedPosition {
    const currentPrice = position.currentPrice || position.purchasePrice;
    const currentValue = position.quantity * currentPrice;
    const unrealizedGain = (currentPrice - position.purchasePrice) * position.quantity;

    return {
      ...position,
      currentPrice,
      currentValue,
      unrealizedGain,
      unrealizedGainPercent: (unrealizedGain / (position.purchasePrice * position.quantity)) * 100,
      metrics: { volatility: 0.1, volume: 0 },
      dataSource: 'manual',
      updatedAt: new Date().toISOString(),
    };
  }

  private calculateDiversification(
    positions: EnrichedPosition[]
  ): { count: number; concentration: 'high' | 'moderate' | 'low' } {
    const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
    const topThreeValue = positions
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(0, 3)
      .reduce((sum, p) => sum + p.currentValue, 0);

    const concentration = topThreeValue / totalValue;

    return {
      count: positions.length,
      concentration: concentration > 0.7 ? 'high' : concentration > 0.4 ? 'moderate' : 'low',
    };
  }

  private calculateRiskScore(positions: EnrichedPosition[]): number {
    if (positions.length === 0) return 0;

    const avgVolatility =
      positions.reduce((sum, p) => sum + (p.metrics.volatility || 0.1), 0) / positions.length;

    return Math.min(100, Math.round(avgVolatility * 100));
  }

  private groupBy<T>(
    items: T[],
    keyFn: (item: T) => string
  ): Record<string, T[]> {
    const result: Record<string, T[]> = {};
    for (const item of items) {
      const key = keyFn(item);
      if (!result[key]) {
        result[key] = [];
      }
      result[key].push(item);
    }
    return result;
  }
}
