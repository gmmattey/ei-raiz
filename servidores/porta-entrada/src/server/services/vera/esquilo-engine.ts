import {
  UserFinancialProfile,
  DecisionOutput,
  UserStage,
  DataState,
  GoalStatus,
  BehavioralHistory,
  AuthorizedCapability,
  AuditTrace
} from "./types";
import { VeraCoreEngine } from "./core";

export class EsquiloEngine {
  private vera = new VeraCoreEngine();
  private policyVersion = "2024.Q2.v1.4";

  public evaluate(profile: UserFinancialProfile, history: BehavioralHistory): DecisionOutput {
    const traceId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // 1. Resolve Confidence
    const globalConfidence = this.calculateGlobalConfidence(profile);
    
    // 2. Call Vera for raw math
    const debtPressure = this.vera.calculateDebtPressure(profile);
    const targetLiquidityMonths = this.calculateDynamicLiquidityTarget(profile);
    const liquidityAdequacy = this.vera.calculateLiquidityAdequacy(profile, targetLiquidityMonths);
    const goalStatuses = this.vera.evaluateGoals(profile);

    // 3. Behavioral Consistency
    const behavioralConsistency = history.consistencyScore;

    // 4. Determine Stage
    let stage = UserStage.GROWING;
    if (debtPressure > 0.7 || liquidityAdequacy < 0.2) {
      stage = UserStage.CRITICAL;
    } else if (liquidityAdequacy < 0.5 || debtPressure > 0.4) {
      stage = UserStage.UNSTABLE;
    } else if (goalStatuses.some(g => g.status === 'unviable') || liquidityAdequacy < 1.0) {
      stage = UserStage.STRUCTURING;
    }

    // 5. Capability Gating
    const { authorizedCapabilities, appliedRules, overrides } = this.applyGatingRules(
      globalConfidence, 
      debtPressure, 
      liquidityAdequacy, 
      behavioralConsistency,
      profile
    );

    // 6. Recommendation Level
    let recLevel: 'structure' | 'asset_class' | 'product' = 'structure';
    if (authorizedCapabilities.includes('PRODUCT_ELIGIBLE')) recLevel = 'product';
    else if (authorizedCapabilities.includes('CLASS_RECOMMENDATION')) recLevel = 'asset_class';

    // 7. Reasoning & Evidence
    const reasoning = this.generateReasoning(stage, authorizedCapabilities, globalConfidence);

    // 8. Audit Trace
    const auditTrace: AuditTrace = {
      traceId,
      policyVersion: this.policyVersion,
      timestamp,
      inputSnapshot: this.createSnapshot(profile),
      derivedVariables: {
        globalConfidence,
        debtPressure,
        liquidityAdequacy,
        behavioralConsistency
      },
      rulesEngine: {
        evaluated: ["RULE_DEBT_STRESS", "RULE_LIQUIDITY_CHECK", "RULE_PRODUCT_GATING", "RULE_CONFIDENCE_THRESHOLD"],
        applied: appliedRules,
        overrides
      },
      limitations: this.identifyLimitations(profile),
      decision: {
        authorizedCapabilities,
        primaryAction: this.determinePrimaryAction(stage, debtPressure, liquidityAdequacy)
      }
    };

    return {
      user_stage: stage,
      main_problem: this.determineMainProblem(stage, debtPressure, liquidityAdequacy),
      main_opportunity: stage === UserStage.GROWING ? "Otimização de Portfólio" : "Estabilização Financeira",
      recommended_action: auditTrace.decision.primaryAction,
      urgency: stage === UserStage.CRITICAL ? 'critical' : stage === UserStage.UNSTABLE ? 'high' : 'medium',
      confidence_level: globalConfidence,
      goal_status: goalStatuses,
      authorized_capabilities: authorizedCapabilities,
      eligible_recommendation_level: recLevel,
      reasoning,
      evidence: {
        debtPressure,
        liquidityAdequacy,
        globalConfidence,
        behavioralConsistency
      },
      audit_trace: auditTrace
    };
  }

  private calculateGlobalConfidence(profile: UserFinancialProfile): number {
    const weights: Record<string, number> = {
      income: 1.0,
      expenses: 1.0,
      liquidAssets: 0.8,
      totalDebt: 0.9,
      highInterestDebt: 0.9,
    };

    const stateWeights: Record<DataState, number> = {
      [DataState.HAS_VALUE]: 1.0,
      [DataState.ESTIMATED]: 0.5,
      [DataState.INFERRED]: 0.3,
      [DataState.UNKNOWN_NOT_ASKED]: 0,
      [DataState.UNKNOWN_SKIPPED]: 0,
      [DataState.UNKNOWN_REFUSED]: 0.05,
      [DataState.DOES_NOT_HAVE]: 1.0,
    };

    let totalWeight = 0;
    let weightedSum = 0;

    for (const key in weights) {
      const container = (profile as any)[key];
      if (container) {
        const w = weights[key];
        const s = stateWeights[container.state as DataState] ?? 0;
        weightedSum += w * s * container.confidence;
        totalWeight += w;
      }
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private calculateDynamicLiquidityTarget(profile: UserFinancialProfile): number {
    let target = 6; // Base
    // Simplified logic: if age is high or income is inferred, increase target
    if ((profile.age.value || 0) > 50) target += 2;
    if (profile.income.origin === 'inference_engine') target += 2;
    return target;
  }

  private applyGatingRules(
    conf: number, 
    debt: number, 
    liq: number, 
    cons: number,
    profile: UserFinancialProfile
  ) {
    const authorizedCapabilities: AuthorizedCapability[] = ['STRUCTURAL_ONLY'];
    const appliedRules: string[] = ["RULE_BASE_STRUCTURAL"];
    const overrides: any[] = [];

    // Goal Simulation
    if (conf > 0.4 && profile.income.state !== DataState.UNKNOWN_REFUSED) {
      authorizedCapabilities.push('GOAL_SIMULATION');
      appliedRules.push("RULE_GOAL_SIMULATION_ENABLED");
    } else {
      overrides.push({ rule: "GOAL_SIMULATION", status: "BLOCKED", reason: "LOW_CONFIDENCE_OR_REFUSED_INCOME" });
    }

    // Class Recommendation
    if (liq > 0.5 && debt < 0.4 && conf > 0.6) {
      authorizedCapabilities.push('CLASS_RECOMMENDATION');
      appliedRules.push("RULE_CLASS_REC_ENABLED");
    }

    // Product Eligible
    if (liq >= 1.0 && debt < 0.2 && conf > 0.8 && cons > 0.6) {
      authorizedCapabilities.push('PRODUCT_ELIGIBLE');
      appliedRules.push("RULE_PRODUCT_ELIGIBLE_ENABLED");
    } else {
      if (liq < 1.0) overrides.push({ rule: "PRODUCT_ELIGIBLE", status: "BLOCKED", reason: "INSUFFICIENT_LIQUIDITY" });
      if (conf <= 0.8) overrides.push({ rule: "PRODUCT_ELIGIBLE", status: "BLOCKED", reason: "CONFIDENCE_BELOW_THRESHOLD" });
    }

    // High Risk
    if (liq > 1.5 && conf > 0.9 && profile.investorProfile.value === 'aggressive') {
      authorizedCapabilities.push('HIGH_RISK_ALLOWED');
      appliedRules.push("RULE_HIGH_RISK_ENABLED");
    }

    return { authorizedCapabilities, appliedRules, overrides };
  }

  private determinePrimaryAction(stage: UserStage, debt: number, liq: number): string {
    if (debt > 0.5) return "Plano de Quitação de Dívidas";
    if (liq < 1.0) return "Construção de Reserva de Emergência";
    if (stage === UserStage.STRUCTURING) return "Ajuste de Cronograma de Metas";
    return "Diversificação de Ativos";
  }

  private determineMainProblem(stage: UserStage, debt: number, liq: number): string {
    if (debt > 0.7) return "ALTA_PRESSAO_DE_DIVIDA";
    if (liq < 0.3) return "RISCO_DE_INSOLVENCIA_LIQUIDEZ";
    if (stage === UserStage.STRUCTURING) return "DESALINHAMENTO_DE_METAS";
    return "NENHUM_DETECTADO";
  }

  private generateReasoning(stage: UserStage, caps: AuthorizedCapability[], conf: number): string {
    let text = `Diagnóstico em estágio ${stage}. `;
    if (conf < 0.6) text += "A precisão está limitada pela falta de dados confirmados. ";
    if (!caps.includes('PRODUCT_ELIGIBLE')) text += "Recomendações de produtos específicos estão bloqueadas por critérios de segurança. ";
    return text;
  }

  private createSnapshot(profile: UserFinancialProfile): Record<string, any> {
    const snapshot: any = {};
    for (const key in profile) {
      if (key !== 'goals') {
        const container = (profile as any)[key];
        snapshot[key] = { val: container.value, state: container.state, conf: container.confidence };
      }
    }
    return snapshot;
  }

  private identifyLimitations(profile: UserFinancialProfile): any[] {
    const limitations = [];
    if (profile.expenses.state === DataState.ESTIMATED) {
      limitations.push({ field: "expenses", impact: "PRECISAO_REDUZIDA_NO_CALCULO_DE_SUPERAVIT" });
    }
    if (profile.income.state === DataState.UNKNOWN_SKIPPED) {
      limitations.push({ field: "income", impact: "IMPOSSIBILIDADE_DE_VALIDAR_CAPACIDADE_DE_APORTE" });
    }
    return limitations;
  }
}
