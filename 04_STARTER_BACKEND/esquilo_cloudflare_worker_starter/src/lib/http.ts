export interface ApiEnvelope<T> {
  ok: boolean;
  version: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: Record<string, unknown>;
}

export function json<T>(
  version: string,
  data: T,
  init: ResponseInit = {},
  meta?: Record<string, unknown>,
): Response {
  const body: ApiEnvelope<T> = { ok: true, version, data, meta };
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {}),
    },
  });
}

export function fail(
  version: string,
  status: number,
  code: string,
  message: string,
  details?: unknown,
): Response {
  const body: ApiEnvelope<never> = {
    ok: false,
    version,
    error: { code, message, details },
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export function methodNotAllowed(version: string): Response {
  return fail(version, 405, "method_not_allowed", "Method not allowed.");
}

export async function parseJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}
