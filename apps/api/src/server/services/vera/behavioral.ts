// Behavioral Engine - EsquiloBehavioralEngine implementation
import { BehavioralHistory } from "./types";

export class EsquiloBehavioralEngine {
  public updateHistory(
    history: BehavioralHistory,
    action: 'accepted' | 'ignored' | 'postponed'
  ): BehavioralHistory {
    const total = history.acceptedCount + history.ignoredCount + history.postponedCount;
    let updatedCount = { accepted: history.acceptedCount, ignored: history.ignoredCount, postponed: history.postponedCount };

    switch (action) {
      case 'accepted':
        updatedCount.accepted++;
        break;
      case 'ignored':
        updatedCount.ignored++;
        break;
      case 'postponed':
        updatedCount.postponed++;
        break;
    }

    const newTotal = updatedCount.accepted + updatedCount.ignored + updatedCount.postponed;
    const executionRate = newTotal > 0 ? updatedCount.accepted / newTotal : 0;
    const consistency = (updatedCount.accepted - updatedCount.ignored) / Math.max(1, newTotal);

    return {
      acceptedCount: updatedCount.accepted,
      ignoredCount: updatedCount.ignored,
      postponedCount: updatedCount.postponed,
      consistencyScore: Math.max(0, Math.min(1, 0.5 + consistency * 0.5)),
      executionRate,
      averageTimeToAction: history.averageTimeToAction,
    };
  }
}
