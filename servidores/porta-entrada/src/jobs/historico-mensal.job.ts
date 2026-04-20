// Fecha o mês vigente consolidando o patrimônio de cada usuário em
// `patrimonio_historico_mensal`. Executa via cron diário; o upsert por
// (usuario_id, ano_mes) garante que rodar múltiplas vezes no mesmo mês
// apenas atualiza a linha correspondente.

import type { Env } from '../infra/bd';
import { agora, criarBd } from '../infra/bd';

interface LinhaUsuario {
  id: string;
}

interface LinhaResumo {
  patrimonio_bruto_brl: number | null;
  divida_brl: number | null;
  patrimonio_liquido_brl: number | null;
  aporte_mes_brl: number | null;
}

export async function historicoMensalJob(env: Env): Promise<void> {
  const bd = criarBd(env);
  const usuarios = await bd.consultar<LinhaUsuario>(`SELECT id FROM usuarios`);
  if (usuarios.length === 0) return;

  const anoMes = new Date().toISOString().slice(0, 7);
  const timestamp = agora();

  for (const u of usuarios) {
    const resumo = await bd.primeiro<LinhaResumo>(
      `SELECT patrimonio_bruto_brl, divida_brl, patrimonio_liquido_brl, aporte_mes_brl
         FROM vw_patrimonio_resumo WHERE usuario_id = ?`,
      u.id,
    );
    if (!resumo) continue;

    await bd.executar(
      `INSERT INTO patrimonio_historico_mensal (
          usuario_id, ano_mes,
          patrimonio_bruto_brl, patrimonio_liquido_brl, divida_brl,
          aporte_mes_brl, rentabilidade_mes_pct, eh_confiavel,
          dados_json, atualizado_em
        ) VALUES (?, ?, ?, ?, ?, ?, NULL, 1, '{}', ?)
       ON CONFLICT(usuario_id, ano_mes) DO UPDATE SET
         patrimonio_bruto_brl = excluded.patrimonio_bruto_brl,
         patrimonio_liquido_brl = excluded.patrimonio_liquido_brl,
         divida_brl = excluded.divida_brl,
         aporte_mes_brl = excluded.aporte_mes_brl,
         atualizado_em = excluded.atualizado_em`,
      u.id,
      anoMes,
      resumo.patrimonio_bruto_brl ?? 0,
      resumo.patrimonio_liquido_brl ?? 0,
      resumo.divida_brl ?? 0,
      resumo.aporte_mes_brl ?? 0,
      timestamp,
    );
  }
}
