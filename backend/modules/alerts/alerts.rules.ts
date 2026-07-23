import { Alert, AlertRuleInput } from "./alerts.types";

export function evaluateAlerts(input: AlertRuleInput): Alert[] {
  const alerts: Alert[] = [];

  // Rule: high concentration (>50%)
  const highCategory = input.snapshot.categories.find(c => c.weight > 0.5);
  if (highCategory) {
    alerts.push({
      id: `alert-concentration-${input.userId}`,
      userId: input.userId,
      type: "concentration_high",
      severity: "high",
      title: "Carteira concentrada",
      context: `Você está com ${Math.round(highCategory.weight * 100)}% em ${highCategory.name}`,
      action: "Diversifique nos próximos aportes",
      dedupKey: `concentration-${input.userId}`,
      status: "active",
      createdAt: input.referenceDate
    });
  }

  // Rule: fund under CDI
  input.snapshot.funds?.forEach(fund => {
    if (fund.performancePct < fund.benchmarkPct) {
      alerts.push({
        id: `alert-fund-${fund.name}-${input.userId}`,
        userId: input.userId,
        type: "fund_under_cdi",
        severity: "medium",
        title: "Fundo abaixo do CDI",
        context: `${fund.name} está rendendo menos que o CDI`,
        action: "Reavalie se vale manter esse fundo",
        dedupKey: `fund-${fund.name}-${input.userId}`,
        status: "active",
        createdAt: input.referenceDate
      });
    }
  });

  // Rule: no contribution (>30 days)
  const last = input.snapshot.contributions?.lastContributionAt;
  if (last) {
    const days = (new Date(input.referenceDate).getTime() - new Date(last).getTime()) / (1000 * 60 * 60 * 24);
    if (days > 30) {
      alerts.push({
        id: `alert-no-contribution-${input.userId}`,
        userId: input.userId,
        type: "no_contribution",
        severity: "medium",
        title: "Sem aportes recentes",
        context: `Você está há ${Math.floor(days)} dias sem investir`,
        action: "Retome aportes mensais consistentes",
        dedupKey: `no-contribution-${input.userId}`,
        status: "active",
        createdAt: input.referenceDate
      });
    }
  }

  return alerts;
}
