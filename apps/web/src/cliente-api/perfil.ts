import type { PerfilFinanceiro, PlataformaVinculada } from "@ei/contratos";
import { apiRequest } from "./http";

export function obterPerfil(): Promise<PerfilFinanceiro | null> {
  return apiRequest<PerfilFinanceiro | null>("/api/perfil", { method: "GET" });
}

export function salvarPerfil(payload: Omit<PerfilFinanceiro, "id" | "usuarioId">): Promise<PerfilFinanceiro> {
  return apiRequest<PerfilFinanceiro>("/api/perfil", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function listarPlataformas(): Promise<PlataformaVinculada[]> {
  return apiRequest<PlataformaVinculada[]>("/api/perfil/plataformas", { method: "GET" });
}
