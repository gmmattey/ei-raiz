import type { SessaoUsuarioSaida } from "@ei/contratos";
import type { Env, ServiceResponse } from "../types/gateway";
import { erro, sucesso } from "../types/gateway";
import { FinancialCoreService } from "../services/financial-core.service";

/**
 * Rotas canônicas do Financial Core — fonte única da verdade financeira.
 *
 * Contratos em camelCase, com `qualityFlags` explícitas, score oficial único
 * (`unified_score_v1`) e retorno principal `returnSinceInception`. Consumido
 * pelo frontend novo e por integrações externas (Vera).
 */
export async function handleFinancialCoreRoutes(
  pathname: string,
  request: Request,
  env: Env,
  sessao: SessaoUsuarioSaida | null,
): Promise<ServiceResponse<unknown> | null> {
  if (!sessao) return null;
  if (!pathname.startsWith("/api/financial-core")) return null;

  const userId = sessao.usuario.id;
  const core = new FinancialCoreService(env);

  if (pathname === "/api/financial-core/summary" && request.method === "GET") {
    const summary = await core.getSummary(userId);
    return sucesso(summary);
  }

  if (pathname === "/api/financial-core/assets" && request.method === "GET") {
    const url = new URL(request.url);
    const filters = {
      class: url.searchParams.get("class") ?? undefined,
      source: url.searchParams.get("source") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
    };
    const assets = await core.getAssets(userId, filters);
    return sucesso(assets);
  }

  if (pathname.startsWith("/api/financial-core/assets/") && request.method === "GET") {
    const id = decodeURIComponent(pathname.replace("/api/financial-core/assets/", ""));
    const assets = await core.getAssets(userId);
    const asset = assets.find((a) => a.id === id);
    if (!asset) return erro("ASSET_NOT_FOUND", "Ativo não encontrado", 404);
    return sucesso(asset);
  }

  if (pathname === "/api/financial-core/history" && request.method === "GET") {
    const url = new URL(request.url);
    const range = url.searchParams.get("range") ?? "12m";
    const history = await core.getHistory(userId, range);
    return sucesso(history);
  }

  return null;
}
