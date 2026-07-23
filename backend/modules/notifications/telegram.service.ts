import { NotificationSendResult } from "./notifications.types";

export class TelegramService {
  private baseUrl: string;

  constructor(private token: string) {
    if (!token) throw new Error("TELEGRAM_BOT_TOKEN missing");
    this.baseUrl = `https://api.telegram.org/bot${token}`;
  }

  async sendMessage(chatId: string, text: string): Promise<NotificationSendResult> {
    try {
      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          disable_web_page_preview: true
        })
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        return { ok: false, status: "failed", error: data.description, raw: data };
      }

      return {
        ok: true,
        status: "sent",
        externalMessageId: data.result?.message_id?.toString(),
        raw: data
      };
    } catch (err: any) {
      return { ok: false, status: "failed", error: err.message };
    }
  }
}
