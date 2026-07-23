import { UserFinancialProfile, UserStage } from "../../types";

export interface Problem {
  type: string;
  action: string;
  detail: string;
  monthsToSolve?: number;
  monthlySave?: number;
  percentageOfIncome?: number;
}

export interface Opportunity {
  type: string;
  action: string;
  detail: string;
  monthlyCapacity?: number;
}

export interface RecommendationSet {
  problems: Problem[];
  opportunities: Opportunity[];
  scoreFactors: {
    debtScore: number;
    liquidityScore: number;
    behaviorScore: number;
  };
}

export class RecommendationEngine {
  /**
   * Generate specific, actionable recommendations based on financial profile
   */
  public generateRecommendations(
    profile: UserFinancialProfile,
    scores: {
      debtPressure: number;
      liquidityAdequacy: number;
      behavioralConsistency: number;
    }
  ): RecommendationSet {
    const problems: Problem[] = [];
    const opportunities: Opportunity[] = [];

    const income = profile.income.value || 0;
    const expenses = profile.expenses.value || 0;
    const liquidAssets = profile.liquidAssets.value || 0;
    const totalDebt = profile.totalDebt.value || 0;
    const highInterestDebt = profile.highInterestDebt.value || 0;

    // ===== PRIMARY PROBLEMS =====

    // Problem 1: High Debt Ratio
    if (scores.debtPressure > 0.5) {
      const debtPayment = income * 0.3; // Target: 30% of income
      const monthsToPayoff = totalDebt > 0 ? totalDebt / debtPayment : 0;

      problems.push({
        type: "HIGH_DEBT_RATIO",
        action: "PAY_DEBT_FIRST",
        detail: `Sua dívida representa ${(scores.debtPressure * 100).toFixed(0)}% da pressão financeira. Dedique R$ ${debtPayment.toFixed(0)}/mês para quitação.`,
        monthsToSolve: Math.ceil(monthsToPayoff),
        monthlySave: Math.round(debtPayment),
        percentageOfIncome: 30,
      });
    }

    // Problem 2: Insufficient Emergency Fund
    if (scores.liquidityAdequacy < 1.0) {
      const targetLiquid = expenses * 6;
      const gap = targetLiquid - liquidAssets;
      const monthlyTarget = gap > 0 ? gap / 12 : 0; // 1 year to build

      problems.push({
        type: "INSUFFICIENT_EMERGENCY_FUND",
        action: "SAVE_X_MONTHLY",
        detail: `Você tem ${scores.liquidityAdequacy.toFixed(1)} meses de cobertura (ideal: 6). Economize R$ ${monthlyTarget.toFixed(0)}/mês por ${Math.ceil(gap / monthlyTarget)} meses.`,
        monthsToSolve: Math.ceil(gap / monthlyTarget),
        monthlySave: Math.round(monthlyTarget),
        percentageOfIncome: ((monthlyTarget / income) * 100),
      });
    }

    // Problem 3: Negative Cash Flow
    if (expenses > income) {
      const deficit = expenses - income;

      problems.push({
        type: "NEGATIVE_CASH_FLOW",
        action: "FIX_CASH_FLOW",
        detail: `Suas despesas (R$ ${expenses.toFixed(0)}) excedem sua renda (R$ ${income.toFixed(0)}) em R$ ${deficit.toFixed(0)}/mês. Reduza despesas ou aumente renda.`,
        monthsToSolve: undefined, // Immediate
        monthlySave: Math.round(deficit),
        percentageOfIncome: ((deficit / income) * 100),
      });
    }

    // Problem 4: High Interest Debt
    if (highInterestDebt > 0 && highInterestDebt > totalDebt * 0.3) {
      const percentageOfDebt = (highInterestDebt / totalDebt) * 100;

      problems.push({
        type: "HIGH_INTEREST_DEBT",
        action: "CONSOLIDATE_OR_REFINANCE",
        detail: `${percentageOfDebt.toFixed(0)}% da sua dívida é de alto juros (cartão, cheque especial). Considere consolidar em empréstimo pessoal com juros menores.`,
        monthlySave: Math.round((highInterestDebt * 0.15) / 12), // Estimated savings at 15% interest reduction
      });
    }

    // Problem 5: Unclear Financial Picture (Low Confidence)
    if (Object.values(profile).some(
      field => field?.state && ['UNKNOWN_NOT_ASKED', 'UNKNOWN_SKIPPED', 'ESTIMATED', 'INFERRED'].includes(field.state)
    )) {
      problems.push({
        type: "UNCLEAR_FINANCIAL_PICTURE",
        action: "SYNC_DATA_OR_UPDATE",
        detail: "Seus dados financeiros estão incompletos ou estimados. Conecte sua conta bancária ou atualize manualmente para análises mais precisas.",
      });
    }

    // ===== OPPORTUNITIES =====

    // Opportunity 1: Investment Ready
    if (
      scores.debtPressure < 0.3 &&
      scores.liquidityAdequacy >= 1.0 &&
      income > expenses
    ) {
      const investmentCapacity = income - expenses - (totalDebt > 0 ? income * 0.1 : 0);

      opportunities.push({
        type: "INVESTMENT_READY",
        action: "START_INVESTING",
        detail: `Você tem capacidade de investir R$ ${Math.round(investmentCapacity)}/mês sem comprometer estabilidade.`,
        monthlyCapacity: Math.round(investmentCapacity),
      });
    }

    // Opportunity 2: Debt Consolidation (with positive cash flow)
    if (
      highInterestDebt > 0 &&
      income > expenses &&
      scores.liquidityAdequacy >= 0.5
    ) {
      const savingsPotential = (highInterestDebt * 0.15) / 12;

      opportunities.push({
        type: "DEBT_CONSOLIDATION",
        action: "REFINANCE_DEBT",
        detail: `Refinanciar R$ ${highInterestDebt.toFixed(0)} em dívida de alto juros pode economizar R$ ${savingsPotential.toFixed(0)}/mês.`,
        monthlyCapacity: Math.round(savingsPotential),
      });
    }

    // Opportunity 3: Build Investment Habit (Behavioral)
    if (
      scores.behavioralConsistency > 0.5 &&
      scores.liquidityAdequacy >= 0.8 &&
      income > expenses
    ) {
      const habitCapacity = (income - expenses) * 0.2; // 20% of surplus

      opportunities.push({
        type: "INVESTMENT_HABIT",
        action: "AUTOMATE_MONTHLY_INVESTMENT",
        detail: `Seu histórico mostra consistência. Automatize um aporte de R$ ${Math.round(habitCapacity)}/mês em investimentos.`,
        monthlyCapacity: Math.round(habitCapacity),
      });
    }

    // Opportunity 4: Expense Optimization (if high expenses relative to income)
    if (expenses > income * 0.8) {
      const optimizationTarget = expenses * 0.1; // Can save 10%

      opportunities.push({
        type: "EXPENSE_OPTIMIZATION",
        action: "REDUCE_RECURRING_EXPENSES",
        detail: `Você gasta ${((expenses / income) * 100).toFixed(0)}% da sua renda em despesas. Otimize para liberar R$ ${Math.round(optimizationTarget)}/mês.`,
        monthlyCapacity: Math.round(optimizationTarget),
      });
    }

    const scoreFactors = {
      debtScore: this.mapScore(scores.debtPressure, 'debt'),
      liquidityScore: this.mapScore(scores.liquidityAdequacy, 'liquidity'),
      behaviorScore: scores.behavioralConsistency * 100,
    };

    return { problems, opportunities, scoreFactors };
  }

  /**
   * Convert individual metrics to 0-100 scores
   */
  private mapScore(metric: number, type: 'debt' | 'liquidity'): number {
    if (type === 'debt') {
      // Debt Pressure: lower is better
      // 0 = 100 (great), 0.2 = 90, 0.5 = 50, 0.7 = 30, 1.0 = 0
      if (metric <= 0.1) return 100;
      if (metric <= 0.2) return 90;
      if (metric <= 0.3) return 80;
      if (metric <= 0.4) return 70;
      if (metric <= 0.5) return 50;
      if (metric <= 0.7) return 30;
      return Math.max(0, 100 - metric * 100); // Floor at 0
    } else {
      // Liquidity Adequacy: higher is better
      // 0 = 0 (danger), 0.5 = 25, 1.0 = 50, 3.0 = 100+
      if (metric <= 0) return 0;
      if (metric <= 0.3) return 15;
      if (metric <= 0.5) return 25;
      if (metric <= 1.0) return 50;
      if (metric <= 2.0) return 75;
      return Math.min(100, 50 + metric * 20); // Cap at 100
    }
  }

  /**
   * Calculate unified 0-100 score from component metrics
   */
  public calculateSimplifiedScore(
    debtPressure: number,
    liquidityAdequacy: number,
    behavioralConsistency: number
  ): number {
    const debtScore = this.mapScore(debtPressure, 'debt');
    const liquidityScore = this.mapScore(liquidityAdequacy, 'liquidity');
    const behaviorScore = behavioralConsistency * 100;

    // Weighted average: debt and liquidity are critical, behavior is secondary
    const score = (debtScore * 0.4) + (liquidityScore * 0.4) + (behaviorScore * 0.2);

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * Map score to user-friendly band
   */
  public getBand(score: number): string {
    if (score < 30) return 'Crítico';
    if (score < 50) return 'Precário';
    if (score < 70) return 'Moderado';
    if (score < 85) return 'Bom';
    return 'Excelente';
  }
}
