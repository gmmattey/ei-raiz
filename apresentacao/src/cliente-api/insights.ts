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
  scoreHistorico?: number[];
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

// ─── Contrato canônico consolidado (gateway v2) ──────────────────────────────

export type SummaryInsights = {
  officialScore: { value: number; band: "critical" | "fragile" | "stable" | "good" | "strong"; version: string } | null;
  diagnosis: {
    mainRisk: { code: string; title: string; description: string; severity: string } | null;
    mainOpportunity: { code: string; title: string; description: string; impact: string } | null;
    summary: string | null;
  };
  actions: Array<{ code: string; title: string; priority: number; expectedImpact: string }>;
  narrative: { enabled: boolean; provider: string | null; text: string | null };
  confidence: { level: "high" | "medium" | "low"; reasons: string[] };
  qualityFlags: Array<{ code: string; severity: "info" | "warning" | "critical"; message: string }>;
};

export function obterSummary(): Promise<SummaryInsights> {
  return apiRequest<SummaryInsights>("/api/insights/summary", { method: "GET" });
}

/**
 * Busca insights pelo contrato canônico `/api/insights/summary` e mescla com o
 * `/api/insights/resumo` (deprecado) para preencher campos que só existem no contrato
 * antigo (pilares, scoreHistorico, patrimonioConsolidado, etc).
 *
 * Estratégia:
 * - Se `/summary` responder, usa seus campos como fonte da verdade para score/diagnóstico
 * - Campos ausentes no canônico são puxados do `/resumo` em paralelo
 * - Se `/summary` falhar, retorna apenas `/resumo` (fallback total ao legado)
 */
export async function obterResumoComFallback(): Promise<ResumoInsights> {
  const [summaryResult, resumoResult] = await Promise.allSettled([obterSummary(), obterResumo()]);
  const resumoLegado = resumoResult.status === "fulfilled" ? resumoResult.value : null;

  if (summaryResult.status !== "fulfilled") {
    if (!resumoLegado) throw summaryResult.reason;
    return resumoLegado;
  }

  const summary = summaryResult.value;
  const risco = summary.diagnosis.mainRisk;
  const oportunidade = summary.diagnosis.mainOpportunity;

  const mesclado: ResumoInsights = {
    ...(resumoLegado ?? ({} as ResumoInsights)),
    riscoPrincipal: risco
      ? { codigo: risco.code, titulo: risco.title, descricao: risco.description, severidade: risco.severity as never }
      : resumoLegado?.riscoPrincipal ?? null,
    acaoPrioritaria: oportunidade
      ? { codigo: oportunidade.code, titulo: oportunidade.title, descricao: oportunidade.description, impactoEsperado: oportunidade.impact }
      : resumoLegado?.acaoPrioritaria ?? null,
    diagnostico: resumoLegado?.diagnostico ?? ({ titulo: "", resumo: summary.diagnosis.summary ?? "", descricao: summary.diagnosis.summary ?? "" } as never),
    score: resumoLegado?.score ?? ({ score: summary.officialScore?.value ?? 0 } as never),
    diagnosticoFinal: resumoLegado?.diagnosticoFinal ?? (summary.diagnosis.summary
      ? { mensagem: summary.diagnosis.summary, insightPrincipal: { titulo: "", descricao: "", acao: "" } }
      : undefined),
    scoreUnificado: summary.officialScore
      ? {
          score: summary.officialScore.value,
          band: summary.officialScore.band,
          completenessStatus: resumoLegado?.scoreUnificado?.completenessStatus ?? "complete",
          calculatedAt: resumoLegado?.scoreUnificado?.calculatedAt ?? new Date().toISOString(),
        }
      : resumoLegado?.scoreUnificado,
  };

  return mesclado;
}
