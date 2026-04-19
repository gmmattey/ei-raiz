import type {
  EstadoReconstrucaoCarteira,
  EventoRelevante,
  HistoricoMensalCompleto,
  PontoHistoricoMensal,
  RentabilidadeMensal,
  RespostaHistoricoMensal,
  SnapshotPatrimonio,
} from "@ei/contratos";
import { apiRequest } from "./http";

const RENTABILIDADE_INDISPONIVEL: RentabilidadeMensal = { available: false, points: [] };

export function listarSnapshots(limite = 12): Promise<SnapshotPatrimonio[]> {
  return apiRequest<SnapshotPatrimonio[]>(`/api/historico/snapshots?limite=${limite}`, { method: "GET" });
}

export function listarEventos(limite = 12): Promise<EventoRelevante[]> {
  return apiRequest<EventoRelevante[]>(`/api/historico/eventos?limite=${limite}`, { method: "GET" });
}

export function listarHistoricoMensal(limite = 24): Promise<RespostaHistoricoMensal> {
  return apiRequest<Partial<RespostaHistoricoMensal> & { pontos: PontoHistoricoMensal[] }>(
    `/api/historico/mensal?limite=${limite}`,
    { method: "GET" },
  ).then((resposta) => ({
    pontos: resposta.pontos ?? [],
    // Defesa defensiva: backends antigos podem não enviar o campo — nesse caso,
    // trata como indisponível e o gráfico fica oculto por padrão.
    monthlyPerformance: resposta.monthlyPerformance ?? RENTABILIDADE_INDISPONIVEL,
  }));
}

export function obterMesHistorico(anoMes: string): Promise<HistoricoMensalCompleto> {
  return apiRequest<HistoricoMensalCompleto>(`/api/historico/mensal/${anoMes}`, { method: "GET" });
}

export function obterEstadoReconstrucao(): Promise<EstadoReconstrucaoCarteira | null> {
  return apiRequest<EstadoReconstrucaoCarteira | null>("/api/historico/reconstrucao", { method: "GET" });
}

export function enfileirarReconstrucao(): Promise<EstadoReconstrucaoCarteira> {
  return apiRequest<EstadoReconstrucaoCarteira>("/api/historico/reconstrucao", { method: "POST" });
}

export function processarLoteReconstrucao(): Promise<EstadoReconstrucaoCarteira> {
  return apiRequest<EstadoReconstrucaoCarteira>("/api/historico/reconstrucao/processar", { method: "POST" });
}
