import type { ApiEnvelope, ResponseMeta } from '../types/contracts';

function meta(version: string): ResponseMeta {
  return { requestId: crypto.randomUUID(), timestamp: new Date().toISOString(), version };
}

export function ok<T>(version: string, data: T, status = 200): Response {
  const body: ApiEnvelope<T> = { ok: true, meta: meta(version), data };
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

export function fail(version: string, code: string, message: string, status = 400, details?: Record<string, unknown>): Response {
  const body: ApiEnvelope<never> = { ok: false, meta: meta(version), error: { code, message, ...(details ? { details } : {}) } };
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

export async function readJson<T>(request: Request): Promise<T> {
  return await request.json<T>();
}
