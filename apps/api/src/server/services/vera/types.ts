export enum DataState {
  HAS_VALUE = "HAS_VALUE",
  DOES_NOT_HAVE = "DOES_NOT_HAVE",
  UNKNOWN_NOT_ASKED = "UNKNOWN_NOT_ASKED",
  UNKNOWN_SKIPPED = "UNKNOWN_SKIPPED",
  UNKNOWN_REFUSED = "UNKNOWN_REFUSED",
  ESTIMATED = "ESTIMATED",
  INFERRED = "INFERRED",
}

export interface SemanticContainer<T> {
  value: T | null;
  state: DataState;
  origin: 'user_input' | 'bank_sync' | 'inference_engine' | 'default_persona';
  confidence: number;
  lastUpdated: string;
  isEstimated: boolean;
}

export interface FinancialGoal {
  id: string;
  type: string;
  title: string;
  targetValue: number;
  currentValue: number;
  deadlineMonths: number;
  priority: number;
  flexibility: number;
}

export interface UserFinancialProfile {
  income: SemanticContainer<number>;
  expenses: SemanticContainer<number>;
  liquidAssets: SemanticContainer<number>;
  totalDebt: SemanticContainer<number>;
  highInterestDebt: SemanticContainer<number>;
  age: SemanticContainer<number>;
  investorProfile: SemanticContainer<string>;
  goals: FinancialGoal[];
}

export enum UserStage {
  CRITICAL = "CRITICAL",
  UNSTABLE = "UNSTABLE",
  STRUCTURING = "STRUCTURING",
  GROWING = "GROWING",
}

export interface GoalStatus {
  id: string;
  status: 'viable' | 'tight' | 'unviable';
  requiredMonthlyContribution: number;
  gap: number;
  suggestedAdjustments: string[];
}

export type AuthorizedCapability =
  | 'STRUCTURAL_ONLY'
  | 'GOAL_SIMULATION'
  | 'CLASS_RECOMMENDATION'
  | 'PRODUCT_ELIGIBLE'
  | 'HIGH_RISK_ALLOWED';

export interface AuditTrace {
  traceId: string;
  policyVersion: string;
  timestamp: string;
  inputSnapshot: Record<string, any>;
  derivedVariables: {
    globalConfidence: number;
    debtPressure: number;
    liquidityAdequacy: number;
    behavioralConsistency: number;
  };
  rulesEngine: {
    evaluated: string[];
    applied: string[];
    overrides: Array<{ rule: string; status: string; reason: string }>;
  };
  limitations: Array<{ field: string; impact: string }>;
  decision: {
    authorizedCapabilities: AuthorizedCapability[];
    primaryAction: string;
  };
}

export interface DecisionOutput {
  user_stage: UserStage;
  main_problem: string;
  main_opportunity: string;
  recommended_action: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  confidence_level: number;
  goal_status: GoalStatus[];
  authorized_capabilities: AuthorizedCapability[];
  eligible_recommendation_level: 'structure' | 'asset_class' | 'product';
  reasoning: string;
  evidence: Record<string, any>;
  audit_trace: AuditTrace;
}

/**
 * Legacy narrative contract kept only for backward compatibility with the local demo.
 * Production integrations should prefer template_key + variables via VeraIntegrationOutput.
 */
export interface NarrativeOutput {
  message_type: string;
  severity: 'info' | 'warning' | 'error' | 'success' | 'critical';
  title: string;
  body: string;
  action_label: string;
  action_type: string;
  related_goal?: string;
  source_recommendation_id: string;
}

export interface BehavioralHistory {
  acceptedCount: number;
  ignoredCount: number;
  postponedCount: number;
  consistencyScore: number;
  executionRate: number;
  averageTimeToAction: number;
}

export type DeliveryChannel = 'in_app' | 'email' | 'push';

export interface TemplatePayload {
  template_key: string;
  decision_type: string;
  severity: 'info' | 'warning' | 'error' | 'success' | 'critical';
  variables: Record<string, string | number | boolean | null>;
  suggested_channels: DeliveryChannel[];
}

export interface VeraIntegrationOutput {
  engine: 'vera';
  decision: DecisionOutput;
  template_payload: TemplatePayload;
  capabilities: {
    authorized: AuthorizedCapability[];
    blocked: string[];
  };
  explanation: {
    primary_reason: string;
    secondary_reason?: string;
  };
}

// --- Studio Specific Types ---

export interface MessageTemplate {
  id: string;
  key: string;
  title: string;
  body: string;
  subject?: string;
  cta?: string;
  channels: {
    in_app: boolean;
    email: boolean;
    push: boolean;
  };
  version: 'draft' | 'published';
}

export interface ChannelPolicy {
  priority: ('in_app' | 'email' | 'push')[];
  fallback: 'email' | 'none';
}

export interface FlowMapping {
  decisionType: string;
  templateKey: string;
  channelPolicy: ChannelPolicy;
  severity: 'info' | 'warning' | 'error' | 'success' | 'critical';
}

export interface SimulationOutput {
  decision: DecisionOutput;
  renderedMessages: {
    in_app?: any;
    email?: any;
    push?: any;
  };
  flowPath: string[];
  appliedRules: string[];
  inputEvidence: Record<string, any>;
}
