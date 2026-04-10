import type { AtivoResumo, CategoriaAtivo, DetalheCategoria, ResumoCarteira } from "@ei/contratos";
import { apiRequest } from "./http";

export function obterResumoCarteira(): Promise<ResumoCarteira> {
  return apiRequest<ResumoCarteira>("/api/carteira/resumo", { method: "GET" });
}

export function listarAtivosCarteira(): Promise<AtivoResumo[]> {
  return apiRequest<AtivoResumo[]>("/api/carteira/ativos", { method: "GET" });
}

export function obterDetalheCategoria(tipo: CategoriaAtivo): Promise<DetalheCategoria> {
  return apiRequest<DetalheCategoria>(`/api/carteira/categoria/${tipo}`, { method: "GET" });
}
