import { BehavioralHistory } from "../../types";

export class VeraBehavioralEngine {
  public updateHistory(
    current: BehavioralHistory, 
    action: 'accepted' | 'ignored' | 'postponed'
  ): BehavioralHistory {
    const next = { ...current };
    if (action === 'accepted') next.acceptedCount++;
    else if (action === 'ignored') next.ignoredCount++;
    else if (action === 'postponed') next.postponedCount++;

    const total = next.acceptedCount + next.ignoredCount + next.postponedCount;
    if (total > 0) {
      // Simple consistency score: accepted weights more than postponed, ignored is 0
      next.consistencyScore = (next.acceptedCount * 1.0 + next.postponedCount * 0.4) / total;
    }

    return next;
  }

  public getComplexityAdjustment(history: BehavioralHistory): number {
    // Returns a multiplier for recommendation complexity
    if (history.consistencyScore < 0.3) return 0.5; // Simplify everything
    if (history.consistencyScore > 0.8) return 1.2; // Increase sophistication
    return 1.0;
  }
}
