import { EsquiloEngine } from "../esquilo/engine";
import { VeraNarrativeEngine } from "./narrative";
import { UserFinancialProfile, BehavioralHistory, DecisionOutput, NarrativeOutput } from "../../types";

export class VeraService {
  private esquilo = new EsquiloEngine();
  private narrative = new VeraNarrativeEngine();

  public process(profile: UserFinancialProfile, history: BehavioralHistory): {
    decision: DecisionOutput;
    narrative: NarrativeOutput;
    updatedHistory: BehavioralHistory;
  } {
    // Esquilo is the main decision engine, it internally uses Vera Core for math
    const decision = this.esquilo.evaluate(profile, history);
    const narrative = this.narrative.generate(decision, history);
    
    return {
      decision,
      narrative,
      updatedHistory: history
    };
  }

  public handleUserAction(
    history: BehavioralHistory, 
    action: 'accepted' | 'ignored' | 'postponed'
  ): BehavioralHistory {
    const next = { ...history };
    if (action === 'accepted') next.acceptedCount++;
    else if (action === 'ignored') next.ignoredCount++;
    else if (action === 'postponed') next.postponedCount++;

    const total = next.acceptedCount + next.ignoredCount + next.postponedCount;
    if (total > 0) {
      next.consistencyScore = (next.acceptedCount * 1.0 + next.postponedCount * 0.4) / total;
      next.executionRate = next.acceptedCount / total;
    }

    return next;
  }
}

export const vera = new VeraService();
