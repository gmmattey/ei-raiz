import { evaluateAlerts } from "./alerts.rules";
import { AlertRuleInput, Alert } from "./alerts.types";
import { NotificationsService } from "../notifications/notifications.service";

export class AlertsService {
  constructor(private notifications: NotificationsService) {}

  async run(input: AlertRuleInput): Promise<Alert[]> {
    const alerts = evaluateAlerts(input);

    for (const alert of alerts) {
      await this.notifications.send({
        alertId: alert.id,
        userId: alert.userId,
        channel: "telegram",
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        context: alert.context,
        action: alert.action,
        dedupKey: alert.dedupKey,
        chatId: process.env.TELEGRAM_DEFAULT_CHAT_ID
      });
    }

    return alerts;
  }
}
