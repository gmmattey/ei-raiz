import { refreshMarketQuotesForUser } from "./market-refresh.job";
import { reprocessUserPortfolio } from "./portfolio-reprocess.job";
import { registrarFechamentoMensalAtual } from "./historico-mensal.job";
import type { Env } from "../types/gateway";

type OpcoesOrquestracao = {
  /** Se true, atualiza cotações antes do snapshot. Default: true. */
  refrescarMercado?: boolean;
  /** Se true, grava ponto mensal em historico_carteira_mensal. Default: false (só cron D-1). */
  gravarHistoricoMensal?: boolean;
};

/**
 * Orquestra os jobs de pós-escrita de carteira em uma única sequência.
 *
 * Substitui o padrão antigo de dois `ctx.waitUntil` paralelos
 * (refresh + reprocess), que podia gerar race conditions no UPSERT
 * de portfolio_snapshots e chamadas redundantes à BRAPI.
 *
 * Sequência:
 *   1. refresh de cotações (opcional)
 *   2. snapshot consolidado (portfolio_snapshots + analytics)
 *   3. ponto do mês atual em historico_carteira_mensal (opcional)
 *
 * Falhas em cada etapa são isoladas — uma etapa não bloqueia as outras.
 */
export async function orquestrarPosEscritaCarteira(
  usuarioId: string,
  env: Env,
  opcoes: OpcoesOrquestracao = {},
): Promise<void> {
  const { refrescarMercado = true, gravarHistoricoMensal = false } = opcoes;

  if (refrescarMercado) {
    try {
      await refreshMarketQuotesForUser(usuarioId, env);
    } catch {
      // mercado indisponível não bloqueia snapshot
    }
  }

  try {
    await reprocessUserPortfolio(usuarioId, env);
  } catch {
    // snapshot já tem fallback interno para analytics
  }

  if (gravarHistoricoMensal) {
    try {
      await registrarFechamentoMensalAtual(usuarioId, env);
    } catch {
      // histórico mensal é idempotente — próxima execução reescreve
    }
  }
}
