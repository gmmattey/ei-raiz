import { DecisionOutput, TemplatePayload, VeraIntegrationOutput } from "./types";

const severityByUrgency: Record<DecisionOutput['urgency'], TemplatePayload['severity']> = {
  low: 'info',
  medium: 'warning',
  high: 'error',
  critical: 'critical',
};

export class VeraAdapter {
  public toIntegrationOutput(decision: DecisionOutput): VeraIntegrationOutput {
    return {
      engine: 'vera',
      decision,
      template_payload: this.toTemplatePayload(decision),
      capabilities: {
        authorized: decision.authorized_capabilities,
        blocked: this.getBlockedCapabilities(decision),
      },
      explanation: {
        primary_reason: decision.main_problem,
        secondary_reason: decision.main_opportunity,
      },
    };
  }

  public toTemplatePayload(decision: DecisionOutput): TemplatePayload {
    const primaryProblem = (decision as any).problems?.[0];
    const templateVars: Record<string, any> = {
      user_stage: decision.user_stage,
      main_problem: decision.main_problem,
      main_opportunity: decision.main_opportunity,
      recommended_action: decision.recommended_action,
      confidence_level: Number(decision.confidence_level.toFixed(2)),
      debt_pressure: this.safeNumber(decision.evidence.debtPressure),
      liquidity_adequacy: this.safeNumber(decision.evidence.liquidityAdequacy),
      behavioral_consistency: this.safeNumber(decision.evidence.behavioralConsistency),
      goal_count: decision.goal_status.length,
      first_unviable_goal_id: decision.goal_status.find((goal) => goal.status === 'unviable')?.id ?? null,
    };

    // Extract problem-specific variables for rich templates
    if (primaryProblem) {
      if (primaryProblem.type === 'INSUFFICIENT_EMERGENCY_FUND') {
        templateVars.liquidity_months = this.safeNumber(decision.evidence.liquidityAdequacy);
        templateVars.monthly_reserve = this.safeNumber(primaryProblem.monthlySave);
        templateVars.months_to_save = primaryProblem.monthsToSolve ?? 12;
      } else if (primaryProblem.type === 'HIGH_DEBT_RATIO' || primaryProblem.type === 'HIGH_INTEREST_DEBT') {
        templateVars.debt_percentage = this.safeNumber((decision.evidence.debtPressure ?? 0) * 100);
        templateVars.high_interest_percentage = this.safeNumber(primaryProblem.percentageOfIncome ?? 30);
        templateVars.monthly_savings = this.safeNumber(primaryProblem.monthlySave);
        templateVars.debt_payment = this.safeNumber(primaryProblem.monthlySave);
        templateVars.months_to_payoff = primaryProblem.monthsToSolve ?? 24;
      } else if (primaryProblem.type === 'EXPENSE_OPTIMIZATION') {
        templateVars.expense_percentage = this.safeNumber(primaryProblem.percentageOfIncome ?? 85);
        templateVars.optimization_potential = this.safeNumber(primaryProblem.monthlySave);
      }
    }

    // If investment ready
    const opportunity = (decision as any).opportunities?.[0];
    if (opportunity && opportunity.type === 'INVESTMENT_READY') {
      templateVars.investment_capacity = this.safeNumber(opportunity.monthlyCapacity);
      templateVars.initial_amount = this.safeNumber(opportunity.monthlyCapacity ?? 500);
    }

    return {
      template_key: this.resolveTemplateKey(decision),
      decision_type: decision.main_problem,
      severity: severityByUrgency[decision.urgency],
      suggested_channels: this.resolveSuggestedChannels(decision),
      variables: templateVars,
    };
  }

  private resolveTemplateKey(decision: DecisionOutput): string {
    const primaryProblem = (decision as any).problems?.[0];

    // Map by problem type first
    if (primaryProblem) {
      switch (primaryProblem.type) {
        case 'INSUFFICIENT_EMERGENCY_FUND':
          return 'reserve_missing_high_priority';
        case 'HIGH_DEBT_RATIO':
        case 'HIGH_INTEREST_DEBT':
          return 'debt_restructuring_needed';
        case 'EXPENSE_OPTIMIZATION':
          return 'expense_optimization';
        case 'NEGATIVE_CASH_FLOW':
          return 'debt_restructuring_needed';
      }
    }

    // Fall back to main_problem
    switch (decision.main_problem) {
      case 'ALTA_PRESSAO_DE_DIVIDA':
        return 'debt_restructuring_needed';
      case 'RISCO_DE_INSOLVENCIA_LIQUIDEZ':
        return 'reserve_missing_high_priority';
      case 'DESALINHAMENTO_DE_METAS':
        return 'goal_timeline_adjustment';
      default:
        return decision.eligible_recommendation_level === 'product'
          ? 'investment_ready'
          : 'reserve_missing_high_priority';
    }
  }

  private resolveSuggestedChannels(decision: DecisionOutput): TemplatePayload['suggested_channels'] {
    if (decision.urgency === 'critical') return ['in_app', 'email', 'push'];
    if (decision.urgency === 'high') return ['in_app', 'push'];
    return ['in_app'];
  }

  private getBlockedCapabilities(decision: DecisionOutput): string[] {
    const all = ['STRUCTURAL_ONLY', 'GOAL_SIMULATION', 'CLASS_RECOMMENDATION', 'PRODUCT_ELIGIBLE', 'HIGH_RISK_ALLOWED'];
    return all.filter((capability) => !decision.authorized_capabilities.includes(capability as any));
  }

  private safeNumber(value: unknown): number | null {
    return typeof value === 'number' && Number.isFinite(value) ? Number(value.toFixed(2)) : null;
  }
}
