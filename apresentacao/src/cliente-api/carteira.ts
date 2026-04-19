import type { AtivoResumo, CategoriaAtivo, ComparativoBenchmarkCarteira, DetalheCategoria, ResumoCarteira } from "@ei/contratos";
import { apiRequest } from "./http";
import { obterSummary as obterFinancialCoreSummary, obterHistorico as obterFinancialCoreHistorico, listarAssets as listarFinancialCoreAssets } from "./financialCore";

export function obterResumoCarteira(): Promise<ResumoCarteira> {
  return apiRequest<ResumoCarteira>("/api/carteira/resumo", { method: "GET" });
}

/**
 * Resumo da carteira via contrato canônico `/api/financial-core/summary`.
 * Mapeia o payload novo (camelCase inglês) para o shape legado `ResumoCarteira` (PT-BR).
 * Em caso de falha, cai para `/api/carteira/resumo` (deprecado mas funcional).
 */
export async function obterResumoCarteiraComFallback(): Promise<ResumoCarteira> {
  try {
    const summary = await obterFinancialCoreSummary();
    const retornoDisponivel = summary.portfolio.returnAvailable;
    const retornoPct = summary.portfolio.returnSinceInception;
    return {
      valorInvestimentos: summary.portfolio.investedValue,
      custoTotalAcumulado: 0,
      rentabilidadeDesdeAquisicaoPct: retornoDisponivel ? retornoPct : null,
      rentabilidadeConfiavel: retornoDisponivel,
      motivoRentabilidadeIndisponivel: retornoDisponivel ? undefined : "dados_insuficientes",
      quantidadeAtivos: summary.portfolio.assetCount,
      patrimonioLiquido: summary.portfolio.totalValue,
      patrimonioBens: summary.portfolio.otherAssetsValue,
      patrimonioPoupanca: summary.portfolio.cashValue,
      distribuicaoPatrimonio: summary.allocation.byClass.map((c) => ({
        id: c.id,
        label: c.label,
        valor: c.value,
        percentual: c.percent,
      })),
    };
  } catch {
    return obterResumoCarteira();
  }
}

/**
 * Benchmark via `/api/financial-core/summary` (campo `benchmark`) + série histórica via
 * `/api/financial-core/history`. Fallback para `/api/carteira/benchmark` se novas rotas falharem.
 */
export async function obterBenchmarkCarteiraComFallback(meses = 12): Promise<ComparativoBenchmarkCarteira> {
  try {
    const [summary, history] = await Promise.all([
      obterFinancialCoreSummary(),
      obterFinancialCoreHistorico(`${meses}m`).catch(() => null),
    ]);
    return {
      periodoMeses: summary.benchmark.periodMonths,
      carteiraRetornoPeriodo: summary.benchmark.portfolioReturn,
      cdiRetornoPeriodo: summary.benchmark.cdiReturn,
      excessoRetorno: summary.benchmark.excessReturn,
      fonteBenchmark: summary.benchmark.source,
      statusAtualizacaoBenchmark: summary.benchmark.status,
      atualizadoEmBenchmark: summary.benchmark.updatedAt,
      serie: (history?.series ?? []).map((p) => ({ data: p.date, carteira: p.portfolioBase100, cdi: p.cdiBase100 })),
    };
  } catch {
    return obterBenchmarkCarteira(meses);
  }
}

export type DashboardPatrimonioResponse = {
  filtros: Record<
    "todos" | "acao" | "fundo" | "previdencia" | "renda_fixa" | "poupanca" | "bens",
    Array<{ id: string; nome: string; categoria: string; valor: number; percentual: number }>
  >;
  totais: Record<"todos" | "acao" | "fundo" | "previdencia" | "renda_fixa" | "poupanca" | "bens", number>;
};

export function obterDashboardPatrimonio(): Promise<DashboardPatrimonioResponse> {
  return apiRequest<DashboardPatrimonioResponse>("/api/carteira/dashboard", { method: "GET" });
}

/**
 * Dashboard de patrimônio derivado de `/api/financial-core/assets` + `/summary` (para totais
 * de classes sintéticas — bens e poupança que não aparecem como ativos). Fallback: `/api/carteira/dashboard`.
 */
export async function obterDashboardPatrimonioComFallback(): Promise<DashboardPatrimonioResponse> {
  try {
    const [summary, assets] = await Promise.all([obterFinancialCoreSummary(), listarFinancialCoreAssets()]);
    const filtros: DashboardPatrimonioResponse["filtros"] = {
      todos: [], acao: [], fundo: [], previdencia: [], renda_fixa: [], poupanca: [], bens: [],
    };
    const totais: DashboardPatrimonioResponse["totais"] = {
      todos: summary.portfolio.totalValue,
      acao: 0, fundo: 0, previdencia: 0, renda_fixa: 0,
      poupanca: summary.portfolio.cashValue,
      bens: summary.portfolio.otherAssetsValue,
    };
    const totalRef = summary.portfolio.totalValue > 0 ? summary.portfolio.totalValue : 1;
    for (const a of assets) {
      const item = {
        id: a.id,
        nome: a.name || a.ticker,
        categoria: a.class,
        valor: a.currentValue,
        percentual: Number(((a.currentValue / totalRef) * 100).toFixed(2)),
      };
      filtros.todos.push(item);
      const cat = a.class as keyof typeof filtros;
      if (cat in filtros && cat !== "todos") {
        (filtros[cat] as typeof filtros.todos).push(item);
        totais[cat] += a.currentValue;
      }
    }
    return { filtros, totais };
  } catch {
    return obterDashboardPatrimonio();
  }
}

export function listarAtivosCarteira(): Promise<AtivoResumo[]> {
  return apiRequest<AtivoResumo[]>("/api/carteira/ativos", { method: "GET" });
}

export function obterDetalheCategoria(tipo: CategoriaAtivo): Promise<DetalheCategoria> {
  return apiRequest<DetalheCategoria>(`/api/carteira/categoria/${tipo}`, { method: "GET" });
}

export function obterBenchmarkCarteira(meses = 12): Promise<ComparativoBenchmarkCarteira & {
  fonte_benchmark?: string;
  status_atualizacao_benchmark?: "atualizado" | "atrasado" | "indisponivel";
  atualizado_em_benchmark?: string | null;
}> {
  return apiRequest(`/api/carteira/benchmark?meses=${meses}`, { method: "GET" });
}

export function obterDetalheAtivo(ticker: string): Promise<any> {
  return apiRequest(`/api/carteira/ativo/${encodeURIComponent(ticker)}`, { method: "GET" });
}

export function atualizarDataAquisicaoAtivo(ativoId: string, dataAquisicao: string): Promise<{ atualizado: boolean; mensagem: string }> {
  return apiRequest(`/api/carteira/ativo/${encodeURIComponent(ativoId)}/data-aquisicao`, {
    method: "PUT",
    body: JSON.stringify({ dataAquisicao }),
  });
}

export function vincularMovimentacaoAtivos(payload: {
  ativoOrigemId: string;
  ativoDestinoId: string;
  valor: number;
  dataMovimentacao: string;
  observacao?: string;
}): Promise<{ id: string; mensagem: string }> {
  return apiRequest("/api/carteira/movimentacoes/vincular", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function registrarAporteAtivo(
  ativoId: string,
  payload: { valorAporte: number; quantidade?: number; precoUnitario?: number; dataOperacao?: string; observacao?: string },
): Promise<{ atualizado: boolean; mensagem: string }> {
  return apiRequest(`/api/carteira/ativo/${encodeURIComponent(ativoId)}/aporte`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function excluirAtivo(ativoId: string, motivo: string): Promise<{ removido: boolean; mensagem: string }> {
  return apiRequest(`/api/carteira/ativo/${encodeURIComponent(ativoId)}`, {
    method: "DELETE",
    body: JSON.stringify({ motivo }),
  });
}
