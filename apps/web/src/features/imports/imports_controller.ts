import type { ApiImportCommitEnvelope, ApiImportPreviewEnvelope, ApiImportStartEnvelope, ImportPreviewData } from '../../core/data/contracts';
import type { ImportsDataSource } from '../../core/data/data_sources';

export type ImportsStartResult = {
  envelope: ApiImportStartEnvelope;
  importId?: string;
  nextPathname?: string;
};

export type ImportsPreviewResult = {
  envelope: ApiImportPreviewEnvelope;
  readyToCommit?: boolean;
  totals?: ImportPreviewData['totals'];
  rows?: ImportPreviewData['rows'];
};

export type ImportsCommitResult = {
  envelope: ApiImportCommitEnvelope;
  nextPathname?: string;
};

export interface ImportsController {
  start(payload?: unknown): Promise<ImportsStartResult>;
  preview(importId: string): Promise<ImportsPreviewResult>;
  commit(importId: string): Promise<ImportsCommitResult>;
}

/**
 * Controller headless do fluxo de importacao (US011 / US012).
 * Regra: sempre preview antes de commit; nao mascara erro/conflito.
 */
export function createImportsController(input: { imports: ImportsDataSource }): ImportsController {
  const imports = input.imports;

  return {
    async start(payload) {
      const envelope = await imports.startImport(payload !== undefined ? { payload } : undefined);
      if (!envelope.ok) return { envelope };
      return { envelope, importId: envelope.data.importId, nextPathname: `/imports/${encodeURIComponent(envelope.data.importId)}/preview` };
    },
    async preview(importId) {
      const envelope = await imports.getImportPreview({ importId });
      if (!envelope.ok) return { envelope };
      return { envelope, readyToCommit: envelope.data.readyToCommit, totals: envelope.data.totals, rows: envelope.data.rows };
    },
    async commit(importId) {
      const envelope = await imports.commitImport({ importId });
      if (!envelope.ok) return { envelope };
      return { envelope, nextPathname: envelope.data.nextStep || '/history' };
    }
  };
}

