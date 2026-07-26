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

const cabecalhosCors = (): Record<string, string> => ({
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "access-control-allow-headers": "authorization,content-type",
});

const responderJson = (carga: unknown, status = 200): Response =>
  new Response(JSON.stringify(carga), {
    status,
    headers: { ...cabecalhosCors(), "content-type": "application/json; charset=utf-8" },
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

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cabecalhosCors() });
    }

    if (!pathname.startsWith("/api/")) {
      return responderJson({ ok: false, erro: { codigo: "rota_invalida", mensagem: "Prefixo de rota inválido" } }, 404);
    }

    if (!prefixoValido(pathname)) {
      return responderJson({ ok: false, erro: { codigo: "rota_invalida", mensagem: "Prefixo de rota inválido" } }, 404);
    }

    try {
      const sessao = await resolverSessao(request, env);
      const apresentaTokenServicoCvm = pathname.startsWith('/api/admin/cvm/') && (
        request.headers.has('x-admin-token') || request.headers.has('authorization')
      );
      if (!ehRotaPublica(pathname) && !ehTokenServicoCvm(request, env, pathname) && !sessao) {
        if (apresentaTokenServicoCvm) {
          return responderJson({ ok: false, erro: { codigo: 'token_servico_cvm_invalido', mensagem: 'Token de serviço CVM inválido' } }, 401);
        }
        if (!extrairToken(request)) {
          return responderJson({ ok: false, erro: { codigo: "nao_autenticado", mensagem: "Token ausente" } }, 401);
        }
        return responderJson({ ok: false, erro: { codigo: "nao_autenticado", mensagem: "Sessão inválida" } }, 401);
      }

      const resultado: ServiceResponse<unknown> = await rotear(pathname, request, env, sessao);
      if (!resultado.ok) {
        return responderJson(
          { ok: false, erro: { codigo: resultado.codigo, mensagem: resultado.mensagem, detalhes: resultado.detalhes } },
          resultado.status,
        );
      }
      return responderJson({ ok: true, dados: resultado.dados }, 200);
    } catch (error) {
      if (error instanceof ZodError) {
        return responderJson(
          { ok: false, erro: { codigo: "validacao", mensagem: "Payload inválido", detalhes: error.flatten() } },
          422,
        );
      }
      console.error("erro_gateway", error);
      return responderJson({ ok: false, erro: { codigo: "erro_interno", mensagem: "Falha interna no gateway" } }, 500);
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
