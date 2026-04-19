import { vera, VeraService } from './vera/service';
import { StudioStore } from './vera/studio-store';
import { TemplateRenderer } from './vera/studio-renderer';
import type { VeraModelParams } from './vera/core';
import type {
  UserFinancialProfile,
  BehavioralHistory,
  VeraIntegrationOutput,
  MessageTemplate,
} from './vera/types';

/**
 * Carrega overrides do modelo Vera de `configuracoes_produto` (chave `vera.v1`).
 * Sem registro? Usa defaults explícitos de `DEFAULT_VERA_MODEL_PARAMS`.
 */
export async function loadVeraModelParams(db: D1Database): Promise<Partial<VeraModelParams>> {
  try {
    const row = await db
      .prepare("SELECT valor_json FROM configuracoes_produto WHERE chave = 'vera.v1' LIMIT 1")
      .first<{ valor_json: string | null }>();
    if (!row?.valor_json) return {};
    const parsed = JSON.parse(row.valor_json) as { modelParams?: Partial<VeraModelParams> };
    return parsed.modelParams ?? {};
  } catch {
    return {};
  }
}

// Public contract types
export interface SemanticContainerInput<T> {
  value: T | null;
  state?: string;
  origin?: string;
  confidence?: number;
  isEstimated?: boolean;
}

export interface GoalInputRequest {
  id?: string;
  title: string;
  category?: string;
  target_amount?: SemanticContainerInput<number>;
  current_allocated_amount?: SemanticContainerInput<number>;
  target_date?: SemanticContainerInput<string>;
  priority?: SemanticContainerInput<string>;
  flexibility?: SemanticContainerInput<number>;
}

export interface VeraAvaliacaoRequest {
  user_id?: string;
  profile: {
    age?: SemanticContainerInput<number>;
    investor_profile_declared?: SemanticContainerInput<string>;
    monthly_income?: SemanticContainerInput<number>;
    monthly_expenses?: SemanticContainerInput<number>;
    monthly_surplus?: SemanticContainerInput<number>;
    current_reserve?: SemanticContainerInput<number>;
    target_reserve?: SemanticContainerInput<number>;
    debt_total?: SemanticContainerInput<number>;
    debt_monthly_payment?: SemanticContainerInput<number>;
    debt_interest_monthly?: SemanticContainerInput<number>;
    high_interest_debt?: SemanticContainerInput<number>;
    goals?: GoalInputRequest[];
  };
  history?: {
    recommendations_completed?: number;
    recommendations_ignored?: number;
    recommendations_postponed?: number;
    average_time_to_action_days?: number;
    promised_vs_actual_contribution_ratio?: number;
  };
}

export interface VeraFrontendPayload {
  kind: 'insight_card' | 'recommendation_card' | 'warning_card' | 'goal_card';
  id: string;
  decision_type: string;
  severity: 'low' | 'medium' | 'high';
  tone: 'neutral' | 'warning' | 'positive' | 'critical';
  status: 'active' | 'informational' | 'blocked';
  title: string;
  body: string;
  supporting_text?: string;
  cta?: {
    label: string;
    action: string;
    payload?: Record<string, unknown>;
  };
  badges?: Array<{
    label: string;
    type: 'neutral' | 'info' | 'warning' | 'critical' | 'positive';
  }>;
  metadata: {
    template_key: string;
    stage?: string;
    confidence?: number;
    trace_id?: string;
    authorized_capabilities?: string[];
    blocked_capabilities?: string[];
  };
}

export interface VeraDecisionPayload {
  decision_type: string;
  stage?: string;
  urgency: 'low' | 'medium' | 'high';
  template_key: string;
  variables: Record<string, unknown>;
  authorized_capabilities: string[];
  blocked_capabilities: string[];
  confidence?: number;
  explanation?: {
    main_reason?: string;
    secondary_reason?: string;
    rationale?: string;
  };
  trace_id?: string;
}

export interface VeraAvaliacaoResponse {
  engine: 'vera';
  decision: VeraDecisionPayload;
  frontend_payload: VeraFrontendPayload;
  audit_trace?: {
    trace_id: string;
    policy_version?: string;
    timestamp?: number;
    limitations?: Array<{ field: string; impact: string }>;
  };
}

/**
 * VeraBridge — Maps public contract to internal types, calls Vera engine, produces frontend_payload
 *
 * Responsibility:
 * - Map VeraAvaliacaoRequest → UserFinancialProfile + BehavioralHistory
 * - Call vera.evaluate()
 * - Vera returns VeraIntegrationOutput with template_key + variables
 * - Resolve template via StudioStore + TemplateRenderer (Vera's internal responsibility)
 * - Build VeraAvaliacaoResponse with frontend_payload pronto
 */
export class VeraBridge {
  private store = new StudioStore();
  private renderer = new TemplateRenderer();

  public avaliar(request: VeraAvaliacaoRequest, modelParams: Partial<VeraModelParams> = {}): VeraAvaliacaoResponse {
    const profile = this.mapProfile(request.profile);
    const history = this.mapHistory(request.history);

    // Call Vera engine — se params vieram do DB, instancia novo serviço; senão usa singleton default.
    const engine = Object.keys(modelParams).length > 0 ? new VeraService(modelParams) : vera;
    const veraOutput: VeraIntegrationOutput = engine.evaluate(profile, history);

    // Resolve template → frontend_payload
    const template = this.store.getTemplateByKey(veraOutput.template_payload.template_key);
    const rendered = template
      ? this.renderer.render(template, veraOutput.template_payload.variables)
      : null;

    // Determine card kind based on stage and template
    const kind = this.resolveKind(veraOutput);

    // Determine tone based on urgency (allow critical)
    const severity = veraOutput.template_payload.severity as string;
    const tone = this.resolveTone(severity);

    // Resolve CTA action
    const ctaAction = this.resolveCtaAction(veraOutput);

    // Build badges
    const badges = this.resolveBadges(veraOutput.template_payload.severity);

    const frontendPayload: VeraFrontendPayload = {
      kind,
      id: veraOutput.decision.audit_trace?.traceId ?? crypto.randomUUID(),
      decision_type: veraOutput.decision.main_problem ?? 'generic',
      severity: this.mapSeverity(severity as string),
      tone,
      status: 'active',
      title: rendered?.title ?? veraOutput.decision.reasoning,
      body: rendered?.body ?? '',
      supporting_text: rendered?.subject,
      cta: ctaAction ? { label: rendered?.cta ?? 'Ver detalhes', action: ctaAction } : undefined,
      badges,
      metadata: {
        template_key: veraOutput.template_payload.template_key,
        stage: veraOutput.decision.user_stage,
        confidence: veraOutput.decision.confidence_level,
        trace_id: veraOutput.decision.audit_trace?.traceId,
        authorized_capabilities: veraOutput.capabilities.authorized,
        blocked_capabilities: veraOutput.capabilities.blocked,
      },
    };

    const mapUrgency = (u: string): 'low' | 'medium' | 'high' => {
      if (u === 'critical') return 'high';
      return (u as 'low' | 'medium' | 'high') || 'low';
    };

    const decisionPayload: VeraDecisionPayload = {
      decision_type: veraOutput.decision.main_problem ?? 'generic',
      stage: veraOutput.decision.user_stage,
      urgency: mapUrgency(veraOutput.decision.urgency),
      template_key: veraOutput.template_payload.template_key,
      variables: veraOutput.template_payload.variables,
      authorized_capabilities: veraOutput.capabilities.authorized,
      blocked_capabilities: veraOutput.capabilities.blocked,
      confidence: veraOutput.decision.confidence_level,
      explanation: {
        main_reason: veraOutput.explanation.primary_reason,
        secondary_reason: veraOutput.explanation.secondary_reason,
        rationale: veraOutput.decision.reasoning,
      },
      trace_id: veraOutput.decision.audit_trace?.traceId,
    };

    return {
      engine: 'vera',
      decision: decisionPayload,
      frontend_payload: frontendPayload,
      audit_trace: veraOutput.decision.audit_trace
        ? {
            trace_id: veraOutput.decision.audit_trace.traceId,
            policy_version: veraOutput.decision.audit_trace.policyVersion,
            timestamp: Date.parse(veraOutput.decision.audit_trace.timestamp),
            limitations: veraOutput.decision.audit_trace.limitations,
          }
        : undefined,
    };
  }

  private mapProfile(input: VeraAvaliacaoRequest['profile']): UserFinancialProfile {
    const now = Date.now();
    const timestamp = new Date().toISOString();

    const wrap = <T>(sc: SemanticContainerInput<T> | undefined, fallback: T | null = null): any => ({
      value: sc?.value ?? fallback,
      state: sc?.state ?? 'UNKNOWN_NOT_ASKED',
      origin: sc?.origin ?? 'user_input',
      confidence: sc?.confidence ?? 0,
      lastUpdated: timestamp,
      isEstimated: sc?.isEstimated ?? false,
    });

    const dateToMonths = (isoDate?: string | null): number => {
      if (!isoDate) return 24;
      const diff = new Date(isoDate).getTime() - Date.now();
      return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24 * 30)));
    };

    return {
      income: wrap(input.monthly_income),
      expenses: wrap(input.monthly_expenses),
      liquidAssets: wrap(input.current_reserve),
      totalDebt: wrap(input.debt_total),
      // highInterestDebt: only if explicit, otherwise UNKNOWN_NOT_ASKED
      highInterestDebt: input.high_interest_debt
        ? wrap(input.high_interest_debt)
        : wrap(undefined),
      age: wrap(input.age),
      investorProfile: wrap(input.investor_profile_declared),
      goals: (input.goals ?? []).map((g) => {
        const priorityMap: Record<string, number> = { high: 3, medium: 2, low: 1 };
        const priorityValue = g.priority?.value;
        const priorityNum = priorityValue && (priorityValue === 'high' || priorityValue === 'medium' || priorityValue === 'low')
          ? priorityMap[priorityValue]
          : 2;

        return {
          id: g.id ?? crypto.randomUUID(),
          type: g.category ?? 'generic',
          title: g.title,
          targetValue: g.target_amount?.value ?? 0,
          currentValue: g.current_allocated_amount?.value ?? 0,
          deadlineMonths: dateToMonths(g.target_date?.value),
          priority: priorityNum,
          flexibility: typeof g.flexibility?.value === 'number' ? g.flexibility.value : 0.5,
        };
      }),
    };
  }

  private mapHistory(input?: VeraAvaliacaoRequest['history']): BehavioralHistory {
    const completedCount = input?.recommendations_completed ?? 0;
    const ignoredCount = input?.recommendations_ignored ?? 0;
    const postponedCount = input?.recommendations_postponed ?? 0;
    const totalCount = completedCount + ignoredCount + postponedCount;

    return {
      acceptedCount: completedCount,
      ignoredCount: ignoredCount,
      postponedCount: postponedCount,
      consistencyScore: input?.promised_vs_actual_contribution_ratio ?? 0.5,
      executionRate: totalCount > 0 ? completedCount / totalCount : 0.5,
      averageTimeToAction: input?.average_time_to_action_days ?? 7,
    };
  }

  private resolveKind(output: VeraIntegrationOutput): VeraFrontendPayload['kind'] {
    const stage = output.decision.user_stage;
    if (stage === 'CRITICAL' || stage === 'UNSTABLE') return 'warning_card';
    if (output.template_payload.template_key.includes('goal')) return 'goal_card';
    if (output.capabilities.authorized.includes('PRODUCT_ELIGIBLE')) return 'recommendation_card';
    return 'insight_card';
  }

  private resolveTone(severity: string): VeraFrontendPayload['tone'] {
    const map: Record<string, VeraFrontendPayload['tone']> = {
      critical: 'critical',
      error: 'critical',
      high: 'critical',
      warning: 'warning',
      medium: 'warning',
      info: 'neutral',
      success: 'positive',
      low: 'neutral',
    };
    return map[severity] ?? 'neutral';
  }

  private resolveCtaAction(output: VeraIntegrationOutput): string | null {
    const key = output.template_payload.template_key;
    if (key.includes('reserve')) return 'OPEN_RESERVE_FLOW';
    if (key.includes('goal')) return 'OPEN_GOAL_REVIEW';
    if (key.includes('debt')) return 'OPEN_DEBT_FLOW';
    return null;
  }

  private mapSeverity(severity: string): 'low' | 'medium' | 'high' {
    const map: Record<string, 'low' | 'medium' | 'high'> = {
      critical: 'high',
      error: 'high',
      high: 'high',
      warning: 'medium',
      medium: 'medium',
      info: 'low',
      success: 'low',
      low: 'low',
    };
    return map[severity] ?? 'low';
  }

  private resolveBadges(severity: string): VeraFrontendPayload['badges'] {
    const badges: VeraFrontendPayload['badges'] = [];
    if (severity === 'high' || severity === 'error' || severity === 'critical') {
      badges.push({ label: 'Prioridade alta', type: 'critical' });
    } else if (severity === 'medium' || severity === 'warning') {
      badges.push({ label: 'Atenção', type: 'warning' });
    }
    return badges.length > 0 ? badges : undefined;
  }
}

export const veraBridge = new VeraBridge();
