// Fecha o mês vigente consolidando o patrimônio de cada usuário em
// `patrimonio_historico_mensal`. Executa via cron diário; o upsert por
// (usuario_id, ano_mes) garante que rodar múltiplas vezes no mesmo mês
// apenas atualiza a linha correspondente.

import type { Env } from '../infra/bd';
import { agora, criarBd } from '../infra/bd';
import { reconstruirHistoricoDeMovimentos, type MovimentoHistorico } from './patrimonio-historico.movimentos';

interface LinhaUsuario {
  id: string;
}

interface LinhaResumo {
  patrimonio_bruto_brl: number | null;
  divida_brl: number | null;
  patrimonio_liquido_brl: number | null;
  aporte_mes_brl: number | null;
}

interface LinhaConfianca {
  total_itens: number;
  itens_sem_valor: number;
  itens_cotacao_expirada: number;
}

interface LinhaContagemItens {
  total_itens: number;
}

export async function historicoMensalJob(env: Env): Promise<void> {
  const bd = criarBd(env);
  const usuarios = await bd.consultar<LinhaUsuario>(`SELECT id FROM usuarios`);
  if (usuarios.length === 0) return;

  const anoMes = new Date().toISOString().slice(0, 7);
  const timestamp = agora();

  for (const u of usuarios) {
    const [movimentos, itens] = await Promise.all([
      bd.consultar<MovimentoHistorico>(
        `SELECT m.item_id, i.tipo AS item_tipo, m.tipo, m.valor_brl, m.data, m.criado_em
           FROM patrimonio_movimentos m
           INNER JOIN patrimonio_itens i ON i.id = m.item_id
          WHERE m.usuario_id = ?
          ORDER BY m.data ASC, m.criado_em ASC`,
        u.id,
      ),
      bd.primeiro<LinhaContagemItens>(
        `SELECT COUNT(*) AS total_itens FROM patrimonio_itens WHERE usuario_id = ?`, u.id,
      ),
    ]);
    const historicoReconstruido = reconstruirHistoricoDeMovimentos(
      movimentos,
      anoMes,
      itens?.total_itens ?? 0,
    );
    for (const item of historicoReconstruido) {
      await bd.executar(
        `INSERT INTO patrimonio_historico_mensal (
            usuario_id, ano_mes, patrimonio_bruto_brl, patrimonio_liquido_brl,
            divida_brl, aporte_mes_brl, rentabilidade_mes_pct, eh_confiavel,
            dados_json, atualizado_em
          ) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)
         ON CONFLICT(usuario_id, ano_mes) DO UPDATE SET
            patrimonio_bruto_brl = excluded.patrimonio_bruto_brl,
            patrimonio_liquido_brl = excluded.patrimonio_liquido_brl,
            divida_brl = excluded.divida_brl,
            aporte_mes_brl = excluded.aporte_mes_brl,
            rentabilidade_mes_pct = NULL,
            eh_confiavel = excluded.eh_confiavel,
            dados_json = excluded.dados_json,
            atualizado_em = excluded.atualizado_em`,
        u.id, item.anoMes, item.patrimonioBrutoBrl, item.patrimonioLiquidoBrl,
        item.dividaBrl, item.aporteMesBrl, item.ehConfiavel ? 1 : 0,
        item.dadosJson, timestamp,
      );
    }

    const resumo = await bd.primeiro<LinhaResumo>(
      `SELECT patrimonio_bruto_brl, divida_brl, patrimonio_liquido_brl, aporte_mes_brl
         FROM vw_patrimonio_resumo WHERE usuario_id = ?`,
      u.id,
    );
    if (!resumo) continue;

    const confianca = await bd.primeiro<LinhaConfianca>(
      `SELECT
          COUNT(*) AS total_itens,
          SUM(CASE WHEN i.valor_atual_brl IS NULL THEN 1 ELSE 0 END) AS itens_sem_valor,
          SUM(CASE WHEN i.quantidade IS NOT NULL AND i.ativo_id IS NOT NULL
                    AND NOT EXISTS (
                      SELECT 1 FROM ativos_cotacoes_cache c
                       WHERE c.ativo_id = i.ativo_id AND c.expira_em >= ?
                    )
                   THEN 1 ELSE 0 END) AS itens_cotacao_expirada
         FROM patrimonio_itens i WHERE i.usuario_id = ? AND i.esta_ativo = 1`,
      timestamp, u.id,
    );
    const itensSemValor = confianca?.itens_sem_valor ?? 0;
    const itensCotacaoExpirada = confianca?.itens_cotacao_expirada ?? 0;
    const ehConfiavel = itensSemValor === 0 && itensCotacaoExpirada === 0 ? 1 : 0;
    const dadosJson = JSON.stringify({
      totalItens: confianca?.total_itens ?? 0,
      itensSemValor,
      itensCotacaoExpirada,
    });

    await bd.executar(
      `INSERT INTO patrimonio_historico_mensal (
          usuario_id, ano_mes,
          patrimonio_bruto_brl, patrimonio_liquido_brl, divida_brl,
          aporte_mes_brl, rentabilidade_mes_pct, eh_confiavel,
          dados_json, atualizado_em
        ) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)
       ON CONFLICT(usuario_id, ano_mes) DO UPDATE SET
         patrimonio_bruto_brl = excluded.patrimonio_bruto_brl,
         patrimonio_liquido_brl = excluded.patrimonio_liquido_brl,
         divida_brl = excluded.divida_brl,
         aporte_mes_brl = excluded.aporte_mes_brl,
         eh_confiavel = excluded.eh_confiavel,
         dados_json = excluded.dados_json,
         atualizado_em = excluded.atualizado_em`,
      u.id,
      anoMes,
      resumo.patrimonio_bruto_brl ?? 0,
      resumo.patrimonio_liquido_brl ?? 0,
      resumo.divida_brl ?? 0,
      resumo.aporte_mes_brl ?? 0,
      ehConfiavel,
      dadosJson,
      timestamp,
    );
  }
}
