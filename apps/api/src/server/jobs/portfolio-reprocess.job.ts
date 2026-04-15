import {
  RepositorioCarteiraD1,
  ServicoCarteiraPadrao,
  calcularSnapshotConsolidado,
  type AtivoParaSnapshot,
} from "@ei/servico-carteira";
import { RepositorioInsightsD1, ServicoInsightsPadrao } from "@ei/servico-insights";
import { RepositorioPerfilD1, ServicoPerfilPadrao } from "@ei/servico-perfil";
import type { Env } from "../types/gateway";

type AnalyticsPayload = Record<string, unknown>;

/**
 * Recalcula o snapshot consolidado (estado atual) do portfólio de um usuário
 * e persiste em portfolio_snapshots.
 *
 * O histórico mensal (gráfico de ganhos/perdas) vai para historico_carteira_mensal
 * e é alimentado por outros caminhos:
 *   - Job D-1 noturno (fechamento do dia)
 *   - Serviço de reconstrução retroativa (a partir de movimentações)
 *
 * Analytics (score, diagnóstico) roda como passo opcional no final, com falha
 * silenciosa — não bloqueia a gravação do snapshot.
 */
export async function reprocessUserPortfolio(userId: string, env: Env): Promise<void> {
  const carteiraService = new ServicoCarteiraPadrao({
    repositorio: new RepositorioCarteiraD1(env.DB),
    brapiToken: env.BRAPI_TOKEN,
    brapiBaseUrl: env.BRAPI_BASE_URL,
  });
  const perfilService = new ServicoPerfilPadrao(new RepositorioPerfilD1(env.DB));

  const [ativosRaw, contexto] = await Promise.all([
    carteiraService.listarAtivos(userId),
    perfilService.obterContextoFinanceiro(userId),
  ]);

  const ativos = ativosRaw as AtivoParaSnapshot[];
  const snapshot = calcularSnapshotConsolidado(ativos, contexto);

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
      snapshot.totalInvestido,
      snapshot.totalAtual,
      snapshot.retornoTotal,
      JSON.stringify(snapshot.payload),
    )
    .run();

  await tentarGravarAnalytics(userId, env, agora);
}

async function tentarGravarAnalytics(userId: string, env: Env, agora: string): Promise<void> {
  try {
    const insightsService = new ServicoInsightsPadrao(new RepositorioInsightsD1(env.DB));
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
    // analytics é opcional — snapshot já foi salvo
  }
}
