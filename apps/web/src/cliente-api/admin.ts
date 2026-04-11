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

export type ParametroSimulacaoAdmin = {
  id?: string;
  chave: string;
  valor: Record<string, unknown>;
  descricao?: string;
  origem?: string;
  ativo: boolean;
  atualizadoEm?: string;
};

export type AuditoriaExclusaoAtivo = {
  id: string;
  acao: string;
  alvo: string;
  autorEmail: string;
  criadoEm: string;
  motivo: string;
  usuarioId: string;
  ativoId: string;
  ticker: string;
  nome: string;
  categoria: string;
  valorAtual: number;
  quantidade: number;
  payloadJson: string;
};

export type SaudeMercadoAdmin = {
  referencia: string;
  sla: { acoesMinutos: number; fundosMinutos: number };
  fontes: Array<{
    fonte: string;
    total: number;
    erros: number;
    expirados: number;
    ultimaAtualizacao: string | null;
    minutosDesdeUltima: number | null;
    slaMinutos: number;
    coberturaAtualizada: number;
    status: "saudavel" | "degradado" | "indisponivel";
  }>;
  statusGeral: "saudavel" | "degradado" | "indisponivel";
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

export function listarParametrosSimulacaoAdmin(): Promise<ParametroSimulacaoAdmin[]> {
  return apiRequest<ParametroSimulacaoAdmin[]>("/api/admin/simulacoes/parametros", { method: "GET" });
}

export function atualizarParametrosSimulacaoAdmin(parametros: Array<{ chave: string; valor: Record<string, unknown>; descricao?: string; ativo: boolean }>): Promise<{ atualizado: boolean }> {
  return apiRequest<{ atualizado: boolean }>("/api/admin/simulacoes/parametros", {
    method: "PUT",
    body: JSON.stringify({ parametros }),
  });
}

export function listarAuditoriaExclusoesAtivos(params?: {
  limite?: number;
  autorEmail?: string;
  ticker?: string;
  dataInicio?: string;
  dataFim?: string;
}): Promise<AuditoriaExclusaoAtivo[]> {
  const query = new URLSearchParams();
  if (params?.limite) query.set("limite", String(params.limite));
  if (params?.autorEmail) query.set("autorEmail", params.autorEmail);
  if (params?.ticker) query.set("ticker", params.ticker);
  if (params?.dataInicio) query.set("dataInicio", params.dataInicio);
  if (params?.dataFim) query.set("dataFim", params.dataFim);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiRequest<AuditoriaExclusaoAtivo[]>(`/api/admin/auditoria/exclusoes${suffix}`, { method: "GET" });
}

export function obterSaudeMercadoAdmin(): Promise<SaudeMercadoAdmin> {
  return apiRequest<SaudeMercadoAdmin>("/api/admin/mercado/saude", { method: "GET" });
}
