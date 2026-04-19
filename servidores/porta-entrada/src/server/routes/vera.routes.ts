import { veraBridge, loadVeraModelParams } from "../services/vera-bridge";
import type { SessaoUsuarioSaida } from "@ei/contratos";
import type { Env, ServiceResponse } from "../types/gateway";
import { parseJsonBody, sucesso } from "../types/gateway";

export async function handleVeraRoutes(
  pathname: string,
  request: Request,
  env: Env,
  sessao: SessaoUsuarioSaida | null,
): Promise<ServiceResponse<unknown> | null> {
  if (!sessao) return null;

  if (pathname === "/api/vera/avaliar" && request.method === "POST") {
    const [body, modelParams] = await Promise.all([
      parseJsonBody(request),
      loadVeraModelParams(env.DB),
    ]);
    const result = veraBridge.avaliar(body as never, modelParams);
    return sucesso(result);
  }

  return null;
}
