import type { Env } from '../types/env';
import { ok, fail, readJson } from './http';
import { buildEntityId, generateOpaqueToken, hashToken } from './auth_crypto';
import { findRecoveryTargetByIdentifier, createRecoveryRequest, updateRecoveryRequestStatus } from '../repositories/auth_recovery_repository';

const RECOVERY_EXPIRY_MINUTES = 30;

export async function recoverUserViaEmailBridge(request: Request, env: Env): Promise<Response> {
  const payload = await readJson<Record<string, unknown>>(request).catch((): Record<string, unknown> => ({}));
  const identifier = normalizeIdentifier(payload.identifier);

  if (!identifier) {
    return fail(env.API_VERSION, 'missing_identifier', 'Informe CPF ou e-mail.', 400);
  }

  const target = await findRecoveryTargetByIdentifier(env, identifier);
  if (!target) {
    return ok(env.API_VERSION, {
      status: 'requested',
      channel: 'email',
      provider: 'apps_script',
      nextStep: '/login'
    });
  }

  if (!env.APPS_SCRIPT_RECOVERY_URL) {
    return fail(env.API_VERSION, 'recovery_unavailable', 'Recuperação temporariamente indisponível. Tente novamente mais tarde.', 503);
  }

  const requestId = buildEntityId('rcv');
  const recoveryToken = generateOpaqueToken();
  const recoveryTokenHash = await hashToken(recoveryToken);
  const expiresAt = buildFutureIso(RECOVERY_EXPIRY_MINUTES);

  await createRecoveryRequest(env, requestId, target.id, recoveryTokenHash, expiresAt, 'APPS_SCRIPT', 'PENDING');

  try {
    const appScriptResponse = await fetch(env.APPS_SCRIPT_RECOVERY_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        secret: env.APPS_SCRIPT_RECOVERY_SECRET || '',
        requestId,
        userId: target.id,
        email: target.email,
        recoveryToken,
        expiresAt
      })
    });

    await updateRecoveryRequestStatus(env, requestId, appScriptResponse.ok ? 'SENT' : 'FAILED');

    if (!appScriptResponse.ok) {
      return fail(env.API_VERSION, 'recovery_unavailable', 'Recuperação temporariamente indisponível. Tente novamente mais tarde.', 503);
    }
  } catch {
    await updateRecoveryRequestStatus(env, requestId, 'FAILED');
    return fail(env.API_VERSION, 'recovery_unavailable', 'Recuperação temporariamente indisponível. Tente novamente mais tarde.', 503);
  }

  return ok(env.API_VERSION, {
    status: 'requested',
    channel: 'email',
    provider: 'apps_script',
    nextStep: '/login'
  });
}

function normalizeIdentifier(value: unknown): string {
  const raw = typeof value === 'string' ? value.trim() : '';
  const cpf = raw.replace(/\D+/g, '');
  return cpf.length === 11 ? cpf : raw.toLowerCase();
}

function buildFutureIso(minutes: number): string {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}
