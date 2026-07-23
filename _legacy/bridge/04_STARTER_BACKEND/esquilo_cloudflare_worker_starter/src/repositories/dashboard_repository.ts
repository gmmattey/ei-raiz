import type { Env } from "../lib/env";
import type { DashboardPayload } from "../contracts/dashboard";
import { nowIso } from "../lib/db";

export class DashboardRepository {
  constructor(private readonly env: Env) {}

  async getDashboard(_userId: string): Promise<DashboardPayload> {
    // TODO: substituir por queries reais no D1
    return {
      dataSource: "d1",
      updatedAt: nowIso(),
      hero: {
        totalEquity: 100000,
        totalInvested: 92000,
        totalProfitLoss: 8000,
        totalProfitLossPct: 0.0869,
        statusLabel: "Atenção",
      },
      primaryProblem: {
        title: "Concentração elevada em uma categoria",
        body: "A carteira ainda carrega concentração acima do desejado para o perfil atual.",
      },
      primaryAction: {
        title: "Rebalancear alocação",
        reason: "Reduzir concentração melhora robustez da carteira.",
        priority: "high",
        targetCategoryKey: "acoes",
      },
      score: {
        value: 67,
        status: "Atenção",
        summary: "A carteira tem base boa, mas ainda carrega distorções claras.",
        problem: "Concentração e distribuição entre plataformas ainda estão fracas.",
      },
      distribution: [
        {
          categoryKey: "acoes",
          label: "Ações",
          currentValue: 52000,
          allocationPct: 52,
          performancePct: 0.12,
        },
        {
          categoryKey: "fundos",
          label: "Fundos",
          currentValue: 28000,
          allocationPct: 28,
          performancePct: 0.05,
        },
        {
          categoryKey: "previdencia",
          label: "Previdência",
          currentValue: 20000,
          allocationPct: 20,
          performancePct: 0.03,
        },
      ],
      insights: [
        {
          title: "Maior peso atual",
          body: "Ações seguem como principal bloco da carteira.",
          severity: "info",
        },
      ],
    };
  }
}
