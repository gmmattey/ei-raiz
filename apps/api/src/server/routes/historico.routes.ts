import {
  RepositorioFilaReconstrucaoD1,
  RepositorioHistoricoD1,
  RepositorioHistoricoMensalD1,
  FonteDadosReconstrucaoD1,
  ServicoHistoricoMensalPadrao,
  ServicoHistoricoPadrao,
  ServicoReconstrucaoCarteiraPadrao,
} from "@ei/servico-historico";
import type { SessaoUsuarioSaida } from "@ei/contratos";
import type { Env, ServiceResponse } from "../types/gateway";
import { erro, sucesso } from "../types/gateway";
import { construirProvedorHistoricoCotacoes } from "../services/provedor-historico-cotacoes";

const TAMANHO_LOTE_RECONSTRUCAO = 6;

const construirServicoHistoricoMensal = (env: Env): ServicoHistoricoMensalPadrao =>
  new ServicoHistoricoMensalPadrao(new RepositorioHistoricoMensalD1(env.DB));

const construirServicoReconstrucao = (env: Env): ServicoReconstrucaoCarteiraPadrao =>
  new ServicoReconstrucaoCarteiraPadrao({
    fila: new RepositorioFilaReconstrucaoD1(env.DB),
    historicoMensal: new RepositorioHistoricoMensalD1(env.DB),
    fonte: new FonteDadosReconstrucaoD1(env.DB),
    provedorHistorico: construirProvedorHistoricoCotacoes(env),
  });

export async function handleHistoricoRoutes(
  pathname: string,
  request: Request,
  env: Env,
  sessao: SessaoUsuarioSaida | null,
  ctx?: ExecutionContext,
): Promise<ServiceResponse<unknown> | null> {
  if (!sessao) return null;
  if (!pathname.startsWith("/api/historico")) return null;

  const userId = sessao.usuario.id;
  const historicoService = new ServicoHistoricoPadrao(new RepositorioHistoricoD1(env.DB));

  // ─── Histórico legado (snapshots_patrimonio + eventos) ────────────────────
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

  // ─── Histórico mensal (nova série temporal por usuário) ───────────────────
  if (pathname === "/api/historico/mensal" && request.method === "GET") {
    const url = new URL(request.url);
    const limite = Number.parseInt(url.searchParams.get("limite") ?? "24", 10);
    const servico = construirServicoHistoricoMensal(env);
    const pontos = await servico.listarPontos(userId, Number.isNaN(limite) ? 24 : limite);
    return sucesso({ pontos });
  }

  if (pathname.startsWith("/api/historico/mensal/") && request.method === "GET") {
    const anoMes = pathname.replace("/api/historico/mensal/", "");
    if (!/^\d{4}-\d{2}$/.test(anoMes)) {
      return erro("ANO_MES_INVALIDO", "Formato esperado: YYYY-MM", 422);
    }
    const servico = construirServicoHistoricoMensal(env);
    const ponto = await servico.obterMes(userId, anoMes);
    if (!ponto) return erro("MES_NAO_ENCONTRADO", "Sem dados para o mês informado", 404);
    return sucesso(ponto);
  }

  // ─── Reconstrução retroativa ──────────────────────────────────────────────
  if (pathname === "/api/historico/reconstrucao" && request.method === "GET") {
    const servico = construirServicoReconstrucao(env);
    const estado = await servico.obterEstado(userId);
    return sucesso(estado);
  }

  if (pathname === "/api/historico/reconstrucao" && request.method === "POST") {
    const servico = construirServicoReconstrucao(env);
    const estado = await servico.enfileirar(userId);
    // Processa primeiro lote já em background — o usuário vê progresso pelo GET acima.
    if (ctx) {
      ctx.waitUntil(
        servico.processarProximoLote(userId, TAMANHO_LOTE_RECONSTRUCAO).then(() => undefined).catch(() => undefined),
      );
    }
    return sucesso(estado);
  }

  if (pathname === "/api/historico/reconstrucao/processar" && request.method === "POST") {
    const servico = construirServicoReconstrucao(env);
    const estado = await servico.processarProximoLote(userId, TAMANHO_LOTE_RECONSTRUCAO);
    return sucesso(estado);
  }

  return null;
}
