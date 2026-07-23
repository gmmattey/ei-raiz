import type { Env } from "../lib/env";
import type { PortfolioPayload } from "../contracts/portfolio";
import { nowIso } from "../lib/db";

export class PortfolioRepository {
  constructor(private readonly env: Env) {}

  async getPortfolio(_userId: string): Promise<PortfolioPayload> {
    // TODO: substituir por queries reais no D1
    return {
      dataSource: "d1",
      updatedAt: nowIso(),
      filters: {
        availableAssetTypes: ["acoes", "fundos", "previdencia"],
        availablePlatforms: ["xp", "ion"],
      },
      groups: [
        {
          categoryKey: "acoes",
          categoryLabel: "Ações",
          totalValue: 52000,
          allocationPct: 52,
          holdings: [
            {
              id: "pos_1",
              assetId: "asset_itsa4",
              assetCode: "ITSA4",
              assetName: "Itaúsa",
              assetTypeCode: "acoes",
              platformCode: "xp",
              platformName: "XP",
              quantity: 27,
              averagePrice: 13.84,
              currentPrice: 14.9,
              investedAmount: 373.68,
              currentValue: 402.3,
              allocationPct: 0.4,
              performancePct: 0.076,
              recommendation: "Manter",
              riskLabel: "Moderado",
              externalUrl: "https://example.com/asset/itsa4",
            }
          ],
        }
      ],
      plannedOrders: [],
    };
  }
}
