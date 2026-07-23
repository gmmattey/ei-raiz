import { DecisionOutput, NarrativeOutput, UserStage, BehavioralHistory } from "../../types";

export class VeraNarrativeEngine {
  private getTone(stage: UserStage): 'URGENT_DIRECT' | 'FIRM_ADVISORY' | 'EDUCATIONAL' | 'OPTIMIZATION' {
    switch (stage) {
      case UserStage.CRITICAL: return 'URGENT_DIRECT';
      case UserStage.UNSTABLE: return 'FIRM_ADVISORY';
      case UserStage.STRUCTURING: return 'EDUCATIONAL';
      case UserStage.GROWING: return 'OPTIMIZATION';
      default: return 'EDUCATIONAL';
    }
  }

  public generate(decision: DecisionOutput, history: BehavioralHistory): NarrativeOutput {
    const tone = this.getTone(decision.user_stage);
    
    // Simplified template selection logic
    if (decision.user_stage === UserStage.CRITICAL) {
      return {
        message_type: "DIAGNOSIS_ACTION",
        severity: "critical",
        title: "Immediate Action Required: Financial Foundation at Risk",
        body: `Your current debt pressure is at ${decision.evidence.debtPressure.toFixed(0)}%. This level of debt, combined with low liquidity, creates a high risk of insolvency. We must prioritize debt repayment over all other goals to stop interest from compounding against you.`,
        action_label: "Review Debt Payoff Strategy",
        action_type: "STRATEGY_DEBT",
        source_recommendation_id: "rec_critical_001"
      };
    }

    if (decision.user_stage === UserStage.UNSTABLE) {
      return {
        message_type: "DIAGNOSIS_ACTION",
        severity: "warning",
        title: "Strengthen Your Safety Net",
        body: "You're making progress, but your emergency fund is currently insufficient to cover unexpected shocks. Building a 6-month buffer is the most important step to ensure long-term stability before moving into aggressive investing.",
        action_label: "Set Up Emergency Savings Goal",
        action_type: "GOAL_SETTING",
        source_recommendation_id: "rec_unstable_002"
      };
    }

    if (decision.user_stage === UserStage.STRUCTURING) {
      const unviableGoals = decision.goal_status.filter(g => g.status === 'unviable');
      return {
        message_type: "GOAL_ADJUSTMENT",
        severity: "info",
        title: "Optimizing Your Path to Success",
        body: unviableGoals.length > 0 
          ? `Some of your goals, like "${unviableGoals[0].id}", are currently out of reach with your current savings rate. Small adjustments to your timeline or monthly contributions can put you back on track.`
          : "Your foundation is solid. Now is the time to refine your asset allocation and ensure your money is working as hard as you are.",
        action_label: "Adjust Goal Parameters",
        action_type: "GOAL_OPTIMIZATION",
        source_recommendation_id: "rec_structuring_003"
      };
    }

    return {
      message_type: "GROWTH_OPPORTUNITY",
      severity: "success",
      title: "Your Wealth is in the Growth Phase",
      body: "Excellent consistency. With your debt under control and a solid emergency fund, you are eligible for advanced investment products. We recommend exploring diversified equity portfolios to maximize long-term compound growth.",
      action_label: "Explore Investment Products",
      action_type: "PRODUCT_EXPLORATION",
      source_recommendation_id: "rec_growing_004"
    };
  }
}
