import type { AppDataSources } from '../data_sources';
import type {
  ApiAnalysisEnvelope,
  ApiDashboardHomeEnvelope,
  ApiHoldingDetailEnvelope,
  ApiImportCommitEnvelope,
  ApiImportPreviewEnvelope,
  ApiImportStartEnvelope,
  ApiImportsCenterEnvelope,
  ApiPortfolioEnvelope,
  ApiHistorySnapshotsEnvelope,
  ApiHistoryTimelineEnvelope,
  ApiProfileContextGetEnvelope,
  ApiProfileContextPutEnvelope,
  ProfileContextPutRequest
} from '../contracts';
import type { JsonLoader } from '../types';

export interface MockProviderOptions {
  loader: JsonLoader;
  basePath?: string;
}

export function createLocalMockDataSources(options: MockProviderOptions): AppDataSources {
  const basePath = (options.basePath ?? 'apps/web/src/core/data/mock/local').replace(/\/+$/, '');
  const loader = options.loader;

  let profileCache: ApiProfileContextGetEnvelope | null = null;

  async function loadProfile(): Promise<ApiProfileContextGetEnvelope> {
    if (profileCache) return profileCache;
    profileCache = await loader.load<ApiProfileContextGetEnvelope>(`${basePath}/profile_context.json`);
    return profileCache;
  }

  return {
    dashboard: {
      async getDashboardHome(): Promise<ApiDashboardHomeEnvelope> {
        return await loader.load<ApiDashboardHomeEnvelope>(`${basePath}/dashboard_home.json`);
      }
    },
    analysis: {
      async getAnalysis(): Promise<ApiAnalysisEnvelope> {
        return await loader.load<ApiAnalysisEnvelope>(`${basePath}/analysis.json`);
      }
    },
    history: {
      async getHistorySnapshots(): Promise<ApiHistorySnapshotsEnvelope> {
        return await loader.load<ApiHistorySnapshotsEnvelope>(`${basePath}/history_snapshots.json`);
      },
      async getHistoryTimeline(): Promise<ApiHistoryTimelineEnvelope> {
        return await loader.load<ApiHistoryTimelineEnvelope>(`${basePath}/history_timeline.json`);
      }
    },
    portfolio: {
      async getPortfolio(): Promise<ApiPortfolioEnvelope> {
        return await loader.load<ApiPortfolioEnvelope>(`${basePath}/portfolio.json`);
      }
    },
    holdingDetail: {
      async getHoldingDetail(input: { portfolioId: string; holdingId: string }): Promise<ApiHoldingDetailEnvelope> {
        if (basePath.includes('apps/web/src/core/data/mock/hml')) {
          return {
            ok: true,
            meta: {
              requestId: 'req_hml_holding_redirect',
              timestamp: new Date().toISOString(),
              version: 'v1'
            },
            data: { screenState: 'redirect_onboarding', redirectTo: '/onboarding' }
          };
        }

        // Mock deterministico por holdingId, para cobrir fundo/previdencia/acao sem UI real.
        const holdingId = input.holdingId;
        const file =
          holdingId === 'pos_bal_3' ? 'holding_detail_pos_bal_3.json'
            : holdingId === 'pos_bal_4' ? 'holding_detail_pos_bal_4.json'
              : 'holding_detail_pos_1.json';
        return await loader.load<ApiHoldingDetailEnvelope>(`${basePath}/${file}`);
      }
    },
    profile: {
      async getProfileContext(): Promise<ApiProfileContextGetEnvelope> {
        return await loadProfile();
      },
      async putProfileContext(_input: ProfileContextPutRequest): Promise<ApiProfileContextPutEnvelope> {
        // Mock persistente em memoria: aplica patch e devolve estado atualizado
        const input = _input;
        const current = await loadProfile();
        if (!current.ok) return current as unknown as ApiProfileContextPutEnvelope;

        const nextContext = { ...current.data.context, ...(input.context ?? {}) };
        const currentOnboarding = current.data.onboarding;

        const step = input.step ?? null;
        const completedSteps = new Set(currentOnboarding.completedSteps ?? []);
        if (step) completedSteps.add(step);

        const nextOnboarding = {
          ...currentOnboarding,
          currentStep: step ?? currentOnboarding.currentStep,
          completedSteps: Array.from(completedSteps),
          completed: step === 'confirm' ? true : currentOnboarding.completed,
          completedAt: step === 'confirm' ? new Date().toISOString() : currentOnboarding.completedAt,
          homeUnlocked: step === 'confirm' ? true : currentOnboarding.homeUnlocked
        };

        profileCache = {
          ...current,
          data: {
            ...current.data,
            context: nextContext,
            onboarding: nextOnboarding
          }
        };

        const { backendHealth, ...rest } = profileCache.data;
        return {
          ok: true,
          meta: current.meta,
          data: rest
        };
      }
    }
    ,
    importsCenter: {
      async getImportsCenter(): Promise<ApiImportsCenterEnvelope> {
        return await loader.load<ApiImportsCenterEnvelope>(`${basePath}/imports_center.json`);
      }
    },
    imports: {
      async startImport(_input?: { payload?: unknown }): Promise<ApiImportStartEnvelope> {
        return await loader.load<ApiImportStartEnvelope>(`${basePath}/imports_start.json`);
      },
      async getImportPreview(_input: { importId: string }): Promise<ApiImportPreviewEnvelope> {
        return await loader.load<ApiImportPreviewEnvelope>(`${basePath}/imports_preview.json`);
      },
      async commitImport(_input: { importId: string }): Promise<ApiImportCommitEnvelope> {
        return await loader.load<ApiImportCommitEnvelope>(`${basePath}/imports_commit.json`);
      }
    }
  };
}
