import { ErroAutenticacao } from "@ei/servico-autenticacao";
import { ErroImportacao } from "@ei/servico-importacao";
import { ZodError } from "zod";
import type { SessaoUsuarioSaida } from "@ei/contratos";

import type { Env, ServiceResponse } from "./server/types/gateway";
import { handleFinancialRoutes } from "./server/routes/financial.routes";
import { handleAuthRoutes, buildAuthService } from "./server/routes/auth.routes";
import { handleAppRoutes } from "./server/routes/app.routes";
import { handleCarteiraRoutes } from "./server/routes/carteira.routes";
import { handleFinancialCoreRoutes } from "./server/routes/financial-core.routes";
import { handleInsightsRoutes } from "./server/routes/insights.routes";
import { handlePerfilRoutes } from "./server/routes/perfil.routes";
import { handleHistoricoRoutes } from "./server/routes/historico.routes";
import { handlePosicoesRoutes } from "./server/routes/posicoes.routes";
import { handleAportesRoutes } from "./server/routes/aportes.routes";
import { handleDecisoesRoutes } from "./server/routes/decisoes.routes";
import { handleImportacaoRoutes } from "./server/routes/importacao.routes";
import { handleVeraRoutes } from "./server/routes/vera.routes";
import { handleAdminRoutes } from "./server/routes/admin.routes";
import { handleScoreRoutes } from "./server/routes/score.routes";
import { handleTelemetriaRoutes } from "./server/routes/telemetria.routes";
import { refreshAllUsersMarketQuotes } from "./server/jobs/market-refresh.job";
import { registrarFechamentoMensalTodosUsuarios } from "./server/jobs/historico-mensal.job";

// Re-exporta Env para uso em workers bindings
export type { Env };

const routePrefixes = [
  "/api/auth", "/api/carteira", "/api/importacao", "/api/perfil",
  "/api/insights", "/api/historico", "/api/decisoes", "/api/vera",
  "/api/posicoes", "/api/app", "/api/admin", "/api/telemetria",
  "/api/market", "/api/funds", "/api/portfolio", "/api/fipe", "/api/score",
  "/api/financial-core", "/api/aportes",
];

const isPublicRoute = (pathname: string): boolean =>
  pathname === "/api/auth/registrar" ||
  pathname === "/api/auth/registro" ||
  pathname === "/api/auth/entrar" ||
  pathname === "/api/auth/login" ||
  pathname === "/api/auth/verificar-cadastro" ||
  pathname === "/api/auth/recuperar-senha" ||
  pathname === "/api/auth/recuperar-acesso" ||
  pathname === "/api/auth/redefinir-senha" ||
  pathname === "/api/admin/test-data/reset" ||
  pathname === "/api/telemetria/evento" ||
  pathname === "/api/app/content" ||
  pathname === "/api/app/corretoras" ||
  pathname === "/api/app/simulacoes/parametros" ||
  pathname.startsWith("/api/market/") ||
  pathname.startsWith("/api/funds/");

const corsHeaders = (): Record<string, string> => ({
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
  "access-control-allow-headers": "authorization,content-type,x-admin-token",
});

const json = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders(), "content-type": "application/json; charset=utf-8" },
  });

const extrairToken = (request: Request): string | null => {
  const auth = request.headers.get("authorization");
  if (!auth) return null;
  const [tipo, token] = auth.split(" ");
  if (!tipo || !token || tipo.toLowerCase() !== "bearer") return null;
  return token;
};

async function dispatch(
  pathname: string,
  request: Request,
  env: Env,
  sessao: SessaoUsuarioSaida | null,
  ctx: ExecutionContext,
): Promise<ServiceResponse<unknown>> {
  // Rotas financeiras (market, funds, portfolio, fipe) — delegadas ao handler existente
  const financialRoute = await handleFinancialRoutes(pathname, request, env);
  if (financialRoute) return financialRoute;

  // Domínios de aplicação
  const routers = [
    () => handleAuthRoutes(pathname, request, env, sessao, ctx),
    () => handleTelemetriaRoutes(pathname, request, env, sessao),
    () => handleAppRoutes(pathname, request, env, sessao),
    () => handleAdminRoutes(pathname, request, env, sessao),
    () => handleFinancialCoreRoutes(pathname, request, env, sessao),
    () => handleCarteiraRoutes(pathname, request, env, sessao, ctx),
    () => handleInsightsRoutes(pathname, request, env, sessao, ctx),
    () => handlePerfilRoutes(pathname, request, env, sessao),
    () => handleHistoricoRoutes(pathname, request, env, sessao, ctx),
    () => handlePosicoesRoutes(pathname, request, env, sessao),
    () => handleAportesRoutes(pathname, request, env, sessao),
    () => handleDecisoesRoutes(pathname, request, env, sessao),
    () => handleImportacaoRoutes(pathname, request, env, sessao, ctx),
    () => handleVeraRoutes(pathname, request, env, sessao),
    () => handleScoreRoutes(pathname, request, env, sessao),
  ];

  for (const router of routers) {
    const result = await router();
    if (result !== null) return result;
  }

  return { ok: false, status: 404, codigo: "ROTA_NAO_ENCONTRADA", mensagem: "Rota não encontrada" };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });

    if (!pathname.startsWith("/api/")) {
      return json({ ok: false, erro: { codigo: "ROTA_INVALIDA", mensagem: "Prefixo de rota inválido" } }, 404);
    }

    const isAllowedPrefix = routePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
    if (!isAllowedPrefix) {
      return json({ ok: false, erro: { codigo: "ROTA_INVALIDA", mensagem: "Prefixo de rota inválido" } }, 404);
    }

    try {
      let sessao: SessaoUsuarioSaida | null = null;
      if (!isPublicRoute(pathname)) {
        const token = extrairToken(request);
        if (!token) {
          return json({ ok: false, erro: { codigo: "NAO_AUTORIZADO", mensagem: "Token ausente" } }, 401);
        }
        sessao = await buildAuthService(env).obterSessao(token);
      }

      const resultado = await dispatch(pathname, request, env, sessao, ctx);
      if (!resultado.ok) {
        return json(
          { ok: false, erro: { codigo: resultado.codigo, mensagem: resultado.mensagem, detalhes: resultado.detalhes } },
          resultado.status,
        );
      }
      return json({ ok: true, dados: resultado.dados }, 200);
    } catch (error) {
      if (error instanceof ZodError) {
        return json({ ok: false, erro: { codigo: "VALIDACAO", mensagem: "Payload inválido", detalhes: error.flatten() } }, 422);
      }
      if (error instanceof ErroAutenticacao) {
        return json({ ok: false, erro: { codigo: error.codigo, mensagem: error.message } }, error.status);
      }
      if (error instanceof ErroImportacao) {
        return json({ ok: false, erro: { codigo: error.codigo, mensagem: error.message, detalhes: error.detalhes } }, error.status);
      }
      return json({ ok: false, erro: { codigo: "ERRO_INTERNO", mensagem: "Falha interna no gateway" } }, 500);
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    // Dois crons diferenciados via `event.cron` (configurados em wrangler.toml):
    //   */5 * * * *  → refresh de cotações de mercado
    //   0 3 * * *    → fechamento mensal D-1 (histórico da carteira)
    if (event.cron === "0 3 * * *") {
      ctx.waitUntil(registrarFechamentoMensalTodosUsuarios(env).catch(() => {}));
      return;
    }
    ctx.waitUntil(refreshAllUsersMarketQuotes(env).catch(() => {}));
  },
};
