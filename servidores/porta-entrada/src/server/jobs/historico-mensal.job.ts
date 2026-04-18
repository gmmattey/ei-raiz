import {
  RepositorioHistoricoMensalD1,
  ServicoHistoricoMensalPadrao,
  extrairAnoMes,
} from "@ei/servico-historico";
import type { PayloadHistoricoMensal } from "@ei/contratos";
import type { Env } from "../types/gateway";

type LinhaSnapshot = {
  payload_json: string;
};

/**
 * Grava um ponto em historico_carteira_mensal para o mês corrente, a partir
 * do snapshot atual consolidado (portfolio_snapshots).
 *
 * Idempotente por (usuario_id, ano_mes): re-execuções no mesmo mês sobrescrevem.
 * Chamado pelo cron D-1 (um por usuário) e opcionalmente pelo orquestrador.
 */
export async function registrarFechamentoMensalAtual(
  usuarioId: string,
  env: Env,
): Promise<void> {
  const row = await env.DB
    .prepare("SELECT payload_json FROM portfolio_snapshots WHERE usuario_id = ?")
    .bind(usuarioId)
    .first<LinhaSnapshot>();

  if (!row?.payload_json) return;

  const payloadSnapshot = JSON.parse(row.payload_json) as PayloadHistoricoMensal;
  const anoMesAtual = extrairAnoMes(new Date().toISOString());

  const servico = new ServicoHistoricoMensalPadrao(
    new RepositorioHistoricoMensalD1(env.DB),
  );
  await servico.registrarFechamentoMensal(
    usuarioId,
    anoMesAtual,
    payloadSnapshot,
    "fechamento_mensal",
  );
}

/**
 * Cron D-1: percorre todos os usuários com snapshot e grava ponto mensal.
 * Usa o snapshot atual de cada usuário — já reflete D-1 porque o cron de
 * cotações roda a cada 5 minutos e o snapshot é atualizado em background.
 */
export async function registrarFechamentoMensalTodosUsuarios(
  env: Env,
): Promise<void> {
  const result = await env.DB
    .prepare("SELECT DISTINCT usuario_id FROM portfolio_snapshots")
    .all<{ usuario_id: string }>();

  const usuarios = result.results ?? [];

  for (const { usuario_id } of usuarios) {
    try {
      await registrarFechamentoMensalAtual(usuario_id, env);
    } catch {
      // não bloqueia outros usuários
    }
  }
}
