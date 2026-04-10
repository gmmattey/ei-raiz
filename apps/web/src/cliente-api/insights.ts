import type { AcaoPrioritaria, Diagnostico, RiscoPrincipal, ScoreCarteira } from "@ei/contratos";
import { apiRequest } from "./http";

export type ResumoInsights = {
  score: ScoreCarteira;
  diagnostico: Diagnostico;
  riscoPrincipal: RiscoPrincipal | null;
  acaoPrioritaria: AcaoPrioritaria | null;
  retorno?: number;
  classificacao?: "critico" | "baixo" | "ok" | "bom" | "excelente";
  diagnosticoFinal?: {
    mensagem: string;
    insightPrincipal: {
      titulo: string;
      descricao: string;
      acao: string;
    };
  };
  insightPrincipal?: {
    titulo: string;
    descricao: string;
    acao: string;
  };
  penalidadesAplicadas?: Array<{
    tipo: string;
    peso: number;
    descricao: string;
    bloco: string;
  }>;
};

export function obterScore(): Promise<ScoreCarteira> {
  return apiRequest<ScoreCarteira>("/api/insights/score", { method: "GET" });
}

export function obterDiagnostico(): Promise<Diagnostico> {
  return apiRequest<Diagnostico>("/api/insights/diagnostico", { method: "GET" });
}

export function obterResumo(): Promise<ResumoInsights> {
  return apiRequest<ResumoInsights>("/api/insights/resumo", { method: "GET" });
}
