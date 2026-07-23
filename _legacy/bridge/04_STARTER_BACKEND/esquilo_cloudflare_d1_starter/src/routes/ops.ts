import type { Env } from '../types/env';
import { ok, fail } from '../lib/http';
import { hashToken } from '../lib/auth_crypto';
import { findSessionStateByTokenHash } from '../repositories/auth_session_repository';
import { getOperationalEventsForUser } from '../lib/operational_events_service';

const AUTH_COOKIE_NAME = 'esquilo_session';

export async function getOperationalEvents(request: Request, env: Env): Promise<Response> {
  const token = readCookie(request.headers.get('cookie') || '', AUTH_COOKIE_NAME);
  if (!token) return fail(env.API_VERSION, 'unauthorized', 'Sessao nao encontrada.', 401);

  const tokenHash = await hashToken(token);
  const session = await findSessionStateByTokenHash(env, tokenHash);
  if (!session || session.revoked_at) return fail(env.API_VERSION, 'unauthorized', 'Sessao invalida.', 401);

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get('limit') || '50') || 50, 200);
  const portfolioId = url.searchParams.get('portfolioId');

  const events = await getOperationalEventsForUser(env, {
    userId: session.user_id,
    portfolioId: portfolioId || null,
    limit
  });

  return ok(env.API_VERSION, { userId: session.user_id, portfolioId: portfolioId || session.portfolio_id || null, events });
}

function readCookie(cookieHeader: string, cookieName: string): string {
  const prefix = `${cookieName}=`;
  const match = cookieHeader
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : '';
}

