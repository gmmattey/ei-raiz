import type { Env } from '../types/env';
import { ok, fail, readJson } from './http';
import { buildEntityId, generateOpaqueToken, hashPassword, hashToken, verifyPassword } from './auth_crypto';
import { d1 } from './d1';
import { recordOperationalEvent } from './operational_events_service';
import { findUserByCpfOrEmail, findUserByIdentifier, incrementFailedLogin, resetFailedLogin } from '../repositories/auth_user_repository';
import { registerUserWithPrimaryPortfolioAndSession, createSession, findSessionStateByTokenHash, revokeSessionByTokenHash } from '../repositories/auth_session_repository';

const AUTH_COOKIE_NAME = 'esquilo_session';
const LOCKOUT_MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const SHORT_SESSION_HOURS = 12;
const REMEMBER_SESSION_DAYS = 30;

export async function registerUser(request: Request, env: Env): Promise<Response> {
  const payload = await readJson<Record<string, unknown>>(request).catch((): Record<string, unknown> => ({}));
  const cpf = normalizeCpf(payload.cpf);
  const email = normalizeEmail(payload.email);
  const password = stringValue(payload.password);
  const confirmPassword = stringValue(payload.confirmPassword);
  const displayName = stringValue(payload.displayName);
  const rememberDevice = Boolean(payload.rememberDevice);

  if (cpf.length !== 11) return fail(env.API_VERSION, 'invalid_cpf', 'CPF inválido.', 400);
  if (!looksLikeEmail(email)) return fail(env.API_VERSION, 'invalid_email', 'E-mail invâvalido.', 400);
  if (password.length < 8) return fail(env.API_VERSION, 'weak_password', 'A senha deve ter pelo menos 8 caracteres.', 400);
  if (password !== confirmPassword) return fail(env.API_VERSION, 'password_mismatch', 'As senhas nao conferem.', 400);

  const existing = await findUserByCpfOrEmail(env, cpf, email);
  if (existing?.cpf === cpf) return fail(env.API_VERSION, 'cpf_in_use', 'CPF já cadastrado.', 409);
  if (existing?.email === email) return fail(env.API_VERSION, 'email_in_use', 'E-mail já cadastrado.', 409);

  const userId = buildEntityId('usr');
  const portfolioId = buildEntityId('pfl');
  const sessionId = buildEntityId('ses');
  const sessionToken = generateOpaqueToken();
  const passwordHash = await hashPassword(password);
  const sessionTokenHash = await hashToken(sessionToken);

  await registerUserWithPrimaryPortfolioAndSession(env, {
    userId,
    cpf,
    email,
    passwordHash,
    displayName,
    portfolioId,
    sessionId,
    sessionTokenHash,
    rememberDevice,
    deviceFingerprint: getDeviceFingerprint(request),
    userAgent: request.headers.get('user-agent') || '',
    ipAddress: request.headers.get('CF-Connecting-IP') || '',
    sessionExpiresAt: buildFutureIso(rememberDevice ? REMEMBER_SESSION_DAYS * 24 * 60 : SHORT_SESSION_HOURS * 60)
  });

  await recordOperationalEvent(env, {
    userId,
    portfolioId,
    eventType: 'auth_register',
    status: 'ok',
    message: 'Usuario registrado.',
    details: { rememberDevice }
  });

  const response = ok(env.API_VERSION, {
    user: { id: userId, cpf, email, displayName, emailVerified: false },
    portfolio: { id: portfolioId, isPrimary: true },
    session: { id: sessionId, rememberDevice, lockoutPolicy: { maxFailedAttempts: LOCKOUT_MAX_ATTEMPTS, lockMinutes: LOCKOUT_MINUTES } },
    nextStep: '/app/onboarding'
  }, undefined, 201);
  response.headers.append('Set-Cookie', buildSessionCookie(sessionToken, rememberDevice, env));
  return response;
}

export async function loginUser(request: Request, env: Env): Promise<Response> {
  const payload = await readJson<Record<string, unknown>>(request).catch((): Record<string, unknown> => ({}));
  const identifier = normalizeIdentifier(payload.identifier);
  const password = stringValue(payload.password);
  const rememberDevice = Boolean(payload.rememberDevice);

  if (!identifier) return fail(env.API_VERSION, 'missing_identifier', 'Informe CPF ou e-mail.', 400);
  if (!password) return fail(env.API_VERSION, 'missing_password', 'Informe a senha.', 400);

  const user = await findUserByIdentifier(env, identifier);
  if (!user) return fail(env.API_VERSION, 'invalid_credentials', 'CPF, e-mail ou senha invâvalidos.', 401);
  if (user.status === 'DISABLED') return fail(env.API_VERSION, 'account_disabled', 'Conta indisponível.', 403);

  if (user.login_locked_until && !isLocked(user.login_locked_until)) {
    await resetFailedLogin(env, user.id);
    user.failed_login_attempts = 0;
    user.login_locked_until = null;
  }
  if (isLocked(user.login_locked_until)) {
    return fail(env.API_VERSION, 'account_locked', 'Acesso temporariamente bloqueado. Tente novamente mais tarde.', 423);
  }

  const passwordOk = await verifyPassword(user.password_hash, password);
  if (!passwordOk) {
    const nextLockUntil = Number(user.failed_login_attempts || 0) + 1 >= LOCKOUT_MAX_ATTEMPTS ? buildFutureIso(LOCKOUT_MINUTES) : null;
    await incrementFailedLogin(env, user, nextLockUntil);
    return fail(env.API_VERSION, 'invalid_credentials', 'CPF, e-mail ou senha invâvalidos.', 401);
  }

  await resetFailedLogin(env, user.id);
  const sessionId = buildEntityId('ses');
  const sessionToken = generateOpaqueToken();
  const sessionTokenHash = await hashToken(sessionToken);
  const sessionState = await findPrimaryPortfolioAndContextState(env, user.id);

  await createSession(env, {
    sessionId,
    userId: user.id,
    sessionTokenHash,
    rememberDevice,
    deviceFingerprint: getDeviceFingerprint(request),
    userAgent: request.headers.get('user-agent') || '',
    ipAddress: request.headers.get('CF-Connecting-IP') || '',
    sessionExpiresAt: buildFutureIso(rememberDevice ? REMEMBER_SESSION_DAYS * 24 * 60 : SHORT_SESSION_HOURS * 60)
  });

  await recordOperationalEvent(env, {
    userId: user.id,
    portfolioId: sessionState.portfolioId || null,
    eventType: 'auth_login',
    status: 'ok',
    message: 'Login realizado.',
    details: { rememberDevice }
  });

  const response = ok(env.API_VERSION, {
    authenticated: true,
    userId: user.id,
    portfolioId: sessionState.portfolioId,
    rememberDevice,
    emailVerified: Boolean(user.email_verified_at),
    nextStep: sessionState.hasContext ? '/app/home' : '/app/onboarding',
    lockoutPolicy: { maxFailedAttempts: LOCKOUT_MAX_ATTEMPTS, lockMinutes: LOCKOUT_MINUTES }
  });
  response.headers.append('Set-Cookie', buildSessionCookie(sessionToken, rememberDevice, env));
  return response;
}

export async function getSession(request: Request, env: Env): Promise<Response> {
  const token = readCookie(request.headers.get('cookie') || '', AUTH_COOKIE_NAME);
  if (!token) return ok(env.API_VERSION, { authenticated: false, nextStep: '/login' });

  const tokenHash = await hashToken(token);
  const session = await findSessionStateByTokenHash(env, tokenHash);
  if (!session || session.revoked_at || isExpired(session.expires_at)) {
    if (token) await revokeSessionByTokenHash(env, tokenHash, 'expired');
    const response = ok(env.API_VERSION, { authenticated: false, nextStep: '/login' });
    response.headers.append('Set-Cookie', clearSessionCookie(env));
    return response;
  }

  return ok(env.API_VERSION, {
    authenticated: true,
    userId: session.user_id,
    portfolioId: session.portfolio_id,
    emailVerified: Boolean(session.email_verified_at),
    nextStep: session.has_context ? '/app/home' : '/app/onboarding'
  });
}

export async function logoutUser(request: Request, env: Env): Promise<Response> {
  const token = readCookie(request.headers.get('cookie') || '', AUTH_COOKIE_NAME);
  if (token) {
    const tokenHash = await hashToken(token);
    const session = await findSessionStateByTokenHash(env, tokenHash);
    await revokeSessionByTokenHash(env, tokenHash, 'logout');
    await recordOperationalEvent(env, {
      userId: session?.user_id || null,
      portfolioId: session?.portfolio_id || null,
      eventType: 'auth_logout',
      status: 'ok',
      message: 'Logout realizado.'
    });
  }

  const response = ok(env.API_VERSION, { authenticated: false, status: 'logged_out', nextStep: '/login' });
  response.headers.append('Set-Cookie', clearSessionCookie(env));
  return response;
}

function stringValue(value: unknown): string { return typeof value === 'string' ? value.trim() : ''; }
function normalizeCpf(value: unknown): string { return stringValue(value).replace(/\D+/g, ''); }
function normalizeEmail(value: unknown): string { return stringValue(value).toLowerCase(); }
function normalizeIdentifier(value: unknown): string {
  const raw = stringValue(value);
  const cpf = raw.replace(/\D+/g, '');
  return cpf.length === 11 ? cpf : raw.toLowerCase();
}
function looksLikeEmail(value: string): boolean { return value.includes('@') && value.includes('.'); }
function isLocked(lockUntil: string | null): boolean { return Boolean(lockUntil && Date.parse(lockUntil) > Date.now()); }
function isExpired(expiresAt: string): boolean { return Date.parse(expiresAt) <= Date.now(); }
function buildFutureIso(minutes: number): string { return new Date(Date.now() + minutes * 60 * 1000).toISOString(); }
function getDeviceFingerprint(request: Request): string { return request.headers.get('cf-ray') || request.headers.get('x-device-fingerprint') || ''; }
function buildSessionCookie(token: string, rememberDevice: boolean, env: Env): string {
  const maxAge = rememberDevice ? REMEMBER_SESSION_DAYS * 24 * 60 * 60 : SHORT_SESSION_HOURS * 60 * 60;
  const secure = env.APP_ENV === 'local' ? '' : '; Secure';
  return `${AUTH_COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax${secure}; Max-Age=${maxAge}`;
}
function clearSessionCookie(env: Env): string {
  const secure = env.APP_ENV === 'local' ? '' : '; Secure';
  return `${AUTH_COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax${secure}; Max-Age=0`;
}
function readCookie(cookieHeader: string, cookieName: string): string {
  const prefix = `${cookieName}=`;
  const match = cookieHeader.split(';').map((item) => item.trim()).find((item) => item.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : '';
}
async function findPrimaryPortfolioAndContextState(env: Env, userId: string): Promise<{ portfolioId: string; hasContext: boolean }> {
  const row = await d1(env).first<{ portfolio_id: string | null; has_context: number }>(
    `SELECT p.id AS portfolio_id, CASE WHEN c.user_id IS NULL THEN 0 ELSE 1 END AS has_context
     FROM portfolios p
     LEFT JOIN user_financial_context c ON c.user_id = p.user_id
     WHERE p.user_id = ? AND p.is_primary = 1
     LIMIT 1`,
    [userId]
  );
  return { portfolioId: row?.portfolio_id || '', hasContext: Boolean(row?.has_context) };
}
