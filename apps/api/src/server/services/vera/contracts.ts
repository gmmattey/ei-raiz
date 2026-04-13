export type DataState =
  | 'HAS_VALUE'
  | 'DOES_NOT_HAVE'
  | 'UNKNOWN_NOT_ASKED'
  | 'UNKNOWN_SKIPPED'
  | 'UNKNOWN_REFUSED'
  | 'ESTIMATED'
  | 'INFERRED';

export type DataOrigin =
  | 'user_input'
  | 'bank_sync'
  | 'inference_engine'
  | 'default_persona';

export interface SemanticContainer<T> {
  value: T | null;
  state: DataState;
  origin?: DataOrigin;
  confidence?: number;
  recency?: number;
  isEstimated?: boolean;
  metadata?: Record<string, unknown>;
}

export interface GoalInput {
  id?: string;
  title: string;
  category?: string;
  target_amount: SemanticContainer<number>;
  current_allocated_amount?: SemanticContainer<number>;
  target_date?: SemanticContainer<string>;
  priority?: SemanticContainer<'high' | 'medium' | 'low'>;
  flexibility?: SemanticContainer<number>;
}

export interface VeraEvaluationRequest {
  user_id?: string;
  profile: {
    age?: SemanticContainer<number>;
    investor_profile_declared?: SemanticContainer<'conservative' | 'moderate' | 'aggressive'>;
    monthly_income?: SemanticContainer<number>;
    monthly_expenses?: SemanticContainer<number>;
    monthly_surplus?: SemanticContainer<number>;
    current_reserve?: SemanticContainer<number>;
    target_reserve?: SemanticContainer<number>;
    debt_total?: SemanticContainer<number>;
    debt_monthly_payment?: SemanticContainer<number>;
    debt_interest_monthly?: SemanticContainer<number>;
    goals?: GoalInput[];
  };
  history?: {
    recommendations_completed?: number;
    recommendations_ignored?: number;
    recommendations_postponed?: number;
    average_time_to_action_days?: number;
    promised_vs_actual_contribution_ratio?: number;
  };
}

export type AuthorizedCapability =
  | 'STRUCTURAL_ONLY'
  | 'GOAL_SIMULATION'
  | 'CLASS_RECOMMENDATION'
  | 'PRODUCT_ELIGIBLE'
  | 'HIGH_RISK_ALLOWED';

export interface VeraDecisionPayload {
  decision_type: string;
  stage?: 'CRITICAL' | 'UNSTABLE' | 'STRUCTURING' | 'GROWING';
  urgency: 'low' | 'medium' | 'high';
  template_key: string;
  variables: Record<string, unknown>;
  authorized_capabilities: AuthorizedCapability[];
  blocked_capabilities: string[];
  confidence?: number;
  explanation?: {
    main_reason?: string;
    secondary_reason?: string;
    rationale?: string;
  };
  trace_id?: string;
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

export interface VeraEvaluationResponse {
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
