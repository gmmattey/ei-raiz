import { expect, test } from '@playwright/test';
import worker from '../src/index';
import { signToken } from '../src/auth';
import { TEST_JWT_SECRET } from './helpers';

type AnalyzeScenario = {
  portfolioSummary?: { total_balance: number; total_invested: number };
  byClass?: Array<{ class: string; total_balance: number }>;
  byInstitution?: Array<{ institution: string; institution_name: string | null; total_balance: number }>;
  topAssets?: Array<{ name: string; class: string; institution: string; balance: number }>;
  recentSnapshots?: Array<{ month: string; total: number }>;
  asset?: Record<string, unknown> | null;
  portfolioTotal?: number;
};

function createFakeDb(scenario: AnalyzeScenario = {}) {
  const normalize = (sql: string) => sql.toLowerCase().replace(/\s+/g, ' ').trim();

  return {
    prepare(sql: string) {
      const query = normalize(sql);

      return {
        bind() {
          return {
            async first<T>() {
              if (query.includes('from vw_portfolio_summary') && query.includes('total_invested')) {
                return (scenario.portfolioSummary ?? null) as T | null;
              }

              if (query.includes('from vw_portfolio_summary')) {
                return ({ total_balance: scenario.portfolioTotal ?? scenario.portfolioSummary?.total_balance ?? 0 } as T) ?? null;
              }

              if (query.includes('from assets a left join quotes_cache q on q.ticker = a.ticker')) {
                return scenario.asset as T | null;
              }

              return null;
            },
            async all<T>() {
              if (query.includes('vw_allocation_by_class')) {
                return { results: scenario.byClass ?? [] as T[] };
              }

              if (query.includes('vw_allocation_by_institution')) {
                return { results: scenario.byInstitution ?? [] as T[] };
              }

              if (query.includes('order by balance desc limit 5')) {
                return { results: scenario.topAssets ?? [] as T[] };
              }

              if (query.includes('from snapshots')) {
                return { results: scenario.recentSnapshots ?? [] as T[] };
              }

              return { results: [] as T[] };
            },
            async run() {
              return { success: true };
            },
          };
        },
      };
    },
  } as unknown as D1Database;
}

async function invoke(
  path: string,
  init: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
  env: Partial<{ DB: D1Database; AI: { run: (model: string, opts: { messages: { role: string; content: string }[] }) => Promise<{ response?: string }> }; JWT_SECRET: string }> = {}
) {
  const token = await signToken(1, 'qa@quanto.local', TEST_JWT_SECRET);
  const headers = new Headers(init.headers ?? {});

  if (init.body !== undefined && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  headers.set('authorization', `Bearer ${token.token}`);

  const body = init.body === undefined
    ? undefined
    : typeof init.body === 'string'
      ? init.body
      : JSON.stringify(init.body);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      method: init.method ?? 'GET',
      headers,
      body,
    }),
    {
      DB: env.DB ?? createFakeDb(),
      JWT_SECRET: env.JWT_SECRET ?? TEST_JWT_SECRET,
      AI: env.AI,
      BRAPI_BASE_URL: 'https://brapi.dev/api',
      BRAPI_TOKEN: '',
    } as any
  );
}

test('POST /api/import/analyze valida entrada e devolve sugestoes com AI mock', async () => {
  const noAiRes = await invoke('/api/import/analyze', {
    method: 'POST',
    body: { items: [{ name: 'Fundo sem AI' }] },
  });
  expect(noAiRes.status).toBe(503);

  const emptyItemsRes = await invoke('/api/import/analyze', {
    method: 'POST',
    body: { items: [] },
  }, {
    AI: {
      run: async () => ({ response: '[]' }),
    },
  });
  expect(emptyItemsRes.status).toBe(400);

  const analyzeRes = await invoke('/api/import/analyze', {
    method: 'POST',
    body: {
      items: [
        { name: 'Fundo XP QA', ticker: 'XPQA', institution: 'XP' },
      ],
    },
  }, {
    AI: {
      run: async () => ({
        response: 'resultado bruto\n[{"index":1,"class":"FUNDO","confidence":0.88}]\nfinal',
      }),
    },
  });

  expect(analyzeRes.ok).toBeTruthy();
  const analyzeJson = await analyzeRes.json();
  expect(analyzeJson.suggestions).toEqual([
    { index: 0, class: 'FUNDO', confidence: 0.88 },
  ]);
});

test('POST /api/ai/analyze retorna observacoes para portfolio e ativo', async () => {
  const aiMock = {
    run: async () => ({
      response: '{"observations":[{"tone":"positive","text":"Carteira consistente e bem distribuida."}]}',
    }),
  };

  const portfolioRes = await invoke('/api/ai/analyze', {
    method: 'POST',
    body: { context: 'portfolio' },
  }, {
    DB: createFakeDb({
      portfolioSummary: { total_balance: 2400, total_invested: 1800 },
      byClass: [
        { class: 'ACAO', total_balance: 1400 },
        { class: 'FUNDO', total_balance: 1000 },
      ],
      byInstitution: [
        { institution: 'XP', institution_name: null, total_balance: 1400 },
        { institution: 'ITAU', institution_name: null, total_balance: 1000 },
      ],
      topAssets: [
        { name: 'PETR4', class: 'ACAO', institution: 'XP', balance: 1400 },
      ],
      recentSnapshots: [
        { month: '2026-06', total: 2400 },
        { month: '2026-05', total: 2300 },
      ],
    }),
    AI: aiMock,
  });

  expect(portfolioRes.ok).toBeTruthy();
  const portfolioJson = await portfolioRes.json();
  expect(portfolioJson.disclaimer).toContain('não constitui recomendação');
  expect(portfolioJson.observations[0].text).toContain('Carteira consistente');

  const badAssetContextRes = await invoke('/api/ai/analyze', {
    method: 'POST',
    body: { context: 'asset' },
  }, {
    AI: aiMock,
  });
  expect(badAssetContextRes.status).toBe(400);

  const assetRes = await invoke('/api/ai/analyze', {
    method: 'POST',
    body: { context: 'asset', asset_id: 42 },
  }, {
    DB: createFakeDb({
      asset: {
        name: 'PETR4 · Petrobras QA',
        class: 'ACAO',
        institution: 'XP',
        ticker: 'PETR4',
        qty: 10,
        price: 38.12,
        balance: 381.2,
        invested: 300,
        balance_updated_at: '2026-06-16T00:00:00.000Z',
        quote_source: 'BRAPI',
      },
      portfolioTotal: 2400,
    }),
    AI: aiMock,
  });

  expect(assetRes.ok).toBeTruthy();
  const assetJson = await assetRes.json();
  expect(assetJson.observations).toHaveLength(1);
  expect(assetJson.observations[0].tone).toBe('positive');
  expect(assetJson.observations[0].text).toContain('Carteira consistente');
});

test('Rotas protegidas falham explicitamente quando JWT_SECRET não está configurado', async () => {
  const res = await invoke('/api/portfolio', {}, {
    JWT_SECRET: '',
  });

  expect(res.status).toBe(500);
  const json = await res.json();
  expect(json.error).toContain('JWT_SECRET');
});
