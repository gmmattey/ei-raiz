import type { AnalysisData, ApiAnalysisEnvelope, AnalysisPendingData, AnalysisReadyData } from '../../core/data/contracts';
import type { AnalysisDataSource } from '../../core/data/data_sources';
import { createRouter, tryParseRoute, type Router } from '../../core/router';
import { toEmptyStateViewModel, type EmptyStateViewModel } from '../../core/view_models/empty_state';
import type { OperationFeedback } from '../../core/ops/load_state';
import { loading } from '../../core/ops/load_state';
import { toErrorFeedback } from '../../core/ops/error_catalog';

export type AnalysisViewModel =
  | { kind: 'redirect_onboarding'; redirectTo: string }
  | { kind: 'pending'; portfolioId: string; pendingState: EmptyStateViewModel }
  | {
      kind: 'ready';
      portfolioId: string;
      analysisId: string;
      snapshotId: string;
      score: { value: number; status: string; explanation: string };
      primaryProblem: { code: string; title: string; body: string; severity: string };
      primaryAction: { code: string; title: string; body: string; ctaLabel: string; target: string };
      insights: Array<{ kind: string; title: string; body: string; priority: number }>;
      generatedAt: string;
      targets: {
        primaryAction?: { pathname: string };
        openPortfolio: { pathname: string };
      };
    }
  | { kind: 'error'; code?: string; message?: string };

export interface AnalysisControllerResult {
  envelope: ApiAnalysisEnvelope;
  viewModel: AnalysisViewModel;
  loadingFeedback: OperationFeedback;
  errorFeedback?: OperationFeedback;
}

export interface AnalysisController {
  load(): Promise<AnalysisControllerResult>;
}

/**
 * Radar/Analise: precisa explicar e orientar e ser coerente com a Home.
 * Este controller centraliza o payload e valida targets de navegacao.
 */
export function createAnalysisController(input: { analysis: AnalysisDataSource; router?: Router }): AnalysisController {
  const analysis = input.analysis;
  const router = input.router ?? createRouter();
  const loadingFeedback = loading('Carregando Radar', 'Gerando/recuperando analise e score.');

  return {
    async load() {
      const envelope = await analysis.getAnalysis();
      if (!envelope.ok) {
        return {
          envelope,
          viewModel: { kind: 'error', code: envelope.error.code, message: envelope.error.message },
          loadingFeedback,
          errorFeedback: toErrorFeedback(envelope.error, { area: 'analysis' })
        };
      }

      const data = envelope.data as AnalysisData;
      if ('screenState' in data && data.screenState === 'redirect_onboarding') {
        return { envelope, viewModel: { kind: 'redirect_onboarding', redirectTo: data.redirectTo || '/onboarding' }, loadingFeedback };
      }

      if ('screenState' in data && data.screenState === 'pending') {
        return {
          envelope,
          viewModel: { kind: 'pending', portfolioId: data.portfolioId, pendingState: toEmptyStateViewModel(data.pendingState) },
          loadingFeedback
        };
      }

      // ready
      const ready = data as AnalysisReadyData;
      const openPortfolio = { pathname: router.build({ id: 'portfolio' }) };
      const primaryTarget = ready.primaryAction?.target ? tryParseRoute({ pathname: ready.primaryAction.target }) : null;

      return {
        envelope,
        loadingFeedback,
        viewModel: {
          kind: 'ready',
          portfolioId: ready.portfolioId,
          analysisId: ready.analysisId,
          snapshotId: ready.snapshotId,
          score: ready.score,
          primaryProblem: ready.primaryProblem,
          primaryAction: ready.primaryAction,
          insights: ready.insights,
          generatedAt: ready.generatedAt,
          targets: {
            openPortfolio,
            primaryAction: primaryTarget ? { pathname: ready.primaryAction.target } : undefined
          }
        }
      };
    }
  };
}
