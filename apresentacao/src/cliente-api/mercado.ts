import type {
  AtivoBuscaSaida,
  AtivoDetalheSaida,
  CotacaoHistoricoSaida,
  FundoCvmSaida,
  TipoAtivo,
} from "@ei/contratos";
import { apiRequest } from "./http";

export function buscarAtivos(q: string, opcoes: { tipo?: TipoAtivo; limite?: number } = {}): Promise<AtivoBuscaSaida> {
  const params = new URLSearchParams({ q });
  if (opcoes.tipo) params.set("tipo", opcoes.tipo);
  if (opcoes.limite) params.set("limite", String(opcoes.limite));
  return apiRequest<AtivoBuscaSaida>(`/api/mercado/ativos?${params.toString()}`, { method: "GET" });
}

export function obterAtivo(ticker: string): Promise<AtivoDetalheSaida> {
  return apiRequest<AtivoDetalheSaida>(`/api/mercado/ativos/${encodeURIComponent(ticker)}`, { method: "GET" });
}

export function obterHistoricoCotacao(
  ticker: string,
  periodo: CotacaoHistoricoSaida["periodo"] = "1m",
): Promise<CotacaoHistoricoSaida> {
  return apiRequest<CotacaoHistoricoSaida>(
    `/api/mercado/ativos/${encodeURIComponent(ticker)}/historico?periodo=${periodo}`,
    { method: "GET" },
  );
}

export function obterFundoCvm(cnpj: string): Promise<FundoCvmSaida> {
  return apiRequest<FundoCvmSaida>(`/api/mercado/fundos-cvm/${encodeURIComponent(cnpj)}`, { method: "GET" });
}
