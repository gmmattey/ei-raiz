import { clearSession, getAuthToken, marcarSessaoExpirada } from "./authStorage";

type ClientEnv = {
  VITE_API_BASE_URL?: string;
  VITE_API_URL?: string;
};

const env = (import.meta as unknown as { env?: ClientEnv }).env;
const configuredBaseUrl = (env?.VITE_API_BASE_URL ?? "").trim() || (env?.VITE_API_URL ?? "").trim();
const host = typeof window !== "undefined" ? window.location.hostname : "";
const executandoLocal = host === "localhost" || host === "127.0.0.1";
const apontaParaLocal = configuredBaseUrl.includes("127.0.0.1") || configuredBaseUrl.includes("localhost");

const API_BASE_URL = configuredBaseUrl
  ? apontaParaLocal && !executandoLocal
    ? "https://ei-api-gateway.giammattey-luiz.workers.dev"
    : configuredBaseUrl
  : executandoLocal
    ? "http://127.0.0.1:8787"
    : "https://ei-api-gateway.giammattey-luiz.workers.dev";
const API_FALLBACK_URL = "https://ei-api-gateway.giammattey-luiz.workers.dev";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiEnvelope<T> = {
  ok: boolean;
  dados?: T;
  erro?: {
    codigo?: string;
    mensagem?: string;
    detalhes?: unknown;
  };
};

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });
  } catch {
    if (API_BASE_URL !== API_FALLBACK_URL) {
      try {
        response = await fetch(`${API_FALLBACK_URL}${path}`, {
          ...init,
          headers,
        });
      } catch {
        throw new ApiError(
          "Nao foi possivel conectar com a API. Verifique se o backend esta em execucao.",
          0,
          "API_INDISPONIVEL",
        );
      }
    } else {
      throw new ApiError(
        "Nao foi possivel conectar com a API. Verifique se o backend esta em execucao.",
        0,
        "API_INDISPONIVEL",
      );
    }
  }

  const raw = await response.text();
  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = raw ? (JSON.parse(raw) as ApiEnvelope<T>) : null;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok) {
    const message = payload?.erro?.mensagem ?? `Erro de integração com API (HTTP ${response.status})`;
    const code = payload?.erro?.codigo ?? "ERRO_API";
    if (response.status === 401) {
      marcarSessaoExpirada();
      clearSession();
    }
    throw new ApiError(message, response.status, code, payload?.erro?.detalhes ?? raw);
  }

  return payload.dados as T;
}
