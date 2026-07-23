import type { Env } from '../types/env';
import { getAnalysisData } from '../lib/analysis_service';

export async function getAnalysis(request: Request, env: Env): Promise<Response> {
  return await getAnalysisData(request, env);
}
