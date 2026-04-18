import { MessageTemplate, FlowMapping } from "./types";

export const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: "t1",
    key: "reserve_missing_high_priority",
    title: "Sua Reserva de Emergência é Prioridade",
    body: "Notamos que você ainda não possui uma reserva de emergência sólida. Com base nos seus gastos de {{monthly_expenses}}, recomendamos acumular {{target_reserve}} antes de outros investimentos.",
    subject: "Alerta de Segurança Financeira",
    cta: "Ver Plano de Reserva",
    channels: { in_app: true, email: true, push: true },
    version: "published"
  },
  {
    id: "t2",
    key: "debt_restructuring_needed",
    title: "Atenção: Pressão de Dívida Elevada",
    body: "Sua pressão de dívida atual está em {{debt_pressure}}%. Recomendamos priorizar a quitação de dívidas de juros altos antes de qualquer novo aporte.",
    subject: "Plano de Reestruturação de Dívidas",
    cta: "Ver Detalhes da Dívida",
    channels: { in_app: true, email: true, push: false },
    version: "published"
  },
  {
    id: "t3",
    key: "goal_timeline_adjustment",
    title: "Ajuste Necessário em suas Metas",
    body: "Para atingir sua meta '{{goal_title}}', sugerimos estender o prazo em {{suggested_months}} meses ou aumentar o aporte mensal em {{suggested_increase}}.",
    cta: "Ajustar Metas",
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
