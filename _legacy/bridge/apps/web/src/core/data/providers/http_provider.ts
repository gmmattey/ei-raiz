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

export interface HttpProviderOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

export function createHttpDataSources(options: HttpProviderOptions): AppDataSources {
  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = options.baseUrl.replace(/\/+$/, '');

  return {
    dashboard: {
      async getDashboardHome(): Promise<ApiDashboardHomeEnvelope> {
        return await fetchJson<ApiDashboardHomeEnvelope>(fetchImpl, `${baseUrl}/v1/dashboard/home`);
      }
    },
    analysis: {
      async getAnalysis(): Promise<ApiAnalysisEnvelope> {
        return await fetchJson<ApiAnalysisEnvelope>(fetchImpl, `${baseUrl}/v1/analysis`);
      }
    },
    history: {
      async getHistorySnapshots(input?: { limit?: number }): Promise<ApiHistorySnapshotsEnvelope> {
        const url = new URL(`${baseUrl}/v1/history/snapshots`);
        if (input?.limit != null) url.searchParams.set('limit', String(input.limit));
        return await fetchJson<ApiHistorySnapshotsEnvelope>(fetchImpl, url.toString());
      },
      async getHistoryTimeline(input?: { limit?: number }): Promise<ApiHistoryTimelineEnvelope> {
        const url = new URL(`${baseUrl}/v1/history/timeline`);
        if (input?.limit != null) url.searchParams.set('limit', String(input.limit));
        return await fetchJson<ApiHistoryTimelineEnvelope>(fetchImpl, url.toString());
      }
    },
    portfolio: {
      async getPortfolio(input?: { performance?: 'all' | 'best' | 'worst' }): Promise<ApiPortfolioEnvelope> {
        const url = new URL(`${baseUrl}/v1/portfolio`);
        if (input?.performance) url.searchParams.set('performance', input.performance);
        return await fetchJson<ApiPortfolioEnvelope>(fetchImpl, url.toString());
      }
    },
    holdingDetail: {
      async getHoldingDetail(input: { portfolioId: string; holdingId: string }): Promise<ApiHoldingDetailEnvelope> {
        const path = `/v1/portfolio/${encodeURIComponent(input.portfolioId)}/holdings/${encodeURIComponent(input.holdingId)}`;
        return await fetchJson<ApiHoldingDetailEnvelope>(fetchImpl, `${baseUrl}${path}`);
      }
    },
    profile: {
      async getProfileContext(): Promise<ApiProfileContextGetEnvelope> {
        return await fetchJson<ApiProfileContextGetEnvelope>(fetchImpl, `${baseUrl}/v1/profile/context`);
      },
      async putProfileContext(input: ProfileContextPutRequest): Promise<ApiProfileContextPutEnvelope> {
        return await fetchJson<ApiProfileContextPutEnvelope>(fetchImpl, `${baseUrl}/v1/profile/context`, {
          method: 'PUT',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(input)
        });
      }
    },
    importsCenter: {
      async getImportsCenter(): Promise<ApiImportsCenterEnvelope> {
        return await fetchJson<ApiImportsCenterEnvelope>(fetchImpl, `${baseUrl}/v1/history/imports`);
      }
    },
    imports: {
      async startImport(input?: { payload?: unknown }): Promise<ApiImportStartEnvelope> {
        // OpenAPI atual nao define request body; payload fica opcional para evolucao sem quebrar UI.
        return await fetchJson<ApiImportStartEnvelope>(fetchImpl, `${baseUrl}/v1/imports/start`, input?.payload !== undefined
          ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(input.payload) }
          : { method: 'POST' });
      },
      async getImportPreview(input: { importId: string }): Promise<ApiImportPreviewEnvelope> {
        return await fetchJson<ApiImportPreviewEnvelope>(fetchImpl, `${baseUrl}/v1/imports/${encodeURIComponent(input.importId)}/preview`);
      },
      async commitImport(input: { importId: string }): Promise<ApiImportCommitEnvelope> {
        return await fetchJson<ApiImportCommitEnvelope>(fetchImpl, `${baseUrl}/v1/imports/${encodeURIComponent(input.importId)}/commit`, { method: 'POST' });
      }
    }
  };
}

async function fetchJson<T>(fetchImpl: typeof fetch, url: string, init?: RequestInit): Promise<T> {
  const response = await fetchImpl(url, { credentials: 'include', ...init });
  return await response.json() as T;
}
