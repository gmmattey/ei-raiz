import type { TelemetriaEventoEntrada, TelemetriaEventoSaida } from "@ei/contratos";
import { apiRequest } from "./http";

export function registrarEvento(entrada: TelemetriaEventoEntrada): Promise<TelemetriaEventoSaida> {
  return apiRequest<TelemetriaEventoSaida>("/api/telemetria/eventos", {
    method: "POST",
    body: JSON.stringify(entrada),
  });
}
