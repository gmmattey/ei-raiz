import { useState, useEffect, useCallback } from "react";
import { carteiraApi } from "../cliente-api";
import type { ResumoCarteira } from "@ei/contratos";
import type { DashboardPatrimonioResponse } from "../cliente-api/carteira";
import { cache } from "../utils/cache";

const CACHE_KEY_RESUMO = "carteira_resumo";
const CACHE_KEY_DASHBOARD = "carteira_dashboard";
const CACHE_TTL_MS = 300 * 1000; // 5 min

export type PortfolioData = {
  resumo: ResumoCarteira | null;
  dashboard: DashboardPatrimonioResponse | null;
  loading: boolean;
  erro: string | null;
  recarregar: () => void;
};

export function usePortfolioData(): PortfolioData {
  const [resumo, setResumo] = useState<ResumoCarteira | null>(() =>
    cache.get<ResumoCarteira>(CACHE_KEY_RESUMO, CACHE_TTL_MS),
  );
  const [dashboard, setDashboard] = useState<DashboardPatrimonioResponse | null>(() =>
    cache.get<DashboardPatrimonioResponse>(CACHE_KEY_DASHBOARD, CACHE_TTL_MS),
  );
  const [loading, setLoading] = useState(resumo === null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async (ignorarCache = false) => {
    if (!ignorarCache) {
      const cachedResumo = cache.get<ResumoCarteira>(CACHE_KEY_RESUMO, CACHE_TTL_MS);
      const cachedDashboard = cache.get<DashboardPatrimonioResponse>(CACHE_KEY_DASHBOARD, CACHE_TTL_MS);
      if (cachedResumo) {
        setResumo(cachedResumo);
        if (cachedDashboard) setDashboard(cachedDashboard);
        setLoading(false);
        return;
      }
    }
    setLoading(true);
    setErro(null);
    try {
      const [resumoResp, dashboardResp] = await Promise.all([
        carteiraApi.obterResumoCarteira(),
        carteiraApi.obterDashboardPatrimonio().catch(() => null),
      ]);
      cache.set(CACHE_KEY_RESUMO, resumoResp);
      if (dashboardResp) cache.set(CACHE_KEY_DASHBOARD, dashboardResp);
      setResumo(resumoResp);
      setDashboard(dashboardResp);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar dados do portfólio");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return {
    resumo,
    dashboard,
    loading,
    erro,
    recarregar: () => carregar(true),
  };
}
