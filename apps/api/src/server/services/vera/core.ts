import {
  UserFinancialProfile,
  GoalStatus
} from "./types";

export class VeraCoreEngine {
  /**
   * DebtPressureScore (Sdp)
   * Sdp = (Monthly Debt Service / Monthly Income) + (High Interest Debt / Net Worth * phi)
   */
  public calculateDebtPressure(profile: UserFinancialProfile): number {
    const income = profile.income.value || 0;
    if (income <= 0) return 1.0; // Max pressure if no income

    const monthlyDebtService = (profile.totalDebt.value || 0) * 0.03; 
    const highInterestDebt = profile.highInterestDebt.value || 0;
    const netWorth = Math.max(1, (profile.liquidAssets.value || 0) - (profile.totalDebt.value || 0));
    const phi = 1.5;

    const score = (monthlyDebtService / income) + (highInterestDebt / netWorth * phi);
    return Math.min(1.0, score);
  }

  /**
   * LiquidityAdequacyScore (Sla)
   * Sla = Liquid Assets / (Monthly Expenses * Target Months)
   */
  public calculateLiquidityAdequacy(profile: UserFinancialProfile, targetMonths: number = 6): number {
    const expenses = profile.expenses.value || 1;
    const assets = profile.liquidAssets.value || 0;

    return assets / (expenses * targetMonths);
  }

  /**
   * GoalFeasibilityScore (Sgf)
   * Sgf = Available Monthly Surplus / PMT_req
   */
  public evaluateGoals(profile: UserFinancialProfile): GoalStatus[] {
    const income = profile.income.value || 0;
    const expenses = profile.expenses.value || 0;
    const surplus = Math.max(0, income - expenses);
    const annualRate = 0.07; 
    const i = annualRate / 12;

    return profile.goals.map(goal => {
      const n = goal.deadlineMonths;
      const FV = goal.targetValue;
      const PV = goal.currentValue;

      // PMT = (FV - PV*(1+i)^n) / (((1+i)^n - 1) / i)
      const pow = Math.pow(1 + i, n);
      const denominator = ((pow - 1) / i);
      const pmtReq = denominator > 0 ? (FV - PV * pow) / denominator : 0;
      
      const sgf = pmtReq > 0 ? surplus / pmtReq : 1.5;

      let status: 'viable' | 'tight' | 'unviable' = 'viable';
      if (sgf < 0.7) status = 'unviable';
      else if (sgf < 1.0) status = 'tight';

      const suggestedAdjustments = [];
      if (status !== 'viable') {
        suggestedAdjustments.push(`Aumentar aporte mensal em $${Math.ceil(pmtReq - surplus)}`);
        suggestedAdjustments.push(`Estender prazo em ${Math.ceil(n * 0.5)} meses`);
        suggestedAdjustments.push(`Reduzir valor alvo para $${Math.ceil(surplus * denominator + PV * pow)}`);
      }

      return {
        id: goal.id,
        status,
        requiredMonthlyContribution: Math.max(0, pmtReq),
        gap: Math.max(0, FV - PV),
        suggestedAdjustments
      };
    });
  }
}
