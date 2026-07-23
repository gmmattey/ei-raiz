import type { Env } from '../types/env';
import { getImportEngineStatusData } from '../lib/import_engine_status_service';

export async function getImportEngineStatus(request: Request, env: Env, params: Record<string, string>): Promise<Response> {
  return await getImportEngineStatusData(request, env, params);
}
