import type { Env } from '../types/env';
import { getImportConflictsData } from '../lib/import_conflicts_service';

export async function getImportConflicts(request: Request, env: Env, params: Record<string, string>): Promise<Response> {
  return await getImportConflictsData(request, env, params);
}
