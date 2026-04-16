import { BrapiProvider } from "../providers/brapi.provider";
import { CvmProvider } from "../providers/cvm.provider";
import { FundDataService } from "../services/fund-data.service";
import { MarketDataService } from "../services/market-data.service";
import { PortfolioAnalysisService } from "../services/portfolio-analysis.service";
import { GoogleFinanceProvider } from "../providers/google-finance.provider";
import { FipeProvider } from "../providers/fipe.provider";
import type { ApiErrorResponse } from "../types/financial-contracts";
import { normalizeCnpj } from "../utils/cnpj";
import { UpstreamHttpError } from "../utils/http";
import { FipeService } from "../services/fipe.service";

type EnvFinancial = {
  DB: D1Database;
  BRAPI_TOKEN?: string;
  BRAPI_BASE_URL?: string;
  CVM_BASE_URL?: string;
  FIPE_BASE_URL?: string;
};

type ServiceError = { ok: false; status: number; codigo: string; mensagem: string; detalhes?: unknown };
type ServiceSuccess<T> = { ok: true; dados: T };
type ServiceResponse<T> = ServiceSuccess<T> | ServiceError;

const badRequest = (message: string, details?: unknown): ServiceError => ({
  ok: false,
  status: 400,
  codigo: "BAD_REQUEST",
  mensagem: message,
  detalhes: details,
});

const mapApiError = (code: ApiErrorResponse["error"]["code"], message: string, source: ApiErrorResponse["error"]["source"], details?: unknown): ServiceError => ({
  ok: false,
  status: code === "NOT_FOUND" ? 404 : code === "TIMEOUT" ? 504 : code === "RATE_LIMIT" ? 429 : 502,
  codigo: code,
  mensagem: message,
  detalhes: { source, details },
});

const fromUpstreamError = (error: UpstreamHttpError): ServiceError =>
  error.status === 408
    ? mapApiError("TIMEOUT", "Timeout no provedor externo", error.source, { status: error.status })
    : error.status === 429
      ? mapApiError("RATE_LIMIT", "Limite de requisições no provedor externo", error.source, { status: error.status })
      : mapApiError("UPSTREAM_ERROR", "Falha no provedor externo", error.source, { status: error.status });

const getMarketService = (env: EnvFinancial, token: string): MarketDataService =>
  new MarketDataService({
    db: env.DB,
    provider: new BrapiProvider({
      token,
      baseUrl: env.BRAPI_BASE_URL?.trim() || "https://brapi.dev/api",
    }),
  });

const getFundService = (env: EnvFinancial): FundDataService =>
  new FundDataService({
    db: env.DB,
    provider: new CvmProvider({
      baseUrl: env.CVM_BASE_URL?.trim() || "https://dados.cvm.gov.br",
    }),
  });

const getFipeService = (env: EnvFinancial): FipeService =>
  new FipeService({
    db: env.DB,
    provider: new FipeProvider({
      baseUrl: env.FIPE_BASE_URL?.trim() || "https://parallelum.com.br/fipe/api/v1/carros",
    }),
  });

const parseJsonBody = async (request: Request): Promise<Record<string, unknown>> => {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
};

export async function handleFinancialRoutes(pathname: string, request: Request, env: EnvFinancial): Promise<ServiceResponse<unknown> | null> {
  try {
    if (pathname.startsWith("/api/market/")) {
      const token = env.BRAPI_TOKEN?.trim();
      if (!token) return mapApiError("INTERNAL_ERROR", "BRAPI_TOKEN não configurado no servidor", "internal");
      const market = getMarketService(env, token);

      if (pathname.startsWith("/api/market/quote/") && request.method === "GET") {
        const ticker = decodeURIComponent(pathname.replace("/api/market/quote/", "")).trim();
        if (!ticker) return badRequest("Ticker é obrigatório");
        return { ok: true, dados: await market.getQuote(ticker) };
      }

      if (pathname === "/api/market/quotes" && request.method === "GET") {
        const url = new URL(request.url);
        const tickers = (url.searchParams.get("tickers") ?? "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
        if (tickers.length === 0) return badRequest("Parâmetro tickers é obrigatório");
        const items = await market.getQuotes(tickers);
        return { ok: true, dados: { items, fetchedAt: new Date().toISOString() } };
      }

      if (pathname.startsWith("/api/market/history/") && request.method === "GET") {
        const ticker = decodeURIComponent(pathname.replace("/api/market/history/", "")).trim();
        if (!ticker) return badRequest("Ticker é obrigatório");
        const url = new URL(request.url);
        const range = (url.searchParams.get("range") ?? "1mo").trim() || "1mo";
        const interval = (url.searchParams.get("interval") ?? "1d").trim() || "1d";
        return { ok: true, dados: await market.getHistory(ticker, range, interval) };
      }
    }

    if (pathname.startsWith("/api/funds/")) {
      const funds = getFundService(env);
      if (pathname === "/api/funds/search" && request.method === "GET") {
        const url = new URL(request.url);
        const q = (url.searchParams.get("q") ?? "").trim();
        if (!q) return badRequest("Parâmetro q é obrigatório");
        return { ok: true, dados: await funds.searchFunds(q) };
      }

      if (pathname.endsWith("/daily-latest") && request.method === "GET") {
        const cnpj = normalizeCnpj(decodeURIComponent(pathname.replace("/api/funds/", "").replace("/daily-latest", "")));
        if (!cnpj) return badRequest("CNPJ inválido");
        const report = await funds.getFundDailyLatest(cnpj);
        if (!report) return mapApiError("NOT_FOUND", "Fundo não encontrado", "cvm");
        return { ok: true, dados: report };
      }

      if (pathname.endsWith("/daily-history") && request.method === "GET") {
        const cnpj = normalizeCnpj(decodeURIComponent(pathname.replace("/api/funds/", "").replace("/daily-history", "")));
        if (!cnpj) return badRequest("CNPJ inválido");
        const url = new URL(request.url);
        const limitRaw = Number.parseInt(url.searchParams.get("limit") ?? "30", 10);
        const limit = Number.isNaN(limitRaw) ? 30 : Math.max(1, Math.min(365, limitRaw));
        const items = await funds.getFundDailyHistory(cnpj, limit);
        return { ok: true, dados: { cnpj, items, fetchedAt: new Date().toISOString() } };
      }

      if (pathname.endsWith("/documents") && request.method === "GET") {
        const cnpj = normalizeCnpj(decodeURIComponent(pathname.replace("/api/funds/", "").replace("/documents", "")));
        if (!cnpj) return badRequest("CNPJ inválido");
        const docs = await funds.getFundDocuments(cnpj);
        return { ok: true, dados: docs };
      }

      const isFundByCnpj = pathname.startsWith("/api/funds/") && pathname.split("/").length === 4;
      if (isFundByCnpj && request.method === "GET") {
        const cnpj = normalizeCnpj(decodeURIComponent(pathname.replace("/api/funds/", "")));
        if (!cnpj) return badRequest("CNPJ inválido");
        const summary = await funds.getFundSummary(cnpj);
        if (!summary) return mapApiError("NOT_FOUND", "Fundo não encontrado", "cvm");
        return { ok: true, dados: summary };
      }
    }

    if (pathname.startsWith("/api/portfolio/")) {
      const token = env.BRAPI_TOKEN?.trim();
      if (!token) return mapApiError("INTERNAL_ERROR", "BRAPI_TOKEN não configurado no servidor", "internal");
      const analysisService = new PortfolioAnalysisService({
        market: getMarketService(env, token),
        googleFinance: new GoogleFinanceProvider(),
      });

      if (pathname === "/api/portfolio/analyze-position" && request.method === "POST") {
        const body = await parseJsonBody(request);
        const ticker = String(body.ticker ?? "").trim();
        const quantity = Number(body.quantity ?? NaN);
        const averagePrice = Number(body.averagePrice ?? NaN);
        if (!ticker || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(averagePrice) || averagePrice <= 0) {
          return badRequest("Payload inválido para análise de posição");
        }
        const totalInvested = quantity * averagePrice;
        const analysis = await analysisService.analyzePosition({ ticker, quantity, averagePrice, totalInvested });
        return { ok: true, dados: analysis };
      }

      if (pathname === "/api/portfolio/analyze-positions" && request.method === "POST") {
        const body = await parseJsonBody(request);
        const itemsRaw = Array.isArray(body.items) ? body.items : [];
        if (itemsRaw.length === 0) return badRequest("items é obrigatório");
        const items = itemsRaw
          .map((item) => {
            const entry = item as Record<string, unknown>;
            const ticker = String(entry.ticker ?? "").trim();
            const quantity = Number(entry.quantity ?? NaN);
            const averagePrice = Number(entry.averagePrice ?? NaN);
            if (!ticker || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(averagePrice) || averagePrice <= 0) return null;
            return { ticker, quantity, averagePrice, totalInvested: quantity * averagePrice };
          })
          .filter((item): item is { ticker: string; quantity: number; averagePrice: number; totalInvested: number } => item !== null);
        if (items.length === 0) return badRequest("Nenhum item válido para análise");
        const analyzed = await analysisService.analyzePositions(items);
        return { ok: true, dados: { items: analyzed, updatedAt: new Date().toISOString() } };
      }
    }

    if (pathname.startsWith("/api/fipe/")) {
      const fipe = getFipeService(env);

      if (pathname === "/api/fipe/car/brands" && request.method === "GET") {
        return { ok: true, dados: { items: await fipe.getBrands(), fetchedAt: new Date().toISOString() } };
      }

      if (pathname.startsWith("/api/fipe/car/models/") && request.method === "GET") {
        const brandCode = decodeURIComponent(pathname.replace("/api/fipe/car/models/", "")).trim();
        if (!brandCode) return badRequest("brandCode é obrigatório");
        return { ok: true, dados: { brandCode, items: await fipe.getModels(brandCode), fetchedAt: new Date().toISOString() } };
      }

      if (pathname.startsWith("/api/fipe/car/years/") && request.method === "GET") {
        const parts = pathname.replace("/api/fipe/car/years/", "").split("/");
        const brandCode = decodeURIComponent(parts[0] ?? "").trim();
        const modelCode = decodeURIComponent(parts[1] ?? "").trim();
        if (!brandCode || !modelCode) return badRequest("brandCode/modelCode são obrigatórios");
        return { ok: true, dados: { brandCode, modelCode, items: await fipe.getYears(brandCode, modelCode), fetchedAt: new Date().toISOString() } };
      }

      if (pathname.startsWith("/api/fipe/car/price/") && request.method === "GET") {
        const parts = pathname.replace("/api/fipe/car/price/", "").split("/");
        const brandCode = decodeURIComponent(parts[0] ?? "").trim();
        const modelCode = decodeURIComponent(parts[1] ?? "").trim();
        const yearCode = decodeURIComponent(parts[2] ?? "").trim();
        if (!brandCode || !modelCode || !yearCode) return badRequest("brandCode/modelCode/yearCode são obrigatórios");
        return { ok: true, dados: await fipe.getPrice(brandCode, modelCode, yearCode) };
      }
    }
  } catch (error) {
    if (error instanceof UpstreamHttpError) return fromUpstreamError(error);
    return mapApiError("INTERNAL_ERROR", "Erro interno na camada financeira", "internal", {
      message: error instanceof Error ? error.message : String(error),
    });
  }

  return null;
}
