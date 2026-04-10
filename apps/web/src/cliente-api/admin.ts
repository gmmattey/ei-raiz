import { apiRequest } from "./http";
import type { AppConfig } from "./config";
import type { BlocoConteudo, ConteudoAppResposta, CorretoraSuportada } from "./conteudo";

export type AdminMe = {
  email: string;
  isAdmin: boolean;
};

export type AdminUsuario = {
  email: string;
  ativo: boolean;
  concedidoPor: string | null;
  atualizadoEm: string | null;
};

export type LogAuditoriaAdmin = {
  id: string;
  acao: string;
  alvo: string;
  payloadJson: string;
  autorEmail: string;
  criadoEm: string;
};

export function obterMeAdmin(): Promise<AdminMe> {
  return apiRequest<AdminMe>("/api/admin/me", { method: "GET" });
}

export function obterConfigAdmin(): Promise<AppConfig> {
  return apiRequest<AppConfig>("/api/admin/config", { method: "GET" });
}

export function atualizarScoreAdmin(score: Record<string, unknown>): Promise<{ atualizado: boolean }> {
  return apiRequest<{ atualizado: boolean }>("/api/admin/config/score", {
    method: "PUT",
    body: JSON.stringify({ score }),
  });
}

export function atualizarFlagsAdmin(flags: Record<string, boolean>): Promise<{ atualizado: boolean }> {
  return apiRequest<{ atualizado: boolean }>("/api/admin/config/flags", {
    method: "PUT",
    body: JSON.stringify({ flags }),
  });
}

export function atualizarMenusAdmin(menus: AppConfig["menus"]): Promise<{ atualizado: boolean }> {
  return apiRequest<{ atualizado: boolean }>("/api/admin/config/menus", {
    method: "PUT",
    body: JSON.stringify({ menus }),
  });
}

export function obterConteudoAdmin(): Promise<ConteudoAppResposta> {
  return apiRequest<ConteudoAppResposta>("/api/admin/content", { method: "GET" });
}

export function atualizarConteudoAdmin(blocos: BlocoConteudo[]): Promise<{ atualizado: boolean }> {
  return apiRequest<{ atualizado: boolean }>("/api/admin/content", {
    method: "PUT",
    body: JSON.stringify({ blocos }),
  });
}

export function obterCorretorasAdmin(): Promise<CorretoraSuportada[]> {
  return apiRequest<CorretoraSuportada[]>("/api/admin/corretoras", { method: "GET" });
}

export function atualizarCorretorasAdmin(corretoras: CorretoraSuportada[]): Promise<{ atualizado: boolean }> {
  return apiRequest<{ atualizado: boolean }>("/api/admin/corretoras", {
    method: "PUT",
    body: JSON.stringify({ corretoras }),
  });
}

export function listarAdmins(): Promise<AdminUsuario[]> {
  return apiRequest<AdminUsuario[]>("/api/admin/usuarios", { method: "GET" });
}

export function atualizarAdmin(email: string, ativo: boolean): Promise<{ atualizado: boolean }> {
  return apiRequest<{ atualizado: boolean }>("/api/admin/usuarios", {
    method: "POST",
    body: JSON.stringify({ email, ativo }),
  });
}

export function listarAuditoria(limite = 50): Promise<LogAuditoriaAdmin[]> {
  return apiRequest<LogAuditoriaAdmin[]>(`/api/admin/auditoria?limite=${limite}`, { method: "GET" });
}
