import { DataSyncJobs } from '../lib/vera/background-jobs.js';
import { BrapiClient } from '../lib/vera/data-clients/brapi-client.js';
import { CvmClient } from '../lib/vera/data-clients/cvm-client.js';
import { FipeClient } from '../lib/vera/data-clients/fipe-client.js';
import { CacheManager } from '../lib/vera/cache-manager.js';
import { PortfolioEnricher } from '../lib/vera/portfolio-enricher.js';

interface TriggerEnv {
  DB: D1Database;
  CACHE: KVNamespace;
}

// Helper to get all active user IDs from D1
async function getActiveUserIds(db: D1Database): Promise<string[]> {
  try {
    const result = await db.prepare(`
      SELECT DISTINCT userId FROM vera_snapshots
      WHERE timestamp > datetime('now', '-30 days')
      ORDER BY timestamp DESC
    `).all();

    return (result.results || []).map((row: any) => row.userId);
  } catch (error) {
    console.error('Error fetching active user IDs:', error);
    return [];
  }
}

// Stock price sync trigger (every 30 min, 9am-6pm Mon-Fri)
export async function handleStockSync(env: TriggerEnv) {
  const startTime = Date.now();
  console.log('[stockSync] Starting stock price synchronization');

  try {
    const brapiClient = new BrapiClient();
    const cvmClient = new CvmClient();
    const fipeClient = new FipeClient();
    const cacheManager = new CacheManager(env.DB);

    const dataSync = new DataSyncJobs(
      brapiClient,
      cvmClient,
      fipeClient,
      new PortfolioEnricher(brapiClient, cvmClient, fipeClient, cacheManager),
      cacheManager,
      env.DB
    );

    const userIds = await getActiveUserIds(env.DB);
    const result = await dataSync.syncStockPrices(userIds);

    const duration = Date.now() - startTime;
    console.log(`[stockSync] Completed in ${duration}ms - Processed: ${result.processed}, Updated: ${result.updated}`);

    // Log to audit table
    await env.DB.prepare(`
      INSERT INTO vera_data_audit (id, type, identifier, fetchedAt, status, durationMs)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      'stock_sync',
      `users:${userIds.length}`,
      new Date().toISOString(),
      'success',
      duration
    ).run();
  } catch (error) {
    console.error('[stockSync] Error:', error);

    await env.DB.prepare(`
      INSERT INTO vera_data_audit (id, type, identifier, fetchedAt, status, errorMessage, durationMs)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      'stock_sync',
      'failed',
      new Date().toISOString(),
      'error',
      String(error),
      Date.now() - startTime
    ).run().catch(e => console.error('Audit log error:', e));
  }
}

// Fund data sync trigger (daily 10pm)
export async function handleFundSync(env: TriggerEnv) {
  const startTime = Date.now();
  console.log('[fundSync] Starting fund data synchronization');

  try {
    const brapiClient = new BrapiClient();
    const cvmClient = new CvmClient();
    const fipeClient = new FipeClient();
    const cacheManager = new CacheManager(env.DB);

    const dataSync = new DataSyncJobs(
      brapiClient,
      cvmClient,
      fipeClient,
      new PortfolioEnricher(brapiClient, cvmClient, fipeClient, cacheManager),
      cacheManager,
      env.DB
    );

    const userIds = await getActiveUserIds(env.DB);
    const result = await dataSync.syncFundData(userIds);

    const duration = Date.now() - startTime;
    console.log(`[fundSync] Completed in ${duration}ms - Processed: ${result.processed}, Updated: ${result.updated}`);

    await env.DB.prepare(`
      INSERT INTO vera_data_audit (id, type, identifier, fetchedAt, status, durationMs)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      'fund_sync',
      `users:${userIds.length}`,
      new Date().toISOString(),
      'success',
      duration
    ).run();
  } catch (error) {
    console.error('[fundSync] Error:', error);
  }
}

// Cache cleanup trigger (hourly)
export async function handleCacheCleanup(env: TriggerEnv) {
  const startTime = Date.now();
  console.log('[cacheCleanup] Starting cache cleanup');

  try {
    const cacheManager = new CacheManager(env.DB);
    const deleted = await cacheManager.cleanupExpiredEntries();

    const duration = Date.now() - startTime;
    console.log(`[cacheCleanup] Removed ${deleted} expired entries in ${duration}ms`);

    await env.DB.prepare(`
      INSERT INTO vera_data_audit (id, type, identifier, fetchedAt, status, durationMs)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      'cache_cleanup',
      `removed:${deleted}`,
      new Date().toISOString(),
      'success',
      duration
    ).run();
  } catch (error) {
    console.error('[cacheCleanup] Error:', error);
  }
}

// Portfolio drift detection trigger (weekly Monday 6am)
export async function handleDriftDetection(env: TriggerEnv) {
  const startTime = Date.now();
  console.log('[driftDetection] Starting portfolio drift detection');

  try {
    const brapiClient = new BrapiClient();
    const cvmClient = new CvmClient();
    const fipeClient = new FipeClient();
    const cacheManager = new CacheManager(env.DB);

    const dataSync = new DataSyncJobs(
      brapiClient,
      cvmClient,
      fipeClient,
      new PortfolioEnricher(brapiClient, cvmClient, fipeClient, cacheManager),
      cacheManager,
      env.DB
    );

    const userIds = await getActiveUserIds(env.DB);
    const result = await dataSync.detectPortfolioDrift(userIds);

    const duration = Date.now() - startTime;
    console.log(`[driftDetection] Completed in ${duration}ms - Analyzed: ${result.analyzed}, Alerts: ${result.alertsSent}`);

    await env.DB.prepare(`
      INSERT INTO vera_data_audit (id, type, identifier, fetchedAt, status, durationMs)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      'drift_detection',
      `analyzed:${result.analyzed},alerts:${result.alertsSent}`,
      new Date().toISOString(),
      'success',
      duration
    ).run();
  } catch (error) {
    console.error('[driftDetection] Error:', error);
  }
}
