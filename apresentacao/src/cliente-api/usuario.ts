import type {
  UsuarioSaida,
  UsuarioAtualizarEntrada,
  PreferenciasSaida,
  PreferenciasAtualizarEntrada,
  PlataformaVinculadaSaida,
} from "@ei/contratos";
import { apiRequest } from "./http";

export function obterUsuario(): Promise<UsuarioSaida> {
  return apiRequest<UsuarioSaida>("/api/usuario", { method: "GET" });
}

export function atualizarUsuario(entrada: UsuarioAtualizarEntrada): Promise<UsuarioSaida> {
  return apiRequest<UsuarioSaida>("/api/usuario", {
    method: "PATCH",
    body: JSON.stringify(entrada),
  });
}

export function obterPreferencias(): Promise<PreferenciasSaida> {
  return apiRequest<PreferenciasSaida>("/api/usuario/preferencias", { method: "GET" });
}

export function atualizarPreferencias(entrada: PreferenciasAtualizarEntrada): Promise<PreferenciasSaida> {
  return apiRequest<PreferenciasSaida>("/api/usuario/preferencias", {
    method: "PATCH",
    body: JSON.stringify(entrada),
  });
}

export function listarPlataformas(): Promise<{ itens: PlataformaVinculadaSaida[] }> {
  return apiRequest<{ itens: PlataformaVinculadaSaida[] }>("/api/usuario/plataformas", { method: "GET" });
}
