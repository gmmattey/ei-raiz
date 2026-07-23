import { describe, it, expect, beforeAll } from 'vitest';
import worker from '../index';
import { hashPassword } from '../lib/auth_crypto';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Constrói um env mínimo para testes unitários.
 * O DB padrão simula prepared statements sem retornar dados — suficiente para
 * cobrir os caminhos que fazem auth check antes de qualquer query.
 */
function buildEnv(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const mockDB = {
    prepare: (_sql: string) => ({
      bind: (..._args: unknown[]) => ({
        first: async () => null,
        all: async () => ({ results: [] }),
        run: async () => {},
      }),
      first: async () => null,
    }),
    batch: async () => [],
  };
  return {
    DB: mockDB,
    APP_ENV: 'local',
    API_VERSION: 'v1',
    ASSETS: undefined,
    CORS_ALLOWED_ORIGINS: 'http://localhost:5173',
    ...overrides,
  };
}

function req(url: string, init?: RequestInit): Request {
  return new Request(`http://localhost${url}`, init);
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

describe('Health route', () => {
  it('retorna 200 quando DB responde', async () => {
    const env = buildEnv({
      DB: {
        prepare: () => ({
          bind: () => ({ first: async () => ({ ok: 1 }), all: async () => ({ results: [] }) }),
          first: async () => ({ ok: 1 }),
        }),
      },
    });
    const res = await worker.fetch(req('/v1/health'), env as any);
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe('ok');
  });

  it('retorna 500 quando DB falha', async () => {
    const env = buildEnv({
      DB: {
        prepare: () => ({
          first: async () => { throw new Error('D1 unavailable'); },
        }),
      },
    });
    const res = await worker.fetch(req('/v1/health'), env as any);
    expect(res.status).toBe(500);
    const body = (await res.json()) as any;
    expect(body.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Proteção de autenticação: rotas protegidas devem retornar 401 sem cookie
// ---------------------------------------------------------------------------

describe('Auth enforcement — rotas protegidas sem cookie retornam 401', () => {
  const protectedRoutes = [
    'GET /v1/dashboard/home',
    'GET /v1/portfolio',
    'GET /v1/analysis',
    'GET /v1/history/snapshots',
    'GET /v1/history/timeline',
    'GET /v1/history/imports',
    'GET /v1/profile/context',
    'GET /v1/onboarding/portfolio-entry',
    'GET /v1/ops/events',
  ] as const;

  for (const route of protectedRoutes) {
    const [method, path] = route.split(' ') as [string, string];
    it(`${method} ${path}`, async () => {
      const env = buildEnv();
      const res = await worker.fetch(req(path, { method }), env as any);
      expect(res.status).toBe(401);
      const body = (await res.json()) as any;
      expect(body.ok).toBe(false);
      expect(body.error.code).toBe('unauthorized');
    });
  }
});

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------

describe('CORS — preflight OPTIONS', () => {
  it('origem permitida recebe 204 com headers CORS', async () => {
    const env = buildEnv();
    const res = await worker.fetch(
      req('/v1/health', { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173' } }),
      env as any
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173');
    expect(res.headers.get('Access-Control-Allow-Credentials')).toBe('true');
    expect(res.headers.get('Access-Control-Allow-Methods')).toBeTruthy();
  });

  it('origem desconhecida recebe 204 SEM headers CORS', async () => {
    const env = buildEnv();
    const res = await worker.fetch(
      req('/v1/health', { method: 'OPTIONS', headers: { Origin: 'https://attacker.example.com' } }),
      env as any
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('CORS_ALLOWED_ORIGINS não configurado recebe 204 sem headers CORS', async () => {
    const env = buildEnv({ CORS_ALLOWED_ORIGINS: undefined });
    const res = await worker.fetch(
      req('/v1/health', { method: 'OPTIONS', headers: { Origin: 'http://localhost:5173' } }),
      env as any
    );
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});

describe('CORS — respostas de API incluem header para origem permitida', () => {
  it('GET /v1/dashboard/home sem cookie retorna 401 com CORS header', async () => {
    const env = buildEnv();
    const res = await worker.fetch(
      req('/v1/dashboard/home', { headers: { Origin: 'http://localhost:5173' } }),
      env as any
    );
    expect(res.status).toBe(401);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173');
  });

  it('origem desconhecida não recebe CORS header na resposta', async () => {
    const env = buildEnv();
    const res = await worker.fetch(
      req('/v1/dashboard/home', { headers: { Origin: 'https://evil.example.com' } }),
      env as any
    );
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Rotas desconhecidas
// ---------------------------------------------------------------------------

describe('Rotas desconhecidas', () => {
  it('GET /v1/rota-inexistente retorna 404 com código route_not_found', async () => {
    const env = buildEnv();
    const res = await worker.fetch(req('/v1/rota-inexistente'), env as any);
    expect(res.status).toBe(404);
    const body = (await res.json()) as any;
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('route_not_found');
  });
});

// ---------------------------------------------------------------------------
// Login flow
// ---------------------------------------------------------------------------

describe('Login flow', () => {
  let PASSWORD_HASH = '';

  beforeAll(async () => {
    PASSWORD_HASH = await hashPassword('Senha123!');
  });

  /**
   * Mock DB que simula o fluxo completo de login bem-sucedido:
   * 1. findUserByIdentifier → retorna usuário ativo com hash de senha
   * 2. resetFailedLogin → run() bem-sucedido
   * 3. findPrimaryPortfolioAndContextState → retorna portfolio
   * 4. createSession → run() bem-sucedido
   * 5. recordOperationalEvent → run() bem-sucedido
   */
  function buildLoginDB(passwordHash: string) {
    let firstCallCount = 0;
    return {
      prepare: (sql: string) => ({
        bind: (..._args: unknown[]) => ({
          first: async () => {
            firstCallCount++;
            if (firstCallCount === 1) {
              // findUserByIdentifier
              return {
                id: 'usr_test001',
                cpf: '07870708017',
                email: 'teste@esquilo.dev',
                password_hash: passwordHash,
                display_name: 'Teste',
                email_verified_at: null,
                failed_login_attempts: 0,
                login_locked_until: null,
                status: 'ACTIVE',
              };
            }
            if (firstCallCount === 2) {
              // findPrimaryPortfolioAndContextState
              return { portfolio_id: 'pfl_test001', has_context: 1 };
            }
            return null;
          },
          all: async () => ({ results: [] }),
          run: async () => {},
        }),
        first: async () => null,
      }),
      batch: async () => [],
    };
  }

  it('retorna 200 com cookie de sessão para credenciais válidas', async () => {
    const env = buildEnv({ DB: buildLoginDB(PASSWORD_HASH) });
    const res = await worker.fetch(
      req('/v1/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifier: '07870708017', password: 'Senha123!', rememberDevice: false }),
      }),
      env as any
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.ok).toBe(true);
    expect(body.data.authenticated).toBe(true);
    expect(body.data.userId).toBe('usr_test001');
    const cookie = res.headers.get('set-cookie');
    expect(cookie).toContain('esquilo_session=');
    expect(cookie).toContain('HttpOnly');
  });

  it('retorna 401 para senha errada', async () => {
    const env = buildEnv({ DB: buildLoginDB(PASSWORD_HASH) });
    const res = await worker.fetch(
      req('/v1/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifier: '07870708017', password: 'SenhaErrada!' }),
      }),
      env as any
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as any;
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('invalid_credentials');
  });

  it('retorna 400 quando identifier está vazio', async () => {
    const env = buildEnv();
    const res = await worker.fetch(
      req('/v1/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifier: '', password: 'Senha123!' }),
      }),
      env as any
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as any;
    expect(body.error.code).toBe('missing_identifier');
  });

  it('retorna 401 quando usuário não existe no DB', async () => {
    // DB retorna null para findUserByIdentifier → usuário não encontrado
    const env = buildEnv();
    const res = await worker.fetch(
      req('/v1/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifier: 'naoexiste@teste.com', password: 'Senha123!' }),
      }),
      env as any
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as any;
    expect(body.error.code).toBe('invalid_credentials');
  });

  it('retorna 500 quando DB falha durante login', async () => {
    const env = buildEnv({
      DB: {
        prepare: (_sql: string) => ({
          bind: (..._args: unknown[]) => ({
            first: async () => { throw new Error('D1 simulated failure'); },
            run: async () => {},
          }),
          first: async () => { throw new Error('D1 simulated failure'); },
        }),
        batch: async () => [],
      },
    });
    const res = await worker.fetch(
      req('/v1/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ identifier: '07870708017', password: 'Senha123!' }),
      }),
      env as any
    );
    expect(res.status).toBe(500);
    const body = (await res.json()) as any;
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('internal_error');
    // O reason fica em error.details.reason (estrutura do fail())
    expect(body.error.details.reason).toContain('Falha ao executar query');
  });
});
