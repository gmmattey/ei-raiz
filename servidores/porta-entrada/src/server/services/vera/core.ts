import {
  UserFinancialProfile,
  GoalStatus
} from "./types";

/**
 * Parâmetros do modelo Vera. São heurísticas explícitas — não dados fabricados.
 * Podem ser sobrescritos por configuração (`configuracoes_produto` chave `vera.v1`)
 * no momento da instanciação do VeraCoreEngine.
 */
export type VeraModelParams = {
  /** Fração do saldo total da dívida usada como aproximação do serviço mensal (parcela/juros). */
  monthlyDebtServiceRate: number;
  /** Peso (phi) do componente "dívida de alto custo / patrimônio líquido" na pressão de dívida. */
  highInterestDebtWeight: number;
  /** Meses-alvo padrão de reserva de emergência quando o perfil não fornece um valor explícito. */
  defaultEmergencyMonths: number;
  /** Taxa anual esperada usada no PMT para viabilidade de metas. */
  expectedAnnualReturn: number;
  /** Limiares de viabilidade de meta (Sgf). */
  goalFeasibility: { tightBelow: number; unviableBelow: number };
  /** Sgf default quando não há contribuição requerida (meta já coberta). */
  goalFeasibilityWhenNoContributionRequired: number;
};

export const DEFAULT_VERA_MODEL_PARAMS: VeraModelParams = {
  monthlyDebtServiceRate: 0.03,
  highInterestDebtWeight: 1.5,
  defaultEmergencyMonths: 6,
  expectedAnnualReturn: 0.07,
  goalFeasibility: { tightBelow: 1.0, unviableBelow: 0.7 },
  goalFeasibilityWhenNoContributionRequired: 1.5,
};

export class VeraCoreEngine {
  private readonly params: VeraModelParams;

  constructor(params: Partial<VeraModelParams> = {}) {
    this.params = {
      ...DEFAULT_VERA_MODEL_PARAMS,
      ...params,
      goalFeasibility: { ...DEFAULT_VERA_MODEL_PARAMS.goalFeasibility, ...(params.goalFeasibility ?? {}) },
    };
  }

  /**
   * DebtPressureScore (Sdp)
   * Sdp = (Monthly Debt Service / Monthly Income) + (High Interest Debt / Net Worth * phi)
   */
  public calculateDebtPressure(profile: UserFinancialProfile): number {
    const income = profile.income.value || 0;
    if (income <= 0) return 1.0;

    const monthlyDebtService = (profile.totalDebt.value || 0) * this.params.monthlyDebtServiceRate;
    const highInterestDebt = profile.highInterestDebt.value || 0;
    const netWorth = Math.max(1, (profile.liquidAssets.value || 0) - (profile.totalDebt.value || 0));

    const score = (monthlyDebtService / income) + (highInterestDebt / netWorth * this.params.highInterestDebtWeight);
    return Math.min(1.0, score);
  }

  /**
   * LiquidityAdequacyScore (Sla)
   * Sla = Liquid Assets / (Monthly Expenses * Target Months)
   */
  public calculateLiquidityAdequacy(profile: UserFinancialProfile, targetMonths: number = this.params.defaultEmergencyMonths): number {
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
    const i = this.params.expectedAnnualReturn / 12;
    const { tightBelow, unviableBelow } = this.params.goalFeasibility;

    return profile.goals.map(goal => {
      const n = goal.deadlineMonths;
      const FV = goal.targetValue;
      const PV = goal.currentValue;

      const pow = Math.pow(1 + i, n);
      const denominator = ((pow - 1) / i);
      const pmtReq = denominator > 0 ? (FV - PV * pow) / denominator : 0;

      const sgf = pmtReq > 0 ? surplus / pmtReq : this.params.goalFeasibilityWhenNoContributionRequired;

      let status: 'viable' | 'tight' | 'unviable' = 'viable';
      if (sgf < unviableBelow) status = 'unviable';
      else if (sgf < tightBelow) status = 'tight';

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
