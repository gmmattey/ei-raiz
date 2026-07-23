import type { Env } from '../types/env';
import { ok, fail } from './http';
import { hashToken } from './auth_crypto';
import { getCdiAccumulatedPct, getExternalQuoteForStockBvmf, getExternalReferencesServiceStatus } from './external_references_service';
import {
  findHoldingSessionStateByTokenHash,
  findHoldingDetailById,
  findCategoryAggregate,
  findPortfolioAggregate,
  findLatestPortfolioAnalysis
} from '../repositories/holding_detail_repository';

const AUTH_COOKIE_NAME = 'esquilo_session';

export async function getHoldingDetailData(request: Request, env: Env, params: Record<string, string>): Promise<Response> {
  const token = readCookie(request.headers.get('cookie') || '', AUTH_COOKIE_NAME);
  if (!token) return fail(env.API_VERSION, 'unauthorized', 'Sessao nao encontrada.', 401);

  const tokenHash = await hashToken(token);
  const session = await findHoldingSessionStateByTokenHash(env, tokenHash);
  if (!session) return fail(env.API_VERSION, 'unauthorized', 'Sessao invalida.', 401);
  if (!session.hasContext) {
    return ok(env.API_VERSION, { screenState: 'redirect_onboarding', redirectTo: '/onboarding' });
  }
  if (!session.portfolioId) {
    return fail(env.API_VERSION, 'portfolio_not_found', 'Carteira principal nao encontrada.', 404);
  }
  if (params.portfolioId !== session.portfolioId) {
    return fail(env.API_VERSION, 'portfolio_mismatch', 'Acesso invalido para esta carteira.', 403);
  }

  const holding = await findHoldingDetailById(env, session.portfolioId, params.holdingId);
  if (!holding) return fail(env.API_VERSION, 'holding_not_found', 'Ativo nao encontrado.', 404);

  const categoryKey = normalizeCategoryKey(holding.category_label, holding.asset_type_code);
  const categoryLabel = normalizeCategoryLabel(holding.category_label, holding.asset_type_name, holding.asset_type_code);
  const categoryAggregate = await findCategoryAggregate(env, session.portfolioId, categoryKey);
  const portfolioAggregate = await findPortfolioAggregate(env, session.portfolioId);
  const latestAnalysis = await findLatestPortfolioAnalysis(env, session.portfolioId);

  const investedAmount = Number(holding.invested_amount || 0);
  const currentValue = Number(holding.current_amount || 0);
  const storedCurrentPrice = holding.current_price == null ? null : Number(holding.current_price);
  let currentPrice = storedCurrentPrice;
  let sourceWarning: string | undefined;

  // External quote is complementary: only used when we don't have current_price stored.
  const normalizedType = (holding.asset_type_code || '').toUpperCase();
  if (currentPrice == null && normalizedType === 'STOCK' && holding.code) {
    const quote = await getExternalQuoteForStockBvmf(env, holding.code);
    if (quote?.price != null) {
      currentPrice = quote.price;
      sourceWarning = 'Cotacao veio de fonte externa complementar.';
    }
  }
  const averagePrice = Number(holding.average_price || 0);
  const performanceValue = currentValue - investedAmount;
  const performancePct = investedAmount > 0 ? (performanceValue / investedAmount) * 100 : null;
  const portfolioTotal = Number(portfolioAggregate?.total_current || 0);
  const allocationPct = portfolioTotal > 0 ? (currentValue / portfolioTotal) * 100 : 0;

  const benchmarkComparison = await buildBenchmarkComparison(env, {
    assetTypeCode: holding.asset_type_code || '',
    holdingCreatedAt: holding.created_at,
    holdingPerformancePct: performancePct
  });

  const ranking = buildRanking({ allocationPct, performancePct, hasQuote: currentPrice != null, benchmarkComparison });
  const holdingCreatedDate = toIsoDate(holding.created_at) ?? new Date().toISOString().slice(0, 10);
  const holdingAgeDays = daysBetweenIsoDates(holdingCreatedDate, new Date().toISOString().slice(0, 10));
  const recommendation = buildRecommendation({
    allocationPct,
    performancePct,
    hasQuote: currentPrice != null,
    analysisAction: latestAnalysis?.primary_action || '',
    benchmarkComparison,
    assetTypeCode: holding.asset_type_code || '',
    holdingAgeDays
  });
  const categoryContext = buildCategoryContext({
    categoryKey,
    categoryLabel,
    categoryAggregate,
    latestAnalysis
  });

  return ok(env.API_VERSION, {
    holding: {
      id: holding.id,
      assetId: holding.asset_id,
      code: holding.code || '',
      name: holding.name,
      categoryKey,
      categoryLabel,
      platformId: holding.platform_id || '',
      platformName: holding.platform_name || '',
      quantity: Number(holding.quantity || 0),
      averagePrice,
      currentPrice,
      currentValue,
      investedAmount,
      performanceValue,
      performancePct,
      allocationPct,
      recommendation: recommendation.title,
      statusLabel: currentPrice == null ? 'Sem cotacao atual' : sourceWarning ? 'Cotacao externa' : 'Cotacao disponivel',
      quotationStatus: currentPrice == null ? 'missing_quote' : 'priced',
      notes: holding.notes || '',
      stopLoss: holding.stop_loss == null ? null : Number(holding.stop_loss),
      targetPrice: holding.target_price == null ? null : Number(holding.target_price),
      sourceKind: holding.source_kind,
      assetTypeCode: holding.asset_type_code || ''
    },
    ranking,
    recommendation,
    categoryContext,
    externalLink: buildExternalLink(holding.asset_type_code || '', holding.code || ''),
    benchmarkComparison
  }, sourceWarning);
}

async function buildBenchmarkComparison(
  env: Env,
  input: { assetTypeCode: string; holdingCreatedAt: string; holdingPerformancePct: number | null }
): Promise<
  | {
      benchmark: 'CDI';
      fromDate: string;
      toDate: string;
      benchmarkAccumulatedPct: number | null;
      holdingPerformancePct: number | null;
      deltaPct: number | null;
      status: 'disabled' | 'degraded' | 'ok';
      label: string;
    }
  | null
> {
  const assetType = (input.assetTypeCode || '').toUpperCase();
  if (assetType !== 'FUND') return null;

  const fromDate = toIsoDate(input.holdingCreatedAt) ?? new Date().toISOString().slice(0, 10);
  const toDate = new Date().toISOString().slice(0, 10);

  const svc = await getExternalReferencesServiceStatus(env).catch(() => 'degraded');
  if (svc === 'disabled') {
    return {
      benchmark: 'CDI',
      fromDate,
      toDate,
      benchmarkAccumulatedPct: null,
      holdingPerformancePct: input.holdingPerformancePct,
      deltaPct: null,
      status: 'disabled',
      label: 'CDI indisponivel'
    };
  }

  const cdi = await getCdiAccumulatedPct(env, { fromDate, toDate });
  if (!cdi) {
    return {
      benchmark: 'CDI',
      fromDate,
      toDate,
      benchmarkAccumulatedPct: null,
      holdingPerformancePct: input.holdingPerformancePct,
      deltaPct: null,
      status: 'degraded',
      label: 'CDI indisponivel'
    };
  }

  const deltaPct = input.holdingPerformancePct != null ? round2(input.holdingPerformancePct - cdi.accumulatedPct) : null;
  const label = inferCdiLabel({ deltaPct, holdingPerformancePct: input.holdingPerformancePct });

  return {
    benchmark: 'CDI',
    fromDate: cdi.fromDate,
    toDate: cdi.toDate,
    benchmarkAccumulatedPct: cdi.accumulatedPct,
    holdingPerformancePct: input.holdingPerformancePct,
    deltaPct,
    status: 'ok',
    label
  };
}

function inferCdiLabel(input: { deltaPct: number | null; holdingPerformancePct: number | null }): string {
  if (input.holdingPerformancePct == null) return 'Sem base suficiente';
  if (input.deltaPct == null) return 'Comparacao indisponivel';
  if (input.deltaPct <= -2) return 'Abaixo do CDI';
  if (input.deltaPct >= 2) return 'Acima do CDI';
  return 'Em linha com CDI';
}

function toIsoDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  // D1 timestamps are often "YYYY-MM-DD HH:MM:SS".
  const iso = value.trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function daysBetweenIsoDates(fromDate: string, toDate: string): number | null {
  const from = Date.parse(fromDate + 'T00:00:00.000Z');
  const to = Date.parse(toDate + 'T00:00:00.000Z');
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return null;
  return Math.floor((to - from) / (24 * 60 * 60 * 1000));
}

function buildRanking(input: {
  allocationPct: number;
  performancePct: number | null;
  hasQuote: boolean;
  benchmarkComparison:
    | {
        benchmark: 'CDI';
        fromDate: string;
        toDate: string;
        benchmarkAccumulatedPct: number | null;
        holdingPerformancePct: number | null;
        deltaPct: number | null;
        status: 'disabled' | 'degraded' | 'ok';
        label: string;
      }
    | null;
}) {
  let score = 70;
  const motives: string[] = [];

  if (input.performancePct != null) {
    if (input.performancePct > 15) {
      score += 10;
      motives.push('Boa performance relativa dentro da carteira');
    } else if (input.performancePct < -10) {
      score -= 20;
      motives.push('Performance fraca em relacao ao preco medio');
    }
  }

  if (input.allocationPct > 20) {
    score -= 15;
    motives.push('Peso elevado dentro da carteira');
  } else if (input.allocationPct > 8) {
    score += 5;
    motives.push('Peso relevante na composicao da carteira');
  }

  if (!input.hasQuote) {
    score -= 25;
    motives.push('Ativo sem cotacao atual');
  }

  // US049: warn when a FUND stays below CDI for a meaningful window.
  if (input.benchmarkComparison?.benchmark === 'CDI' && input.benchmarkComparison.status === 'ok') {
    const days = daysBetweenIsoDates(input.benchmarkComparison.fromDate, input.benchmarkComparison.toDate);
    const delta = input.benchmarkComparison.deltaPct;
    if (days != null && days >= 60 && delta != null && delta <= -2) {
      score -= 10;
      motives.push('Fundo abaixo do CDI no periodo');
    }
  }

  score = Math.max(0, Math.min(100, score));
  return {
    score,
    status: score >= 75 ? 'Atrativo' : score >= 50 ? 'Neutro' : 'Atenção',
    motives,
    opportunityScore: Math.max(0, Math.min(100, score - (input.allocationPct > 20 ? 10 : 0)))
  };
}

function buildRecommendation(input: {
  allocationPct: number;
  performancePct: number | null;
  hasQuote: boolean;
  analysisAction: string;
  benchmarkComparison:
    | {
        benchmark: 'CDI';
        fromDate: string;
        toDate: string;
        benchmarkAccumulatedPct: number | null;
        holdingPerformancePct: number | null;
        deltaPct: number | null;
        status: 'disabled' | 'degraded' | 'ok';
        label: string;
      }
    | null;
  assetTypeCode: string;
  holdingAgeDays: number | null;
}) {
  if (!input.hasQuote) {
    return {
      code: 'monitor_without_quote',
      title: 'Monitorar sem cotacao',
      body: 'O ativo continua visivel, mas sem cotacao atual a leitura fica incompleta. Revise a origem dos dados antes de decidir.'
    };
  }

  if (input.benchmarkComparison?.benchmark === 'CDI' && input.benchmarkComparison.status === 'ok') {
    const days = daysBetweenIsoDates(input.benchmarkComparison.fromDate, input.benchmarkComparison.toDate);
    const delta = input.benchmarkComparison.deltaPct;
    if (days != null && days >= 60 && delta != null && delta <= -2) {
      return {
        code: 'review_fund_below_cdi',
        title: 'Revisar fundo (abaixo do CDI)',
        body:
          'O fundo ficou abaixo do CDI por um periodo relevante. ' +
          'Antes de trocar, valide taxas e se o papel dele na carteira ainda faz sentido. ' +
          appendAnalysisContext(input.analysisAction)
      };
    }
  }
  if (input.performancePct != null && input.performancePct < -10 && input.allocationPct > 15) {
    return {
      code: 'review_exposure',
      title: 'Revisar exposicao',
      body: 'O ativo esta perdendo valor e ainda ocupa peso relevante na carteira. ' + appendAnalysisContext(input.analysisAction)
    };
  }

  // US065: fund review recommendation without requiring CDI. Conservative window to avoid short-term noise.
  const assetType = (input.assetTypeCode || '').toUpperCase();
  if (assetType === 'FUND' && input.holdingAgeDays != null && input.holdingAgeDays >= 90 && input.performancePct != null && input.performancePct <= -5 && input.allocationPct >= 8) {
    return {
      code: 'review_fund',
      title: 'Revisar fundo',
      body:
        'O fundo esta com performance negativa por um periodo relevante e tem peso material na carteira. ' +
        'Revise taxas, estrategia e se ele ainda cumpre o papel esperado. ' +
        appendAnalysisContext(input.analysisAction)
    };
  }
  if (input.performancePct != null && input.performancePct > 15 && input.allocationPct > 20) {
    return {
      code: 'protect_gain',
      title: 'Proteger ganho e rebalancear',
      body: 'Existe ganho acumulado e concentracao alta no ativo. ' + appendAnalysisContext(input.analysisAction)
    };
  }
  return {
    code: 'hold_and_monitor',
    title: 'Manter e monitorar',
    body: 'O ativo nao acendeu alerta critico isolado. ' + appendAnalysisContext(input.analysisAction)
  };
}

function buildCategoryContext(input: any) {
  const totalCurrent = Number(input.categoryAggregate?.total_current || 0);
  const totalInvested = Number(input.categoryAggregate?.total_invested || 0);
  const profitLoss = totalCurrent - totalInvested;
  const profitLossPct = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : null;

  return {
    categoryKey: input.categoryKey,
    categoryLabel: input.categoryLabel,
    categoryRisk: profitLossPct != null && profitLossPct < -10 ? 'Pressionada' : profitLossPct != null && profitLossPct > 10 ? 'Saudavel' : 'Neutra',
    categoryRecommendation: input.latestAnalysis?.primary_action || 'Sem recomendacao consolidada especifica',
    primaryMessage: input.latestAnalysis?.summary_text || 'Contexto construído a partir da categoria e da analise consolidada da carteira.',
    holdingsCount: Number(input.categoryAggregate?.holdings_count || 0),
    totalCurrent,
    totalInvested,
    totalProfitLoss: profitLoss,
    totalProfitLossPct: profitLossPct
  };
}

function buildExternalLink(assetTypeCode: string, code: string): string {
  const normalizedType = (assetTypeCode || '').toUpperCase();
  if (normalizedType === 'STOCK' && code) {
    return `https://www.google.com/finance/quote/${encodeURIComponent(code)}:BVMF`;
  }
  return '';
}

function appendAnalysisContext(action: string): string {
  return action ? `Contexto da carteira: ${action}.` : 'Use isso junto com a leitura consolidada da carteira.';
}

function normalizeCategoryKey(categoryLabel: unknown, assetTypeCode: unknown): string {
  const label = typeof categoryLabel === 'string' ? categoryLabel.trim().toLowerCase() : '';
  const code = typeof assetTypeCode === 'string' ? assetTypeCode.trim().toLowerCase() : '';
  return label || code || 'outros';
}

function normalizeCategoryLabel(categoryLabel: unknown, assetTypeName: unknown, assetTypeCode: unknown): string {
  const label = typeof categoryLabel === 'string' ? categoryLabel.trim() : '';
  const name = typeof assetTypeName === 'string' ? assetTypeName.trim() : '';
  const code = typeof assetTypeCode === 'string' ? assetTypeCode.trim() : '';
  return label || name || code || 'Outros';
}

function readCookie(cookieHeader: string, cookieName: string): string {
  const prefix = `${cookieName}=`;
  const match = cookieHeader.split(';').map((item) => item.trim()).find((item) => item.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : '';
}
