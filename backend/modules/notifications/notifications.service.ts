import { TelegramService } from "./telegram.service";
import {
  SendNotificationInput,
  NotificationSendResult
} from "./notifications.types";

export class NotificationsService {
  private sentCache = new Set<string>();

  constructor(private telegram: TelegramService) {}

  async send(input: SendNotificationInput): Promise<NotificationSendResult> {
    if (this.sentCache.has(input.dedupKey)) {
      return { ok: true, status: "skipped" };
    }

    let result: NotificationSendResult;

    if (input.channel === "telegram") {
      const text = this.formatMessage(input);
      result = await this.telegram.sendMessage(input.chatId || "", text);
    } else {
      result = { ok: false, status: "failed", error: "email not implemented" };
    }

    if (result.ok) {
      this.sentCache.add(input.dedupKey);
    }

    return result;
  }

  private formatMessage(input: SendNotificationInput): string {
    return [
      `🚨 ${input.title}`,
      "",
      input.context,
      "",
      `👉 ${input.action}`
    ].join("\n");
  }
}
