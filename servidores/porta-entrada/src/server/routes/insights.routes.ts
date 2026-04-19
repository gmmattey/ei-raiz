import { RepositorioInsightsD1, ServicoInsightsPadrao } from "@ei/servico-insights";
import { UnifiedScoreService } from "../services/unified-score.service";
import { PortfolioViewService } from "../services/portfolio-view.service";
import { FinancialCoreService } from "../services/financial-core.service";
import { construirServicoCarteira } from "../services/construir-servico-carteira";
import { orquestrarPosEscritaCarteira } from "../jobs/portfolio-orchestrator.job";
import type { RiscoPrincipal, AcaoPrioritaria, SessaoUsuarioSaida } from "@ei/contratos";
import type { Env, ServiceResponse } from "../types/gateway";
import { sucesso } from "../types/gateway";

type StatusAtualizacaoMercado = "atualizado" | "atrasado" | "indisponivel";
type FonteMercado = "brapi" | "cvm" | "nenhuma";

const resumirAtualizacaoMercado = (
  ativos: Array<{ statusAtualizacao?: StatusAtualizacaoMercado; fontePreco?: FonteMercado; ultimaAtualizacao?: string }>,
) => {
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

  const cobertura = total > 0 ? Number(((coberturaPorStatus.atualizado / total) * 100).toFixed(2)) : 0;
  let statusGeral: StatusAtualizacaoMercado = "indisponivel";
  if (coberturaPorStatus.atualizado > 0) statusGeral = "atualizado";
  else if (coberturaPorStatus.atrasado > 0) statusGeral = "atrasado";

  return {
    cobertura,
    statusGeral,
    ultimaAtualizacao,
    fontes: Array.from(fontesMap.entries()).map(([fonte, quantidade]) => ({ fonte, quantidade })),
    coberturaPorStatus,
    cobertura_por_status: coberturaPorStatus,
    status_geral: statusGeral,
    ultima_atualizacao: ultimaAtualizacao,
  };
};

export async function handleInsightsRoutes(
  pathname: string,
  request: Request,
  env: Env,
  sessao: SessaoUsuarioSaida | null,
  ctx: ExecutionContext,
): Promise<ServiceResponse<unknown> | null> {
  if (!sessao) return null;
  if (!pathname.startsWith("/api/insights")) return null;

  const userId = sessao.usuario.id;
  const insightsService = new ServicoInsightsPadrao(new RepositorioInsightsD1(env.DB));
  const portfolioView = new PortfolioViewService(env);

  // Contrato canônico consolidado. Substitui /score + /diagnostico + /resumo.
  // Não recalcula carteira — consome o Financial Core como fonte da verdade.
  if (pathname === "/api/insights/summary" && request.method === "GET") {
    try {
      const core = new FinancialCoreService(env);
      const [summary, resumo] = await Promise.all([
        core.getSummary(userId),
        insightsService.gerarResumo(userId).catch(() => null),
      ]);

      const risco = resumo?.riscoPrincipal ?? null;
      const acao = resumo?.acaoPrioritaria ?? null;

      const mainRisk = risco
        ? {
            code: risco.codigo,
            title: risco.titulo,
            description: risco.descricao,
            severity: risco.severidade,
          }
        : null;
      const mainOpportunity = acao
        ? {
            code: acao.codigo,
            title: acao.titulo,
            description: acao.descricao,
            impact: acao.impactoEsperado,
          }
        : null;

      const actions: Array<{ code: string; title: string; priority: number; expectedImpact: string }> = [];
      if (acao) {
        actions.push({ code: acao.codigo, title: acao.titulo, priority: 1, expectedImpact: acao.impactoEsperado });
      }
      const penalidades = (resumo?.penalidadesAplicadas ?? []) as Array<{ tipo: string; descricao: string; peso: number }>;
      penalidades.slice(0, 3).forEach((pen, idx) => {
        actions.push({
          code: pen.tipo,
          title: pen.descricao,
          priority: idx + 2,
          expectedImpact: pen.peso >= 10 ? "high" : pen.peso >= 5 ? "medium" : "low",
        });
      });

      // Confiança deriva da cobertura de mercado + completude dos insights.
      const confidenceReasons: string[] = [];
      if (summary.marketData.coveragePercent < 80) confidenceReasons.push("market_data_partial");
      if (summary.marketData.status === "indisponivel") confidenceReasons.push("market_data_unavailable");
      if (!resumo) confidenceReasons.push("insights_engine_unavailable");
      if (summary.qualityFlags.some((f: { severity: string }) => f.severity === "critical")) confidenceReasons.push("critical_quality_flags");
      const confidenceLevel =
        confidenceReasons.length === 0 ? "high" : confidenceReasons.length <= 1 ? "medium" : "low";

      return sucesso({
        officialScore: summary.score
          ? { value: summary.score.official, band: summary.score.band, version: summary.score.version }
          : null,
        diagnosis: {
          mainRisk,
          mainOpportunity,
          summary: resumo?.diagnostico?.mensagem ?? null,
        },
        actions,
        narrative: {
          enabled: false,
          provider: null,
          text: null,
        },
        confidence: {
          level: confidenceLevel,
          reasons: confidenceReasons,
        },
        qualityFlags: summary.qualityFlags,
      });
    } catch (error) {
      return {
        ok: false,
        status: 500,
        codigo: "ERRO_INSIGHTS_SUMMARY",
        mensagem: "Falha ao gerar summary de insights",
        detalhes: { message: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  /**
   * @deprecated Use `/api/insights/summary` — contrato canônico consolidado.
   * Este endpoint retorna apenas o score de insights proprietário (0-100, sem
   * pilares do modelo oficial unificado 0-1000).
   */
  if (pathname === "/api/insights/score" && request.method === "GET") {
    try {
      const score = await insightsService.calcularScore(userId);
      return sucesso(score);
    } catch (error) {
      return {
        ok: false,
        status: 500,
        codigo: "ERRO_INSIGHTS_SCORE",
        mensagem: "Falha ao calcular score de insights",
        detalhes: { message: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  /**
   * @deprecated Use `/api/insights/summary` — retorna `diagnosis` consolidado.
   */
  if (pathname === "/api/insights/diagnostico" && request.method === "GET") {
    try {
      const diagnostico = await insightsService.gerarDiagnostico(userId);
      return sucesso(diagnostico);
    } catch (error) {
      return {
        ok: false,
        status: 500,
        codigo: "ERRO_INSIGHTS_DIAGNOSTICO",
        mensagem: "Falha ao gerar diagnóstico de insights",
        detalhes: { message: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  /**
   * @deprecated Use `/api/insights/summary` — contrato canônico com
   * `officialScore`, `diagnosis`, `actions`, `narrative`, `confidence`.
   * Este endpoint permanece vivo por retrocompatibilidade do frontend legado.
   */
  if (pathname === "/api/insights/resumo" && request.method === "GET") {
    try {
      // Tenta servir analytics do snapshot — sem refresh de mercado
      const analyticsData = await portfolioView.getAnalytics(userId);

      if (analyticsData && analyticsData._calculadoEm) {
        // Dados vêm do analytics persistido (background job)
        const carteiraService = construirServicoCarteira(env);
        const ativosMercado = (await carteiraService.listarAtivos(userId)) as Array<{
          statusAtualizacao?: StatusAtualizacaoMercado;
          fontePreco?: FonteMercado;
          ultimaAtualizacao?: string;
        }>;
        const atualizacaoMercado = resumirAtualizacaoMercado(ativosMercado);
        const confiancaDiagnostico = atualizacaoMercado.statusGeral === "atualizado" ? "alta" : "limitada";
        const dadosMercadoSessao = {
          status: atualizacaoMercado.statusGeral,
          timestamp: atualizacaoMercado.ultimaAtualizacao,
          ativosAtualizados: atualizacaoMercado.coberturaPorStatus.atualizado,
        };

        const unifiedService = new UnifiedScoreService(env.DB);
        let scoreUnificado = null;
        let scoreHistorico: Array<{ score: number; band: string; createdAt: string }> = [];
        try {
          scoreUnificado = await unifiedService.calculateForUser(userId);
        } catch {
          // score unificado indisponível não bloqueia resposta
        }
        try {
          scoreHistorico = (await unifiedService.getHistory(userId)).slice(0, 12).reverse();
        } catch {
          scoreHistorico = [];
        }

        const diagnosticoFinal = analyticsData.diagnosticoFinal as Record<string, unknown> | null;
        const mensagemConfianca =
          confiancaDiagnostico === "alta"
            ? (diagnosticoFinal?.mensagem as string ?? "")
            : `${diagnosticoFinal?.mensagem ?? ""} Atenção: parte das cotações está ${atualizacaoMercado.statusGeral === "atrasado" ? "atrasada" : "indisponível"}; revise antes de decisão crítica.`;

        return sucesso({
          ...analyticsData,
          diagnosticoFinal: diagnosticoFinal ? { ...diagnosticoFinal, mensagem: mensagemConfianca } : null,
          scoreUnificado,
          score_unificado: scoreUnificado,
          scoreOficial: scoreUnificado,
          score_oficial: scoreUnificado,
          scoreHistorico,
          score_historico: scoreHistorico,
          confiancaDiagnostico,
          confianca_diagnostico: confiancaDiagnostico,
          atualizacaoMercado,
          atualizacao_mercado: atualizacaoMercado,
          dadosMercadoSessao,
          dados_mercado_sessao: dadosMercadoSessao,
        });
      }

      // Fallback: calcula ao vivo (sem refresh de mercado externo)
      const resumo = await insightsService.gerarResumo(userId);

      const unifiedService = new UnifiedScoreService(env.DB);
      let scoreUnificado: Awaited<ReturnType<UnifiedScoreService["calculateForUser"]>> | null = null;
      try {
        scoreUnificado = await unifiedService.calculateForUser(userId);
      } catch {
        scoreUnificado = null;
      }
      let scoreHistoricoReal: Array<{ score: number; band: string; createdAt: string }> = [];
      try {
        scoreHistoricoReal = (await unifiedService.getHistory(userId)).slice(0, 12).reverse();
      } catch {
        scoreHistoricoReal = [];
      }

      const carteiraService = construirServicoCarteira(env);
      const ativosMercado = (await carteiraService.listarAtivos(userId)) as Array<{
        statusAtualizacao?: StatusAtualizacaoMercado;
        fontePreco?: FonteMercado;
        ultimaAtualizacao?: string;
      }>;
      const atualizacaoMercado = resumirAtualizacaoMercado(ativosMercado);
      const confiancaDiagnostico = atualizacaoMercado.statusGeral === "atualizado" ? "alta" : "limitada";
      const dadosMercadoSessaoLive = {
        status: atualizacaoMercado.statusGeral,
        timestamp: atualizacaoMercado.ultimaAtualizacao,
        ativosAtualizados: atualizacaoMercado.coberturaPorStatus.atualizado,
      };
      const mensagemConfianca =
        confiancaDiagnostico === "alta"
          ? resumo.diagnostico.mensagem
          : `${resumo.diagnostico.mensagem} Atenção: parte das cotações está ${atualizacaoMercado.statusGeral === "atrasado" ? "atrasada" : "indisponível"}; revise antes de decisão crítica.`;

      // Dispara reprocessamento em background para próxima requisição servir do cache
      ctx.waitUntil(orquestrarPosEscritaCarteira(userId, env, { refrescarMercado: false }));

      return sucesso({
        scoreGeral: resumo.scoreDetalhado.score,
        pilares: resumo.scoreDetalhado.pilares,
        score: resumo.scoreDetalhado,
        diagnostico: resumo.diagnosticoLegado,
        riscoPrincipal: (resumo.riscoPrincipal ?? null) as RiscoPrincipal | null,
        acaoPrioritaria: (resumo.acaoPrioritaria ?? null) as AcaoPrioritaria | null,
        retorno: resumo.retorno,
        classificacao: resumo.classificacao,
        diagnosticoFinal: { ...resumo.diagnostico, mensagem: mensagemConfianca },
        insightPrincipal: resumo.diagnostico.insightPrincipal,
        penalidadesAplicadas: resumo.penalidadesAplicadas,
        impactoDecisoesRecentes: resumo.impactoDecisoesRecentes,
        patrimonioConsolidado: resumo.patrimonioConsolidado,
        patrimonio_consolidado: resumo.patrimonioConsolidado,
        pesosScoreProprietario: resumo.pesosProprietarios,
        pesos_score_proprietario: resumo.pesosProprietarios,
        scoreUnificado,
        score_unificado: scoreUnificado,
        scoreOficial: scoreUnificado,
        score_oficial: scoreUnificado,
        scoreHistorico: scoreHistoricoReal,
        score_historico: scoreHistoricoReal,
        confiancaDiagnostico,
        confianca_diagnostico: confiancaDiagnostico,
        atualizacaoMercado,
        atualizacao_mercado: atualizacaoMercado,
        dadosMercadoSessao: dadosMercadoSessaoLive,
        dados_mercado_sessao: dadosMercadoSessaoLive,
      });
    } catch (error) {
      return {
        ok: false,
        status: 500,
        codigo: "ERRO_INSIGHTS_RESUMO",
        mensagem: "Falha ao gerar resumo de insights",
        detalhes: { message: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  return null;
}
