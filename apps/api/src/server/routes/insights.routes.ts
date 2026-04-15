import { RepositorioInsightsD1, ServicoInsightsPadrao } from "@ei/servico-insights";
import { RepositorioCarteiraD1, ServicoCarteiraPadrao } from "@ei/servico-carteira";
import { UnifiedScoreService } from "../services/unified-score.service";
import { PortfolioViewService } from "../services/portfolio-view.service";
import { reprocessUserPortfolio } from "../jobs/portfolio-reprocess.job";
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

  if (pathname === "/api/insights/resumo" && request.method === "GET") {
    try {
      // Tenta servir analytics do snapshot — sem refresh de mercado
      const analyticsData = await portfolioView.getAnalytics(userId);

      if (analyticsData && analyticsData._calculadoEm) {
        // Dados vêm do analytics persistido (background job)
        const carteiraService = new ServicoCarteiraPadrao({
          repositorio: new RepositorioCarteiraD1(env.DB),
          brapiToken: env.BRAPI_TOKEN,
          brapiBaseUrl: env.BRAPI_BASE_URL,
        });
        const ativosMercado = (await carteiraService.listarAtivos(userId)) as Array<{
          statusAtualizacao?: StatusAtualizacaoMercado;
          fontePreco?: FonteMercado;
          ultimaAtualizacao?: string;
        }>;
        const atualizacaoMercado = resumirAtualizacaoMercado(ativosMercado);
        const confiancaDiagnostico = atualizacaoMercado.statusGeral === "atualizado" ? "alta" : "limitada";

        let scoreUnificado = null;
        try {
          scoreUnificado = await new UnifiedScoreService(env.DB).calculateForUser(userId);
        } catch {
          // score unificado indisponível não bloqueia resposta
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
          scoreHistorico: [320, 350, 380, 400, 420, 450, 480, 510, 540, 570, 600, 620],
          confiancaDiagnostico,
          confianca_diagnostico: confiancaDiagnostico,
          atualizacaoMercado,
          atualizacao_mercado: atualizacaoMercado,
          dadosMercadoSessao: { status: "cache", timestamp: null, ativosAtualizados: 0 },
          dados_mercado_sessao: { status: "cache", timestamp: null, ativosAtualizados: 0 },
        });
      }

      // Fallback: calcula ao vivo (sem refresh de mercado externo)
      const resumo = await insightsService.gerarResumo(userId);

      let scoreUnificado: Awaited<ReturnType<UnifiedScoreService["calculateForUser"]>> | null = null;
      try {
        scoreUnificado = await new UnifiedScoreService(env.DB).calculateForUser(userId);
      } catch {
        scoreUnificado = null;
      }

      const carteiraService = new ServicoCarteiraPadrao({
        repositorio: new RepositorioCarteiraD1(env.DB),
        brapiToken: env.BRAPI_TOKEN,
        brapiBaseUrl: env.BRAPI_BASE_URL,
      });
      const ativosMercado = (await carteiraService.listarAtivos(userId)) as Array<{
        statusAtualizacao?: StatusAtualizacaoMercado;
        fontePreco?: FonteMercado;
        ultimaAtualizacao?: string;
      }>;
      const atualizacaoMercado = resumirAtualizacaoMercado(ativosMercado);
      const confiancaDiagnostico = atualizacaoMercado.statusGeral === "atualizado" ? "alta" : "limitada";
      const mensagemConfianca =
        confiancaDiagnostico === "alta"
          ? resumo.diagnostico.mensagem
          : `${resumo.diagnostico.mensagem} Atenção: parte das cotações está ${atualizacaoMercado.statusGeral === "atrasado" ? "atrasada" : "indisponível"}; revise antes de decisão crítica.`;

      // Dispara reprocessamento em background para próxima requisição servir do cache
      ctx.waitUntil(reprocessUserPortfolio(userId, env));

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
        scoreHistorico: [320, 350, 380, 400, 420, 450, 480, 510, 540, 570, 600, 620],
        confiancaDiagnostico,
        confianca_diagnostico: confiancaDiagnostico,
        atualizacaoMercado,
        atualizacao_mercado: atualizacaoMercado,
        dadosMercadoSessao: { status: "cache_ou_indisponivel", timestamp: null, ativosAtualizados: 0 },
        dados_mercado_sessao: { status: "cache_ou_indisponivel", timestamp: null, ativosAtualizados: 0 },
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
