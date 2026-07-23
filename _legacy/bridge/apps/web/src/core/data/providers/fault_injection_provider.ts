import type { AppDataSources } from '../data_sources';
import type { ApiEnvelopeError, ApiMeta } from '../types';

export type FaultKey =
  | 'dashboard.home'
  | 'portfolio.get'
  | 'analysis.get'
  | 'history.snapshots'
  | 'history.timeline'
  | 'holding_detail.get'
  | 'profile.get'
  | 'profile.put'
  | 'imports.start'
  | 'imports.preview'
  | 'imports.commit';

export type FaultSpec = {
  code: string;
  message: string;
  once?: boolean;
  details?: Record<string, unknown>;
};

export type FaultConfig = Partial<Record<FaultKey, FaultSpec>>;

/**
 * Wrapper de data sources para simular falhas sem depender de trocar mocks.
 * Usado para E2E-020 (mensagens recuperaveis) e para validar UX em casos de erro.
 */
export function withFaultInjection(inner: AppDataSources, faults: FaultConfig): AppDataSources {
  const shouldFail = (key: FaultKey): FaultSpec | null => {
    const spec = faults[key];
    if (!spec) return null;
    if (spec.once) delete faults[key];
    return spec;
  };

  const fail = (spec: FaultSpec): ApiEnvelopeError => ({
    ok: false,
    meta: makeMeta(),
    error: { code: spec.code, message: spec.message, details: spec.details }
  });

  return {
    dashboard: {
      async getDashboardHome() {
        const spec = shouldFail('dashboard.home');
        if (spec) return fail(spec);
        return await inner.dashboard.getDashboardHome();
      }
    },
    analysis: {
      async getAnalysis() {
        const spec = shouldFail('analysis.get');
        if (spec) return fail(spec);
        return await inner.analysis.getAnalysis();
      }
    },
    history: {
      async getHistorySnapshots(input) {
        const spec = shouldFail('history.snapshots');
        if (spec) return fail(spec);
        return await inner.history.getHistorySnapshots(input);
      },
      async getHistoryTimeline(input) {
        const spec = shouldFail('history.timeline');
        if (spec) return fail(spec);
        return await inner.history.getHistoryTimeline(input);
      }
    },
    portfolio: {
      async getPortfolio(input) {
        const spec = shouldFail('portfolio.get');
        if (spec) return fail(spec);
        return await inner.portfolio.getPortfolio(input);
      }
    },
    holdingDetail: {
      async getHoldingDetail(input) {
        const spec = shouldFail('holding_detail.get');
        if (spec) return fail(spec);
        return await inner.holdingDetail.getHoldingDetail(input);
      }
    },
    profile: {
      async getProfileContext() {
        const spec = shouldFail('profile.get');
        if (spec) return fail(spec);
        return await inner.profile.getProfileContext();
      },
      async putProfileContext(input) {
        const spec = shouldFail('profile.put');
        if (spec) return fail(spec);
        return await inner.profile.putProfileContext(input);
      }
    },
    imports: {
      async startImport(input) {
        const spec = shouldFail('imports.start');
        if (spec) return fail(spec);
        return await inner.imports.startImport(input);
      },
      async getImportPreview(input) {
        const spec = shouldFail('imports.preview');
        if (spec) return fail(spec);
        return await inner.imports.getImportPreview(input);
      },
      async commitImport(input) {
        const spec = shouldFail('imports.commit');
        if (spec) return fail(spec);
        return await inner.imports.commitImport(input);
      }
    }
  };
}

function makeMeta(): ApiMeta {
  return {
    requestId: `req_fault_${Math.random().toString(16).slice(2)}`,
    timestamp: new Date().toISOString(),
    version: 'v1'
  };
}

