import { ZodError } from "zod";

import type { Env } from "./infra/bd";
import type { ServiceResponse } from "./infra/http";
import { ehRotaPublica, ehTokenServicoCvm, resolverSessao, rotear } from "./aplicacao";
import { atualizarMercadoJob } from "./jobs/mercado-atualizar.job";
import { historicoMensalJob } from "./jobs/historico-mensal.job";
import { patrimonioReconstruirJob } from "./jobs/patrimonio-reconstruir.job";
import { executarJobMonitorado } from "./jobs/observabilidade.job";

export type { Env };

const PREFIXOS_VALIDOS = [
  "/api/auth/",
  "/api/usuario",
  "/api/perfil",
  "/api/mercado/",
  "/api/patrimonio",
  "/api/decisoes",
  "/api/admin",
  "/api/telemetria",
];

export const cabecalhosCors = (request: Request, env: Env): Record<string, string> => {
  const origem = request.headers.get('origin');
  const permitidas = (env.CORS_ALLOWED_ORIGINS ?? env.WEB_BASE_URL ?? '')
    .split(',').map((item) => item.trim()).filter(Boolean);
  const origemPermitida = origem !== null && permitidas.includes(origem);
  return {
  ...(origemPermitida ? { 'access-control-allow-origin': origem, vary: 'origin' } : {}),
  "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "access-control-allow-headers": "authorization,content-type",
  };
};

const responderJson = (carga: unknown, status: number, cors: Record<string, string>): Response =>
  new Response(JSON.stringify(carga), {
    status,
    headers: { ...cors, "content-type": "application/json; charset=utf-8" },
  });

const extrairToken = (request: Request): string | null => {
  const auth = request.headers.get("authorization");
  if (!auth) return null;
  const [tipo, token] = auth.split(" ");
  if (!tipo || !token || tipo.toLowerCase() !== "bearer") return null;
  return token;
};

function prefixoValido(caminho: string): boolean {
  return PREFIXOS_VALIDOS.some((p) => caminho === p.replace(/\/$/, "") || caminho.startsWith(p));
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);
    const cors = cabecalhosCors(request, env);

    if (request.method === "OPTIONS") {
      if (request.headers.has('origin') && !cors['access-control-allow-origin']) {
        return new Response(null, { status: 403 });
      }
      return new Response(null, { status: 204, headers: cors });
    }

    if (!pathname.startsWith("/api/")) {
      return responderJson({ ok: false, erro: { codigo: "rota_invalida", mensagem: "Prefixo de rota inválido" } }, 404, cors);
    }

    if (!prefixoValido(pathname)) {
      return responderJson({ ok: false, erro: { codigo: "rota_invalida", mensagem: "Prefixo de rota inválido" } }, 404, cors);
    }

    try {
      const sessao = await resolverSessao(request, env);
      const apresentaTokenServicoCvm = pathname.startsWith('/api/admin/cvm/') && (
        request.headers.has('x-admin-token') || request.headers.has('authorization')
      );
      if (!ehRotaPublica(pathname) && !ehTokenServicoCvm(request, env, pathname) && !sessao) {
        if (apresentaTokenServicoCvm) {
          return responderJson({ ok: false, erro: { codigo: 'token_servico_cvm_invalido', mensagem: 'Token de serviço CVM inválido' } }, 401, cors);
        }
        if (!extrairToken(request)) {
          return responderJson({ ok: false, erro: { codigo: "nao_autenticado", mensagem: "Token ausente" } }, 401, cors);
        }
        return responderJson({ ok: false, erro: { codigo: "nao_autenticado", mensagem: "Sessão inválida" } }, 401, cors);
      }

      const resultado: ServiceResponse<unknown> = await rotear(pathname, request, env, sessao);
      if (!resultado.ok) {
        return responderJson(
          { ok: false, erro: { codigo: resultado.codigo, mensagem: resultado.mensagem, detalhes: resultado.detalhes } },
          resultado.status, cors,
        );
      }
      return responderJson({ ok: true, dados: resultado.dados }, 200, cors);
    } catch (error) {
      if (error instanceof ZodError) {
        return responderJson(
          { ok: false, erro: { codigo: "validacao", mensagem: "Payload inválido", detalhes: error.flatten() } },
          422, cors,
        );
      }
      console.error("erro_gateway", error);
      return responderJson({ ok: false, erro: { codigo: "erro_interno", mensagem: "Falha interna no gateway" } }, 500, cors);
    } finally {
      void ctx;
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    if (event.cron === "0 3 * * *") {
      ctx.waitUntil(executarJobMonitorado(env, 'historico_mensal', () => historicoMensalJob(env)).catch((causa) => {
        console.error('cron_historico_mensal_falhou', causa);
      }));
      return;
    }
    if (event.cron === "*/30 * * * *") {
      ctx.waitUntil(executarJobMonitorado(env, 'patrimonio_reconstrucao', () => patrimonioReconstruirJob(env)).catch((causa) => {
        console.error('cron_patrimonio_reconstrucao_falhou', causa);
      }));
      return;
    }
    ctx.waitUntil(executarJobMonitorado(env, 'mercado_atualizar', () => atualizarMercadoJob(env)).catch((causa) => {
      console.error('cron_mercado_atualizar_falhou', causa);
    }));
  },
};
