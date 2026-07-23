export interface AnalysisPayload {
  analysisId: string;
  generatedAt: string;
  score: {
    value: number;
    status: string;
  };
  primaryProblem: string;
  primaryAction: string;
  summaryText: string;
  insights: Array<{
    id: string;
    kind: string;
    title: string;
    body: string;
    severity?: string;
    relatedAssetId?: string;
    relatedCategoryCode?: string;
  }>;
}
