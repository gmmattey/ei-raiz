import type { SessaoUsuarioSaida } from "@ei/contratos";
import { obterConteudoApp, obterCorretorasSuportadas, obterAppConfig } from "../../configuracao-produto";
import type { Env, ServiceResponse } from "../types/gateway";
import { sucesso } from "../types/gateway";

export async function handleAppRoutes(
  pathname: string,
  request: Request,
  env: Env,
  sessao: SessaoUsuarioSaida | null,
): Promise<ServiceResponse<unknown> | null> {
  if (pathname === "/api/app/content" && request.method === "GET") {
    return sucesso(await obterConteudoApp(env.DB));
  }

  if (pathname === "/api/app/corretoras" && request.method === "GET") {
    return sucesso(await obterCorretorasSuportadas(env.DB));
  }

  if (pathname === "/api/app/simulacoes/parametros" && request.method === "GET") {
    const rows = await env.DB
      .prepare("SELECT chave, valor_json, descricao, ativo, atualizado_em FROM simulacoes_parametros WHERE ativo = 1 ORDER BY chave ASC")
      .all<{ chave: string; valor_json: string; descricao: string | null; ativo: number; atualizado_em: string }>();
    return sucesso(
      (rows.results ?? []).map((row) => ({
        chave: row.chave,
        valor: row.valor_json ? JSON.parse(row.valor_json) : {},
        descricao: row.descricao ?? "",
        ativo: row.ativo === 1,
        atualizadoEm: row.atualizado_em,
      })),
    );
  }

  if (pathname === "/api/app/config" && request.method === "GET") {
    if (!sessao) return null;
    return sucesso(await obterAppConfig(env.DB));
  }

  return null;
}
