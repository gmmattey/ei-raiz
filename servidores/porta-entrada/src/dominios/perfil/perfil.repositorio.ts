import type { Bd } from '../../infra/bd';

export interface LinhaPerfil {
  usuario_id: string;
  renda_mensal_brl: number | null;
  aporte_mensal_brl: number | null;
  horizonte_meses: number | null;
  tolerancia_risco: 'conservador' | 'moderado' | 'arrojado' | null;
  objetivos_json: string;
  atualizado_em: string;
}

export const repositorioPerfil = (bd: Bd) => ({
  async buscar(usuarioId: string) {
    return bd.primeiro<LinhaPerfil>(
      `SELECT usuario_id, renda_mensal_brl, aporte_mensal_brl, horizonte_meses,
              tolerancia_risco, objetivos_json, atualizado_em
         FROM perfis_financeiros WHERE usuario_id = ? LIMIT 1`,
      usuarioId,
    );
  },

  async salvar(linha: Omit<LinhaPerfil, 'atualizado_em'>): Promise<void> {
    await bd.executar(
      `INSERT INTO perfis_financeiros
         (usuario_id, renda_mensal_brl, aporte_mensal_brl, horizonte_meses,
          tolerancia_risco, objetivos_json, atualizado_em)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(usuario_id) DO UPDATE SET
         renda_mensal_brl = excluded.renda_mensal_brl,
         aporte_mensal_brl = excluded.aporte_mensal_brl,
         horizonte_meses = excluded.horizonte_meses,
         tolerancia_risco = excluded.tolerancia_risco,
         objetivos_json = excluded.objetivos_json,
         atualizado_em = datetime('now')`,
      linha.usuario_id,
      linha.renda_mensal_brl,
      linha.aporte_mensal_brl,
      linha.horizonte_meses,
      linha.tolerancia_risco,
      linha.objetivos_json,
    );
  },
});
