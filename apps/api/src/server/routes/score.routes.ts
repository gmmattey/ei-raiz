import { UnifiedScoreService } from "../services/unified-score.service";
import type { SessaoUsuarioSaida } from "@ei/contratos";
import type { Env, ServiceResponse } from "../types/gateway";
import { parseJsonBody, sucesso, erro } from "../types/gateway";
import { usuarioEhAdmin } from "../../configuracao-produto";

export async function handleScoreRoutes(
  pathname: string,
  request: Request,
  env: Env,
  sessao: SessaoUsuarioSaida | null,
): Promise<ServiceResponse<unknown> | null> {
  if (!sessao) return null;
  if (!pathname.startsWith("/api/score")) return null;

  const service = new UnifiedScoreService(env.DB);

  const validarAdmin = async (): Promise<ServiceResponse<unknown> | null> => {
    const autorizado = await usuarioEhAdmin(env.DB, sessao.usuario.email, {
      adminTokenHeader: request.headers.get("x-admin-token"),
      adminTokenEnv: env.ADMIN_TOKEN,
      adminEmailsEnv: env.ADMIN_EMAILS,
    });
    if (!autorizado) return erro("ACESSO_NEGADO", "Acesso administrativo negado", 403);
    return null;
  };

  if (pathname === "/api/score/unified/calculate" && request.method === "POST") {
    const body = (await parseJsonBody(request)) as Record<string, unknown>;
    const requestedUserId = String(body.userId ?? "").trim();
    const targetUserId = requestedUserId || sessao.usuario.id;
    if (targetUserId !== sessao.usuario.id) {
      const erroAdmin = await validarAdmin();
      if (erroAdmin) return erroAdmin;
    }
    return sucesso(await service.calculateForUser(targetUserId));
  }

  if (pathname === "/api/score/unified/preview" && request.method === "POST") {
    const body = (await parseJsonBody(request)) as Record<string, unknown>;
    return sucesso(await service.preview(body));
  }

  if (pathname.startsWith("/api/score/unified/") && pathname.endsWith("/history") && request.method === "GET") {
    const userId = pathname.replace("/api/score/unified/", "").replace("/history", "");
    const alvo = userId || sessao.usuario.id;
    if (alvo !== sessao.usuario.id) {
      const erroAdmin = await validarAdmin();
      if (erroAdmin) return erroAdmin;
    }
    return sucesso(await service.getHistory(alvo));
  }

  return null;
}
