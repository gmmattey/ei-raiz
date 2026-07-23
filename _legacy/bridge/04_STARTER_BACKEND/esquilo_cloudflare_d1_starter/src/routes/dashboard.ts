import type { Env } from '../types/env';
import { getDashboardHomeData } from '../lib/dashboard_home_service';

export async function getDashboardHome(request: Request, env: Env): Promise<Response> {
  return await getDashboardHomeData(request, env);
}
