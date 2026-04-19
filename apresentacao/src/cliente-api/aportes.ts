import { apiRequest } from "./http";

export type Aporte = {
  id: string;
  usuarioId: string;
  ativoId: string | null;
  valor: number;
  dataAporte: string;
  origem: "manual" | "importacao" | "integracao";
  observacao: string | null;
  criadoEm: string;
};

export type CriarAporteEntrada = {
  ativoId?: string | null;
  valor: number;
  dataAporte: string;
  origem?: "manual" | "importacao" | "integracao";
  observacao?: string;
};

export type ResumoAportes = {
  total: number;
  mesesDistintos6m: number;
  valorTotal6m: number;
};

export function listarAportes(limit = 100): Promise<Aporte[]> {
  return apiRequest<Aporte[]>(`/api/aportes?limit=${limit}`, { method: "GET" });
}

export function obterResumoAportes(): Promise<ResumoAportes> {
  return apiRequest<ResumoAportes>("/api/aportes/resumo", { method: "GET" });
}

export function criarAporte(payload: CriarAporteEntrada): Promise<Aporte> {
  return apiRequest<Aporte>("/api/aportes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function removerAporte(id: string): Promise<{ removido: boolean }> {
  return apiRequest<{ removido: boolean }>(`/api/aportes/${id}`, { method: "DELETE" });
}
