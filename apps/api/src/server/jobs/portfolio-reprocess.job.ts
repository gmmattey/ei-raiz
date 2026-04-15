import { RepositorioCarteiraD1, ServicoCarteiraPadrao } from "@ei/servico-carteira";
import { RepositorioInsightsD1, ServicoInsightsPadrao } from "@ei/servico-insights";
import { RepositorioPerfilD1, ServicoPerfilPadrao } from "@ei/servico-perfil";
import type { Env } from "../types/gateway";

type SnapshotPayload = {
  ativos: Array<{
    id: string;
    ticker: string | null;
    nome: string;
    categoria: string;
    valorAtual: number;
    totalInvestido: number;
    retorno12m: number;
    participacao: number;
  }>;
  patrimonioInvestimentos: number;
  patrimonioBens: number;
  patrimonioPoupanca: number;
  patrimonioTotal: number;
  distribuicaoPatrimonio: Array<{ id: string; label: string; valor: number; percentual: number }>;
};

type AnalyticsPayload = Record<string, unknown>;

/**
 * Recalcula o snapshot e analytics do portfólio de um usuário e persiste nas tabelas
 * portfolio_snapshots e portfolio_analytics.
 *
 * Chamado via ctx.waitUntil() após escritas (aporte, importação, exclusão de ativo)
 * e pelo cron trigger de refresh periódico.
 */
export async function reprocessUserPortfolio(userId: string, env: Env): Promise<void> {
  const carteiraService = new ServicoCarteiraPadrao({
    repositorio: new RepositorioCarteiraD1(env.DB),
    brapiToken: env.BRAPI_TOKEN,
    brapiBaseUrl: env.BRAPI_BASE_URL,
  });
  const perfilService = new ServicoPerfilPadrao(new RepositorioPerfilD1(env.DB));
  const insightsService = new ServicoInsightsPadrao(new RepositorioInsightsD1(env.DB));

  const [ativosRaw, contexto] = await Promise.all([
    carteiraService.listarAtivos(userId),
    perfilService.obterContextoFinanceiro(userId),
  ]);

  const ativos = ativosRaw as Array<{
    id: string;
    ticker: string | null;
    nome: string;
    categoria: string;
    valorAtual: number;
    quantidade?: number;
    precoMedio?: number;
    retorno12m: number;
    participacao: number;
  }>;

  const patrimonioInvestimentos = ativos.reduce((acc, a) => acc + Number(a.valorAtual ?? 0), 0);

  const imoveis = contexto?.patrimonioExterno?.imoveis ?? [];
  const veiculos = contexto?.patrimonioExterno?.veiculos ?? [];
  const patrimonioImoveis = imoveis.reduce(
    (acc, i) => acc + Math.max(0, Number(i.valorEstimado ?? 0) - Number(i.saldoFinanciamento ?? 0)),
    0,
  );
  const patrimonioVeiculos = veiculos.reduce((acc, v) => acc + Math.max(0, Number(v.valorEstimado ?? 0)), 0);
  const patrimonioBens = patrimonioImoveis + patrimonioVeiculos;
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

  const snapshotPayload: SnapshotPayload = {
    ativos: ativos.map((a) => ({
      id: a.id,
      ticker: a.ticker ?? null,
      nome: a.nome,
      categoria: a.categoria,
      valorAtual: Number(a.valorAtual ?? 0),
      totalInvestido: Number((a.quantidade ?? 0) * (a.precoMedio ?? 0)),
      retorno12m: Number(a.retorno12m ?? 0),
      participacao: Number(a.participacao ?? 0),
    })),
    patrimonioInvestimentos: Number(patrimonioInvestimentos.toFixed(2)),
    patrimonioBens: Number(patrimonioBens.toFixed(2)),
    patrimonioPoupanca: Number(patrimonioPoupanca.toFixed(2)),
    patrimonioTotal: Number(patrimonioTotal.toFixed(2)),
    distribuicaoPatrimonio,
  };

  const totalInvestido = ativos.reduce((acc, a) => acc + Number((a.quantidade ?? 0) * (a.precoMedio ?? 0)), 0);
  const retornoTotal = totalInvestido > 0 ? ((patrimonioInvestimentos - totalInvestido) / totalInvestido) * 100 : 0;

  const agora = new Date().toISOString();
  const snapshotId = `snap_${userId}`;

  await env.DB
    .prepare(
      [
        "INSERT INTO portfolio_snapshots (id, usuario_id, calculado_em, total_investido, total_atual, retorno_total, payload_json)",
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        "ON CONFLICT(usuario_id) DO UPDATE SET",
        "calculado_em = excluded.calculado_em,",
        "total_investido = excluded.total_investido,",
        "total_atual = excluded.total_atual,",
        "retorno_total = excluded.retorno_total,",
        "payload_json = excluded.payload_json",
      ].join(" "),
    )
    .bind(
      snapshotId,
      userId,
      agora,
      Number(totalInvestido.toFixed(2)),
      Number(patrimonioInvestimentos.toFixed(2)),
      Number(retornoTotal.toFixed(4)),
      JSON.stringify(snapshotPayload),
    )
    .run();

  // Analytics: tenta calcular score e insights
  try {
    const resumo = await insightsService.gerarResumo(userId);
    const analyticsPayload: AnalyticsPayload = {
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

    const scoreGeral = resumo.scoreDetalhado?.score ?? null;
    const faixa = resumo.classificacao ?? null;

    await env.DB
      .prepare(
        [
          "INSERT INTO portfolio_analytics (id, usuario_id, calculado_em, score_unificado, faixa, confianca, payload_json)",
          "VALUES (?, ?, ?, ?, ?, ?, ?)",
          "ON CONFLICT(usuario_id) DO UPDATE SET",
          "calculado_em = excluded.calculado_em,",
          "score_unificado = excluded.score_unificado,",
          "faixa = excluded.faixa,",
          "confianca = excluded.confianca,",
          "payload_json = excluded.payload_json",
        ].join(" "),
      )
      .bind(
        `analytics_${userId}`,
        userId,
        agora,
        scoreGeral,
        faixa,
        1.0,
        JSON.stringify(analyticsPayload),
      )
      .run();
  } catch {
    // analytics falhou mas snapshot foi salvo — não interrompe
  }
}
