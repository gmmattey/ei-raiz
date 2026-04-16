import { useState, useEffect, useCallback } from "react";
import { insightsApi } from "../cliente-api";
import type { ResumoInsights } from "../cliente-api/insights";
import { cache } from "../utils/cache";

const CACHE_KEY = "insights_resumo";
const CACHE_TTL_MS = 60 * 1000; // 60s

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
      const resultado = await insightsApi.obterResumo();
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
