import type { Bd } from '../../infra/bd';

export interface LinhaSimulacao {
  id: string;
  usuario_id: string;
  tipo: string;
  premissas_json: string;
  resultado_json: string;
  criado_em: string;
}

export const repositorioDecisoes = (bd: Bd) => ({
  async listar(usuarioId: string, limite = 50): Promise<LinhaSimulacao[]> {
    return bd.consultar<LinhaSimulacao>(
      `SELECT id, usuario_id, tipo, premissas_json, resultado_json, criado_em
         FROM decisoes_simulacoes WHERE usuario_id = ? ORDER BY criado_em DESC LIMIT ?`,
      usuarioId, limite,
    );
  },

  async buscar(usuarioId: string, id: string) {
    return bd.primeiro<LinhaSimulacao>(
      `SELECT id, usuario_id, tipo, premissas_json, resultado_json, criado_em
         FROM decisoes_simulacoes WHERE id = ? AND usuario_id = ? LIMIT 1`,
      id, usuarioId,
    );
  },

  async inserir(id: string, usuarioId: string, tipo: string, premissasJson: string, resultadoJson: string): Promise<void> {
    await bd.executar(
      `INSERT INTO decisoes_simulacoes (id, usuario_id, tipo, premissas_json, resultado_json)
       VALUES (?, ?, ?, ?, ?)`,
      id, usuarioId, tipo, premissasJson, resultadoJson,
    );
  },
});
