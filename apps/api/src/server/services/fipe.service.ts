import { FipeProvider } from "../providers/fipe.provider";
import { readCache, writeCache } from "../utils/cache";
import type { FipeBrand, FipeModel, FipePriceReference, FipeYearVersion } from "../types/financial-contracts";

type FipeServiceDeps = {
  provider: FipeProvider;
  db: D1Database;
};

const TTL_FIPE_MS = 24 * 60 * 60 * 1000;

export class FipeService {
  private readonly provider: FipeProvider;
  private readonly db: D1Database;

  constructor(deps: FipeServiceDeps) {
    this.provider = deps.provider;
    this.db = deps.db;
  }

  async getBrands(): Promise<FipeBrand[]> {
    const key = "fipe:brands:carros";
    const cached = await readCache<FipeBrand[]>(this.db, "fipe", key);
    if (cached) return cached;
    const data = await this.provider.fetchBrands();
    await writeCache(this.db, "fipe", key, data, TTL_FIPE_MS);
    return data;
  }

  async getModels(brandCode: string): Promise<FipeModel[]> {
    const key = `fipe:models:carros:${brandCode}`;
    const cached = await readCache<FipeModel[]>(this.db, "fipe", key);
    if (cached) return cached;
    const data = await this.provider.fetchModels(brandCode);
    await writeCache(this.db, "fipe", key, data, TTL_FIPE_MS);
    return data;
  }

  async getYears(brandCode: string, modelCode: string): Promise<FipeYearVersion[]> {
    const key = `fipe:years:carros:${brandCode}:${modelCode}`;
    const cached = await readCache<FipeYearVersion[]>(this.db, "fipe", key);
    if (cached) return cached;
    const data = await this.provider.fetchYears(brandCode, modelCode);
    await writeCache(this.db, "fipe", key, data, TTL_FIPE_MS);
    return data;
  }

  async getPrice(brandCode: string, modelCode: string, yearCode: string): Promise<FipePriceReference> {
    const key = `fipe:price:carros:${brandCode}:${modelCode}:${yearCode}`;
    const cached = await readCache<FipePriceReference>(this.db, "fipe", key);
    if (cached) return cached;
    const data = await this.provider.fetchPrice(brandCode, modelCode, yearCode);
    await writeCache(this.db, "fipe", key, data, TTL_FIPE_MS);
    return data;
  }
}
