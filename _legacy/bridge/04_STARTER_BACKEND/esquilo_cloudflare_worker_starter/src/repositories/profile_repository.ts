import type { Env } from "../lib/env";
import type { UserContextPayload } from "../contracts/common";

export class ProfileRepository {
  constructor(private readonly env: Env) {}

  async getContext(userId: string): Promise<UserContextPayload> {
    // TODO: buscar no D1
    return {
      userId,
      financialGoal: "Construir patrimônio com mais clareza",
      monthlyIncomeRange: "10k-20k",
      monthlyInvestmentTarget: 1500,
      availableToInvest: 500,
      riskProfile: "moderado",
      investmentHorizon: "longo_prazo",
      platformsUsed: ["xp", "ion"],
      ghostModeEnabled: false,
    };
  }

  async upsertContext(payload: UserContextPayload): Promise<UserContextPayload> {
    // TODO: persistir no D1
    return payload;
  }
}
