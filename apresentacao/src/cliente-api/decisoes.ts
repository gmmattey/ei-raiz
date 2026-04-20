import type {
  SimulacaoSaida,
  SimulacaoCriarEntrada,
  VeraMensagemEntrada,
  VeraMensagemSaida,
  TipoSimulacao,
} from "@ei/contratos";
import { apiRequest } from "./http";

export function listarSimulacoes(): Promise<{ itens: SimulacaoSaida[] }> {
  return apiRequest<{ itens: SimulacaoSaida[] }>("/api/decisoes/simulacoes", { method: "GET" });
}

export function obterSimulacao(id: string): Promise<SimulacaoSaida> {
  return apiRequest<SimulacaoSaida>(`/api/decisoes/simulacoes/${encodeURIComponent(id)}`, { method: "GET" });
}

export function criarSimulacao(entrada: SimulacaoCriarEntrada): Promise<SimulacaoSaida> {
  return apiRequest<SimulacaoSaida>("/api/decisoes/simulacoes", {
    method: "POST",
    body: JSON.stringify(entrada),
  });
}

export function enviarMensagemVera(entrada: VeraMensagemEntrada): Promise<VeraMensagemSaida> {
  return apiRequest<VeraMensagemSaida>("/api/decisoes/vera/mensagens", {
    method: "POST",
    body: JSON.stringify(entrada),
  });
}

// ─── Shims legados para simuladores .jsx ────────────────────────────────────
// Serão removidos em Etapa 7 após os simuladores migrarem para criarSimulacao.
// Cálculo local (sem rede) — backend canônico só persiste resultado.

type LegacyEntrada = { tipo: string; nome?: string; premissas: Record<string, unknown> };

function mapearTipo(tipoLegado: string): TipoSimulacao {
  if (tipoLegado === "imovel" || tipoLegado === "carro") return tipoLegado === "carro" ? "veiculo" : "imovel";
  return "outro";
}

function simularLocalmente(entrada: LegacyEntrada): Record<string, unknown> {
  // Cálculo placeholder: retorna as premissas como resultado para preservar o shape.
  // Cada simulador .jsx migrará a lógica real para calculos/ no backend em Etapa 7.
  return { ...entrada.premissas, calculadoLocalmente: true };
}

export async function calcularSimulacao(entrada: LegacyEntrada): Promise<SimulacaoSaida> {
  const resultado = simularLocalmente(entrada);
  return {
    id: "",
    usuarioId: "",
    tipo: mapearTipo(entrada.tipo),
    premissasJson: { nome: entrada.nome ?? "", tipoLegado: entrada.tipo, ...entrada.premissas },
    resultadoJson: resultado,
    criadoEm: new Date().toISOString(),
  };
}

export async function salvarSimulacao(entrada: LegacyEntrada): Promise<SimulacaoSaida> {
  const resultado = simularLocalmente(entrada);
  return criarSimulacao({
    tipo: mapearTipo(entrada.tipo),
    premissasJson: { nome: entrada.nome ?? "", tipoLegado: entrada.tipo, ...entrada.premissas },
    resultadoJson: resultado,
  });
}

export async function recalcularSimulacao(id: string): Promise<SimulacaoSaida> {
  const atual = await obterSimulacao(id);
  return {
    ...atual,
    resultadoJson: { ...atual.premissasJson, calculadoLocalmente: true },
  };
}

export async function obterPremissasMercado(_tipo: string): Promise<Record<string, unknown>> {
  // Backend canônico não expõe premissas editáveis por tipo. Cada simulador usa defaults hardcoded.
  return {};
}
