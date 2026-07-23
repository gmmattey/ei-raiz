import type {
  ApiHistorySnapshotsEnvelope,
  ApiHistoryTimelineEnvelope,
  EmptyState,
  HistorySnapshotsData,
  HistorySnapshotsEmptyData,
  HistorySnapshotsReadyData,
  HistoryTimelineData,
  HistoryTimelineEmptyData,
  HistoryTimelineReadyData
} from '../../core/data/contracts';
import type { HistoryDataSource } from '../../core/data/data_sources';
import { createRouter, type Router } from '../../core/router';
import { toEmptyStateViewModel, type EmptyStateViewModel } from '../../core/view_models/empty_state';
import type { OperationFeedback } from '../../core/ops/load_state';
import { loading } from '../../core/ops/load_state';
import { toErrorFeedback } from '../../core/ops/error_catalog';

export type HistoryViewModel =
  | { kind: 'redirect_onboarding'; redirectTo: string }
  | { kind: 'empty'; portfolioId: string; emptyState: EmptyStateViewModel }
  | {
      kind: 'ready';
      portfolioId: string;
      snapshots: HistorySnapshotsReadyData['snapshots'];
      timelineItems: HistoryTimelineReadyData['items'];
      targets: {
        openPortfolio: { pathname: string };
        openRadar: { pathname: string };
      };
    }
  | { kind: 'error'; code?: string; message?: string };

export interface HistoryControllerResult {
  snapshots: ApiHistorySnapshotsEnvelope;
  timeline: ApiHistoryTimelineEnvelope;
  viewModel: HistoryViewModel;
  loadingFeedback: OperationFeedback;
  errorFeedback?: OperationFeedback;
}

export interface HistoryController {
  load(input?: { limit?: number }): Promise<HistoryControllerResult>;
}

/**
 * Historico: snapshots + timeline/eventos de forma util, coerente com a Home/Radar.
 * Controller headless centraliza os dois endpoints.
 */
export function createHistoryController(input: { history: HistoryDataSource; router?: Router }): HistoryController {
  const history = input.history;
  const router = input.router ?? createRouter();
  const loadingFeedback = loading('Carregando Historico', 'Buscando snapshots e eventos.');

  return {
    async load(opts) {
      const [snapshots, timeline] = await Promise.all([
        history.getHistorySnapshots(opts),
        history.getHistoryTimeline(opts)
      ]);

      if (!snapshots.ok) {
        return {
          snapshots,
          timeline,
          viewModel: { kind: 'error', code: snapshots.error.code, message: snapshots.error.message },
          loadingFeedback,
          errorFeedback: toErrorFeedback(snapshots.error, { area: 'history' })
        };
      }
      if (!timeline.ok) {
        return {
          snapshots,
          timeline,
          viewModel: { kind: 'error', code: timeline.error.code, message: timeline.error.message },
          loadingFeedback,
          errorFeedback: toErrorFeedback(timeline.error, { area: 'history' })
        };
      }

      const sData = snapshots.data as HistorySnapshotsData;
      const tData = timeline.data as HistoryTimelineData;

      if ('screenState' in sData && sData.screenState === 'redirect_onboarding') {
        return { snapshots, timeline, viewModel: { kind: 'redirect_onboarding', redirectTo: sData.redirectTo || '/onboarding' }, loadingFeedback };
      }

      if ('screenState' in tData && tData.screenState === 'redirect_onboarding') {
        return { snapshots, timeline, viewModel: { kind: 'redirect_onboarding', redirectTo: tData.redirectTo || '/onboarding' }, loadingFeedback };
      }

      if (sData.screenState === 'empty' || tData.screenState === 'empty') {
        const emptyState = (sData.screenState === 'empty'
          ? (sData as HistorySnapshotsEmptyData).emptyState
          : (tData as HistoryTimelineEmptyData).emptyState);
        const portfolioId = sData.portfolioId;
        return { snapshots, timeline, viewModel: { kind: 'empty', portfolioId, emptyState: toEmptyStateViewModel(emptyState) }, loadingFeedback };
      }

      const sReady = sData as HistorySnapshotsReadyData;
      const tReady = tData as HistoryTimelineReadyData;
      return {
        snapshots,
        timeline,
        loadingFeedback,
        viewModel: {
          kind: 'ready',
          portfolioId: sReady.portfolioId,
          snapshots: sReady.snapshots,
          timelineItems: tReady.items,
          targets: {
            openPortfolio: { pathname: router.build({ id: 'portfolio' }) },
            openRadar: { pathname: router.build({ id: 'radar' }) }
          }
        }
      };
    }
  };
}
