import type { AppDataSources } from '../core/data';
import { createRouter, type Router, type RouterLocationLike } from '../core/router';

export type EntryFlowReason =
  | 'redirect_onboarding'
  | 'ready'
  | 'empty'
  | 'analysis_pending'
  | 'backend_error';

export interface EntryFlowResult {
  reason: EntryFlowReason;
  nextPathname: string;
}

export interface ResolveEntryFlowInput {
  dataSources: AppDataSources;
  router?: Router;
  currentLocation?: RouterLocationLike;
}

/**
 * Resolve o primeiro destino do app.
 * Regra MVP: nao quebrar no primeiro acesso; orientar pro proximo passo.
 *
 * Fonte dominante: `GET /v1/dashboard/home` (screenState).
 */
export async function resolveEntryFlow(input: ResolveEntryFlowInput): Promise<EntryFlowResult> {
  const router = input.router ?? createRouter();
  const current = input.currentLocation ?? { pathname: '/' };

  const home = await input.dataSources.dashboard.getDashboardHome();
  if (!home.ok) {
    // Se o backend falhar no primeiro acesso, nao joga erro tecnico pra UI; volta pro splash.
    return { reason: 'backend_error', nextPathname: router.build(router.parse(current)) };
  }

  const data = home.data;
  if (data.screenState === 'redirect_onboarding') {
    return { reason: 'redirect_onboarding', nextPathname: data.redirectTo || '/onboarding' };
  }

  if (data.screenState === 'empty') {
    return { reason: 'empty', nextPathname: '/home' };
  }

  if (data.screenState === 'portfolio_ready_analysis_pending') {
    return { reason: 'analysis_pending', nextPathname: '/home' };
  }

  return { reason: 'ready', nextPathname: '/home' };
}

