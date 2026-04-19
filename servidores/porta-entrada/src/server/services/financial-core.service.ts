import type { CategoriaAtivo } from "@ei/contratos";
import type { Env } from "../types/gateway";
import { BenchmarkService } from "./benchmark.service";
import { construirServicoCarteira } from "./construir-servico-carteira";
import { PortfolioViewService } from "./portfolio-view.service";
import { UnifiedScoreService, type UnifiedScoreBand } from "./unified-score.service";

type StatusAtualizacaoMercado = "atualizado" | "atrasado" | "indisponivel";
type FonteMercado = "brapi" | "cvm" | "nenhuma";

type AtivoBruto = {
  id: string;
  ticker: string;
  nome: string;
  categoria: CategoriaAtivo;
  quantidade?: number;
  precoMedio?: number;
  precoAtual?: number;
  valorAtual: number;
  participacao: number;
  ganhoPerda?: number;
  ganhoPerdaPercentual?: number;
  retornoDesdeAquisicao?: number;
  retorno12m?: number;
  statusPrecoMedio?: "confiavel" | "ajustado_heuristica" | "inconsistente";
  statusAtualizacao?: StatusAtualizacaoMercado;
  fontePreco?: FonteMercado;
  ultimaAtualizacao?: string;
};

export type QualityFlag = {
  code: string;
  severity: "info" | "warning" | "critical";
  message: string;
};

export type FinancialCoreSummary = {
  portfolio: {
    totalValue: number;
    investedValue: number;
    otherAssetsValue: number;
    cashValue: number;
    returnSinceInception: number | null;
    returnAvailable: boolean;
    assetCount: number;
    lastCalculatedAt: string | null;
  };
  allocation: {
    byClass: Array<{ id: string; label: string; value: number; percent: number }>;
    largestPositions: Array<{ id: string; ticker: string; name: string; value: number; percent: number }>;
  };
  benchmark: {
    periodMonths: number;
    portfolioReturn: number;
    cdiReturn: number;
    excessReturn: number;
    source: string;
    status: StatusAtualizacaoMercado;
    updatedAt: string | null;
  };
  score: {
    official: number;
    band: UnifiedScoreBand;
    version: string;
  } | null;
  marketData: {
    coveragePercent: number;
    status: StatusAtualizacaoMercado;
    updatedAt: string | null;
    sources: Array<{ source: FonteMercado; count: number }>;
  };
  qualityFlags: QualityFlag[];
};

export type FinancialCoreAsset = {
  id: string;
  ticker: string;
  name: string;
  class: CategoriaAtivo;
  quantity: number | null;
  averagePrice: number | null;
  averagePriceStatus: "trusted" | "adjusted" | "inconsistent" | "unknown";
  currentPrice: number | null;
  currentValue: number;
  gainLoss: number | null;
  gainLossPercent: number | null;
  returnSinceInception: number | null;
  marketSource: FonteMercado;
  marketStatus: StatusAtualizacaoMercado;
  updatedAt: string | null;
  qualityFlags: QualityFlag[];
};

export type FinancialCoreHistory = {
  range: string;
  series: Array<{
    date: string;
    portfolioBase100: number;
    cdiBase100: number;
    officialScore: number | null;
  }>;
};

const CATEGORY_LABELS: Record<CategoriaAtivo, string> = {
  acao: "Ações",
  fundo: "Fundos",
  previdencia: "Previdência",
  renda_fixa: "Renda Fixa",
  poupanca: "Caixa / Poupança",
  bens: "Outros Patrimônios",
};

const SCORE_VERSION = "unified_score_v1";

const mapPrecoMedioStatus = (status?: string): FinancialCoreAsset["averagePriceStatus"] => {
  if (status === "confiavel") return "trusted";
  if (status === "ajustado_heuristica") return "adjusted";
  if (status === "inconsistente") return "inconsistent";
  return "unknown";
};

/**
 * FinancialCoreService — fonte única da verdade financeira.
 *
 * Compõe PortfolioViewService + ServicoCarteira + UnifiedScoreService + BenchmarkService
 * para expor contratos canônicos em camelCase consumíveis por frontend e Vera.
 *
 * Não duplica cálculo: delega a leitura pesada ao snapshot (via PortfolioView) e a
 * decisões de score à engine unificada. Apenas traduz para o contrato externo e
 * acrescenta `qualityFlags` explícitas quando detecta heurísticas ou dados parciais.
 */
export class FinancialCoreService {
  private readonly portfolioView: PortfolioViewService;
  private readonly unifiedScore: UnifiedScoreService;
  private readonly benchmark: BenchmarkService;

  constructor(private readonly env: Env) {
    this.portfolioView = new PortfolioViewService(env);
    this.unifiedScore = new UnifiedScoreService(env.DB);
    this.benchmark = new BenchmarkService();
  }

  async getSummary(userId: string): Promise<FinancialCoreSummary> {
    const [resumo, ativos, scoreResult, benchmarkData] = await Promise.all([
      this.portfolioView.getResumo(userId),
      this.listAssetsRaw(userId),
      this.calculateScoreSafe(userId),
      this.calculateBenchmarkSafe(userId, 12),
    ]);

    const patrimonioTotal = Number(resumo.patrimonioTotal ?? 0);
    const patrimonioInvestimentos = Number(resumo.patrimonioInvestimentos ?? 0);
    const patrimonioBens = Number(resumo.patrimonioBens ?? 0);
    const patrimonioPoupanca = Number(resumo.patrimonioPoupanca ?? 0);
    const retornoRaw =
      (resumo.retornoDesdeAquisicao as number | undefined) ??
      (resumo.retorno12m as number | undefined) ??
      null;
    const retornoDisponivel = resumo.retornoDisponivel !== false && retornoRaw !== null;

    const marketData = this.summarizeMarketData(ativos);
    const qualityFlags = this.deriveQualityFlags(ativos, marketData, retornoDisponivel);

    return {
      portfolio: {
        totalValue: patrimonioTotal,
        investedValue: patrimonioInvestimentos,
        otherAssetsValue: patrimonioBens,
        cashValue: patrimonioPoupanca,
        returnSinceInception: retornoDisponivel ? Number(retornoRaw) : null,
        returnAvailable: retornoDisponivel,
        assetCount: ativos.length,
        lastCalculatedAt: (resumo._calculadoEm as string | undefined) ?? null,
      },
      allocation: this.buildAllocation(ativos, { patrimonioInvestimentos, patrimonioBens, patrimonioPoupanca, patrimonioTotal }),
      benchmark: benchmarkData,
      score: scoreResult,
      marketData,
      qualityFlags,
    };
  }

  async getAssets(
    userId: string,
    filters: { class?: string; source?: string; status?: string } = {},
  ): Promise<FinancialCoreAsset[]> {
    const ativos = await this.listAssetsRaw(userId);
    return ativos
      .filter((a) => !filters.class || a.categoria === filters.class)
      .filter((a) => !filters.source || a.fontePreco === filters.source)
      .filter((a) => !filters.status || a.statusAtualizacao === filters.status)
      .map((a) => this.toPublicAsset(a));
  }

  async getHistory(userId: string, range: string = "12m"): Promise<FinancialCoreHistory> {
    const months = this.parseRangeToMonths(range);
    const carteiraService = construirServicoCarteira(this.env);

    const [benchmark, scoreHistory] = await Promise.all([
      carteiraService.obterComparativoBenchmark(userId, months).catch(() => null),
      this.unifiedScore.getHistory(userId).catch(() => []),
    ]);

    const serie = benchmark?.serie ?? [];

    // Mapeia score histórico por mês (YYYY-MM) — ponto mais recente do mês ganha.
    const scoreByMonth = new Map<string, number>();
    for (const item of scoreHistory) {
      const mes = item.createdAt.slice(0, 7);
      if (!scoreByMonth.has(mes)) scoreByMonth.set(mes, item.score);
    }

    const series = serie.map((ponto: { data: string; carteira: number; cdi: number }) => ({
      date: ponto.data,
      portfolioBase100: Number(ponto.carteira ?? 0),
      cdiBase100: Number(ponto.cdi ?? 0),
      officialScore: scoreByMonth.get(ponto.data.slice(0, 7)) ?? null,
    }));

    return { range, series };
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private async listAssetsRaw(userId: string): Promise<AtivoBruto[]> {
    const carteiraService = construirServicoCarteira(this.env);
    const ativos = (await carteiraService.listarAtivos(userId)) as AtivoBruto[];
    return ativos;
  }

  private async calculateScoreSafe(userId: string): Promise<FinancialCoreSummary["score"]> {
    try {
      const result = await this.unifiedScore.calculateForUser(userId);
      return { official: result.score, band: result.band, version: SCORE_VERSION };
    } catch {
      return null;
    }
  }

  private async calculateBenchmarkSafe(userId: string, periodMonths: number): Promise<FinancialCoreSummary["benchmark"]> {
    const carteiraService = construirServicoCarteira(this.env);
    try {
      const data = await carteiraService.obterComparativoBenchmark(userId, periodMonths);
      return {
        periodMonths: data.periodoMeses,
        portfolioReturn: data.carteiraRetornoPeriodo,
        cdiReturn: data.cdiRetornoPeriodo,
        excessReturn: data.excessoRetorno,
        source: data.fonteBenchmark,
        status: data.statusAtualizacaoBenchmark,
        updatedAt: data.atualizadoEmBenchmark,
      };
    } catch {
      return {
        periodMonths,
        portfolioReturn: 0,
        cdiReturn: 0,
        excessReturn: 0,
        source: "bcb",
        status: "indisponivel",
        updatedAt: null,
      };
    }
  }

  private buildAllocation(
    ativos: AtivoBruto[],
    totals: { patrimonioInvestimentos: number; patrimonioBens: number; patrimonioPoupanca: number; patrimonioTotal: number },
  ): FinancialCoreSummary["allocation"] {
    const byClassMap = new Map<CategoriaAtivo, number>();
    for (const ativo of ativos) {
      const cat = ativo.categoria;
      byClassMap.set(cat, (byClassMap.get(cat) ?? 0) + Number(ativo.valorAtual ?? 0));
    }
    if (totals.patrimonioBens > 0) byClassMap.set("bens", (byClassMap.get("bens") ?? 0) + totals.patrimonioBens);
    if (totals.patrimonioPoupanca > 0) byClassMap.set("poupanca", (byClassMap.get("poupanca") ?? 0) + totals.patrimonioPoupanca);

    const total = totals.patrimonioTotal > 0 ? totals.patrimonioTotal : 1;
    const byClass = Array.from(byClassMap.entries())
      .filter(([, value]) => value > 0)
      .map(([id, value]) => ({
        id,
        label: CATEGORY_LABELS[id],
        value: Number(value.toFixed(2)),
        percent: Number(((value / total) * 100).toFixed(2)),
      }))
      .sort((a, b) => b.value - a.value);

    const largestPositions = ativos
      .filter((a) => Number(a.valorAtual ?? 0) > 0)
      .sort((a, b) => Number(b.valorAtual ?? 0) - Number(a.valorAtual ?? 0))
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        ticker: a.ticker,
        name: a.nome,
        value: Number((a.valorAtual ?? 0).toFixed(2)),
        percent: Number(((Number(a.valorAtual ?? 0) / total) * 100).toFixed(2)),
      }));

    return { byClass, largestPositions };
  }

  private summarizeMarketData(ativos: AtivoBruto[]): FinancialCoreSummary["marketData"] {
    const total = ativos.length;
    const coberturaPorStatus: Record<StatusAtualizacaoMercado, number> = { atualizado: 0, atrasado: 0, indisponivel: 0 };
    const fontesMap = new Map<FonteMercado, number>();
    let ultimaAtualizacao: string | null = null;

    for (const ativo of ativos) {
      const status = ativo.statusAtualizacao ?? "indisponivel";
      coberturaPorStatus[status] += 1;
      const fonte = ativo.fontePreco ?? "nenhuma";
      fontesMap.set(fonte, (fontesMap.get(fonte) ?? 0) + 1);
      if (ativo.ultimaAtualizacao && (!ultimaAtualizacao || ativo.ultimaAtualizacao > ultimaAtualizacao)) {
        ultimaAtualizacao = ativo.ultimaAtualizacao;
      }
    }

    const coveragePercent = total > 0 ? Number(((coberturaPorStatus.atualizado / total) * 100).toFixed(2)) : 0;
    let statusGeral: StatusAtualizacaoMercado = "indisponivel";
    if (coberturaPorStatus.atualizado === total && total > 0) statusGeral = "atualizado";
    else if (coberturaPorStatus.atualizado > 0) statusGeral = "atrasado"; // cobertura parcial
    else if (coberturaPorStatus.atrasado > 0) statusGeral = "atrasado";

    return {
      coveragePercent,
      status: statusGeral,
      updatedAt: ultimaAtualizacao,
      sources: Array.from(fontesMap.entries()).map(([source, count]) => ({ source, count })),
    };
  }

  private deriveQualityFlags(
    ativos: AtivoBruto[],
    marketData: FinancialCoreSummary["marketData"],
    retornoDisponivel: boolean,
  ): QualityFlag[] {
    const flags: QualityFlag[] = [];

    const ajustados = ativos.filter((a) => a.statusPrecoMedio === "ajustado_heuristica").length;
    const inconsistentes = ativos.filter((a) => a.statusPrecoMedio === "inconsistente").length;

    if (ajustados > 0) {
      flags.push({
        code: "PRICE_AVERAGE_HEURISTIC_ADJUSTMENT",
        severity: "warning",
        message: `O preço médio de ${ajustados} ativo(s) foi ajustado heuristicamente para reconciliar com o valor investido.`,
      });
    }
    if (inconsistentes > 0) {
      flags.push({
        code: "PRICE_AVERAGE_INCONSISTENT",
        severity: "critical",
        message: `O preço médio de ${inconsistentes} ativo(s) não pôde ser reconciliado — o retorno desses ativos pode estar distorcido.`,
      });
    }
    if (marketData.status === "indisponivel" && ativos.length > 0) {
      flags.push({
        code: "MARKET_DATA_STALE",
        severity: "warning",
        message: "Nenhum ativo tem cotação atualizada — valores podem estar defasados.",
      });
    } else if (marketData.coveragePercent < 80 && ativos.length > 0) {
      flags.push({
        code: "MARKET_DATA_PARTIAL",
        severity: "warning",
        message: `Apenas ${marketData.coveragePercent}% dos ativos têm cotação atualizada.`,
      });
    }
    if (!retornoDisponivel) {
      flags.push({
        code: "RETURN_UNAVAILABLE",
        severity: "info",
        message: "Retorno indisponível: dados insuficientes para calcular sem inventar.",
      });
    }
    return flags;
  }

  private toPublicAsset(a: AtivoBruto): FinancialCoreAsset {
    const retorno = a.retornoDesdeAquisicao ?? a.retorno12m ?? null;
    const qualityFlags: QualityFlag[] = [];
    if (a.statusPrecoMedio === "ajustado_heuristica") {
      qualityFlags.push({
        code: "PRICE_AVERAGE_HEURISTIC_ADJUSTMENT",
        severity: "warning",
        message: "Preço médio ajustado heuristicamente.",
      });
    }
    if (a.statusPrecoMedio === "inconsistente") {
      qualityFlags.push({
        code: "PRICE_AVERAGE_INCONSISTENT",
        severity: "critical",
        message: "Preço médio não reconciliável — retorno deste ativo deve ser tratado com cautela.",
      });
    }
    if (a.statusAtualizacao === "indisponivel") {
      qualityFlags.push({
        code: "MARKET_DATA_STALE",
        severity: "warning",
        message: "Cotação indisponível para este ativo.",
      });
    }

    return {
      id: a.id,
      ticker: a.ticker,
      name: a.nome,
      class: a.categoria,
      quantity: typeof a.quantidade === "number" ? a.quantidade : null,
      averagePrice: typeof a.precoMedio === "number" ? a.precoMedio : null,
      averagePriceStatus: mapPrecoMedioStatus(a.statusPrecoMedio),
      currentPrice: typeof a.precoAtual === "number" ? a.precoAtual : null,
      currentValue: Number((a.valorAtual ?? 0).toFixed(2)),
      gainLoss: typeof a.ganhoPerda === "number" ? Number(a.ganhoPerda.toFixed(2)) : null,
      gainLossPercent: typeof a.ganhoPerdaPercentual === "number" ? Number(a.ganhoPerdaPercentual.toFixed(2)) : null,
      returnSinceInception: typeof retorno === "number" ? Number(retorno.toFixed(2)) : null,
      marketSource: a.fontePreco ?? "nenhuma",
      marketStatus: a.statusAtualizacao ?? "indisponivel",
      updatedAt: a.ultimaAtualizacao ?? null,
      qualityFlags,
    };
  }

  private parseRangeToMonths(range: string): number {
    const match = /^(\d+)([my])$/.exec(range.toLowerCase());
    if (!match) return 12;
    const value = Number.parseInt(match[1], 10);
    if (!Number.isFinite(value) || value <= 0) return 12;
    return match[2] === "y" ? value * 12 : value;
  }

  // BenchmarkService é parte do núcleo — expõe para quem precisar (drill-down de ativo etc)
  getBenchmarkService(): BenchmarkService {
    return this.benchmark;
  }
}
