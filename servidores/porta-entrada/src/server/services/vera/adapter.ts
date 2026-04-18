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
    return {
      template_key: this.resolveTemplateKey(decision),
      decision_type: decision.main_problem,
      severity: severityByUrgency[decision.urgency],
      suggested_channels: this.resolveSuggestedChannels(decision),
      variables: {
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
      },
    };
  }

  private resolveTemplateKey(decision: DecisionOutput): string {
    switch (decision.main_problem) {
      case 'ALTA_PRESSAO_DE_DIVIDA':
        return 'debt_pressure_critical';
      case 'RISCO_DE_INSOLVENCIA_LIQUIDEZ':
        return 'reserve_missing_high_priority';
      case 'DESALINHAMENTO_DE_METAS':
        return 'goal_misalignment_adjustment';
      default:
        return decision.eligible_recommendation_level === 'product'
          ? 'portfolio_growth_product_eligible'
          : 'financial_health_generic';
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
