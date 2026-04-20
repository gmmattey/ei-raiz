import { useState, useEffect, useCallback } from "react";
import { patrimonioApi } from "../cliente-api";
import type { PatrimonioResumoSaida } from "@ei/contratos";
import { cache } from "../utils/cache";

type ResumoCarteira = {
  valorInvestimentos: number;
  custoTotalAcumulado: number;
  rentabilidadeDesdeAquisicaoPct: number | null;
  rentabilidadeConfiavel: boolean;
  motivoRentabilidadeIndisponivel?: string;
  quantidadeAtivos: number;
  patrimonioLiquido: number;
  patrimonioBens: number;
  patrimonioPoupanca: number;
  distribuicaoPatrimonio: Array<{ id: string; label: string; valor: number; percentual: number }>;
};

type CategoriaPatrimonio = "todos" | "acao" | "fundo" | "previdencia" | "renda_fixa" | "poupanca" | "bens";

type ItemDashboard = {
  id: string;
  nome: string;
  categoria: string;
  valor: number;
  percentual: number;
};

type DashboardPatrimonioResponse = {
  filtros: Record<CategoriaPatrimonio, ItemDashboard[]>;
  totais: Record<CategoriaPatrimonio, number>;
};

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

function adaptarResumo(canonico: PatrimonioResumoSaida): ResumoCarteira {
  return {
    valorInvestimentos: canonico.patrimonioBrutoBrl,
    custoTotalAcumulado: 0,
    rentabilidadeDesdeAquisicaoPct: canonico.rentabilidadeMesPct,
    rentabilidadeConfiavel: canonico.rentabilidadeMesPct !== null,
    motivoRentabilidadeIndisponivel: canonico.rentabilidadeMesPct === null ? "dados_insuficientes" : undefined,
    quantidadeAtivos: canonico.quantidadeItens,
    patrimonioLiquido: canonico.patrimonioLiquidoBrl,
    patrimonioBens: 0,
    patrimonioPoupanca: 0,
    distribuicaoPatrimonio: canonico.alocacao.map((a) => ({
      id: a.tipo,
      label: a.classe ?? a.tipo,
      valor: a.valorBrl,
      percentual: a.pesoPct,
    })),
  };
}

function montarDashboard(canonico: PatrimonioResumoSaida): DashboardPatrimonioResponse {
  const filtros: DashboardPatrimonioResponse["filtros"] = {
    todos: [], acao: [], fundo: [], previdencia: [], renda_fixa: [], poupanca: [], bens: [],
  };
  const totais: DashboardPatrimonioResponse["totais"] = {
    todos: canonico.patrimonioBrutoBrl,
    acao: 0, fundo: 0, previdencia: 0, renda_fixa: 0, poupanca: 0, bens: 0,
  };
  for (const item of canonico.principaisAtivos) {
    const entrada = {
      id: item.id,
      nome: item.nome,
      categoria: item.tipo,
      valor: item.valorAtualBrl ?? 0,
      percentual: item.pesoPct ?? 0,
    };
    filtros.todos.push(entrada);
    const cat = item.tipo as keyof typeof filtros;
    if (cat in filtros && cat !== "todos") {
      (filtros[cat] as typeof filtros.todos).push(entrada);
      totais[cat] += entrada.valor;
    }
  }
  return { filtros, totais };
}

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
      const canonico = await patrimonioApi.obterResumo();
      const resumoAdaptado = adaptarResumo(canonico);
      const dashboardAdaptado = montarDashboard(canonico);
      cache.set(CACHE_KEY_RESUMO, resumoAdaptado);
      cache.set(CACHE_KEY_DASHBOARD, dashboardAdaptado);
      setResumo(resumoAdaptado);
      setDashboard(dashboardAdaptado);
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
