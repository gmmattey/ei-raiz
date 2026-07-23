export interface ResponseMeta {
  requestId: string;
  timestamp: string;
  version: string;
}

export interface ApiEnvelope<T> {
  ok: boolean;
  meta: ResponseMeta;
  data?: T;
  error?: { code: string; message: string; details?: Record<string, unknown> };
}

export interface ExtractionFieldTrace {
  source: 'rule' | 'ai' | 'manual';
  confidence: number;
}

export interface ExtractionEntry {
  sourceKind: 'ACOES' | 'FUNDOS' | 'PREVIDENCIA';
  code: string;
  name: string;
  quantity: number;
  investedAmount: number;
  currentAmount: number;
  categoryLabel: string;
  notes: string;
  sourceTrace: {
    fieldMap: Record<string, ExtractionFieldTrace>;
  };
  warnings: string[];
}

export interface ExtractionDocument {
  documentId: string;
  fileName: string;
  mimeType: string;
  documentType: string;
  importable: boolean;
  parserMode: 'rule' | 'ai' | 'hybrid';
  providerUsed: 'rule' | 'openai' | 'gemini';
  confidence: number;
}

export interface ExtractionResult {
  document: ExtractionDocument;
  entries: ExtractionEntry[];
  warnings: string[];
  errors: string[];
}
