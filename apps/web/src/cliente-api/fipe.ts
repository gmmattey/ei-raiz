import { apiRequest } from "./http";

export type FipeBrand = { code: string; label: string };
export type FipeModel = { code: string; label: string };
export type FipeYearVersion = { code: string; label: string };
export type FipePriceReference = {
  referencePrice: number | null;
  referencePriceLabel: string | null;
  fipeCode: string | null;
  brand: string | null;
  model: string | null;
  modelYear: number | null;
  fuel: string | null;
  source: "fipe";
  fetchedAt: string;
};

export function listarMontadorasCarro(): Promise<{ items: FipeBrand[]; fetchedAt: string }> {
  return apiRequest<{ items: FipeBrand[]; fetchedAt: string }>("/api/fipe/car/brands", { method: "GET" });
}

export function listarModelosCarro(brandCode: string): Promise<{ brandCode: string; items: FipeModel[]; fetchedAt: string }> {
  return apiRequest<{ brandCode: string; items: FipeModel[]; fetchedAt: string }>(`/api/fipe/car/models/${encodeURIComponent(brandCode)}`, { method: "GET" });
}

export function listarAnosCarro(brandCode: string, modelCode: string): Promise<{ brandCode: string; modelCode: string; items: FipeYearVersion[]; fetchedAt: string }> {
  return apiRequest<{ brandCode: string; modelCode: string; items: FipeYearVersion[]; fetchedAt: string }>(`/api/fipe/car/years/${encodeURIComponent(brandCode)}/${encodeURIComponent(modelCode)}`, { method: "GET" });
}

export function obterPrecoFipeCarro(brandCode: string, modelCode: string, yearCode: string): Promise<FipePriceReference> {
  return apiRequest<FipePriceReference>(`/api/fipe/car/price/${encodeURIComponent(brandCode)}/${encodeURIComponent(modelCode)}/${encodeURIComponent(yearCode)}`, { method: "GET" });
}
