import type { Env } from '../types/env';
import { getPortfolioData } from '../lib/portfolio_service';
import { getHoldingDetailData } from '../lib/holding_detail_service';

export async function getPortfolio(request: Request, env: Env): Promise<Response> {
  return await getPortfolioData(request, env);
}

export async function getHoldingDetail(request: Request, env: Env, params: Record<string, string>): Promise<Response> {
  return await getHoldingDetailData(request, env, params);
}
