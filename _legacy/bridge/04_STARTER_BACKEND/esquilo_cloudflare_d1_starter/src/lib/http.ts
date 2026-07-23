import type { ApiEnvelope, ResponseMeta } from '../types/contracts';

export function buildMeta(version: string, sourceWarning?: string): ResponseMeta {
  return {
    requestId: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    version,
    ...(sourceWarning ? { sourceWarning } : {})
  };
}

export function ok<T>(version: string, data: T, sourceWarning?: string, status = 200): Response {
  const meta = buildMeta(version, sourceWarning);
  const body: ApiEnvelope<T> = {
    ok: true,
    meta,
    data
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'x-api-version': meta.version,
      'x-request-id': meta.requestId
    }
  });
}

export function fail(version: string, code: string, message: string, status = 400, details?: Record<string, unknown>): Response {
  const meta = buildMeta(version);
  const body: ApiEnvelope<never> = {
    ok: false,
    meta,
    error: { code, message, ...(details ? { details } : {}) }
  };

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'x-api-version': meta.version,
      'x-request-id': meta.requestId,
      'x-error-code': code
    }
  });
}

export async function readJson<T>(request: Request): Promise<T> {
  return await request.json<T>();
}
