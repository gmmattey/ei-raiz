import type { Env } from '../types/env';
import { d1 } from '../lib/d1';

export async function findRecoveryTargetByIdentifier(env: Env, identifier: string): Promise<{ id: string; email: string } | null> {
  return await d1(env).first<{ id: string; email: string }>(
    `SELECT id, email
     FROM users
     WHERE cpf = ? OR email = ?
     LIMIT 1`,
    [identifier, identifier]
  );
}

export async function createRecoveryRequest(env: Env, requestId: string, userId: string, tokenHash: string, expiresAt: string, provider: string, status: string): Promise<void> {
  await d1(env).run(
    `INSERT INTO auth_recovery_requests (
      id, user_id, channel, status, token_hash, delivery_provider, expires_at, created_at
    ) VALUES (?, ?, 'EMAIL', ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [requestId, userId, status, tokenHash, provider, expiresAt]
  );
}

export async function updateRecoveryRequestStatus(env: Env, requestId: string, status: string): Promise<void> {
  await d1(env).run(
    `UPDATE auth_recovery_requests
     SET status = ?
     WHERE id = ?`,
    [status, requestId]
  );
}
