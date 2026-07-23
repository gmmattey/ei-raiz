import type { AppDataSources } from "../data_sources";
import type {
  ApiAuthLoginEnvelope,
  ApiAuthLogoutEnvelope,
  ApiAuthRegisterEnvelope,
  ApiAuthSessionEnvelope,
  AuthLoginRequest,
  AuthRegisterRequest,
  ApiAnalysisEnvelope,
  ApiDashboardHomeEnvelope,
  ApiHoldingDetailEnvelope,
  ApiPortfolioEnvelope,
  ApiHistorySnapshotsEnvelope,
  ApiHistoryTimelineEnvelope,
  ApiHistoryImportsEnvelope,
  ApiProfileContextGetEnvelope,
  ApiProfileContextPutEnvelope,
  ProfileContextPutRequest,
  ApiHealthEnvelope,
  ApiImportStartEnvelope,
  ApiImportPreviewEnvelope,
  ApiImportCommitEnvelope,
  ApiImportEngineStatusEnvelope,
  ApiImportDetailEnvelope,
  ApiImportConflictsEnvelope,
  ApiImportResolveDuplicateEnvelope,
  ImportResolveDuplicateRequest,
} from "../contracts";
import type { JsonLoader } from "../types";

export interface MockProviderOptions {
  loader: JsonLoader;
  basePath?: string;
}

export function createMockDataSources(options: MockProviderOptions): AppDataSources {
  const basePath = (options.basePath ?? "/src/core/data/mock/hml").replace(/\/+$/, "");
  const loader = options.loader;

  const isHml = basePath.includes("/mock/hml");

  return {
    auth: {
      async register(_input: AuthRegisterRequest): Promise<ApiAuthRegisterEnvelope> {
        return {
          ok: false,
          meta: { requestId: "mock", timestamp: new Date().toISOString(), version: "v1" },
          error: { code: "mock_disabled", message: "Auth real exigida. Desative mocks e conecte na API." },
        };
      },
      async login(_input: AuthLoginRequest): Promise<ApiAuthLoginEnvelope> {
        return {
          ok: false,
          meta: { requestId: "mock", timestamp: new Date().toISOString(), version: "v1" },
          error: { code: "mock_disabled", message: "Auth real exigida. Desative mocks e conecte na API." },
        };
      },
      async getSession(): Promise<ApiAuthSessionEnvelope> {
        return {
          ok: true,
          meta: { requestId: "mock", timestamp: new Date().toISOString(), version: "v1" },
          data: { authenticated: false, nextStep: "/login" },
        };
      },
      async logout(): Promise<ApiAuthLogoutEnvelope> {
        return {
          ok: true,
          meta: { requestId: "mock", timestamp: new Date().toISOString(), version: "v1" },
          data: { authenticated: false, status: "logged_out", nextStep: "/login" },
        };
      },
    },
    dashboard: {
      async getDashboardHome(): Promise<ApiDashboardHomeEnvelope> {
        return await loader.load<ApiDashboardHomeEnvelope>(`${basePath}/dashboard_home.json`);
      },
    },
    health: {
      async getHealth(): Promise<ApiHealthEnvelope> {
        return await loader.load<ApiHealthEnvelope>(`${basePath}/health.json`);
      },
    },
    analysis: {
      async getAnalysis(): Promise<ApiAnalysisEnvelope> {
        return await loader.load<ApiAnalysisEnvelope>(`${basePath}/analysis.json`);
      },
    },
    history: {
      async getHistorySnapshots(): Promise<ApiHistorySnapshotsEnvelope> {
        return await loader.load<ApiHistorySnapshotsEnvelope>(`${basePath}/history_snapshots.json`);
      },
      async getHistoryTimeline(): Promise<ApiHistoryTimelineEnvelope> {
        return await loader.load<ApiHistoryTimelineEnvelope>(`${basePath}/history_timeline.json`);
      },
      async getHistoryImports(): Promise<ApiHistoryImportsEnvelope> {
        return await loader.load<ApiHistoryImportsEnvelope>(`${basePath}/history_imports.json`);
      },
    },
    portfolio: {
      async getPortfolio(): Promise<ApiPortfolioEnvelope> {
        return await loader.load<ApiPortfolioEnvelope>(`${basePath}/portfolio.json`);
      },
    },
    holdingDetail: {
      async getHoldingDetail(input: { portfolioId: string; holdingId: string }): Promise<ApiHoldingDetailEnvelope> {
        if (!isHml) {
          return await loader.load<ApiHoldingDetailEnvelope>(`${basePath}/holding_detail_pos_1.json`);
        }

        // Mock deterministico por holdingId, para cobrir fundo/previdencia/acao sem UI real.
        const holdingId = input.holdingId;
        const file =
          holdingId === "pos_bal_3"
            ? "holding_detail_pos_bal_3.json"
            : holdingId === "pos_bal_4"
              ? "holding_detail_pos_bal_4.json"
              : "holding_detail_pos_1.json";
        return await loader.load<ApiHoldingDetailEnvelope>(`${basePath}/${file}`);
      },
    },
    profile: {
      async getProfileContext(): Promise<ApiProfileContextGetEnvelope> {
        return await loader.load<ApiProfileContextGetEnvelope>(`${basePath}/profile_context.json`);
      },
      async putProfileContext(_input: ProfileContextPutRequest): Promise<ApiProfileContextPutEnvelope> {
        // Mock simples: reusa o GET como estado "persistido".
        const current = await loader.load<ApiProfileContextGetEnvelope>(`${basePath}/profile_context.json`);
        if (!current.ok) return current as unknown as ApiProfileContextPutEnvelope;

        const { backendHealth, ...rest } = current.data;
        return {
          ok: true,
          meta: current.meta,
          data: rest,
        };
      },
    },
    imports: {
      async startImport(_input?: { payload?: Record<string, unknown> }): Promise<ApiImportStartEnvelope> {
        return await loader.load<ApiImportStartEnvelope>(`${basePath}/imports_start.json`);
      },
      async getPreview(input: { importId: string }): Promise<ApiImportPreviewEnvelope> {
        const preview = await loader.load<ApiImportPreviewEnvelope>(`${basePath}/imports_preview.json`);
        if (!preview.ok) return preview;
        return {
          ...preview,
          data: { ...preview.data, importId: input.importId },
        };
      },
      async getEngineStatus(input: { importId: string }): Promise<ApiImportEngineStatusEnvelope> {
        const status = await loader.load<ApiImportEngineStatusEnvelope>(`${basePath}/imports_engine_status.json`);
        if (!status.ok) return status;
        // Inject importId when needed
        if (status.data && (status.data as any).screenState === "ready") {
          return { ...status, data: { ...(status.data as any), importId: input.importId } };
        }
        return status;
      },
      async getConflicts(input: { importId: string }): Promise<ApiImportConflictsEnvelope> {
        const conflicts = await loader.load<ApiImportConflictsEnvelope>(`${basePath}/imports_conflicts.json`);
        if (!conflicts.ok) return conflicts;

        if (conflicts.data && (conflicts.data as any).screenState === "ready") {
          const patched = {
            ...(conflicts.data as any),
            importId: input.importId,
            conflicts: Array.isArray((conflicts.data as any).conflicts)
              ? (conflicts.data as any).conflicts.map((c: any) => ({
                  ...c,
                  target: {
                    ...c.target,
                    preview: String(c.target?.preview || "").replace("imp_mock", input.importId),
                    resolve: String(c.target?.resolve || "").replace("imp_mock", input.importId),
                  },
                }))
              : [],
          };
          return { ...conflicts, data: patched };
        }

        if (conflicts.data && (conflicts.data as any).screenState === "empty") {
          const patched = {
            ...(conflicts.data as any),
            importId: input.importId,
            emptyState: {
              ...(conflicts.data as any).emptyState,
              target: String((conflicts.data as any).emptyState?.target || "").replace("imp_mock", input.importId),
            },
          };
          return { ...conflicts, data: patched };
        }

        return conflicts;
      },
      async getImportDetail(input: { importId: string }): Promise<ApiImportDetailEnvelope> {
        const detail = await loader.load<ApiImportDetailEnvelope>(`${basePath}/imports_detail.json`);
        if (!detail.ok) return detail;
        if (detail.data && (detail.data as any).screenState === "ready") {
          return { ...detail, data: { ...(detail.data as any), importId: input.importId } };
        }
        return detail;
      },
      async resolveDuplicateRow(input: { importId: string; rowId: string; payload: ImportResolveDuplicateRequest }): Promise<ApiImportResolveDuplicateEnvelope> {
        const now = new Date().toISOString();
        return {
          ok: true,
          meta: { requestId: "mock", timestamp: now, version: "v1" },
          data: {
            importId: input.importId,
            rowId: input.rowId,
            status: "duplicate_resolved",
            action: input.payload.action,
            beforeStatus: "PENDING",
            afterStatus: input.payload.action === "replace_existing" ? "RESOLVED_REPLACE" : input.payload.action === "consolidate" ? "RESOLVED_CONSOLIDATE" : "IGNORED",
            nextStep: `/v1/imports/${encodeURIComponent(input.importId)}/preview`,
          },
        };
      },
      async commitImport(input: { importId: string }): Promise<ApiImportCommitEnvelope> {
        const commit = await loader.load<ApiImportCommitEnvelope>(`${basePath}/imports_commit.json`);
        if (!commit.ok) return commit;
        return {
          ...commit,
          data: { ...commit.data, importId: input.importId },
        };
      },
    },
  };
}
