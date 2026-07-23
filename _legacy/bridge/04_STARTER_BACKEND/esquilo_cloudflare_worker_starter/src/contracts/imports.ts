export interface ImportPreviewRequest {
  userId: string;
  portfolioId?: string;
  origin: string;
  fileName: string;
  checksumSha256?: string;
  rows: Array<Record<string, unknown>>;
}

export interface ImportPreviewResponse {
  importId: string;
  status: string;
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateRows: number;
  };
  rows: Array<{
    rowNumber: number;
    status: string;
    dedupKey?: string;
    resolvedAssetLabel?: string;
    normalizedRow: Record<string, unknown>;
    validationErrors?: string[];
  }>;
}

export interface ImportCommitRequest {
  importId: string;
  portfolioId: string;
  userId: string;
}

export interface ImportCommitResponse {
  importId: string;
  snapshotId: string;
  importedPositions: number;
  skippedRows: number;
  status: string;
}
