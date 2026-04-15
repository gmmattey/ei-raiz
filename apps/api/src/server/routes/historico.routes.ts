import { RepositorioHistoricoD1, ServicoHistoricoPadrao } from "@ei/servico-historico";
import type { SessaoUsuarioSaida } from "@ei/contratos";
import type { Env, ServiceResponse } from "../types/gateway";
import { sucesso } from "../types/gateway";

export async function handleHistoricoRoutes(
  pathname: string,
  request: Request,
  env: Env,
  sessao: SessaoUsuarioSaida | null,
): Promise<ServiceResponse<unknown> | null> {
  if (!sessao) return null;
  if (!pathname.startsWith("/api/historico")) return null;

  const userId = sessao.usuario.id;
  const historicoService = new ServicoHistoricoPadrao(new RepositorioHistoricoD1(env.DB));

  if (pathname === "/api/historico/snapshots" && request.method === "GET") {
    const url = new URL(request.url);
    const limite = Number.parseInt(url.searchParams.get("limite") ?? "12", 10);
    return sucesso(await historicoService.listarSnapshots(userId, Number.isNaN(limite) ? 12 : limite));
  }

  if (pathname === "/api/historico/eventos" && request.method === "GET") {
    const url = new URL(request.url);
    const limite = Number.parseInt(url.searchParams.get("limite") ?? "12", 10);
    return sucesso(await historicoService.listarEventos(userId, Number.isNaN(limite) ? 12 : limite));
  }

  return null;
}
