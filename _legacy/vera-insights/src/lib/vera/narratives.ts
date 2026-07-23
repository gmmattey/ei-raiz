import { Problem, Opportunity } from "./recommendations";
import { UserStage } from "../../types";

export interface Card {
  id: string;
  type: 'problem' | 'opportunity' | 'insight';
  icon: string;
  severity?: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  narrative: string;
  action: string;
  ctaLabel: string;
  ctaUrl?: string;
  metrics?: Record<string, string | number>;
  timeframe?: string;
}

export interface DashboardNarrative {
  hero: {
    score: number;
    band: string;
    message: string;
    sentiment: 'critical' | 'warning' | 'neutral' | 'positive' | 'excellent';
  };
  problems: Card[];
  opportunities: Card[];
  insights: Card[];
}

export class NarrativeGenerator {
  /**
   * Generate complete dashboard narrative
   */
  public generateDashboardNarrative(
    score: number,
    band: string,
    stage: UserStage,
    problems: Problem[],
    opportunities: Opportunity[],
    metrics: Record<string, number>
  ): DashboardNarrative {
    return {
      hero: this.generateHero(score, band, stage),
      problems: problems.map((p) => this.generateProblemCard(p, metrics)),
      opportunities: opportunities.map((o) => this.generateOpportunityCard(o, metrics)),
      insights: this.generateInsights(stage, metrics),
    };
  }

  private generateHero(score: number, band: string, stage: UserStage): DashboardNarrative['hero'] {
    const heroMap: Record<string, any> = {
      Crítico: {
        sentiment: 'critical',
        message: 'Sua saúde financeira precisa de atenção urgente. Há riscos imediatos que precisam ser controlados.',
      },
      Precário: {
        sentiment: 'warning',
        message: 'Você está em uma situação vulnerável. Ações rápidas podem evitar uma crise maior.',
      },
      Moderado: {
        sentiment: 'neutral',
        message: 'Sua situação é estável, mas há espaço para melhorar. Pequenas ações têm grande impacto.',
      },
      Bom: {
        sentiment: 'positive',
        message: 'Sua base está sólida. Agora é hora de otimizar e crescer seu patrimônio.',
      },
      Excelente: {
        sentiment: 'excellent',
        message: 'Parabéns! Você está em excelente situação financeira. Foco em maximizar oportunidades.',
      },
    };

    const hero = heroMap[band] || heroMap['Moderado'];

    return {
      score,
      band,
      message: hero.message,
      sentiment: hero.sentiment,
    };
  }

  private generateProblemCard(problem: Problem, metrics: Record<string, number>): Card {
    const templates: Record<string, any> = {
      HIGH_DEBT_RATIO: {
        icon: '📊',
        severity: 'critical',
        title: 'Dívida Acima do Seguro',
        narrative: `Suas dívidas representam ${metrics['debtRatio'] || 0}% da sua renda anual. Isso reduz sua capacidade de investir e gera estresse financeiro. Priorizar o pagamento de dívidas é essencial antes de qualquer novo investimento.`,
        timeframe: `${problem.monthsToSolve || 0} meses`,
      },
      INSUFFICIENT_EMERGENCY_FUND: {
        icon: '🛟',
        severity: 'warning',
        title: 'Fundo de Emergência Insuficiente',
        narrative: `Você tem apenas ${metrics['liquidityMonths'] || 0} meses de despesas em reserva. O ideal é 6 meses. Sem essa proteção, qualquer imprevisto (desemprego, saúde) força endividamento de emergência.`,
        timeframe: `${problem.monthsToSolve || 0} meses para chegar ao alvo`,
      },
      NEGATIVE_CASH_FLOW: {
        icon: '📉',
        severity: 'critical',
        title: 'Fluxo de Caixa Negativo',
        narrative: `Suas despesas (R$ ${metrics['expenses'] || 0}/mês) excedem sua renda (R$ ${metrics['income'] || 0}/mês) em R$ ${problem.monthlySave || 0}. Você está queimando patrimônio todo mês. Cortar despesas é urgente.`,
        timeframe: 'Imediato',
      },
      HIGH_INTEREST_DEBT: {
        icon: '💳',
        severity: 'warning',
        title: 'Dívida de Alto Juros',
        narrative: `${problem.detail}. Cartões de crédito, cheque especial e consignados custam 10-400% ao ano. Refinanciar em empréstimo pessoal com juros menores economiza R$ ${problem.monthlySave || 0}/mês.`,
        timeframe: 'Dentro de 30 dias',
      },
      UNCLEAR_FINANCIAL_PICTURE: {
        icon: '🔍',
        severity: 'info',
        title: 'Dados Financeiros Incompletos',
        narrative: 'Seus dados têm estimativas ou estão incompletos. Sem informações precisas, recomendações não são 100% confiáveis. Conecte sua conta bancária para análise mais precisa.',
        timeframe: 'Esta semana',
      },
    };

    const template = templates[problem.type] || {
      icon: '⚠️',
      severity: 'warning',
      title: problem.type.replace(/_/g, ' '),
      narrative: problem.detail,
      timeframe: `${problem.monthsToSolve || 0} meses`,
    };

    return {
      id: problem.type,
      type: 'problem',
      icon: template.icon,
      severity: template.severity,
      title: template.title,
      narrative: template.narrative,
      action: problem.action,
      ctaLabel: this.getCtaLabel(problem.action),
      metrics: {
        'Poupança mensal necessária': `R$ ${problem.monthlySave || 0}`,
        'Prazo para resolver': template.timeframe,
        'Impacto na renda': `${problem.percentageOfIncome?.toFixed(1) || 0}%`,
      },
      timeframe: template.timeframe,
    };
  }

  private generateOpportunityCard(opportunity: Opportunity, metrics: Record<string, number>): Card {
    const templates: Record<string, any> = {
      INVESTMENT_READY: {
        icon: '📈',
        severity: 'success',
        title: 'Oportunidade de Investimento',
        narrative: `Você tem capacidade de investir R$ ${opportunity.monthlyCapacity || 0}/mês sem comprometer sua estabilidade. Automatizar aportes constrói patrimônio gradualmente através de juros compostos.`,
      },
      DEBT_CONSOLIDATION: {
        icon: '🔄',
        severity: 'success',
        title: 'Oportunidade de Refinanciamento',
        narrative: `Refinanciar suas dívidas de alto juros em empréstimo pessoal economiza R$ ${opportunity.monthlyCapacity || 0}/mês. Esse dinheiro pode ir para reserva ou investimentos.`,
      },
      INVESTMENT_HABIT: {
        icon: '💪',
        severity: 'success',
        title: 'Construir Hábito de Investimento',
        narrative: `Seu histórico mostra consistência. Automatizar aporte de R$ ${opportunity.monthlyCapacity || 0}/mês em investimentos transforma pequenas economias em grande patrimônio ao longo do tempo.`,
      },
      EXPENSE_OPTIMIZATION: {
        icon: '✂️',
        severity: 'success',
        title: 'Otimizar Despesas Recorrentes',
        narrative: `Analisando suas despesas, encontramos potencial de economizar R$ ${opportunity.monthlyCapacity || 0}/mês em gastos recorrentes. Renegociar seguros, planos e assinaturas libera fluxo sem impactar qualidade de vida.`,
      },
    };

    const template = templates[opportunity.type] || {
      icon: '⭐',
      severity: 'success',
      title: opportunity.type.replace(/_/g, ' '),
      narrative: opportunity.detail,
    };

    return {
      id: opportunity.type,
      type: 'opportunity',
      icon: template.icon,
      severity: template.severity,
      title: template.title,
      narrative: template.narrative,
      action: opportunity.action,
      ctaLabel: this.getCtaLabel(opportunity.action),
      metrics: {
        'Capacidade mensal': `R$ ${opportunity.monthlyCapacity || 0}`,
        'Impacto anual': `R$ ${((opportunity.monthlyCapacity || 0) * 12).toLocaleString('pt-BR')}`,
      },
    };
  }

  private generateInsights(stage: UserStage, metrics: Record<string, number>): Card[] {
    const insights: Card[] = [];

    if (stage === 'CRITICAL') {
      insights.push({
        id: 'emergency_protocol',
        type: 'insight',
        icon: '🚨',
        severity: 'critical',
        title: 'Protocolo de Emergência Financeira',
        narrative: `1) Corte despesas variáveis imediatamente. 2) Liste todas as dívidas com juros. 3) Busque aumentar renda (freelance, emprego extra). 4) Considere vender ativos para cobrir deficit.`,
        action: 'START_EMERGENCY_PROTOCOL',
        ctaLabel: 'Ver plano de ação',
      });
    }

    if (stage === 'UNSTABLE') {
      insights.push({
        id: 'stabilization_plan',
        type: 'insight',
        icon: '📍',
        severity: 'warning',
        title: 'Plano de Estabilização',
        narrative: `Você está no caminho certo, mas sem margem de segurança. Focus: 1) Criar fundo de emergência (3 meses). 2) Reduzir dívidas de juros altos. 3) Depois, começar investimentos.`,
        action: 'VIEW_STABILIZATION_PATH',
        ctaLabel: 'Ver plano de estabilização',
      });
    }

    if (stage === 'GROWING' || stage === 'STRUCTURING') {
      insights.push({
        id: 'wealth_building',
        type: 'insight',
        icon: '🎯',
        severity: 'success',
        title: 'Estratégia de Construção de Patrimônio',
        narrative: `Você tem base sólida. Próximos passos: 1) Diversificar investimentos. 2) Automatizar aportes (juros compostos). 3) Revisar alocação anualmente. 4) Planejar aposentadoria.`,
        action: 'VIEW_WEALTH_STRATEGY',
        ctaLabel: 'Explorar estratégia completa',
      });
    }

    return insights;
  }

  private getCtaLabel(action: string): string {
    const labels: Record<string, string> = {
      PAY_DEBT_FIRST: 'Ver plano de quitação',
      SAVE_X_MONTHLY: 'Começar poupança',
      FIX_CASH_FLOW: 'Analisar despesas',
      CONSOLIDATE_OR_REFINANCE: 'Simular refinanciamento',
      SYNC_DATA_OR_UPDATE: 'Conectar conta bancária',
      START_INVESTING: 'Começar a investir',
      REFINANCE_DEBT: 'Simular consolidação',
      AUTOMATE_MONTHLY_INVESTMENT: 'Configurar automação',
      REDUCE_RECURRING_EXPENSES: 'Analisar despesas',
    };

    return labels[action] || 'Explorar detalhes';
  }
}
