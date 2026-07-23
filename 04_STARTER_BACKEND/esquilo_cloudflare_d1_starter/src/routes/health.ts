import type { Env } from '../types/env';
import { ok, fail } from '../lib/http';
import { getExternalReferencesServiceStatus } from '../lib/external_references_service';

export async function getHealth(_request: Request, env: Env): Promise<Response> {
  try {
    await env.DB.prepare('SELECT 1 as ok').first();
    const externalStatus = await getExternalReferencesServiceStatus(env);

    return ok(env.API_VERSION, {
      status: 'ok',
      appEnv: env.APP_ENV,
      apiVersion: env.API_VERSION,
      services: {
        d1: 'ok',
        externalReferences: externalStatus
      }
    });
  } catch (error) {
    return fail(env.API_VERSION, 'health_check_failed', 'Falha ao verificar saúde da API.', 500, {
      reason: String(error)
    });
  }
}
