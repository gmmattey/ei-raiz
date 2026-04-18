import { apiRequest } from "./http";

export function registrarEventoTelemetria(nomeEvento: string, payload?: Record<string, unknown>): Promise<{ registrado: boolean }> {
  return apiRequest<{ registrado: boolean }>("/api/telemetria/evento", {
    method: "POST",
    body: JSON.stringify({ nomeEvento, payload, origem: "web" }),
  });
}
