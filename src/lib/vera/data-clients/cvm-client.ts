interface FundInfo {
  code: string;
  name: string;
  type: 'FIA' | 'FII' | 'FIC_AÇÕES' | 'FIC_RENDA_FIXA' | 'FIC_MULTIMERCADO';
  manager: string;
  minimumInvestment: number;
  fee: number; // Annual %
  benchmark: string;
  updatedAt: string;
}

interface FundPerformance {
  return1m: number;
  return3m: number;
  return12m: number;
  returnYtd: number;
  benchmarkReturn12m: number;
  outperformance: number;
  volatility: number;
  sharpeRatio: number;
  updatedAt: string;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class CvmClient {
  private cache: Map<string, CacheEntry<FundInfo>> = new Map();
  private performanceCache: Map<string, CacheEntry<FundPerformance>> = new Map();
  private readonly cacheTTL = 24 * 60 * 60 * 1000; // 24 hours

  async getFundData(fundCode: string): Promise<FundInfo | null> {
    // Check cache
    const cached = this.cache.get(fundCode);
    if (cached && !this.isExpired(cached)) {
      return cached.data;
    }

    try {
      // For now, return mock data since CVM API requires authentication
      // In production, integrate with real CVM API
      const fundInfo: FundInfo = {
        code: fundCode,
        name: `Fund ${fundCode}`,
        type: 'FIA',
        manager: 'Unknown Manager',
        minimumInvestment: 100,
        fee: 0.5, // 0.5% annually
        benchmark: 'IBOV',
        updatedAt: new Date().toISOString(),
      };

      this.cache.set(fundCode, {
        data: fundInfo,
        expiresAt: Date.now() + this.cacheTTL,
      });

      return fundInfo;
    } catch (error) {
      console.error(`Error fetching fund data for ${fundCode}:`, error);
      return null;
    }
  }

  async getFundPerformance(
    fundCode: string,
    months: number = 12
  ): Promise<FundPerformance | null> {
    const cacheKey = `${fundCode}_${months}`;
    const cached = this.performanceCache.get(cacheKey);
    if (cached && !this.isExpired(cached)) {
      return cached.data;
    }

    try {
      // Mock performance data
      const performance: FundPerformance = {
        return1m: 0.015, // 1.5%
        return3m: 0.045, // 4.5%
        return12m: 0.12, // 12%
        returnYtd: 0.08, // 8%
        benchmarkReturn12m: 0.1, // 10%
        outperformance: 0.02, // 2%
        volatility: 0.12, // 12%
        sharpeRatio: 1.0,
        updatedAt: new Date().toISOString(),
      };

      this.performanceCache.set(cacheKey, {
        data: performance,
        expiresAt: Date.now() + this.cacheTTL,
      });

      return performance;
    } catch (error) {
      console.error(`Error fetching fund performance for ${fundCode}:`, error);
      return null;
    }
  }

  private isExpired<T>(entry: CacheEntry<T>): boolean {
    return Date.now() > entry.expiresAt;
  }

  clearCache(): void {
    this.cache.clear();
    this.performanceCache.clear();
  }
}
