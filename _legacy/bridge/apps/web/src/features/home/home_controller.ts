import type { ApiDashboardHomeEnvelope, DashboardHomeData, DashboardHomeEmptyData, ScreenStateRedirect } from '../../core/data/contracts';
import type { DashboardDataSource } from '../../core/data/data_sources';
import { tryParseRoute, type AppRoute } from '../../core/router';
import type { OperationFeedback } from '../../core/ops/load_state';
import { loading } from '../../core/ops/load_state';
import { toErrorFeedback } from '../../core/ops/error_catalog';
import { bannerFromSourceWarning, type ExternalDataBanner } from '../../core/view_models/external_data';

export interface HomeNavigationTargets {
  primaryAction?: { label: string; pathname: string; route: AppRoute };
  openPortfolio?: { pathname: string; route: AppRoute };
  openRadar?: { pathname: string; route: AppRoute };
  openHoldingDetail?: { pathname: string; route: AppRoute };
}

export interface HomeControllerResult {
  envelope: ApiDashboardHomeEnvelope;
  nav: HomeNavigationTargets;
  loadingFeedback: OperationFeedback;
  errorFeedback?: OperationFeedback;
  externalDataBanner?: ExternalDataBanner | null;
}

export interface HomeController {
  load(): Promise<HomeControllerResult>;
}

/**
 * Controller headless da Home:
 * - centraliza leitura do contrato
 * - prepara targets de navegacao (E2E-010) de forma valida contra o router
 */
export function createHomeController(input: { dashboard: DashboardDataSource }): HomeController {
  const dashboard = input.dashboard;
  const loadingFeedback = loading('Carregando Home', 'Consolidando carteira e recomendacao.');

  return {
    async load() {
      const envelope = await dashboard.getDashboardHome();
      if (!envelope.ok) return { envelope, nav: {}, loadingFeedback, errorFeedback: toErrorFeedback(envelope.error, { area: 'home' }) };

      const nav = resolveNav(envelope.data);
      const externalDataBanner =
        envelope.data.screenState === 'ready' ? bannerFromSourceWarning((envelope.data as any).sourceWarning) : null;
      return { envelope, nav, loadingFeedback, externalDataBanner };
    }
  };
}

function resolveNav(data: DashboardHomeData): HomeNavigationTargets {
  if (data.screenState === 'redirect_onboarding') {
    const redirect = data as ScreenStateRedirect;
    const route = tryParseRoute({ pathname: redirect.redirectTo }) ?? { id: 'onboarding' };
    return {
      primaryAction: { label: 'Completar onboarding', pathname: redirect.redirectTo, route }
    };
  }

  if (data.screenState !== 'ready' && data.screenState !== 'portfolio_ready_analysis_pending' && data.screenState !== 'empty') {
    return {};
  }

  const targets: HomeNavigationTargets = {};

  if (data.screenState === 'empty') {
    const empty = data as DashboardHomeEmptyData;
    const pathname = empty.emptyState.target;
    const route = tryParseRoute({ pathname });
    if (route) {
      targets.primaryAction = { label: empty.emptyState.ctaLabel, pathname, route };
    }
  }

  // CTA principal vem do backend; valida antes de expor.
  if ('primaryAction' in data && data.primaryAction?.target) {
    const pathname = data.primaryAction.target;
    const route = tryParseRoute({ pathname });
    if (route) {
      targets.primaryAction = { label: data.primaryAction.ctaLabel, pathname, route };
    }
  }

  const portfolioRoute = tryParseRoute({ pathname: '/portfolio' });
  if (portfolioRoute) targets.openPortfolio = { pathname: '/portfolio', route: portfolioRoute };

  const radarRoute = tryParseRoute({ pathname: '/radar' });
  if (radarRoute) targets.openRadar = { pathname: '/radar', route: radarRoute };

  // Se o backend no futuro sugerir um holdingId alvo, a Home ja sabe montar o destino.
  // Aqui fica "best effort": usa portfolioId do payload quando existir.
  if ('portfolioId' in data && typeof data.portfolioId === 'string' && data.portfolioId) {
    const exampleHoldingId = null as string | null;
    if (exampleHoldingId) {
      const pathname = `/portfolio/${encodeURIComponent(data.portfolioId)}/holdings/${encodeURIComponent(exampleHoldingId)}`;
      const route = tryParseRoute({ pathname });
      if (route) targets.openHoldingDetail = { pathname, route };
    }
  }

  return targets;
}
