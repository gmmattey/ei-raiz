import type { Env } from "../lib/env";
import type {
  ImportCommitRequest,
  ImportCommitResponse,
  ImportPreviewRequest,
  ImportPreviewResponse,
} from "../contracts/imports";

export class ImportRepository {
  constructor(private readonly env: Env) {}

  async previewImport(input: ImportPreviewRequest): Promise<ImportPreviewResponse> {
    // TODO: implementar parse/normalização/deduplicação reais
    return {
      importId: crypto.randomUUID(),
      status: "preview_ready",
      summary: {
        totalRows: input.rows.length,
        validRows: input.rows.length,
        invalidRows: 0,
        duplicateRows: 0,
      },
      rows: input.rows.map((row, index) => ({
        rowNumber: index + 1,
        status: "valid",
        dedupKey: `${input.origin}:${index + 1}`,
        resolvedAssetLabel: String(row["codigo"] || row["name"] || `row_${index + 1}`),
        normalizedRow: row,
        validationErrors: [],
      })),
    };
  }

  async commitImport(input: ImportCommitRequest): Promise<ImportCommitResponse> {
    // TODO: persistir posições e gerar snapshot
    return {
      importId: input.importId,
      snapshotId: crypto.randomUUID(),
      importedPositions: 0,
      skippedRows: 0,
      status: "committed",
    };
  }
}
