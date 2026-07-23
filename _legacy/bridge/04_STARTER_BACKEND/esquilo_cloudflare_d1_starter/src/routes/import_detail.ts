import type { Env } from '../types/env';
import { getImportDetailData } from '../lib/import_detail_service';

export async function getImportDetail(request: Request, env: Env, params: Record<string, string>): Promise<Response> {
  return await getImportDetailData(request, env, params);
}
