import { MessageTemplate, FlowMapping } from "./types";

export const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: "t1",
    key: "reserve_missing_high_priority",
    title: "Seu Fundo de Segurança Precisa de Atenção",
    body: "Você atualmente tem {{liquidity_months}} meses de despesas guardadas. O ideal é ter 6 meses. Para chegar lá, reserve {{monthly_reserve}}/mês durante {{months_to_save}} meses.\n\nPor que isso importa? Uma emergência inesperada (desemprego, doença) pode derrubar seus planos. Com essa almofada, você consegue lidar sem puxar crédito caro ou parar seus investimentos.\n\nComo fazer: Automatize uma transferência de {{monthly_reserve}} para uma conta poupança assim que recebe seu salário.",
    subject: "Alerta de Segurança Financeira",
    cta: "Começar a Economizar",
    channels: { in_app: true, email: true, push: true },
    version: "published"
  },
  {
    id: "t2",
    key: "debt_restructuring_needed",
    title: "Sua Dívida Está Consumindo Seu Potencial",
    body: "{{debt_percentage}}% do que você ganha vai para pagar dívidas. Você está pagando {{high_interest_percentage}}% delas com juros altos (cartão, cheque especial).\n\nPor que isso importa? Quanto mais você paga de juros, menos sobra para construir riqueza. A boa notícia: você pode se livrar disso.\n\nComo fazer: Primeiro, consolidar a dívida de juros altos em um empréstimo pessoal pode poupar R$ {{monthly_savings}}/mês. Depois, dedique {{debt_payment}}/mês para quitação. Em {{months_to_payoff}} meses você respira fundo de novo.",
    subject: "Plano de Reestruturação de Dívidas",
    cta: "Ver Opções de Consolidação",
    channels: { in_app: true, email: true, push: false },
    version: "published"
  },
  {
    id: "t3",
    key: "goal_timeline_adjustment",
    title: "Suas Metas Precisam de Ajuste",
    body: "Para atingir suas metas, você consegue em {{months_to_save}} meses com {{monthly_reserve}}/mês. Mas dá para acelerar.\n\nPor que isso importa? Conhecer o caminho real ajuda a manter a disciplina e a fazer escolhas certas agora para ganhar no futuro.\n\nComo fazer: Aumente seu aporte e alcança mais rápido. Ou mantenha o ritmo atual e estenda o prazo. Você escolhe qual encaixa melhor.",
    cta: "Ajustar Metas",
    channels: { in_app: true, email: false, push: true },
    version: "published"
  },
  {
    id: "t4",
    key: "investment_ready",
    title: "Você Está Pronto para Investir",
    body: "Suas dívidas estão sob controle, sua reserva está sólida. Você tem {{investment_capacity}}/mês disponível para crescer seu dinheiro.\n\nPor que agora? Quando você investe cedo e por tempo, o juros composto trabalha a seu favor. R$ 500/mês por 10 anos pode virar R$ 80 mil+.\n\nComo fazer: Comece com {{initial_amount}}/mês em fundos diversificados. Daqui a 6 meses, revise e aumente se conseguir. Pequeno e consistente supera grande e esporádico.",
    cta: "Começar a Investir",
    channels: { in_app: true, email: true, push: true },
    version: "published"
  },
  {
    id: "t5",
    key: "expense_optimization",
    title: "Suas Despesas Estão Acima do Ideal",
    body: "Você gasta {{expense_percentage}}% da sua renda em despesas fixas. O padrão saudável é 70%. Isso deixa pouco espaço para economizar.\n\nPor que isso importa? Se não sobra dinheiro, você fica preso. Sem almofada, qualquer problema vira dívida. Sem sobra, impossível investir.\n\nComo fazer: Revise seus gastos neste mês. Pode cortar {{optimization_potential}}/mês em assinaturas, alimentação, transporte. Alguns clientes conseguem 20-30% de redução.",
    cta: "Revisar Despesas",
    channels: { in_app: true, email: false, push: true },
    version: "published"
  }
];

export const DEFAULT_MAPPINGS: FlowMapping[] = [
  {
    decisionType: "ALTA_PRESSAO_DE_DIVIDA",
    templateKey: "debt_restructuring_needed",
    severity: "critical",
    channelPolicy: {
      priority: ["in_app", "email"],
      fallback: "email"
    }
  },
  {
    decisionType: "RISCO_DE_INSOLVENCIA_LIQUIDEZ",
    templateKey: "reserve_missing_high_priority",
    severity: "critical",
    channelPolicy: {
      priority: ["push", "in_app", "email"],
      fallback: "email"
    }
  },
  {
    decisionType: "DESALINHAMENTO_DE_METAS",
    templateKey: "goal_timeline_adjustment",
    severity: "warning",
    channelPolicy: {
      priority: ["in_app"],
      fallback: "none"
    }
  }
];

export class StudioStore {
  private templates: MessageTemplate[] = [...DEFAULT_TEMPLATES];
  private mappings: FlowMapping[] = [...DEFAULT_MAPPINGS];

  public getTemplates() { return this.templates; }
  public getMappings() { return this.mappings; }

  public updateTemplate(updated: MessageTemplate) {
    this.templates = this.templates.map(t => t.id === updated.id ? updated : t);
  }

  public updateMapping(updated: FlowMapping) {
    this.mappings = this.mappings.map(m => m.decisionType === updated.decisionType ? updated : m);
  }

  public getTemplateByKey(key: string) {
    return this.templates.find(t => t.key === key);
  }

  public getMappingByDecision(type: string) {
    return this.mappings.find(m => m.decisionType === type);
  }
}

export const studioStore = new StudioStore();
