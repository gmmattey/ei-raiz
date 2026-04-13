import type { AcaoPrioritaria, Diagnostico, RiscoPrincipal, ScoreCarteira } from "@ei/contratos";
import { apiRequest } from "./http";

export type ResumoInsights = {
  scoreGeral?: number;
  pilares?: {
    estrategiaCarteira: number;
    comportamentoFinanceiro: number;
    estruturaPatrimonial: number;
    adequacaoMomentoVida: number;
  };
  score: ScoreCarteira;
  diagnostico: Diagnostico;
  riscoPrincipal: RiscoPrincipal | null;
  acaoPrioritaria: AcaoPrioritaria | null;
  retorno?: number;
  classificacao?: "critico" | "baixo" | "ok" | "bom" | "excelente";
  diagnosticoFinal?: {
    mensagem: string;
    impactoConcreto?: string;
    consequencia?: string;
    oQueFazerAgora?: string;
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
    pilar: string;
  }>;
  impactoDecisoesRecentes?: {
    quantidade: number;
    deltaMedio: number;
    deltaTotal: number;
  };
  confiancaDiagnostico?: "alta" | "limitada";
  confianca_diagnostico?: "alta" | "limitada";
  atualizacaoMercado?: {
    cobertura: number;
    statusGeral: "atualizado" | "atrasado" | "indisponivel";
    ultimaAtualizacao: string | null;
    fontes: Array<{ fonte: "brapi" | "cvm" | "nenhuma"; quantidade: number }>;
    coberturaPorStatus: Record<"atualizado" | "atrasado" | "indisponivel", number>;
  };
  atualizacao_mercado?: {
    cobertura: number;
    status_geral: "atualizado" | "atrasado" | "indisponivel";
    ultima_atualizacao: string | null;
    fontes: Array<{ fonte: "brapi" | "cvm" | "nenhuma"; quantidade: number }>;
    cobertura_por_status: Record<"atualizado" | "atrasado" | "indisponivel", number>;
  };
  scoreUnificado?: {
    score: number;
    band: "critical" | "fragile" | "stable" | "good" | "strong";
    completenessStatus: "empty" | "partial" | "complete";
    calculatedAt: string;
  };
  score_unificado?: {
    score: number;
    band: "critical" | "fragile" | "stable" | "good" | "strong";
    completenessStatus: "empty" | "partial" | "complete";
    calculatedAt: string;
  };
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
