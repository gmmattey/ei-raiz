import type { Env } from '../types/env';
import { ok, fail } from './http';
import { hashToken } from './auth_crypto';
import {
  findDashboardSessionStateByTokenHash,
  findLatestSnapshotByPortfolioId,
  findDistributionBySnapshotId,
  findLatestAnalysisBySnapshotId,
  findInsightsByAnalysisId
} from '../repositories/dashboard_home_repository';
import type { DistributionItem, HomeData } from '../types/contracts';
import { getOrGenerateAiSuggestion } from './ai_suggestion_service';

const AUTH_COOKIE_NAME = 'esquilo_session';

export async function getDashboardHomeData(request: Request, env: Env): Promise<Response> {
  const token = readCookie(request.headers.get('cookie') || '', AUTH_COOKIE_NAME);
  if (!token) return fail(env.API_VERSION, 'unauthorized', 'Sessao nao encontrada.', 401);

  const tokenHash = await hashToken(token);
  const session = await findDashboardSessionStateByTokenHash(env, tokenHash);
  if (!session) return fail(env.API_VERSION, 'unauthorized', 'Sessao invalida.', 401);
  if (!session.hasContext) {
    return ok(env.API_VERSION, {
      screenState: 'redirect_onboarding',
      redirectTo: '/onboarding'
    });
  }
  if (!session.portfolioId) {
    // Primeiro acesso ou estado inconsistente: nunca devolver erro "técnico" para a Home.
    // O produto precisa orientar o próximo passo.
    return ok(env.API_VERSION, {
      screenState: 'redirect_onboarding',
      redirectTo: '/onboarding/portfolio-entry'
    });
  }

  const snapshot = await findLatestSnapshotByPortfolioId(env, session.portfolioId);
  if (!snapshot) {
    const emptyData: HomeData = {
      screenState: 'empty',
      portfolioId: session.portfolioId,
      hero: {
        totalEquity: 0,
        totalInvested: 0,
        totalProfitLoss: 0,
        totalProfitLossPct: 0,
        statusLabel: 'Carteira ainda nao importada'
      },
      primaryProblem: {
        code: 'empty_portfolio',
        title: 'Sua carteira ainda nao foi lida',
        body: 'Importe sua carteira para gerar o primeiro snapshot e liberar a analise.',
        severity: 'info'
      },
      primaryAction: {
        code: 'import_first_file',
        title: 'Importe sua carteira',
        body: 'Envie um CSV ou extrato para montar a leitura inicial da sua carteira.',
        ctaLabel: 'Importar carteira',
        target: '/imports/entry'
      },
      score: {
        value: 0,
        status: 'Sem analise',
        explanation: 'Ainda nao existe snapshot persistido para esta carteira.'
      },
      distribution: [],
      insights: [],
      updatedAt: new Date().toISOString()
    };
    return ok(env.API_VERSION, emptyData);
  }

  const distributionRows = await findDistributionBySnapshotId(env, snapshot.id);
  const totalDistributionValue = distributionRows.reduce((sum, item) => sum + Number(item.total_value || 0), 0);
  const distribution: DistributionItem[] = distributionRows.map((item) => ({
    key: item.category_code,
    label: item.category_name,
    value: Number(item.total_value || 0),
    sharePct: totalDistributionValue > 0 ? Number(item.total_value || 0) / totalDistributionValue * 100 : 0,
    performancePct: 0,
    sourceType: item.category_code
  }));

  const analysis = await findLatestAnalysisBySnapshotId(env, snapshot.id);
  if (!analysis) {
    const pendingData: HomeData = {
      screenState: 'portfolio_ready_analysis_pending',
      portfolioId: session.portfolioId,
      hero: {
        totalEquity: Number(snapshot.total_equity || 0),
        totalInvested: Number(snapshot.total_invested || 0),
        totalProfitLoss: Number(snapshot.total_profit_loss || 0),
        totalProfitLossPct: Number(snapshot.total_profit_loss_pct || 0),
        statusLabel: 'Snapshot pronto, analise pendente'
      },
      primaryProblem: {
        code: 'analysis_pending',
        title: 'Sua carteira foi lida, mas a analise ainda nao saiu',
        body: 'Os numeros da carteira ja estao disponiveis. A recomendacao principal ainda esta pendente.',
        severity: 'info'
      },
      primaryAction: {
        code: 'analysis_pending_wait',
        title: 'Analise em preparacao',
        body: 'Revise a distribuicao e aguarde a analise consolidada da carteira.',
        ctaLabel: 'Ver carteira',
        target: '/portfolio'
      },
      score: {
        value: 0,
        status: 'Analise pendente',
        explanation: 'Ja existe snapshot, mas ainda nao existe analise consolidada persistida.'
      },
      distribution,
      insights: [],
      updatedAt: snapshot.created_at
    };
    return ok(env.API_VERSION, pendingData);
  }

  const insightsRows = await findInsightsByAnalysisId(env, analysis.id);
  const primaryProblemTitle = analysis.primary_problem || 'Principal problema identificado';
  const primaryActionTitle = analysis.primary_action || 'Principal ação recomendada';
  const aiSuggestion = await getOrGenerateAiSuggestion(env, {
    analysisId: analysis.id,
    messagingJson: analysis.messaging_json,
    promptData: {
      scoreValue: Number(analysis.score_value || 0),
      scoreStatus: analysis.score_status || 'Calculado',
      primaryProblemTitle,
      primaryActionTitle,
      totals: {
        totalEquity: Number(snapshot.total_equity || 0),
        totalInvested: Number(snapshot.total_invested || 0),
        totalProfitLoss: Number(snapshot.total_profit_loss || 0),
        totalProfitLossPct: Number(snapshot.total_profit_loss_pct || 0)
      }
    }
  });
  const readyData: HomeData = {
    screenState: 'ready',
    portfolioId: session.portfolioId,
    hero: {
      totalEquity: Number(snapshot.total_equity || 0),
      totalInvested: Number(snapshot.total_invested || 0),
      totalProfitLoss: Number(snapshot.total_profit_loss || 0),
      totalProfitLossPct: Number(snapshot.total_profit_loss_pct || 0),
      statusLabel: analysis.score_status || 'Analise concluida'
    },
    primaryProblem: {
      code: analysis.primary_problem || 'analysis_ready',
      title: analysis.primary_problem || 'Principal problema identificado',
      body: analysis.summary_text || 'A analise consolidada da carteira foi gerada.',
      severity: 'info'
    },
    primaryAction: {
      code: analysis.primary_action || 'review_portfolio',
      title: analysis.primary_action || 'Principal acao recomendada',
      body: analysis.summary_text || 'Revise a recomendacao principal da sua carteira.',
      ctaLabel: 'Ver carteira',
      target: '/portfolio'
    },
    score: {
      value: Number(analysis.score_value || 0),
      status: analysis.score_status || 'Calculado',
      explanation: analysis.summary_text || 'Analise consolidada disponivel.'
    },
    distribution,
    insights: insightsRows.map((item) => ({
      kind: item.insight_type,
      title: item.title || 'Insight',
      body: item.message
    })),
    aiSuggestion,
    updatedAt: analysis.generated_at
  };

  return ok(env.API_VERSION, readyData);
}

function readCookie(cookieHeader: string, cookieName: string): string {
  const prefix = `${cookieName}=`;
  const match = cookieHeader.split(';').map((item) => item.trim()).find((item) => item.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : '';
}
