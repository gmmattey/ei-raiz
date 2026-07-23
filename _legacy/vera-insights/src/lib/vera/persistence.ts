import { UserFinancialProfile, DecisionOutput } from "../../types";

export interface VeraSnapshot {
  id: string;
  userId: string;
  timestamp: string;
  debtPressure: number;
  liquidityAdequacy: number;
  globalConfidence: number;
  behavioralConsistency: number;
  stage: string;
  simplifiedScore: number;
  primaryProblem: string;
  primaryAction: string;
  problemsJson: string;
  opportunitiesJson: string;
  provider: string;
  confidenceLevel: number;
}

export interface BehavioralAction {
  id: string;
  userId: string;
  actionDate: string;
  actionType: 'accepted' | 'ignored' | 'postponed' | 'completed';
  recommendationType: string;
  recommendationId?: string;
  completed: boolean;
  completedDate?: string;
}

export interface MonthlyTrend {
  userId: string;
  year: number;
  month: number;
  avgScore: number;
  avgDebtPressure: number;
  avgLiquidityAdequacy: number;
  snapshotCount: number;
  stageDistribution: Record<string, number>;
  problemsFixed: string[];
  newProblems: string[];
}

export class VeraPersistence {
  private db: any; // D1 Database binding

  constructor(db: any) {
    this.db = db;
  }

  /**
   * Save analysis snapshot to D1
   */
  async saveSnapshot(
    userId: string,
    profile: UserFinancialProfile,
    decision: DecisionOutput,
    provider: string
  ): Promise<VeraSnapshot> {
    const snapshot: VeraSnapshot = {
      id: crypto.randomUUID(),
      userId,
      timestamp: new Date().toISOString(),
      debtPressure: decision.evidence.debtPressure,
      liquidityAdequacy: decision.evidence.liquidityAdequacy,
      globalConfidence: decision.evidence.globalConfidence,
      behavioralConsistency: decision.evidence.behavioralConsistency,
      stage: decision.user_stage,
      simplifiedScore: decision.simplified_score || 0,
      primaryProblem: decision.primary_problem || decision.main_problem,
      primaryAction: decision.primary_action || decision.recommended_action,
      problemsJson: JSON.stringify(decision.problems || []),
      opportunitiesJson: JSON.stringify(decision.opportunities || []),
      provider,
      confidenceLevel: decision.confidence_level,
    };

    await this.db.prepare(`
      INSERT INTO vera_snapshots (
        id, userId, timestamp, debtPressure, liquidityAdequacy,
        globalConfidence, behavioralConsistency, stage, simplifiedScore,
        primaryProblem, primaryAction, problemsJson, opportunitiesJson,
        provider, confidenceLevel
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      snapshot.id,
      snapshot.userId,
      snapshot.timestamp,
      snapshot.debtPressure,
      snapshot.liquidityAdequacy,
      snapshot.globalConfidence,
      snapshot.behavioralConsistency,
      snapshot.stage,
      snapshot.simplifiedScore,
      snapshot.primaryProblem,
      snapshot.primaryAction,
      snapshot.problemsJson,
      snapshot.opportunitiesJson,
      snapshot.provider,
      snapshot.confidenceLevel
    ).run();

    return snapshot;
  }

  /**
   * Record user behavior on a recommendation
   */
  async saveBehavioralAction(
    userId: string,
    actionType: 'accepted' | 'ignored' | 'postponed' | 'completed',
    recommendationType: string,
    recommendationId?: string
  ): Promise<BehavioralAction> {
    const action: BehavioralAction = {
      id: crypto.randomUUID(),
      userId,
      actionDate: new Date().toISOString(),
      actionType,
      recommendationType,
      recommendationId,
      completed: actionType === 'completed',
      completedDate: actionType === 'completed' ? new Date().toISOString() : undefined,
    };

    await this.db.prepare(`
      INSERT INTO vera_behavioral (
        id, userId, actionDate, actionType, recommendationType,
        recommendationId, completed, completedDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      action.id,
      action.userId,
      action.actionDate,
      action.actionType,
      action.recommendationType,
      action.recommendationId || null,
      action.completed ? 1 : 0,
      action.completedDate || null
    ).run();

    return action;
  }

  /**
   * Get user trend for last N months
   */
  async getUserTrend(userId: string, months: number = 12): Promise<{
    snapshots: VeraSnapshot[];
    trends: MonthlyTrend[];
    scoreEvolution: Array<{ date: string; score: number }>;
    stageTransitions: Array<{ from: string; to: string; date: string }>;
    problemsSolved: string[];
  }> {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1).toISOString();

    // Get all snapshots in period
    const snapshots = await this.db.prepare(`
      SELECT * FROM vera_snapshots
      WHERE userId = ? AND timestamp >= ?
      ORDER BY timestamp ASC
    `).bind(userId, startDate).all<VeraSnapshot>();

    // Get monthly trends
    const trends = await this.db.prepare(`
      SELECT * FROM vera_monthly_trend
      WHERE userId = ? AND (year > ? OR (year = ? AND month >= ?))
      ORDER BY year, month ASC
    `).bind(
      userId,
      now.getFullYear() - 1,
      now.getFullYear(),
      Math.max(1, now.getMonth() - months + 1)
    ).all<any>();

    // Build score evolution
    const scoreEvolution = snapshots.results?.map((s: any) => ({
      date: s.timestamp,
      score: s.simplifiedScore,
    })) || [];

    // Detect stage transitions
    const stageTransitions: Array<{ from: string; to: string; date: string }> = [];
    const snaphotList = snapshots.results || [];
    for (let i = 1; i < snaphotList.length; i++) {
      const prev = snaphotList[i - 1] as any;
      const curr = snaphotList[i] as any;
      if (prev.stage !== curr.stage) {
        stageTransitions.push({
          from: prev.stage,
          to: curr.stage,
          date: curr.timestamp,
        });
      }
    }

    // Detect problems solved
    const problemsSolved: Set<string> = new Set();
    const currentProblems = new Set(
      (snaphotList[snaphotList.length - 1] as any)?.problemsJson ?
        JSON.parse((snaphotList[snaphotList.length - 1] as any).problemsJson).map((p: any) => p.type) :
        []
    );

    if (snaphotList.length > 1) {
      const previousProblems = new Set(
        (snaphotList[0] as any)?.problemsJson ?
          JSON.parse((snaphotList[0] as any).problemsJson).map((p: any) => p.type) :
          []
      );

      previousProblems.forEach(p => {
        if (!currentProblems.has(p)) {
          problemsSolved.add(p);
        }
      });
    }

    return {
      snapshots: snapshots.results || [],
      trends: trends.results?.map((t: any) => ({
        userId: t.userId,
        year: t.year,
        month: t.month,
        avgScore: t.avgScore,
        avgDebtPressure: t.avgDebtPressure,
        avgLiquidityAdequacy: t.avgLiquidityAdequacy,
        snapshotCount: t.snapshotCount,
        stageDistribution: JSON.parse(t.stageDistributionJson),
        problemsFixed: JSON.parse(t.problemsFixedJson),
        newProblems: JSON.parse(t.newProblemsJson),
      })) || [],
      scoreEvolution,
      stageTransitions,
      problemsSolved: Array.from(problemsSolved),
    };
  }

  /**
   * Update monthly summary (call once per month)
   */
  async updateMonthlySummary(userId: string): Promise<MonthlyTrend> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthStart = new Date(year, month - 1, 1).toISOString();
    const monthEnd = new Date(year, month, 1).toISOString();

    // Aggregate snapshots for this month
    const snapshots = await this.db.prepare(`
      SELECT * FROM vera_snapshots
      WHERE userId = ? AND timestamp >= ? AND timestamp < ?
      ORDER BY timestamp ASC
    `).bind(userId, monthStart, monthEnd).all<any>();

    if (!snapshots.results || snapshots.results.length === 0) {
      return {
        userId,
        year,
        month,
        avgScore: 0,
        avgDebtPressure: 0,
        avgLiquidityAdequacy: 0,
        snapshotCount: 0,
        stageDistribution: {},
        problemsFixed: [],
        newProblems: [],
      };
    }

    const results = snapshots.results;

    // Calculate averages
    const avgScore = Math.round(
      results.reduce((sum: number, s: any) => sum + s.simplifiedScore, 0) / results.length
    );
    const avgDebtPressure =
      results.reduce((sum: number, s: any) => sum + s.debtPressure, 0) / results.length;
    const avgLiquidityAdequacy =
      results.reduce((sum: number, s: any) => sum + s.liquidityAdequacy, 0) / results.length;

    // Stage distribution
    const stageDistribution: Record<string, number> = {};
    results.forEach((s: any) => {
      stageDistribution[s.stage] = (stageDistribution[s.stage] || 0) + 1;
    });

    // Problem analysis
    const allProblemsThisMonth = new Set<string>();
    const problemsFirstDay = new Set<string>();
    const problemsLastDay = new Set<string>();

    results.forEach((s: any, idx: number) => {
      const problems = JSON.parse(s.problemsJson || '[]').map((p: any) => p.type);
      problems.forEach((p: string) => allProblemsThisMonth.add(p));

      if (idx === 0) {
        problems.forEach((p: string) => problemsFirstDay.add(p));
      }
      if (idx === results.length - 1) {
        problems.forEach((p: string) => problemsLastDay.add(p));
      }
    });

    const problemsFixed: string[] = [];
    const newProblems: string[] = [];

    problemsFirstDay.forEach(p => {
      if (!problemsLastDay.has(p)) {
        problemsFixed.push(p);
      }
    });

    problemsLastDay.forEach(p => {
      if (!problemsFirstDay.has(p)) {
        newProblems.push(p);
      }
    });

    const trendId = `${userId}-${year}-${month}`;
    const trend: MonthlyTrend = {
      userId,
      year,
      month,
      avgScore,
      avgDebtPressure,
      avgLiquidityAdequacy,
      snapshotCount: results.length,
      stageDistribution,
      problemsFixed,
      newProblems,
    };

    // Upsert into vera_monthly_trend
    await this.db.prepare(`
      INSERT OR REPLACE INTO vera_monthly_trend (
        id, userId, year, month, avgScore, avgDebtPressure,
        avgLiquidityAdequacy, snapshotCount, stageDistributionJson,
        problemsFixedJson, newProblemsJson
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      trendId,
      userId,
      year,
      month,
      avgScore,
      avgDebtPressure,
      avgLiquidityAdequacy,
      results.length,
      JSON.stringify(stageDistribution),
      JSON.stringify(problemsFixed),
      JSON.stringify(newProblems)
    ).run();

    return trend;
  }
}
