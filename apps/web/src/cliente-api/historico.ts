import type { EventoRelevante, SnapshotPatrimonio } from "@ei/contratos";
import { apiRequest } from "./http";

export function listarSnapshots(limite = 12): Promise<SnapshotPatrimonio[]> {
  return apiRequest<SnapshotPatrimonio[]>(`/api/historico/snapshots?limite=${limite}`, { method: "GET" });
}

export function listarEventos(limite = 12): Promise<EventoRelevante[]> {
  return apiRequest<EventoRelevante[]>(`/api/historico/eventos?limite=${limite}`, { method: "GET" });
}
