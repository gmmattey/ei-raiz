import type { PerfilSaida, PerfilAtualizarEntrada } from "@ei/contratos";
import { apiRequest } from "./http";

export function obterPerfil(): Promise<PerfilSaida> {
  return apiRequest<PerfilSaida>("/api/perfil", { method: "GET" });
}

export function atualizarPerfil(entrada: PerfilAtualizarEntrada): Promise<PerfilSaida> {
  return apiRequest<PerfilSaida>("/api/perfil", {
    method: "PUT",
    body: JSON.stringify(entrada),
  });
}
