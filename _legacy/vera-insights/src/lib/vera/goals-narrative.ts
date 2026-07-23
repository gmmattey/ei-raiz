import { FinancialGoal, UserFinancialProfile } from "../../types";

export interface GoalAnalysis {
  goalId: string;
  title: string;
  status: 'viable' | 'tight' | 'unviable';
  narrative: string;
  requiredMonthlyContribution: number;
  currentMonthlyContribution?: number;
  gap: number;
  gapPercent: number;
  deadlineMonths: number;
  daysUntilDeadline: number;
  priority: number;
  alerts: Array<{ type: 'critical' | 'warning' | 'info'; message: string }>;
  suggestedAdjustments: string[];
  icon: string;
}

export class GoalsNarrative {
  /**
   * Analyze all goals and generate narratives
   */
  public analyzeGoals(
    goals: FinancialGoal[],
    profile: UserFinancialProfile
  ): GoalAnalysis[] {
    return goals.map((goal) => this.analyzeGoal(goal, profile)).sort((a, b) => b.priority - a.priority);
  }

  private analyzeGoal(goal: FinancialGoal, profile: UserFinancialProfile): GoalAnalysis {
    const income = profile.income.value || 0;
    const expenses = profile.expenses.value || 0;
    const surplus = income - expenses;

    // Calculate required monthly contribution
    const gap = Math.max(0, goal.targetValue - goal.currentValue);
    const requiredMonthly = gap > 0 ? gap / Math.max(1, goal.deadlineMonths) : 0;
    const gapPercent = goal.targetValue > 0 ? (gap / goal.targetValue) * 100 : 0;

    // Determine viability
    let status: 'viable' | 'tight' | 'unviable' = 'viable';
    if (surplus < 0) status = 'unviable';
    else if (requiredMonthly > surplus * 0.5) status = 'tight';

    // Calculate days until deadline
    const deadlineDate = new Date();
    deadlineDate.setMonth(deadlineDate.getMonth() + goal.deadlineMonths);
    const daysUntilDeadline = Math.floor(
      (deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    // Generate alerts
    const alerts = this.generateAlerts(goal, status, requiredMonthly, surplus, daysUntilDeadline);

    // Generate narrative
    const narrative = this.generateGoalNarrative(
      goal,
      status,
      requiredMonthly,
      gap,
      gapPercent,
      daysUntilDeadline
    );

    // Suggest adjustments
    const adjustments = this.suggestAdjustments(goal, status, requiredMonthly, surplus);

    return {
      goalId: goal.id,
      title: goal.title,
      status,
      narrative,
      requiredMonthlyContribution: Math.round(requiredMonthly),
      gap: Math.round(gap),
      gapPercent: Math.round(gapPercent * 10) / 10,
      deadlineMonths: goal.deadlineMonths,
      daysUntilDeadline,
      priority: goal.priority,
      alerts,
      suggestedAdjustments: adjustments,
      icon: this.getGoalIcon(goal.type),
    };
  }

  private generateGoalNarrative(
    goal: FinancialGoal,
    status: 'viable' | 'tight' | 'unviable',
    requiredMonthly: number,
    gap: number,
    gapPercent: number,
    daysUntilDeadline: number
  ): string {
    const deadlineMonths = goal.deadlineMonths;
    const progress = ((goal.currentValue / goal.targetValue) * 100).toFixed(0);

    if (status === 'viable') {
      return `Você já aportou R$ ${goal.currentValue.toLocaleString('pt-BR')} (${progress}% da meta). Precisa de R$ ${Math.round(requiredMonthly).toLocaleString('pt-BR')}/mês pelos próximos ${deadlineMonths} meses para atingir R$ ${goal.targetValue.toLocaleString('pt-BR')}. Prazo: ${daysUntilDeadline} dias. Meta é alcançável com disciplina.`;
    }

    if (status === 'tight') {
      return `Você está em ${progress}% da meta (R$ ${goal.currentValue.toLocaleString('pt-BR')}). Será necessário R$ ${Math.round(requiredMonthly).toLocaleString('pt-BR')}/mês, o que representa uma parte significativa do seu orçamento. Considere aumentar renda ou estender o prazo.`;
    }

    // unviable
    return `Você precisa de R$ ${gap.toLocaleString('pt-BR')} para atingir essa meta em ${deadlineMonths} meses (R$ ${Math.round(requiredMonthly).toLocaleString('pt-BR')}/mês). Sua situação financeira atual não permite esse aporte. Recomendamos: 1) Estender o prazo para ${Math.ceil(gap / 500)} meses, ou 2) Reduzir a meta para R$ ${goal.currentValue.toLocaleString('pt-BR')}.`;
    }

  private generateAlerts(
    goal: FinancialGoal,
    status: 'viable' | 'tight' | 'unviable',
    requiredMonthly: number,
    surplus: number,
    daysUntilDeadline: number
  ): Array<{ type: 'critical' | 'warning' | 'info'; message: string }> {
    const alerts: Array<{ type: 'critical' | 'warning' | 'info'; message: string }> = [];

    if (status === 'unviable') {
      alerts.push({
        type: 'critical',
        message: `Meta financeiramente inviável com seu orçamento atual. Ajustes urgentes necessários.`,
      });
    }

    if (status === 'tight') {
      alerts.push({
        type: 'warning',
        message: `Meta exige ${((requiredMonthly / surplus) * 100).toFixed(0)}% do seu orçamento disponível. Pouca margem para imprevistos.`,
      });
    }

    if (daysUntilDeadline < 90) {
      alerts.push({
        type: 'warning',
        message: `Menos de 3 meses para a meta. Aumente aportes ou revise o prazo.`,
      });
    }

    if (daysUntilDeadline < 30) {
      alerts.push({
        type: 'critical',
        message: `Meta vence em ${daysUntilDeadline} dias. Ação imediata necessária.`,
      });
    }

    return alerts;
  }

  private suggestAdjustments(
    goal: FinancialGoal,
    status: 'viable' | 'tight' | 'unviable',
    requiredMonthly: number,
    surplus: number
  ): string[] {
    const adjustments: string[] = [];

    if (status === 'unviable') {
      adjustments.push(`Estender prazo de ${goal.deadlineMonths} para ${Math.ceil((goal.targetValue - goal.currentValue) / 500)} meses`);
      adjustments.push(`Reduzir meta para R$ ${(goal.currentValue + surplus * goal.deadlineMonths).toLocaleString('pt-BR')}`);
      adjustments.push('Aumentar receita (freelance, emprego extra)');
      adjustments.push('Liberar fluxo cortando despesas variáveis');
    }

    if (status === 'tight') {
      adjustments.push(`Aumentar aporte para R$ ${Math.round(requiredMonthly * 1.2).toLocaleString('pt-BR')}/mês`);
      adjustments.push(`Estender prazo em 3-6 meses para reduzir aporte necessário`);
      adjustments.push('Garantir que no mínimo 60% da meta seja atingida antes do prazo');
    }

    if (status === 'viable') {
      adjustments.push(`Manter aporte de R$ ${Math.round(requiredMonthly).toLocaleString('pt-BR')}/mês automatizado`);
      adjustments.push('Revisar retorno esperado vs realizado a cada 3 meses');
      adjustments.push(`Antecipar meta em ${Math.floor(goal.deadlineMonths * 0.2)} meses se possível`);
    }

    return adjustments;
  }

  private getGoalIcon(type: string): string {
    const icons: Record<string, string> = {
      emergency_fund: '🛟',
      house: '🏠',
      car: '🚗',
      vacation: '✈️',
      education: '🎓',
      retirement: '🏖️',
      wedding: '💒',
      investment: '📈',
      debt_payoff: '💳',
      starting_business: '🚀',
      children_education: '📚',
      holiday: '🎄',
    };

    return icons[type] || '🎯';
  }
}
