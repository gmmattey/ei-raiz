import type { Env } from '../types/env';
import { d1 } from '../lib/d1';

export interface RegisterRecordInput {
  userId: string;
  cpf: string;
  email: string;
  passwordHash: string;
  displayName: string;
  portfolioId: string;
  sessionId: string;
  sessionTokenHash: string;
  rememberDevice: boolean;
  deviceFingerprint: string;
  userAgent: string;
  ipAddress: string;
  sessionExpiresAt: string;
}

export interface SessionInsertInput {
  sessionId: string;
  userId: string;
  sessionTokenHash: string;
  rememberDevice: boolean;
  deviceFingerprint: string;
  userAgent: string;
  ipAddress: string;
  sessionExpiresAt: string;
}

export interface SessionStateRow {
  session_id: string;
  user_id: string;
  remember_device: number;
  expires_at: string;
  revoked_at: string | null;
  email_verified_at: string | null;
  portfolio_id: string | null;
  has_context: number;
}

export async function registerUserWithPrimaryPortfolioAndSession(env: Env, input: RegisterRecordInput): Promise<void> {
  await d1(env).batch([
    {
      sql: `INSERT INTO users (
        id, cpf, email, password_hash, display_name, email_verification_sent_at, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      params: [input.userId, input.cpf, input.email, input.passwordHash, input.displayName || null]
    },
    {
      sql: `INSERT INTO portfolios (
        id, user_id, name, is_primary, created_at, updated_at
      ) VALUES (?, ?, 'Carteira Principal', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      params: [input.portfolioId, input.userId]
    },
    {
      sql: `INSERT INTO auth_sessions (
        id, user_id, session_token_hash, device_fingerprint, user_agent, ip_address, remember_device, expires_at, created_at, last_seen_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      params: [
        input.sessionId,
        input.userId,
        input.sessionTokenHash,
        input.deviceFingerprint || null,
        input.userAgent || null,
        input.ipAddress || null,
        input.rememberDevice ? 1 : 0,
        input.sessionExpiresAt
      ]
    }
  ]);
}

export async function createSession(env: Env, input: SessionInsertInput): Promise<void> {
  await d1(env).run(
    `INSERT INTO auth_sessions (
      id, user_id, session_token_hash, device_fingerprint, user_agent, ip_address, remember_device, expires_at, created_at, last_seen_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      input.sessionId,
      input.userId,
      input.sessionTokenHash,
      input.deviceFingerprint || null,
      input.userAgent || null,
      input.ipAddress || null,
      input.rememberDevice ? 1 : 0,
      input.sessionExpiresAt
    ]
  );
}

export async function findSessionStateByTokenHash(env: Env, tokenHash: string): Promise<SessionStateRow | null> {
  return await d1(env).first<SessionStateRow>(
    `SELECT
       s.id AS session_id,
       s.user_id,
       s.remember_device,
       s.expires_at,
       s.revoked_at,
       u.email_verified_at,
       p.id AS portfolio_id,
       CASE
         WHEN c.onboarding_completed_at IS NOT NULL THEN 1
         ELSE 0
       END AS has_context
     FROM auth_sessions s
     JOIN users u ON u.id = s.user_id
     LEFT JOIN portfolios p ON p.user_id = u.id AND p.is_primary = 1
     LEFT JOIN user_financial_context c ON c.user_id = u.id
     WHERE s.session_token_hash = ?
     LIMIT 1`,
    [tokenHash]
  );
}

export async function revokeSessionByTokenHash(env: Env, tokenHash: string, reason: string): Promise<void> {
  await d1(env).run(
    `UPDATE auth_sessions
     SET revoked_at = CURRENT_TIMESTAMP,
         revoke_reason = ?
     WHERE session_token_hash = ?
       AND revoked_at IS NULL`,
    [reason, tokenHash]
  );
}
