// Contratos do domínio telemetria — eventos de produto.

export interface TelemetriaEventoEntrada {
  nome: string;
  dadosJson?: Record<string, unknown>;
  ocorridoEm?: string;
}

export interface TelemetriaEventoSaida {
  id: string;
  aceito: boolean;
}
