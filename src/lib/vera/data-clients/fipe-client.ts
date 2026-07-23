interface CarValue {
  brand: string;
  model: string;
  year: number;
  currentValue: number;
  referenceDate: string;
  deprecationRate: number;
  marketCondition: 'abundant' | 'normal' | 'scarce';
  updatedAt: string;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class FipeClient {
  private cache: Map<string, CacheEntry<CarValue>> = new Map();
  private readonly cacheTTL = 30 * 24 * 60 * 60 * 1000; // 30 days

  async getCarValue(
    brand: string,
    model: string,
    year: number
  ): Promise<CarValue | null> {
    const cacheKey = `${brand}-${model}-${year}`;
    const cached = this.cache.get(cacheKey);
    if (cached && !this.isExpired(cached)) {
      return cached.data;
    }

    try {
      // For now, return mock data
      // In production, integrate with real FIPE API via parallelum.com.br
      const carValue: CarValue = {
        brand,
        model,
        year,
        currentValue: this.estimateCarValue(year),
        referenceDate: new Date().toISOString().split('T')[0],
        deprecationRate: 0.1, // 10% annual deprecation
        marketCondition: 'normal',
        updatedAt: new Date().toISOString(),
      };

      this.cache.set(cacheKey, {
        data: carValue,
        expiresAt: Date.now() + this.cacheTTL,
      });

      return carValue;
    } catch (error) {
      console.error(`Error fetching car value for ${brand} ${model} ${year}:`, error);
      return null;
    }
  }

  async getCarValues(
    vehicles: Array<{ brand: string; model: string; year: number }>
  ): Promise<Map<string, CarValue>> {
    const results = new Map<string, CarValue>();

    const values = await Promise.all(
      vehicles.map((v) => this.getCarValue(v.brand, v.model, v.year))
    );

    vehicles.forEach((v, i) => {
      const key = `${v.brand}-${v.model}-${v.year}`;
      if (values[i]) {
        results.set(key, values[i]!);
      }
    });

    return results;
  }

  private estimateCarValue(year: number): number {
    // Simple linear depreciation model
    const currentYear = new Date().getFullYear();
    const ageYears = currentYear - year;
    const baseValue = 50000; // BRL
    const depreciationPerYear = 0.15; // 15% per year

    return baseValue * Math.pow(1 - depreciationPerYear, ageYears);
  }

  private isExpired<T>(entry: CacheEntry<T>): boolean {
    return Date.now() > entry.expiresAt;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
