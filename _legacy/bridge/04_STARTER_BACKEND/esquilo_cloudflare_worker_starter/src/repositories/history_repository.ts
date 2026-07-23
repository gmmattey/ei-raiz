import type { Env } from "../lib/env";
import type { HistoryPayload } from "../contracts/history";

export class HistoryRepository {
  constructor(private readonly env: Env) {}

  async getHistory(_userId: string): Promise<HistoryPayload> {
    // TODO: substituir por queries reais
    return {
      snapshots: [],
      recommendations: [],
      events: [],
    };
  }
}
