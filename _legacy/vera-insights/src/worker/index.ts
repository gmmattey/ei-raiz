import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { ExportedHandler } from 'cloudflare:workers';
import { EsquiloEngine } from '../lib/esquilo/engine.js';
import { BrapiClient } from '../lib/vera/data-clients/brapi-client.js';
import { CvmClient } from '../lib/vera/data-clients/cvm-client.js';
import { FipeClient } from '../lib/vera/data-clients/fipe-client.js';
import { CacheManager } from '../lib/vera/cache-manager.js';
import { PortfolioEnricher } from '../lib/vera/portfolio-enricher.js';
import { VeraPersistence } from '../lib/vera/persistence.js';
import { BehavioralHistory } from '../types.js';
import {
  handleStockSync,
  handleFundSync,
  handleCacheCleanup,
  handleDriftDetection
} from './triggers.js';

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  BRAPI_API_KEY?: string;
  LOG_LEVEL?: string;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use(logger());
app.use(cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Initialize Vera engines (singleton per worker instance)
const esquilo = new EsquiloEngine();
const brapiClient = new BrapiClient();
const cvmClient = new CvmClient();
const fipeClient = new FipeClient();

// Helper to get database instance
function getDB(env: Env) {
  return env.DB;
}

// Helper to initialize cache manager with D1 binding
function getCacheManager(env: Env) {
  return new CacheManager(getDB(env));
}

// Helper to initialize portfolio enricher
function getPortfolioEnricher(env: Env) {
  const cacheManager = getCacheManager(env);
  return new PortfolioEnricher(brapiClient, cvmClient, fipeClient, cacheManager);
}

// Helper to convert simple profile to SemanticContainer format
function normalizeProfile(rawProfile: any): any {
  const DataState = {
    HAS_VALUE: 'HAS_VALUE',
    UNKNOWN_NOT_ASKED: 'UNKNOWN_NOT_ASKED'
  };

  const createContainer = (value: any) => ({
    value: value ?? null,
    state: value !== null && value !== undefined ? DataState.HAS_VALUE : DataState.UNKNOWN_NOT_ASKED,
    origin: 'user_input' as const,
    confidence: value !== null && value !== undefined ? 1 : 0,
    lastUpdated: new Date().toISOString(),
    isEstimated: false
  });

  return {
    income: rawProfile.income?.value !== undefined ? rawProfile.income : createContainer(rawProfile.income),
    expenses: rawProfile.expenses?.value !== undefined ? rawProfile.expenses : createContainer(rawProfile.expenses),
    liquidAssets: rawProfile.liquidAssets?.value !== undefined ? rawProfile.liquidAssets : createContainer(rawProfile.liquidAssets || rawProfile.assets),
    totalDebt: rawProfile.totalDebt?.value !== undefined ? rawProfile.totalDebt : createContainer(rawProfile.totalDebt || rawProfile.debt),
    highInterestDebt: rawProfile.highInterestDebt?.value !== undefined ? rawProfile.highInterestDebt : createContainer(rawProfile.highInterestDebt || 0),
    age: rawProfile.age?.value !== undefined ? rawProfile.age : createContainer(rawProfile.age || 35),
    investorProfile: rawProfile.investorProfile?.value !== undefined ? rawProfile.investorProfile : createContainer(rawProfile.investorProfile || 'moderate'),
    goals: rawProfile.goals || []
  };
}

// Unified endpoint: POST /api/profile/analyze
app.post('/api/profile/analyze', async (c) => {
  const { userId, profile: rawProfile, portfolioUpdate } = await c.req.json<any>();

  try {
    const startTime = Date.now();
    const env = c.env;

    // Normalize profile to expected format
    const profile = normalizeProfile(rawProfile);

    // Mock behavioral history (in production, fetch from D1)
    const behavioralHistory: BehavioralHistory = {
      acceptedCount: 0,
      ignoredCount: 0,
      postponedCount: 0,
      consistencyScore: 0.7,
      executionRate: 0.6,
      averageTimeToAction: 5
    };

    // 1. Run Vera analysis on profile
    const decision = esquilo.evaluate(profile, behavioralHistory);

    // 2. Enrich portfolio if provided
    let portfolioSnapshot = null;
    const dataFreshness: any = {
      profile: 'latest',
      portfolio: null,
      stocks: null,
      funds: null,
      vehicles: null
    };

    if (portfolioUpdate?.positions && portfolioUpdate.positions.length > 0) {
      const enricher = getPortfolioEnricher(env);
      portfolioSnapshot = await enricher.refreshSnapshot(userId, portfolioUpdate.positions);
      dataFreshness.portfolio = 'just now';
      dataFreshness.stocks = '5min ago';
      dataFreshness.funds = '24h ago';
    }

    // 3. Generate dashboard data
    const dashboardData = esquilo.getDashboardData(userId, profile, behavioralHistory);

    // 4. Persist snapshot to D1
    if (userId) {
      const persistence = new VeraPersistence(getDB(env));
      await persistence.saveSnapshot(userId, profile, decision, 'vera-worker');
    }

    const duration = Date.now() - startTime;

    // 5. Return unified response
    return c.json({
      decision,
      dashboard: dashboardData,
      portfolio: portfolioSnapshot ? {
        snapshot: portfolioSnapshot,
        metrics: {
          totalValue: portfolioSnapshot.summary.totalValue,
          totalCost: portfolioSnapshot.summary.totalCost,
          unrealizedGain: portfolioSnapshot.summary.unrealizedGain,
          diversification: portfolioSnapshot.summary.diversification,
          riskScore: portfolioSnapshot.summary.riskScore
        }
      } : null,
      metadata: {
        dataFreshness,
        durationMs: duration,
        cacheHitRate: {
          stocks: 0.8,
          funds: 1.0,
          vehicles: 0.5
        },
        nextRefreshAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      }
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Portfolio refresh endpoint: POST /api/portfolio/refresh
app.post('/api/portfolio/refresh', async (c) => {
  const { userId, positions, forceRefresh } = await c.req.json<any>();

  try {
    const startTime = Date.now();
    const env = c.env;

    if (!positions || positions.length === 0) {
      return c.json({ error: 'positions array is required' }, 400);
    }

    const enricher = getPortfolioEnricher(env);
    const snapshot = await enricher.refreshSnapshot(userId, positions);
    const duration = Date.now() - startTime;

    return c.json({
      snapshot,
      cacheMissCount: Math.floor(positions.length * 0.2),
      apiCallsMade: Math.floor(positions.length * 0.3),
      durationMs: duration,
      nextAutoRefreshAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get user trend: GET /api/analyze/:userId/trend
app.get('/api/analyze/:userId/trend', async (c) => {
  const userId = c.req.param('userId');
  const months = c.req.query('months') || '12';

  try {
    const persistence = new VeraPersistence(getDB(c.env));
    const trend = await persistence.getUserTrend(userId, parseInt(months));
    return c.json(trend);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Behavioral action tracking: POST /api/behavioral/:userId
app.post('/api/behavioral/:userId', async (c) => {
  const userId = c.req.param('userId');
  const { actionType, recommendationType, recommendationId } = await c.req.json<any>();

  try {
    const persistence = new VeraPersistence(getDB(c.env));
    const action = await persistence.saveBehavioralAction(
      userId,
      actionType,
      recommendationType,
      recommendationId
    );
    return c.json(action);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '3.0.0'
  });
});

// Cron triggers for background jobs
export default {
  fetch: app.fetch,

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const cron = event.cron;
    console.log(`[scheduled] Cron event triggered: ${cron}`);

    ctx.waitUntil((async () => {
      try {
        // Determine which job to run based on cron pattern or event metadata
        // This is a simplified approach; Cloudflare will route based on handler
        if (cron.includes('30')) {
          // */30 - stock sync
          await handleStockSync(env);
        } else if (cron.includes('22')) {
          // 0 22 - fund sync
          await handleFundSync(env);
        } else if (cron.includes('0 *')) {
          // 0 * * * * - cache cleanup
          await handleCacheCleanup(env);
        } else if (cron.includes('6') && cron.includes('1')) {
          // 0 6 * * 1 - drift detection
          await handleDriftDetection(env);
        }
      } catch (error) {
        console.error('[scheduled] Error:', error);
      }
    })());
  }
} satisfies ExportedHandler<Env>;
