import type {
  PatrimonioResumoSaida,
  ItemPatrimonioSaida,
  ItemPatrimonioCriarEntrada,
  ItemPatrimonioAtualizarEntrada,
  AporteSaida,
  AporteCriarEntrada,
  HistoricoMensalSaida,
  PatrimonioScoreSaida,
  ImportacaoSaida,
  ImportacaoCriarEntrada,
} from "@ei/contratos";
import { apiRequest } from "./http";

export function obterResumo(): Promise<PatrimonioResumoSaida> {
  return apiRequest<PatrimonioResumoSaida>("/api/patrimonio/resumo", { method: "GET" });
}

export function listarItens(): Promise<{ itens: ItemPatrimonioSaida[] }> {
  return apiRequest<{ itens: ItemPatrimonioSaida[] }>("/api/patrimonio/itens", { method: "GET" });
}

export function obterItem(id: string): Promise<ItemPatrimonioSaida> {
  return apiRequest<ItemPatrimonioSaida>(`/api/patrimonio/itens/${encodeURIComponent(id)}`, { method: "GET" });
}

export function criarItem(entrada: ItemPatrimonioCriarEntrada): Promise<ItemPatrimonioSaida> {
  return apiRequest<ItemPatrimonioSaida>("/api/patrimonio/itens", {
    method: "POST",
    body: JSON.stringify(entrada),
  });
}

export function atualizarItem(id: string, entrada: ItemPatrimonioAtualizarEntrada): Promise<ItemPatrimonioSaida> {
  return apiRequest<ItemPatrimonioSaida>(`/api/patrimonio/itens/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(entrada),
  });
}

export function removerItem(id: string): Promise<{ removido: boolean }> {
  return apiRequest<{ removido: boolean }>(`/api/patrimonio/itens/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function listarAportes(): Promise<{ itens: AporteSaida[] }> {
  return apiRequest<{ itens: AporteSaida[] }>("/api/patrimonio/aportes", { method: "GET" });
}

export function criarAporte(entrada: AporteCriarEntrada): Promise<AporteSaida> {
  return apiRequest<AporteSaida>("/api/patrimonio/aportes", {
    method: "POST",
    body: JSON.stringify(entrada),
  });
}

export function removerAporte(id: string): Promise<{ removido: boolean }> {
  return apiRequest<{ removido: boolean }>(`/api/patrimonio/aportes/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function obterHistorico(): Promise<HistoricoMensalSaida> {
  return apiRequest<HistoricoMensalSaida>("/api/patrimonio/historico", { method: "GET" });
}

export function obterScore(): Promise<PatrimonioScoreSaida> {
  return apiRequest<PatrimonioScoreSaida>("/api/patrimonio/score", { method: "GET" });
}

export function criarImportacao(entrada: ImportacaoCriarEntrada): Promise<ImportacaoSaida> {
  return apiRequest<ImportacaoSaida>("/api/patrimonio/importacoes", {
    method: "POST",
    body: JSON.stringify(entrada),
  });
}

export function obterImportacao(id: string): Promise<ImportacaoSaida> {
  return apiRequest<ImportacaoSaida>(`/api/patrimonio/importacoes/${encodeURIComponent(id)}`, { method: "GET" });
}
