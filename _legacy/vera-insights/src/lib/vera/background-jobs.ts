import { BrapiClient } from './data-clients/brapi-client.js';
import { CvmClient } from './data-clients/cvm-client.js';
import { FipeClient } from './data-clients/fipe-client.js';
import { PortfolioEnricher, PortfolioPosition } from './portfolio-enricher.js';
import { CacheManager } from './cache-manager.js';

export interface BackgroundJobConfig {
  enabled: boolean;
  interval: string; // cron expression
  maxRetries?: number;
  timeoutMs?: number;
}

export class DataSyncJobs {
  constructor(
    private brapi: BrapiClient,
    private cvm: CvmClient,
    private fipe: FipeClient,
    private enricher: PortfolioEnricher,
    private cache: CacheManager,
    private db?: any
  ) {}

  // Job 1: Sync stock prices every 30 minutes (market hours)
  async syncStockPrices(userIds: string[]): Promise<{ processed: number; updated: number }> {
    let processed = 0;
    let updated = 0;

    try {
      for (const userId of userIds) {
        processed++;
        try {
          // Query latest portfolio snapshots
          const snapshots = await this.getLatestPortfolioSnapshots(userId);

          if (!snapshots || snapshots.length === 0) {
            continue;
          }

          const positions = JSON.parse(snapshots[0].positions || '[]');
          const stocks = positions.filter((p: any) => p.assetClass === 'stocks');

          if (stocks.length > 0) {
            // Refresh stock prices via BRAPI
            const tickers = stocks.map((s: any) => s.ticker).filter(Boolean);
            const quotes = await this.brapi.getBatchPrices(tickers);

            if (quotes.size > 0) {
              updated++;
              // Re-enrich portfolio with fresh prices
              await this.enricher.refreshSnapshot(userId, positions);
            }
          }
        } catch (err) {
          console.error(`Error syncing stocks for user ${userId}:`, err);
        }
      }
    } catch (err) {
      console.error('Fatal error in syncStockPrices:', err);
    }

    return { processed, updated };
  }

  // Job 2: Sync fund data daily at 10pm
  async syncFundData(userIds: string[]): Promise<{ processed: number; updated: number }> {
    let processed = 0;
    let updated = 0;

    try {
      for (const userId of userIds) {
        processed++;
        try {
          const snapshots = await this.getLatestPortfolioSnapshots(userId);

          if (!snapshots || snapshots.length === 0) {
            continue;
          }

          const positions = JSON.parse(snapshots[0].positions || '[]');
          const funds = positions.filter((p: any) => p.assetClass === 'funds');

          if (funds.length > 0) {
            // Update fund data and performance
            for (const fund of funds) {
              const fundData = await this.cvm.getFundData(fund.ticker);
              const performance = await this.cvm.getFundPerformance(fund.ticker);

              if (fundData && performance) {
                updated++;
              }
            }

            // Re-enrich portfolio
            await this.enricher.refreshSnapshot(userId, positions);
          }
        } catch (err) {
          console.error(`Error syncing funds for user ${userId}:`, err);
        }
      }
    } catch (err) {
      console.error('Fatal error in syncFundData:', err);
    }

    return { processed, updated };
  }

  // Job 3: Cleanup expired cache entries hourly
  async cleanupExpiredCache(): Promise<{ deleted: number }> {
    try {
      const deleted = await this.cache.cleanupExpiredEntries();
      console.log(`Cache cleanup: removed ${deleted} expired entries`);
      return { deleted };
    } catch (err) {
      console.error('Error cleaning up cache:', err);
      return { deleted: 0 };
    }
  }

  // Job 4: Detect portfolio drift weekly
  async detectPortfolioDrift(userIds: string[]): Promise<{
    analyzed: number;
    alertsSent: number;
  }> {
    let analyzed = 0;
    let alertsSent = 0;

    const DRIFT_THRESHOLD = 0.1; // 10%

    try {
      for (const userId of userIds) {
        analyzed++;
        try {
          // Get last 2 snapshots
          const snapshots = await this.getPortfolioSnapshots(userId, 2);

          if (!snapshots || snapshots.length < 2) {
            continue;
          }

          const [latest, previous] = snapshots;
          const driftPercent = this.calculateConcentrationDrift(latest, previous);

          if (driftPercent > DRIFT_THRESHOLD) {
            alertsSent++;
            console.log(`Portfolio drift alert for user ${userId}: ${(driftPercent * 100).toFixed(1)}%`);
            // TODO: Send notification to user
          }
        } catch (err) {
          console.error(`Error detecting drift for user ${userId}:`, err);
        }
      }
    } catch (err) {
      console.error('Fatal error in detectPortfolioDrift:', err);
    }

    return { analyzed, alertsSent };
  }

  // Helper: Get latest portfolio snapshot
  private async getLatestPortfolioSnapshots(userId: string): Promise<any[]> {
    // Mock implementation - in production would query D1
    return [];
  }

  // Helper: Get multiple portfolio snapshots
  private async getPortfolioSnapshots(userId: string, limit: number): Promise<any[]> {
    // Mock implementation - in production would query D1
    return [];
  }

  // Helper: Calculate concentration drift between two snapshots
  private calculateConcentrationDrift(latest: any, previous: any): number {
    try {
      const latestPositions = JSON.parse(latest.positions || '[]');
      const previousPositions = JSON.parse(previous.positions || '[]');

      const latestTotalValue = latestPositions.reduce((sum: number, p: any) => sum + (p.currentValue || 0), 0);
      const previousTotalValue = previousPositions.reduce((sum: number, p: any) => sum + (p.currentValue || 0), 0);

      if (latestTotalValue === 0 || previousTotalValue === 0) {
        return 0;
      }

      // Get top 3 positions by value
      const latestTop3 = latestPositions
        .sort((a: any, b: any) => (b.currentValue || 0) - (a.currentValue || 0))
        .slice(0, 3)
        .reduce((sum: number, p: any) => sum + (p.currentValue || 0), 0);

      const previousTop3 = previousPositions
        .sort((a: any, b: any) => (b.currentValue || 0) - (a.currentValue || 0))
        .slice(0, 3)
        .reduce((sum: number, p: any) => sum + (p.currentValue || 0), 0);

      const latestConcentration = latestTop3 / latestTotalValue;
      const previousConcentration = previousTop3 / previousTotalValue;

      return Math.abs(latestConcentration - previousConcentration);
    } catch (err) {
      console.error('Error calculating drift:', err);
      return 0;
    }
  }

  // Get job status
  getJobStatus(): { lastRun: Date | null; nextRun: Date | null } {
    // TODO: Track job execution times
    return { lastRun: null, nextRun: null };
  }
}

// Cron schedule recommendations:
// Stock sync: */30 9-18 * * 1-5  (Every 30min, 9am-6pm, Mon-Fri)
// Fund sync:  0 22 * * *         (Daily at 10pm)
// Cache cleanup: 0 * * * *       (Hourly)
// Portfolio drift: 0 6 * * 1     (Weekly Monday 6am)
