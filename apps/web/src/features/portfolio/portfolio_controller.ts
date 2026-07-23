import type {
  ApiPortfolioEnvelope,
  PortfolioData,
  PortfolioDataEmpty,
  PortfolioDataReady,
  PortfolioHolding,
  PortfolioGroup
} from '../../core/data/contracts';
import type { PortfolioDataSource } from '../../core/data/data_sources';
import { createRouter, type Router } from '../../core/router';
import { toEmptyStateViewModel, type EmptyStateViewModel } from '../../core/view_models/empty_state';
import type { OperationFeedback } from '../../core/ops/load_state';
import { loading } from '../../core/ops/load_state';
import { toErrorFeedback } from '../../core/ops/error_catalog';
import { bannerFromQuotationStatus, type ExternalDataBanner } from '../../core/view_models/external_data';

export type PortfolioLocalFilters = {
  categoryKey?: string;
  platformId?: string;
};

export type PortfolioQuery = {
  performance?: 'all' | 'best' | 'worst';
} & PortfolioLocalFilters;

export type PortfolioCategorySummary = {
  categoryKey: string;
  categoryLabel: string;
  totalCurrent: number;
  sharePct: number;
  holdingsCount: number;
  concentrationLevel: 'low' | 'medium' | 'high';
};

export type PortfolioAssetConcentration = {
  assetId: string;
  code: string;
  name: string;
  totalCurrent: number;
  sharePct: number;
  positionsCount: number;
  platformsCount: number;
  concentrationLevel: 'low' | 'medium' | 'high';
  attentionLabel: string | null;
  primaryHoldingId: string;
};

export type PortfolioInstitutionConcentration = {
  platformId: string;
  platformName: string;
  totalCurrent: number;
  sharePct: number;
  positionsCount: number;
  categoriesCount: number;
  concentrationLevel: 'low' | 'medium' | 'high';
  attentionLabel: string | null;
};

export type PortfolioReadyViewModel = {
  kind: 'ready';
  portfolioId: string;
  summary: PortfolioDataReady['summary'];
  filters: PortfolioDataReady['filters'] & PortfolioLocalFilters;
  categories: PortfolioCategorySummary[];
  assets: PortfolioAssetConcentration[];
  institutions: PortfolioInstitutionConcentration[];
  groups: PortfolioGroup[];
  holdings: PortfolioHolding[];
  targets: {
    toHoldingDetail(holdingId: string): { pathname: string };
  };
};

export type PortfolioEmptyViewModel = {
  kind: 'empty';
  portfolioId: string;
  emptyState: EmptyStateViewModel;
};

export type PortfolioRedirectViewModel = {
  kind: 'redirect_onboarding';
  redirectTo: string;
};

export type PortfolioErrorViewModel = {
  kind: 'error';
  code?: string;
  message?: string;
};

export type PortfolioViewModel =
  | PortfolioReadyViewModel
  | PortfolioEmptyViewModel
  | PortfolioRedirectViewModel
  | PortfolioErrorViewModel;

export interface PortfolioControllerResult {
  envelope: ApiPortfolioEnvelope;
  viewModel: PortfolioViewModel;
  loadingFeedback: OperationFeedback;
  errorFeedback?: OperationFeedback;
  externalDataBanner?: ExternalDataBanner | null;
}

export interface PortfolioController {
  load(query?: PortfolioQuery): Promise<PortfolioControllerResult>;
}

/**
 * Controller headless da Carteira:
 * - carrega `GET /v1/portfolio` (performance como query param quando houver)
 * - aplica filtros locais (categoria, plataforma) sem inventar contrato
 * - expõe agrupamento por categoria (US029) + target para detalhe
 */
export function createPortfolioController(input: { portfolio: PortfolioDataSource; router?: Router }): PortfolioController {
  const portfolio = input.portfolio;
  const router = input.router ?? createRouter();
  const loadingFeedback = loading('Carregando Carteira', 'Lendo posicoes e agrupando por categoria.');

  return {
    async load(query) {
      const performance = query?.performance;
      const envelope = await portfolio.getPortfolio(performance ? { performance } : undefined);
      if (!envelope.ok) {
        return {
          envelope,
          viewModel: { kind: 'error', code: envelope.error.code, message: envelope.error.message },
          loadingFeedback,
          errorFeedback: toErrorFeedback(envelope.error, { area: 'portfolio' })
        };
      }

      const viewModel = buildViewModel(envelope.data, query ?? {}, router);
      const externalDataBanner = inferExternalBanner(viewModel);
      return { envelope, viewModel, loadingFeedback, externalDataBanner };
    }
  };
}

function inferExternalBanner(viewModel: PortfolioViewModel): ExternalDataBanner | null {
  if (viewModel.kind !== 'ready') return null;
  const hasDegraded = viewModel.holdings.some((h) => h.quotationStatus && h.quotationStatus !== 'priced');
  return hasDegraded ? bannerFromQuotationStatus({ quotationStatus: 'degraded' }) : null;
}

function buildViewModel(data: PortfolioData, query: PortfolioQuery, router: Router): PortfolioViewModel {
  if (data.screenState === 'redirect_onboarding') {
    return { kind: 'redirect_onboarding', redirectTo: data.redirectTo || '/onboarding' };
  }

  if (data.screenState === 'empty') {
    return { kind: 'empty', portfolioId: data.portfolioId, emptyState: toEmptyStateViewModel(data.emptyState) };
  }

  // ready
  const ready = data as PortfolioDataReady;
  const groups = applyLocalFilters(ready.groups, query);
  const holdings = groups.flatMap((g) => g.holdings);
  const categories = buildCategorySummaries(groups, ready.summary.totalEquity);
  const assets = buildAssetConcentrations(holdings, ready.summary.totalEquity);
  const institutions = buildInstitutionConcentrations(holdings, ready.summary.totalEquity);

  return {
    kind: 'ready',
    portfolioId: ready.portfolioId,
    summary: ready.summary,
    filters: { ...ready.filters, categoryKey: query.categoryKey, platformId: query.platformId },
    categories,
    assets,
    institutions,
    groups,
    holdings,
    targets: {
      toHoldingDetail(holdingId) {
        const pathname = router.build({ id: 'holding_detail', params: { portfolioId: ready.portfolioId, holdingId } });
        return { pathname };
      }
    }
  };
}

function applyLocalFilters(groups: PortfolioGroup[], query: PortfolioQuery): PortfolioGroup[] {
  const categoryKey = query.categoryKey;
  const platformId = query.platformId;
  if (!categoryKey && !platformId) return groups;

  return groups
    .filter((g) => !categoryKey || g.categoryKey === categoryKey)
    .map((g) => ({
      ...g,
      holdings: g.holdings.filter((h) => !platformId || h.platformId === platformId)
    }))
    .filter((g) => g.holdings.length > 0);
}

function buildCategorySummaries(groups: PortfolioGroup[], totalEquity: number): PortfolioCategorySummary[] {
  const eq = totalEquity > 0 ? totalEquity : 1;

  return groups
    .map((g) => ({
      categoryKey: g.categoryKey,
      categoryLabel: g.categoryLabel,
      totalCurrent: g.totalCurrent,
      sharePct: round2((g.totalCurrent / eq) * 100),
      holdingsCount: g.holdings.length,
      concentrationLevel: concentrationLevel((g.totalCurrent / eq) * 100)
    }))
    .sort((a, b) => b.totalCurrent - a.totalCurrent);
}

function buildAssetConcentrations(holdings: PortfolioHolding[], totalEquity: number): PortfolioAssetConcentration[] {
  const eq = totalEquity > 0 ? totalEquity : 1;
  const map = new Map<
    string,
    {
      assetId: string;
      code: string;
      name: string;
      totalCurrent: number;
      holdingIds: string[];
      platformIds: Set<string>;
      primaryHoldingId: string;
      primaryHoldingValue: number;
    }
  >();

  for (const h of holdings) {
    const key = h.assetId;
    const current = map.get(key) ?? {
      assetId: h.assetId,
      code: h.code,
      name: h.name,
      totalCurrent: 0,
      holdingIds: [] as string[],
      platformIds: new Set<string>(),
      primaryHoldingId: h.id,
      primaryHoldingValue: -Infinity
    };
    current.totalCurrent += h.currentValue;
    current.holdingIds.push(h.id);
    if (h.platformId) current.platformIds.add(h.platformId);
    if (h.currentValue > current.primaryHoldingValue) {
      current.primaryHoldingValue = h.currentValue;
      current.primaryHoldingId = h.id;
    }
    map.set(key, current);
  }

  const items = Array.from(map.values()).map((row) => {
    const share = (row.totalCurrent / eq) * 100;
    const level = concentrationLevel(share);
    const attentionLabel = level === 'high' ? 'Concentracao alta no ativo' : level === 'medium' ? 'Peso relevante no ativo' : null;

    return {
      assetId: row.assetId,
      code: row.code,
      name: row.name,
      totalCurrent: row.totalCurrent,
      sharePct: round2(share),
      positionsCount: row.holdingIds.length,
      platformsCount: row.platformIds.size || 1,
      concentrationLevel: level,
      attentionLabel,
      primaryHoldingId: row.primaryHoldingId
    };
  });

  return items.sort((a, b) => b.totalCurrent - a.totalCurrent || a.name.localeCompare(b.name));
}

function buildInstitutionConcentrations(holdings: PortfolioHolding[], totalEquity: number): PortfolioInstitutionConcentration[] {
  const eq = totalEquity > 0 ? totalEquity : 1;
  const map = new Map<string, { platformId: string; platformName: string; totalCurrent: number; positionsCount: number; categories: Set<string> }>();

  for (const h of holdings) {
    const key = h.platformId || 'unknown';
    const name = h.platformName || 'Instituicao nao informada';
    const current = map.get(key) ?? {
      platformId: key,
      platformName: name,
      totalCurrent: 0,
      positionsCount: 0,
      categories: new Set<string>()
    };
    current.totalCurrent += h.currentValue;
    current.positionsCount += 1;
    if (h.categoryKey) current.categories.add(h.categoryKey);
    map.set(key, current);
  }

  const items = Array.from(map.values()).map((row) => {
    const share = (row.totalCurrent / eq) * 100;
    const level = concentrationLevel(share);
    const attentionLabel = level === 'high' ? 'Concentracao alta na instituicao' : level === 'medium' ? 'Dependencia relevante' : null;

    return {
      platformId: row.platformId,
      platformName: row.platformName,
      totalCurrent: row.totalCurrent,
      sharePct: round2(share),
      positionsCount: row.positionsCount,
      categoriesCount: row.categories.size || 1,
      concentrationLevel: level,
      attentionLabel
    };
  });

  return items.sort((a, b) => b.totalCurrent - a.totalCurrent || a.platformName.localeCompare(b.platformName));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function concentrationLevel(sharePct: number): 'low' | 'medium' | 'high' {
  // Heuristica simples para leitura macro (US031) sem inventar regra financeira complexa.
  if (sharePct >= 60) return 'high';
  if (sharePct >= 30) return 'medium';
  return 'low';
}
