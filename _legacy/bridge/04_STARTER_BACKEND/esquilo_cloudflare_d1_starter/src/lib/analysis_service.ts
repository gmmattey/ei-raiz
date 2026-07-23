import type { Env } from '../types/env';
import { ok, fail } from './http';
import { hashToken } from './auth_crypto';
import { findAnalysisSessionStateByTokenHash, findLatestPortfolioAnalysis, findInsightsByAnalysisId } from '../repositories/analysis_repository';

const AUTH_COOKIE_NAME = 'esquilo_session';

type InsightSeverity = 'info' | 'warning' | 'critical';

function presentInsight(insightType: string, priority?: number | null) {
  const p = typeof priority === 'number' ? priority : 999;
  const severity: InsightSeverity = p <= 2 ? 'critical' : p <= 5 ? 'warning' : 'info';

  const t = (insightType || '').toLowerCase();
  if (t.includes('concentration') || t.includes('concentracao')) {
    return { severity, ctaLabel: 'Ver carteira', target: '/portfolio' };
  }
  if (t.includes('import')) {
    return { severity, ctaLabel: 'Ver importações', target: '/history/imports' };
  }
  if (t.includes('context') || t.includes('onboarding')) {
    return { severity, ctaLabel: 'Completar contexto', target: '/onboarding' };
  }

  return { severity, ctaLabel: 'Abrir Radar', target: '/radar' };
}

export async function getAnalysisData(request: Request, env: Env): Promise<Response> {
  const token = readCookie(request.headers.get('cookie') || '', AUTH_COOKIE_NAME);
  if (!token) return fail(env.API_VERSION, 'unauthorized', 'Sessao nao encontrada.', 401);

  const tokenHash = await hashToken(token);
  const session = await findAnalysisSessionStateByTokenHash(env, tokenHash);
  if (!session) return fail(env.API_VERSION, 'unauthorized', 'Sessao invalida.', 401);
  if (!session.hasContext) {
    return ok(env.API_VERSION, { screenState: 'redirect_onboarding', redirectTo: '/onboarding' });
  }
  if (!session.portfolioId) {
    return fail(env.API_VERSION, 'portfolio_not_found', 'Carteira principal nao encontrada.', 404);
  }

  const analysis = await findLatestPortfolioAnalysis(env, session.portfolioId);
  if (!analysis) {
    return ok(env.API_VERSION, {
      screenState: 'pending',
      portfolioId: session.portfolioId,
      pendingState: {
        title: 'Análise ainda não gerada',
        body: 'A carteira já pode ser lida, mas a análise consolidada ainda não foi persistida.',
        ctaLabel: 'Ir para histórico',
        target: '/history/snapshots'
      }
    });
  }

  const insightsRows = await findInsightsByAnalysisId(env, analysis.id);
  const actionPlan = splitActionPlan(analysis.action_plan_text);
  const summaryText = analysis.summary_text || extractSummaryFromMessaging(analysis.messaging_json) || '';

  return ok(env.API_VERSION, {
    screenState: 'ready',
    analysisId: analysis.id,
    portfolioId: analysis.portfolio_id,
    snapshotId: analysis.snapshot_id,
    score: {
      value: Number(analysis.score_value || 0),
      status: analysis.score_status || 'Calculado',
      explanation: summaryText || 'Análise consolidada disponível.'
    },
    primaryProblem: {
      code: analysis.primary_problem || 'analysis_ready',
      title: analysis.primary_problem || 'Principal problema identificado',
      body: summaryText || 'A análise consolidada da carteira está disponível.',
      severity: 'info'
    },
    primaryAction: {
      code: analysis.primary_action || 'review_portfolio',
      title: analysis.primary_action || 'Principal ação recomendada',
      body: summaryText || 'Revise a recomendação principal da carteira.',
      ctaLabel: 'Ver carteira',
      target: '/portfolio'
    },
    portfolioDecision: analysis.portfolio_decision || '',
    actionPlan,
    summary: summaryText,
    insights: insightsRows.map((item) => ({
      kind: item.insight_type,
      title: item.title || 'Insight',
      body: item.message,
      priority: item.priority ?? 999,
      ...presentInsight(item.insight_type, item.priority)
    })),
    generatedAt: analysis.generated_at
  });
}

function splitActionPlan(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(/\n|;|\.|•/g)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function extractSummaryFromMessaging(value: string | null): string {
  if (!value) return '';
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    const summary = parsed.summary;
    return typeof summary === 'string' ? summary.trim() : '';
  } catch {
    return '';
  }
}

function readCookie(cookieHeader: string, cookieName: string): string {
  const prefix = `${cookieName}=`;
  const match = cookieHeader.split(';').map((item) => item.trim()).find((item) => item.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : '';
}
