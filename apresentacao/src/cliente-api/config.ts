import { apiRequest } from "./http";

export type AppMenuItem = {
  chave: string;
  label: string;
  path: string;
  ordem: number;
  visivel: boolean;
};

export type AppConfig = {
  score: Record<string, unknown>;
  flags: Record<string, boolean>;
  menus: AppMenuItem[];
};

export function obterAppConfig(): Promise<AppConfig> {
  return apiRequest<AppConfig>("/api/app/config", { method: "GET" });
}
