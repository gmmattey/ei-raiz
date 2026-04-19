import type { CalcularSimulacaoEntrada, HistoricoSimulacao, PremissasMercadoSimulador, ResultadoSimulacao, Simulacao, TipoSimulacao } from "@ei/contratos";
import { apiRequest } from "./http";

export function obterPremissasMercado(tipo: TipoSimulacao): Promise<PremissasMercadoSimulador> {
  return apiRequest<PremissasMercadoSimulador>(`/api/decisoes/premissas/${tipo}`, { method: "GET" });
}

export function calcularSimulacao(payload: CalcularSimulacaoEntrada): Promise<ResultadoSimulacao> {
  return apiRequest<ResultadoSimulacao>("/api/decisoes/simulacoes/calcular", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function salvarSimulacao(payload: CalcularSimulacaoEntrada): Promise<Simulacao> {
  return apiRequest<Simulacao>("/api/decisoes/simulacoes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listarSimulacoes(): Promise<Simulacao[]> {
  return apiRequest<Simulacao[]>("/api/decisoes/simulacoes", { method: "GET" });
}

export function obterSimulacao(id: string): Promise<Simulacao> {
  return apiRequest<Simulacao>(`/api/decisoes/simulacoes/${id}`, { method: "GET" });
}

export function recalcularSimulacao(id: string): Promise<Simulacao> {
  return apiRequest<Simulacao>(`/api/decisoes/simulacoes/${id}/recalcular`, { method: "POST" });
}

export function duplicarSimulacao(id: string): Promise<Simulacao> {
  return apiRequest<Simulacao>(`/api/decisoes/simulacoes/${id}/duplicar`, { method: "POST" });
}

export function listarHistoricoSimulacao(id: string): Promise<HistoricoSimulacao[]> {
  return apiRequest<HistoricoSimulacao[]>(`/api/decisoes/simulacoes/${id}/historico`, { method: "GET" });
}
