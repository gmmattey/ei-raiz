import type { Env } from '../types/env';
import { getPortfolioEntryOnboarding } from '../lib/portfolio_onboarding_service';

export async function getPortfolioEntryOnboardingRoute(request: Request, env: Env): Promise<Response> {
  return await getPortfolioEntryOnboarding(request, env);
}
