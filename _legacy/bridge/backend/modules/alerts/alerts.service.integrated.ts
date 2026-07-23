import { evaluateAlerts } from "./alerts.rules";
import { AlertRuleInput, Alert } from "./alerts.types";
import { NotificationsService } from "../notifications/notifications.service";
import { ScoreResult } from "../score/score.types";

export class AlertsServiceIntegrated {
  constructor(private notifications: NotificationsService) {}

  async run(input: AlertRuleInput, score?: ScoreResult): Promise<Alert[]> {
    const alerts = evaluateAlerts(input);

    if (!alerts.length) return [];

    let prioritized: Alert | undefined;

    if (score && score.main_problem !== "none") {
      prioritized = alerts.find(a => a.type === score.main_problem);
    }

    const alertToSend = prioritized || alerts[0];

    await this.notifications.send({
      alertId: alertToSend.id,
      userId: alertToSend.userId,
      channel: "telegram",
      type: alertToSend.type,
      severity: alertToSend.severity,
      title: alertToSend.title,
      context: alertToSend.context,
      action: alertToSend.action,
      dedupKey: alertToSend.dedupKey,
      chatId: process.env.TELEGRAM_DEFAULT_CHAT_ID
    });

    return alerts;
  }
}
