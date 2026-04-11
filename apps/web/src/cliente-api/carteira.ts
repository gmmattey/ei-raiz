import type { AtivoResumo, CategoriaAtivo, ComparativoBenchmarkCarteira, DetalheCategoria, ResumoCarteira } from "@ei/contratos";
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

export function obterBenchmarkCarteira(meses = 12): Promise<ComparativoBenchmarkCarteira & {
  fonte_benchmark?: string;
  status_atualizacao_benchmark?: "atualizado" | "atrasado" | "indisponivel";
  atualizado_em_benchmark?: string | null;
}> {
  return apiRequest(`/api/carteira/benchmark?meses=${meses}`, { method: "GET" });
}

export function obterDetalheAtivo(ticker: string): Promise<any> {
  return apiRequest(`/api/carteira/ativo/${encodeURIComponent(ticker)}`, { method: "GET" });
}

export function atualizarDataAquisicaoAtivo(ativoId: string, dataAquisicao: string): Promise<{ atualizado: boolean; mensagem: string }> {
  return apiRequest(`/api/carteira/ativo/${encodeURIComponent(ativoId)}/data-aquisicao`, {
    method: "PUT",
    body: JSON.stringify({ dataAquisicao }),
  });
}

export function vincularMovimentacaoAtivos(payload: {
  ativoOrigemId: string;
  ativoDestinoId: string;
  valor: number;
  dataMovimentacao: string;
  observacao?: string;
}): Promise<{ id: string; mensagem: string }> {
  return apiRequest("/api/carteira/movimentacoes/vincular", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registrarAporteAtivo(
  ativoId: string,
  payload: { valorAporte: number; quantidade?: number; precoUnitario?: number; dataOperacao?: string; observacao?: string },
): Promise<{ atualizado: boolean; mensagem: string }> {
  return apiRequest(`/api/carteira/ativo/${encodeURIComponent(ativoId)}/aporte`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function excluirAtivo(ativoId: string, motivo: string): Promise<{ removido: boolean; mensagem: string }> {
  return apiRequest(`/api/carteira/ativo/${encodeURIComponent(ativoId)}`, {
    method: "DELETE",
    body: JSON.stringify({ motivo }),
  });
}
