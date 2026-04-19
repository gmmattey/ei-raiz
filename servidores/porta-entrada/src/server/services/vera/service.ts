import { EsquiloEngine } from "./esquilo-engine";
import type { VeraModelParams } from "./core";
import { EsquiloBehavioralEngine } from "./behavioral";
import { VeraAdapter } from "./adapter";
import {
  BehavioralHistory,
  DecisionOutput,
  NarrativeOutput,
  UserFinancialProfile,
  VeraIntegrationOutput,
} from "./types";
// Note: VeraNarrativeEngine is deprecated and not imported

/**
 * Plug-and-play facade for external systems.
 * Vera calculates and packages a structured decision payload.
 * Esquilo or Vera Studio should decide how to present the final message.
 */
export class VeraService {
  private esquilo: EsquiloEngine;
  private adapter = new VeraAdapter();
  private behavioral = new EsquiloBehavioralEngine();

  constructor(veraParams: Partial<VeraModelParams> = {}) {
    this.esquilo = new EsquiloEngine(veraParams);
  }

  public evaluate(profile: UserFinancialProfile, history: BehavioralHistory): VeraIntegrationOutput {
    const decision = this.esquilo.evaluate(profile, history);
    return this.adapter.toIntegrationOutput(decision);
  }

  public updateHistory(
    history: BehavioralHistory,
    action: 'accepted' | 'ignored' | 'postponed'
  ): BehavioralHistory {
    return this.behavioral.updateHistory(history, action);
  }
}

export const vera = new VeraService();
