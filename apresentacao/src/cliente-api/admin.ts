import type {
  AdminEntrarEntrada,
  AdminUsuarioSaida,
  AdminAuditoriaItem,
  AdminIngestaoCvmItem,
  TokenSaida,
} from "@ei/contratos";
import { saveSession } from "./authStorage";
import { apiRequest } from "./http";

export async function entrarAdmin(entrada: AdminEntrarEntrada): Promise<TokenSaida> {
  const resposta = await apiRequest<TokenSaida>("/api/admin/entrar", {
    method: "POST",
    body: JSON.stringify(entrada),
  });
  saveSession({
    token: resposta.token,
    usuario: { id: "", nome: "", email: entrada.email },
  });
  return resposta;
}

export function listarUsuarios(): Promise<{ itens: AdminUsuarioSaida[] }> {
  return apiRequest<{ itens: AdminUsuarioSaida[] }>("/api/admin/usuarios", { method: "GET" });
}

export function listarAuditoria(): Promise<{ itens: AdminAuditoriaItem[] }> {
  return apiRequest<{ itens: AdminAuditoriaItem[] }>("/api/admin/auditoria", { method: "GET" });
}

export function listarIngestoesCvm(): Promise<{ itens: AdminIngestaoCvmItem[] }> {
  return apiRequest<{ itens: AdminIngestaoCvmItem[] }>("/api/admin/cvm", { method: "GET" });
}
