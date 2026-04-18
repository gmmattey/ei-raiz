import type {
  EstadoReconstrucaoCarteira,
  EventoRelevante,
  HistoricoMensalCompleto,
  PontoHistoricoMensal,
  SnapshotPatrimonio,
} from "@ei/contratos";
import { apiRequest } from "./http";

export function listarSnapshots(limite = 12): Promise<SnapshotPatrimonio[]> {
  return apiRequest<SnapshotPatrimonio[]>(`/api/historico/snapshots?limite=${limite}`, { method: "GET" });
}

export function listarEventos(limite = 12): Promise<EventoRelevante[]> {
  return apiRequest<EventoRelevante[]>(`/api/historico/eventos?limite=${limite}`, { method: "GET" });
}

export function listarHistoricoMensal(limite = 24): Promise<{ pontos: PontoHistoricoMensal[] }> {
  return apiRequest<{ pontos: PontoHistoricoMensal[] }>(
    `/api/historico/mensal?limite=${limite}`,
    { method: "GET" },
  );
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
