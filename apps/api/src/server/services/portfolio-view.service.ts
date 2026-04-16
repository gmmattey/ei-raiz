import { RepositorioCarteiraD1, ServicoCarteiraPadrao } from "@ei/servico-carteira";
import { RepositorioInsightsD1, ServicoInsightsPadrao } from "@ei/servico-insights";
import { RepositorioPerfilD1, ServicoPerfilPadrao } from "@ei/servico-perfil";
import { readCache } from "../utils/cache";
import type { Env } from "../types/gateway";

type SnapshotRow = {
  calculado_em: string;
  total_investido: number;
  total_atual: number;
  retorno_total: number;
  payload_json: string;
};

type AnalyticsRow = {
  calculado_em: string;
  score_unificado: number | null;
  faixa: string | null;
  confianca: number | null;
  payload_json: string;
};

type CachedQuote = { ticker: string; price: number | null };

/**
 * Compõe a resposta da carteira a partir de três fontes:
 * 1. portfolio_snapshots (D1, leitura direta, calculado em background)
 * 2. portfolio_analytics (D1, leitura direta, calculado em background)
 * 3. cotacoes_ativos_cache (D1, TTL 30s, populado pelo cron de mercado)
 *
 * Se não houver snapshot: fallback para cálculo síncrono via serviços de domínio
 * (sem chamar BRAPI — usa valores em ativos.valor_atual).
 */
export class PortfolioViewService {
  private readonly carteiraService: ServicoCarteiraPadrao;
  private readonly perfilService: ServicoPerfilPadrao;
  private readonly insightsService: ServicoInsightsPadrao;

  constructor(private readonly env: Env) {
    this.carteiraService = new ServicoCarteiraPadrao({
      repositorio: new RepositorioCarteiraD1(env.DB),
      brapiToken: env.BRAPI_TOKEN,
      brapiBaseUrl: env.BRAPI_BASE_URL,
    });
    this.perfilService = new ServicoPerfilPadrao(new RepositorioPerfilD1(env.DB));
    this.insightsService = new ServicoInsightsPadrao(new RepositorioInsightsD1(env.DB));
  }

  /**
   * Retorna o resumo consolidado da carteira.
   * Preferência: lê do snapshot. Fallback: calcula ao vivo (sem refresh de mercado).
   */
  async getResumo(userId: string): Promise<Record<string, unknown>> {
    const [snapshot, analytics] = await Promise.all([
      this.readSnapshot(userId),
      this.readAnalytics(userId),
    ]);

    if (snapshot) {
      const payload = JSON.parse(snapshot.payload_json) as Record<string, unknown>;
      const overlaid = await this.overlayFreshQuotes(payload, userId);
      return {
        ...overlaid,
        score: analytics ? (analytics as Record<string, unknown>).scoreGeral : null,
        _fonte: "snapshot",
        _calculadoEm: snapshot.calculado_em,
      };
    }

    // Fallback: cálculo síncrono sem refresh de mercado externo
    return this.computeResumoFallback(userId);
  }

  /**
   * Retorna os analytics (score, diagnóstico) do portfólio.
   * Preferência: lê do analytics. Fallback: calcula ao vivo.
   */
  async getAnalytics(userId: string): Promise<Record<string, unknown> | null> {
    const row = await this.readAnalyticsRow(userId);
    if (row) {
      return {
        ...(JSON.parse(row.payload_json) as Record<string, unknown>),
        _calculadoEm: row.calculado_em,
      };
    }

    // Fallback: calcula ao vivo (caro mas correto)
    try {
      const resumo = await this.insightsService.gerarResumo(userId);
      return {
        scoreGeral: resumo.scoreDetalhado?.score ?? null,
        pilares: resumo.scoreDetalhado?.pilares ?? null,
        score: resumo.scoreDetalhado ?? null,
        diagnostico: resumo.diagnosticoLegado ?? null,
        riscoPrincipal: resumo.riscoPrincipal ?? null,
        acaoPrioritaria: resumo.acaoPrioritaria ?? null,
        retorno: resumo.retorno ?? null,
        classificacao: resumo.classificacao ?? null,
        diagnosticoFinal: resumo.diagnostico ?? null,
        insightPrincipal: resumo.diagnostico?.insightPrincipal ?? null,
        penalidadesAplicadas: resumo.penalidadesAplicadas ?? null,
        impactoDecisoesRecentes: resumo.impactoDecisoesRecentes ?? null,
        patrimonioConsolidado: resumo.patrimonioConsolidado ?? null,
        pesosScoreProprietario: resumo.pesosProprietarios ?? null,
      };
    } catch {
      return null;
    }
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private async readSnapshot(userId: string): Promise<SnapshotRow | null> {
    return this.env.DB
      .prepare("SELECT calculado_em, total_investido, total_atual, retorno_total, payload_json FROM portfolio_snapshots WHERE usuario_id = ? LIMIT 1")
      .bind(userId)
      .first<SnapshotRow>();
  }

  private async readAnalyticsRow(userId: string): Promise<AnalyticsRow | null> {
    return this.env.DB
      .prepare("SELECT calculado_em, score_unificado, faixa, confianca, payload_json FROM portfolio_analytics WHERE usuario_id = ? LIMIT 1")
      .bind(userId)
      .first<AnalyticsRow>();
  }

  private async readAnalytics(userId: string): Promise<Record<string, unknown> | null> {
    const row = await this.readAnalyticsRow(userId);
    if (!row) return null;
    return JSON.parse(row.payload_json) as Record<string, unknown>;
  }

  /**
   * Faz overlay das cotações frescas no payload do snapshot.
   * Para cada ativo com ticker, lê cotacoes_ativos_cache e atualiza valorAtual.
   * Recalcula totais se alguma cotação foi atualizada.
   */
  private async overlayFreshQuotes(
    payload: Record<string, unknown>,
    _userId: string,
  ): Promise<Record<string, unknown>> {
    const ativos = payload.ativos as Array<{
      id: string;
      ticker: string | null;
      valorAtual: number;
      quantidade: number | null;
      precoMedio: number | null;
      retorno12m: number;
      participacao: number;
      [key: string]: unknown;
    }> | undefined;

    if (!ativos || ativos.length === 0) return payload;

    const tickers = [...new Set(ativos.filter((a) => a.ticker).map((a) => a.ticker!.toUpperCase()))];
    if (tickers.length === 0) return payload;

    // Lê cotações do cache (apenas D1, sem BRAPI)
    const quoteResults = await Promise.all(
      tickers.map((ticker) => readCache<CachedQuote>(this.env.DB, "brapi", `quote:${ticker}`)),
    );
    const quoteMap = new Map<string, number>();
    quoteResults.forEach((q) => {
      if (q && q.price !== null) quoteMap.set(q.ticker, q.price);
    });

    if (quoteMap.size === 0) return payload;

    let totalAtualAtualizado = 0;
    const ativosAtualizados = ativos.map((ativo) => {
      const ticker = ativo.ticker?.toUpperCase();
      const freshPrice = ticker ? quoteMap.get(ticker) : undefined;
      if (freshPrice === undefined) {
        totalAtualAtualizado += Number(ativo.valorAtual ?? 0);
        return ativo;
      }
      const quantidade = Number(ativo.quantidade ?? 0);
      const precoMedio = Number(ativo.precoMedio ?? 0);
      const novoValor = quantidade > 0 ? quantidade * freshPrice : freshPrice;
      const novoRetorno = precoMedio > 0 ? ((freshPrice - precoMedio) / precoMedio) * 100 : 0;
      totalAtualAtualizado += novoValor;
      return { ...ativo, valorAtual: Number(novoValor.toFixed(4)), retorno12m: Number(novoRetorno.toFixed(4)) };
    });

    const patrimonioTotal = Number(payload.patrimonioTotal as number ?? 0);
    const deltaInvestimentos = totalAtualAtualizado - Number(payload.patrimonioInvestimentos ?? 0);
    const novoPatrimonioTotal = patrimonioTotal + deltaInvestimentos;

    return {
      ...payload,
      ativos: ativosAtualizados,
      patrimonioInvestimentos: Number(totalAtualAtualizado.toFixed(2)),
      patrimonioTotal: Number(novoPatrimonioTotal.toFixed(2)),
    };
  }

  /**
   * Fallback síncrono: calcula o resumo sem snapshot (primeira vez ou após tabela vazia).
   * NÃO chama BRAPI — usa valores de ativos.valor_atual já no banco.
   */
  private async computeResumoFallback(userId: string): Promise<Record<string, unknown>> {
    const [resumo, ativos, contexto] = await Promise.all([
      this.carteiraService.obterResumo(userId),
      this.carteiraService.listarAtivos(userId),
      this.perfilService.obterContextoFinanceiro(userId),
    ]);

    const ativosTyped = ativos as Array<{ valorAtual: number; [key: string]: unknown }>;

    const patrimonioInvestimentos = ativosTyped.reduce((acc, a) => acc + Number(a.valorAtual ?? 0), 0);
    const imoveis = contexto?.patrimonioExterno?.imoveis ?? [];
    const veiculos = contexto?.patrimonioExterno?.veiculos ?? [];
    const patrimonioBens =
      imoveis.reduce((acc, i) => acc + Math.max(0, Number(i.valorEstimado ?? 0) - Number(i.saldoFinanciamento ?? 0)), 0) +
      veiculos.reduce((acc, v) => acc + Math.max(0, Number(v.valorEstimado ?? 0)), 0);
    const patrimonioPoupanca = Number(contexto?.patrimonioExterno?.poupanca ?? contexto?.patrimonioExterno?.caixaDisponivel ?? 0);
    const patrimonioTotal = patrimonioInvestimentos + patrimonioBens + patrimonioPoupanca;

    const distribuicaoBase = [
      { id: "investimentos", label: "Investimentos", valor: patrimonioInvestimentos },
      { id: "bens", label: "Bens", valor: patrimonioBens },
      { id: "poupanca", label: "Poupança", valor: patrimonioPoupanca },
    ].filter((item) => item.valor > 0);

    const distribuicaoPatrimonio = distribuicaoBase.map((item) => ({
      ...item,
      percentual: patrimonioTotal > 0 ? Number(((item.valor / patrimonioTotal) * 100).toFixed(4)) : 0,
    }));

    let score: unknown = null;
    try {
      const insightsScore = await this.insightsService.calcularScore(userId);
      score = insightsScore.score;
    } catch {
      // score indisponível não bloqueia resposta
    }

    return {
      ...(resumo as Record<string, unknown>),
      patrimonioTotal: Number(patrimonioTotal.toFixed(2)),
      patrimonioInvestimentos: Number(patrimonioInvestimentos.toFixed(2)),
      patrimonioBens: Number(patrimonioBens.toFixed(2)),
      patrimonioPoupanca: Number(patrimonioPoupanca.toFixed(2)),
      distribuicaoPatrimonio,
      score,
      _fonte: "live",
    };
  }
}
