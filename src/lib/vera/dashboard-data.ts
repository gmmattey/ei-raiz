import { UserFinancialProfile, DecisionOutput } from "../../types";
import { PortfolioPosition, PortfolioMetrics, PortfolioAnalysis } from "./portfolio-analysis";
import { Card, DashboardNarrative, NarrativeGenerator } from "./narratives";
import { GoalAnalysis, GoalsNarrative } from "./goals-narrative";

export interface DashboardData {
  // User metadata
  userId?: string;
  timestamp: string;
  analysisVersion: string;

  // Hero section
  hero: {
    score: number;
    band: string;
    message: string;
    sentiment: 'critical' | 'warning' | 'neutral' | 'positive' | 'excellent';
  };

  // Financial snapshot
  financial: {
    income: number;
    expenses: number;
    surplus: number;
    liquidAssets: number;
    totalDebt: number;
    debtRatio: number;
    liquidityMonths: number;
    confidence: number;
  };

  // Portfolio analysis
  portfolio?: {
    totalValue: number;
    unrealizedGain: number;
    gainPercent: number;
    riskScore: number;
    expectedReturn: number;
    volatility: number;
    sharpeRatio: number;
    diversification: {
      count: number;
      concentration: 'high' | 'moderate' | 'low';
    };
    issues: Array<{ severity: string; message: string }>;
  };

  // Cards for rendering
  cards: {
    problems: Card[];
    opportunities: Card[];
    insights: Card[];
  };

  // Goals analysis
  goals?: GoalAnalysis[];

  // Trends
  trends?: {
    scoreHistory: Array<{ date: string; score: number }>;
    stageHistory: Array<{ date: string; stage: string }>;
    problemsSolved: string[];
  };

  // Authorization
  capabilities: {
    canViewPortfolio: boolean;
    canInvest: boolean;
    canSetGoals: boolean;
    eligibleRecommendationLevel: 'structure' | 'asset_class' | 'product';
  };

  // Metadata for debugging
  _meta: {
    debtPressure: number;
    liquidityAdequacy: number;
    behavioralConsistency: number;
    policyVersion: string;
  };
}

export class DashboardDataGenerator {
  private narrativeGen = new NarrativeGenerator();
  private goalsNarrative = new GoalsNarrative();
  private portfolioAnalysis = new PortfolioAnalysis();

  /**
   * Generate complete dashboard data from decision output and optional portfolio
   */
  public generateDashboardData(
    userId: string | undefined,
    profile: UserFinancialProfile,
    decision: DecisionOutput,
    positions?: PortfolioPosition[],
    trendData?: any
  ): DashboardData {
    // Base financial metrics
    const income = profile.income.value || 0;
    const expenses = profile.expenses.value || 0;
    const surplus = income - expenses;
    const liquidAssets = profile.liquidAssets.value || 0;
    const totalDebt = profile.totalDebt.value || 0;
    const debtRatio = income > 0 ? (totalDebt / income) * 100 : 0;
    const liquidityMonths = expenses > 0 ? liquidAssets / expenses : 0;

    // Generate narratives
    const dashboardNarrative = this.narrativeGen.generateDashboardNarrative(
      decision.simplified_score || 0,
      decision.simplified_band || 'Moderado',
      decision.user_stage,
      decision.problems || [],
      decision.opportunities || [],
      {
        debtRatio: Math.round(debtRatio),
        liquidityMonths: Math.round(liquidityMonths * 10) / 10,
        expenses: Math.round(expenses),
        income: Math.round(income),
      }
    );

    // Portfolio analysis (if positions provided)
    let portfolioMetrics: PortfolioMetrics | undefined;
    if (positions && positions.length > 0) {
      portfolioMetrics = this.portfolioAnalysis.analyzePortfolio(positions, profile);
    }

    // Goals analysis
    let goalsAnalysis: GoalAnalysis[] | undefined;
    if (profile.goals && profile.goals.length > 0) {
      goalsAnalysis = this.goalsNarrative.analyzeGoals(profile.goals, profile);
    }

    // Build dashboard data
    const dashboard: DashboardData = {
      userId,
      timestamp: new Date().toISOString(),
      analysisVersion: '2.0.0',

      hero: dashboardNarrative.hero,

      financial: {
        income: Math.round(income),
        expenses: Math.round(expenses),
        surplus: Math.round(surplus),
        liquidAssets: Math.round(liquidAssets),
        totalDebt: Math.round(totalDebt),
        debtRatio: Math.round(debtRatio * 10) / 10,
        liquidityMonths: Math.round(liquidityMonths * 10) / 10,
        confidence: Math.round(decision.confidence_level * 100) / 100,
      },

      cards: {
        problems: dashboardNarrative.problems,
        opportunities: dashboardNarrative.opportunities,
        insights: dashboardNarrative.insights,
      },

      capabilities: {
        canViewPortfolio: decision.authorized_capabilities.includes('PRODUCT_ELIGIBLE'),
        canInvest:
          decision.authorized_capabilities.includes('PRODUCT_ELIGIBLE') ||
          decision.authorized_capabilities.includes('CLASS_RECOMMENDATION'),
        canSetGoals: decision.authorized_capabilities.includes('GOAL_SIMULATION'),
        eligibleRecommendationLevel: decision.eligible_recommendation_level || 'structure',
      },

      _meta: {
        debtPressure: Math.round(decision.evidence.debtPressure * 100) / 100,
        liquidityAdequacy: Math.round(decision.evidence.liquidityAdequacy * 100) / 100,
        behavioralConsistency: Math.round(decision.evidence.behavioralConsistency * 100) / 100,
        policyVersion: decision.audit_trace?.policyVersion || 'unknown',
      },
    };

    // Add portfolio section if available
    if (portfolioMetrics) {
      dashboard.portfolio = {
        totalValue: Math.round(portfolioMetrics.totalValue),
        unrealizedGain: Math.round(portfolioMetrics.unrealizedGain),
        gainPercent: Math.round(portfolioMetrics.unrealizedGainPercent * 10) / 10,
        riskScore: portfolioMetrics.riskScore,
        expectedReturn: Math.round(portfolioMetrics.expectedReturn * 10) / 10,
        volatility: Math.round(portfolioMetrics.volatility * 10) / 10,
        sharpeRatio: Math.round(portfolioMetrics.sharpeRatio * 100) / 100,
        diversification: {
          count: portfolioMetrics.diversification.count,
          concentration: portfolioMetrics.diversification.concentration,
        },
        issues: portfolioMetrics.issues,
      };
    }

    // Add goals if available
    if (goalsAnalysis) {
      dashboard.goals = goalsAnalysis;
    }

    // Add trends if available
    if (trendData) {
      dashboard.trends = {
        scoreHistory: trendData.scoreEvolution || [],
        stageHistory: trendData.stageTransitions?.map((t: any) => ({
          date: t.date,
          stage: t.to,
        })) || [],
        problemsSolved: trendData.problemsSolved || [],
      };
    }

    return dashboard;
  }
}
