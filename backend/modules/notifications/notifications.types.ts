export type NotificationChannel = "telegram" | "email";

export type NotificationStatus = "pending" | "sent" | "failed" | "skipped";

export type NotificationSeverity = "low" | "medium" | "high";

export type NotificationType =
  | "asset_drawdown"
  | "fund_under_cdi"
  | "concentration_high"
  | "no_contribution"
  | "system_test";

export type NotificationPayload = {
  alertId: string;
  userId: string;
  channel: NotificationChannel;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  context: string;
  action: string;
  dedupKey: string;
  chatId?: string;
  email?: string;
};

export type NotificationHistoryRecord = {
  id: string;
  alertId: string;
  userId: string;
  channel: NotificationChannel;
  type: NotificationType;
  status: NotificationStatus;
  dedupKey: string;
  externalMessageId?: string;
  errorMessage?: string;
  createdAt: string;
};

export type NotificationSendResult = {
  ok: boolean;
  status: NotificationStatus;
  externalMessageId?: string;
  error?: string;
  raw?: unknown;
};

export type SendNotificationInput = NotificationPayload;
