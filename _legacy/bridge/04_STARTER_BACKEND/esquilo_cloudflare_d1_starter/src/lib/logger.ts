import type { Env } from '../types/env';

type LogLevel = 'info' | 'warn' | 'error';

export function logEvent(env: Env, level: LogLevel, event: string, fields: Record<string, unknown>) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    appEnv: env.APP_ENV,
    apiVersion: env.API_VERSION,
    ...fields
  };

  const line = safeJson(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export function logHttpRequest(env: Env, input: {
  requestId: string | null;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  errorCode: string | null;
  cfRay: string | null;
  ip: string | null;
}) {
  logEvent(env, 'info', 'http_request', input);
}

export function logHttpUnhandledError(env: Env, input: {
  requestId: string | null;
  method: string;
  path: string;
  cfRay: string | null;
  ip: string | null;
  error: unknown;
}) {
  logEvent(env, 'error', 'http_unhandled_error', {
    requestId: input.requestId,
    method: input.method,
    path: input.path,
    cfRay: input.cfRay,
    ip: input.ip,
    error: toErrorDetails(input.error)
  });
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ serialization: 'failed' });
  }
}

function toErrorDetails(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    const base: Record<string, unknown> = { name: error.name, message: error.message, stack: error.stack };
    // D1Error expõe causeDetails com o erro original do runtime — inclui para diagnóstico.
    const cause = (error as Record<string, unknown>).causeDetails;
    if (cause && typeof cause === 'object') base.causeDetails = cause;
    return base;
  }
  return { value: String(error) };
}

