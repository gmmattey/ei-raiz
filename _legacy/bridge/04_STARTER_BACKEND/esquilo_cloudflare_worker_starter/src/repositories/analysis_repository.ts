import type { Env } from "../lib/env";
import type { AnalysisPayload } from "../contracts/analysis";

export class AnalysisRepository {
  constructor(private readonly env: Env) {}

  async getLatestAnalysis(_userId: string): Promise<AnalysisPayload> {
    // TODO: buscar análise persistida no D1
    return {
      analysisId: crypto.randomUUID(),
      generatedAt: new Date().toISOString(),
      score: {
        value: 67,
        status: "Atenção",
      },
      primaryProblem: "Concentração elevada e distribuição pouco eficiente.",
      primaryAction: "Rebalancear a carteira e revisar origens.",
      summaryText: "A carteira tem base boa, mas ainda carrega distorções claras.",
      insights: [],
    };
  }
}
