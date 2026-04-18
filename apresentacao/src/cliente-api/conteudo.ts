import { apiRequest } from "./http";

export type BlocoConteudo = {
  chave: string;
  modulo: string;
  tipo: "texto" | "markdown" | "json" | "boolean";
  valor: string;
  visivel: boolean;
  ordem: number;
  atualizadoEm: string | null;
};

export type ConteudoAppResposta = {
  blocos: BlocoConteudo[];
  mapa: Record<string, string>;
};

export type CorretoraSuportada = {
  codigo: string;
  nome: string;
  status: "ativo" | "beta" | "planejado";
  mensagemAjuda: string;
  atualizadoEm: string | null;
};

export function obterConteudoApp(): Promise<ConteudoAppResposta> {
  return apiRequest<ConteudoAppResposta>("/api/app/content", { method: "GET" });
}

export function obterCorretorasSuportadas(): Promise<CorretoraSuportada[]> {
  return apiRequest<CorretoraSuportada[]>("/api/app/corretoras", { method: "GET" });
}
