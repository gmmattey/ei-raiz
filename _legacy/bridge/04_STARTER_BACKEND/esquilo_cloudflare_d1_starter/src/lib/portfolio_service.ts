import type { Env } from '../types/env';
import { ok, fail } from './http';
import { hashToken } from './auth_crypto';
import { findPortfolioSessionStateByTokenHash, findActivePortfolioPositions } from '../repositories/portfolio_repository';
import type { PortfolioData, PortfolioGroup, PortfolioHoldingListItem } from '../types/contracts';

const AUTH_COOKIE_NAME = 'esquilo_session';

export async function getPortfolioData(request: Request, env: Env): Promise<Response> {
  const token = readCookie(request.headers.get('cookie') || '', AUTH_COOKIE_NAME);
  if (!token) return fail(env.API_VERSION, 'unauthorized', 'Sessao nao encontrada.', 401);

  const tokenHash = await hashToken(token);
  const session = await findPortfolioSessionStateByTokenHash(env, tokenHash);
  if (!session) return fail(env.API_VERSION, 'unauthorized', 'Sessao invalida.', 401);
  if (!session.hasContext) {
    return ok(env.API_VERSION, {
      screenState: 'redirect_onboarding',
      redirectTo: '/onboarding'
    });
  }
  if (!session.portfolioId) {
    return fail(env.API_VERSION, 'portfolio_not_found', 'Carteira principal nao encontrada.', 404);
  }

  const url = new URL(request.url);
  const performanceFilter = normalizePerformanceFilter(url.searchParams.get('performance'));
  const rows = await findActivePortfolioPositions(env, session.portfolioId);

  if (!rows.length) {
    const emptyData: PortfolioData = {
      screenState: 'empty',
      portfolioId: session.portfolioId,
      summary: {
        totalEquity: 0,
        totalInvested: 0,
        totalProfitLoss: 0,
        totalProfitLossPct: 0,
        statusLabel: 'Sem posicoes ativas'
      },
        emptyState: {
          title: 'Sua carteira ainda nao tem posicoes ativas',
          body: 'Importe sua carteira para montar a leitura consolidada dos ativos.',
          ctaLabel: 'Importar carteira',
          target: '/imports/entry'
        },
        groups: [],
        filters: { performance: performanceFilter },
      orders: []
    };
    return ok(env.API_VERSION, emptyData);
  }

  const holdings = rows.map(mapHolding);
  const filteredHoldings = applyPerformanceFilter(holdings, performanceFilter);
  const summary = buildSummary(holdings);
  const groups = buildGroups(filteredHoldings);

  const data: PortfolioData = {
    screenState: 'ready',
    portfolioId: session.portfolioId,
    summary,
    groups,
    filters: { performance: performanceFilter },
    orders: []
  };

  return ok(env.API_VERSION, data);
}

function mapHolding(row: any): PortfolioHoldingListItem {
  const investedAmount = Number(row.invested_amount || 0);
  const currentValue = Number(row.current_amount || 0);
  const currentPrice = row.current_price == null ? null : Number(row.current_price);
  const performanceValue = currentValue - investedAmount;
  const performancePct = investedAmount > 0 ? (performanceValue / investedAmount) * 100 : null;
  const categoryKey = normalizeCategoryKey(row.category_label, row.category_code);
  const categoryLabel = normalizeCategoryLabel(row.category_label, row.category_name, row.category_code);

  return {
    id: row.id,
    assetId: row.asset_id,
    code: row.code || '',
    name: row.name,
    categoryKey,
    categoryLabel,
    platformId: row.platform_id || '',
    platformName: row.platform_name || '',
    quantity: Number(row.quantity || 0),
    averagePrice: Number(row.average_price || 0),
    currentPrice,
    currentValue,
    investedAmount,
    performanceValue,
    performancePct,
    allocationPct: 0,
    quotationStatus: currentPrice == null ? 'missing_quote' : 'priced'
  };
}

function applyPerformanceFilter(holdings: PortfolioHoldingListItem[], performance: 'all' | 'best' | 'worst') {
  if (performance === 'best') {
    return holdings.filter((item) => item.performancePct != null && item.performancePct > 0);
  }
  if (performance === 'worst') {
    return holdings.filter((item) => item.performancePct != null && item.performancePct < 0);
  }
  return holdings;
}

function buildSummary(holdings: PortfolioHoldingListItem[]) {
  const totalEquity = holdings.reduce((sum, item) => sum + item.currentValue, 0);
  const totalInvested = holdings.reduce((sum, item) => sum + item.investedAmount, 0);
  const totalProfitLoss = totalEquity - totalInvested;
  const totalProfitLossPct = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;
  holdings.forEach((item) => {
    item.allocationPct = totalEquity > 0 ? (item.currentValue / totalEquity) * 100 : 0;
  });
  return {
    totalEquity,
    totalInvested,
    totalProfitLoss,
    totalProfitLossPct,
    statusLabel: 'Posicoes ativas'
  };
}

function buildGroups(holdings: PortfolioHoldingListItem[]): PortfolioGroup[] {
  const map = new Map<string, PortfolioGroup>();
  for (const holding of holdings) {
    const key = holding.categoryKey;
    const current = map.get(key) || {
      categoryKey: key,
      categoryLabel: holding.categoryLabel,
      totalInvested: 0,
      totalCurrent: 0,
      totalProfitLoss: 0,
      totalProfitLossPct: null,
      holdings: []
    };
    current.totalInvested += holding.investedAmount;
    current.totalCurrent += holding.currentValue;
    current.totalProfitLoss += holding.performanceValue;
    current.holdings.push(holding);
    map.set(key, current);
  }

  const groups = Array.from(map.values()).map((group) => {
    group.totalProfitLossPct = group.totalInvested > 0 ? (group.totalProfitLoss / group.totalInvested) * 100 : null;
    group.holdings.sort((a, b) => b.currentValue - a.currentValue || a.name.localeCompare(b.name));
    return group;
  });

  groups.sort((a, b) => b.totalCurrent - a.totalCurrent || a.categoryLabel.localeCompare(b.categoryLabel));
  return groups;
}

function normalizePerformanceFilter(value: string | null): 'all' | 'best' | 'worst' {
  if (value === 'best' || value === 'worst') return value;
  return 'all';
}

function normalizeCategoryKey(categoryLabel: unknown, categoryCode: unknown): string {
  const label = typeof categoryLabel === 'string' ? categoryLabel.trim().toLowerCase() : '';
  const code = typeof categoryCode === 'string' ? categoryCode.trim().toLowerCase() : '';
  return label || code || 'outros';
}

function normalizeCategoryLabel(categoryLabel: unknown, categoryName: unknown, categoryCode: unknown): string {
  const label = typeof categoryLabel === 'string' ? categoryLabel.trim() : '';
  const name = typeof categoryName === 'string' ? categoryName.trim() : '';
  const code = typeof categoryCode === 'string' ? categoryCode.trim() : '';
  return label || name || code || 'Outros';
}

function readCookie(cookieHeader: string, cookieName: string): string {
  const prefix = `${cookieName}=`;
  const match = cookieHeader.split(';').map((item) => item.trim()).find((item) => item.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : '';
}
