// Shim legado — FIPE foi removido como endpoint canônico (rota /api/fipe morta).
// Todas as funções devolvem vazio; PerfilUsuario/CarSimulator têm fallback
// para digitação manual de valor. Arquivo some em Etapa 7.

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

export async function listarMontadorasCarro(): Promise<{ items: FipeBrand[]; fetchedAt: string }> {
  return { items: [], fetchedAt: new Date().toISOString() };
}

export async function listarModelosCarro(brandCode: string): Promise<{ brandCode: string; items: FipeModel[]; fetchedAt: string }> {
  return { brandCode, items: [], fetchedAt: new Date().toISOString() };
}

export async function listarAnosCarro(brandCode: string, modelCode: string): Promise<{ brandCode: string; modelCode: string; items: FipeYearVersion[]; fetchedAt: string }> {
  return { brandCode, modelCode, items: [], fetchedAt: new Date().toISOString() };
}

export async function obterPrecoFipeCarro(_brandCode: string, _modelCode: string, _yearCode: string): Promise<FipePriceReference> {
  return {
    referencePrice: null,
    referencePriceLabel: null,
    fipeCode: null,
    brand: null,
    model: null,
    modelYear: null,
    fuel: null,
    source: "fipe",
    fetchedAt: new Date().toISOString(),
  };
}
