export type LoadPhase = 'idle' | 'loading' | 'success' | 'error';

export type OperationFeedback = {
  phase: LoadPhase;
  label: string;
  detail?: string;
  /**
   * Quando houver polling/steps, permite indicar "o que esta acontecendo" sem layout.
   * 0..100 quando fizer sentido.
   */
  progressPct?: number;
};

export function loading(label: string, detail?: string): OperationFeedback {
  return { phase: 'loading', label, detail };
}

export function success(label: string, detail?: string): OperationFeedback {
  return { phase: 'success', label, detail };
}

export function error(label: string, detail?: string): OperationFeedback {
  return { phase: 'error', label, detail };
}

