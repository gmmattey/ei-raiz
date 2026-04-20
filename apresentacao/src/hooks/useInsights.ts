import { useState, useEffect, useCallback } from "react";
import { patrimonioApi } from "../cliente-api";
import type { PatrimonioScoreSaida, ScoreFaixa } from "@ei/contratos";
import { cache } from "../utils/cache";

type ScoreUnificadoBand = "critical" | "fragile" | "stable" | "good" | "strong";

type ResumoInsights = {
  scoreGeral: number;
  score: { score: number };
  diagnostico: { titulo: string; resumo: string; descricao: string; riscos?: unknown[] };
  riscoPrincipal: { titulo?: string; descricao?: string } | null;
  acaoPrioritaria: { titulo?: string; descricao?: string } | null;
  scoreHistorico: number[];
  scoreUnificado: {
    score: number;
    band: ScoreUnificadoBand;
    completenessStatus: string;
    calculatedAt: string;
  };
};

const CACHE_KEY = "insights_resumo";
const CACHE_TTL_MS = 300 * 1000; // 5 min

const FAIXA_PARA_BAND: Record<ScoreFaixa, "critical" | "fragile" | "stable" | "good" | "strong"> = {
  critico: "critical",
  baixo: "fragile",
  medio: "stable",
  bom: "good",
  excelente: "strong",
};

function adaptarScore(score: PatrimonioScoreSaida): ResumoInsights {
  const scoreValor = score.scoreTotal ?? 0;
  const band = score.faixa ? FAIXA_PARA_BAND[score.faixa] : "stable";
  return {
    scoreGeral: scoreValor,
    score: { score: scoreValor } as never,
    diagnostico: { titulo: "", resumo: "", descricao: "" } as never,
    riscoPrincipal: null,
    acaoPrioritaria: null,
    scoreHistorico: score.historico.map((h) => h.score),
    scoreUnificado: {
      score: scoreValor,
      band,
      completenessStatus: "complete",
      calculatedAt: score.calculadoEm ?? new Date().toISOString(),
    },
  };
}

export function useInsights() {
  const [dados, setDados] = useState<ResumoInsights | null>(() =>
    cache.get<ResumoInsights>(CACHE_KEY, CACHE_TTL_MS),
  );
  const [loading, setLoading] = useState(dados === null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async (ignorarCache = false) => {
    if (!ignorarCache) {
      const cached = cache.get<ResumoInsights>(CACHE_KEY, CACHE_TTL_MS);
      if (cached) {
        setDados(cached);
        setLoading(false);
        return;
      }
    }
    setLoading(true);
    setErro(null);
    try {
      const score = await patrimonioApi.obterScore();
      const resultado = adaptarScore(score);
      cache.set(CACHE_KEY, resultado);
      setDados(resultado);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar insights");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return {
    dados,
    loading,
    erro,
    recarregar: () => carregar(true),
  };
}
