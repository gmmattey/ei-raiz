import { apiRequest } from './http';

export interface VeraCTA {
  label: string;
  action: string;
  payload?: Record<string, unknown>;
}

export interface VeraBadge {
  label: string;
  type: 'neutral' | 'info' | 'warning' | 'critical' | 'positive';
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
  cta?: VeraCTA;
  badges?: VeraBadge[];
  metadata: {
    template_key: string;
    stage?: string;
    confidence?: number;
    trace_id?: string;
    authorized_capabilities?: string[];
    blocked_capabilities?: string[];
  };
}

export interface VeraAvaliacaoResponse {
  engine: 'vera';
  decision: any;
  frontend_payload: VeraFrontendPayload;
  audit_trace?: {
    trace_id: string;
    policy_version?: string;
    timestamp?: number;
    limitations?: Array<{ field: string; impact: string }>;
  };
}

export function avaliarComVera(payload: Record<string, unknown>): Promise<VeraAvaliacaoResponse> {
  return apiRequest('/api/vera/avaliar', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
