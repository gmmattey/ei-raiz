import { httpJson } from "../utils/http";

type FipeBrandRaw = { codigo: string; nome: string };
type FipeModelRaw = { codigo: number; nome: string };
type FipeModelsResponse = { modelos: FipeModelRaw[] };
type FipeYearRaw = { codigo: string; nome: string };
type FipePriceRaw = {
  Valor?: string;
  Marca?: string;
  Modelo?: string;
  AnoModelo?: number;
  Combustivel?: string;
  CodigoFipe?: string;
};

const toPrice = (raw: string | undefined): number | null => {
  if (!raw) return null;
  const normalized = raw.replace(/[R$\s]/g, "").replace(/\./g, "").replace(",", ".");
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
};

type FipeProviderDeps = { baseUrl: string };

export class FipeProvider {
  private readonly baseUrl: string;

  constructor(deps: FipeProviderDeps) {
    this.baseUrl = deps.baseUrl.replace(/\/+$/, "");
  }

  async fetchBrands(): Promise<Array<{ code: string; label: string }>> {
    const data = await httpJson<FipeBrandRaw[]>(
      `${this.baseUrl}/marcas`,
      { method: "GET", headers: { Accept: "application/json" } },
      { timeoutMs: 8000, source: "fipe" },
    );
    return (data || []).map((item) => ({ code: String(item.codigo), label: item.nome }));
  }

  async fetchModels(brandCode: string): Promise<Array<{ code: string; label: string }>> {
    const data = await httpJson<FipeModelsResponse>(
      `${this.baseUrl}/marcas/${encodeURIComponent(brandCode)}/modelos`,
      { method: "GET", headers: { Accept: "application/json" } },
      { timeoutMs: 8000, source: "fipe" },
    );
    return (data.modelos || []).map((item) => ({ code: String(item.codigo), label: item.nome }));
  }

  async fetchYears(brandCode: string, modelCode: string): Promise<Array<{ code: string; label: string }>> {
    const data = await httpJson<FipeYearRaw[]>(
      `${this.baseUrl}/marcas/${encodeURIComponent(brandCode)}/modelos/${encodeURIComponent(modelCode)}/anos`,
      { method: "GET", headers: { Accept: "application/json" } },
      { timeoutMs: 8000, source: "fipe" },
    );
    return (data || []).map((item) => ({ code: item.codigo, label: item.nome }));
  }

  async fetchPrice(brandCode: string, modelCode: string, yearCode: string) {
    const data = await httpJson<FipePriceRaw>(
      `${this.baseUrl}/marcas/${encodeURIComponent(brandCode)}/modelos/${encodeURIComponent(modelCode)}/anos/${encodeURIComponent(yearCode)}`,
      { method: "GET", headers: { Accept: "application/json" } },
      { timeoutMs: 8000, source: "fipe" },
    );
    return {
      referencePrice: toPrice(data.Valor),
      referencePriceLabel: data.Valor ?? null,
      fipeCode: data.CodigoFipe ?? null,
      brand: data.Marca ?? null,
      model: data.Modelo ?? null,
      modelYear: typeof data.AnoModelo === "number" ? data.AnoModelo : null,
      fuel: data.Combustivel ?? null,
      source: "fipe" as const,
      fetchedAt: new Date().toISOString(),
    };
  }
}
