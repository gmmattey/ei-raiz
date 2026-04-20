import type { Bd } from '../../infra/bd';

export interface LinhaPreferencia {
  chave: string;
  valor_json: string;
  atualizado_em: string;
}

export interface LinhaPlataforma {
  id: string;
  corretora_id: string;
  corretora_nome: string;
  status: 'ativa' | 'desconectada' | 'erro';
  vinculado_em: string;
}

export const repositorioUsuario = (bd: Bd) => ({
  async buscar(usuarioId: string) {
    return bd.primeiro<{
      id: string; nome: string; cpf: string; email: string; criado_em: string; atualizado_em: string;
    }>(
      `SELECT id, nome, cpf, email, criado_em, atualizado_em FROM usuarios WHERE id = ? LIMIT 1`,
      usuarioId,
    );
  },

  async atualizar(usuarioId: string, campos: { nome?: string; email?: string }) {
    const partes: string[] = [];
    const vals: unknown[] = [];
    if (campos.nome !== undefined) { partes.push('nome = ?'); vals.push(campos.nome); }
    if (campos.email !== undefined) { partes.push('email = ?'); vals.push(campos.email.toLowerCase()); }
    if (partes.length === 0) return;
    partes.push("atualizado_em = datetime('now')");
    vals.push(usuarioId);
    await bd.executar(`UPDATE usuarios SET ${partes.join(', ')} WHERE id = ?`, ...vals);
  },

  async listarPreferencias(usuarioId: string): Promise<LinhaPreferencia[]> {
    return bd.consultar<LinhaPreferencia>(
      `SELECT chave, valor_json, atualizado_em FROM usuario_preferencias WHERE usuario_id = ?`,
      usuarioId,
    );
  },

  async salvarPreferencia(usuarioId: string, chave: string, valorJson: string): Promise<void> {
    await bd.executar(
      `INSERT INTO usuario_preferencias (usuario_id, chave, valor_json, atualizado_em)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(usuario_id, chave) DO UPDATE SET valor_json = excluded.valor_json, atualizado_em = datetime('now')`,
      usuarioId, chave, valorJson,
    );
  },

  async listarPlataformas(usuarioId: string): Promise<LinhaPlataforma[]> {
    return bd.consultar<LinhaPlataforma>(
      `SELECT up.id, up.corretora_id, c.nome AS corretora_nome, up.status, up.vinculado_em
         FROM usuario_plataformas up
         JOIN corretoras c ON c.id = up.corretora_id
        WHERE up.usuario_id = ?`,
      usuarioId,
    );
  },
});
