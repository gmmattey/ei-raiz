import type { ContextoFinanceiroUsuario, PerfilFinanceiro, PlataformaVinculada } from "@ei/contratos";
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

export function obterContextoFinanceiro(): Promise<ContextoFinanceiroUsuario | null> {
  return apiRequest<ContextoFinanceiroUsuario | null>("/api/perfil/contexto", { method: "GET" });
}

export function salvarContextoFinanceiro(payload: Omit<ContextoFinanceiroUsuario, "usuarioId">): Promise<ContextoFinanceiroUsuario> {
  return apiRequest<ContextoFinanceiroUsuario>("/api/perfil/contexto", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
