import type { Bd } from '../../infra/bd';

export interface LinhaUsuario {
  id: string;
  nome: string;
  cpf: string | null;
  email: string;
  senha_hash: string;
  criado_em: string;
  atualizado_em: string;
}

export interface LinhaRecuperacao {
  id: string;
  usuario_id: string;
  pin_hash: string;
  expira_em: string;
  usado_em: string | null;
  criado_em: string;
}

export const repositorioAuth = (bd: Bd) => ({
  async buscarUsuarioPorEmail(email: string): Promise<LinhaUsuario | null> {
    return bd.primeiro<LinhaUsuario>(
      `SELECT id, nome, cpf, email, senha_hash, criado_em, atualizado_em
         FROM usuarios WHERE email = ? LIMIT 1`,
      email.toLowerCase(),
    );
  },
  async buscarUsuarioPorId(id: string): Promise<LinhaUsuario | null> {
    return bd.primeiro<LinhaUsuario>(
      `SELECT id, nome, cpf, email, senha_hash, criado_em, atualizado_em
         FROM usuarios WHERE id = ? LIMIT 1`,
      id,
    );
  },
  async buscarUsuarioPorCpf(cpf: string): Promise<LinhaUsuario | null> {
    return bd.primeiro<LinhaUsuario>(
      `SELECT id, nome, cpf, email, senha_hash, criado_em, atualizado_em
         FROM usuarios WHERE cpf = ? LIMIT 1`,
      cpf,
    );
  },
  async inserirUsuario(linha: Omit<LinhaUsuario, 'criado_em' | 'atualizado_em'>): Promise<void> {
    await bd.executar(
      `INSERT INTO usuarios (id, nome, cpf, email, senha_hash)
       VALUES (?, ?, ?, ?, ?)`,
      linha.id,
      linha.nome,
      linha.cpf,
      linha.email.toLowerCase(),
      linha.senha_hash,
    );
  },
  async atualizarSenha(usuarioId: string, senhaHash: string): Promise<void> {
    await bd.executar(
      `UPDATE usuarios SET senha_hash = ?, atualizado_em = datetime('now') WHERE id = ?`,
      senhaHash,
      usuarioId,
    );
  },
  async ehAdmin(email: string): Promise<boolean> {
    const l = await bd.primeiro<{ email: string }>(
      `SELECT email FROM admin_usuarios WHERE email = ? LIMIT 1`,
      email.toLowerCase(),
    );
    return l != null;
  },
  async inserirRecuperacao(linha: Omit<LinhaRecuperacao, 'criado_em' | 'usado_em'>): Promise<void> {
    await bd.executar(
      `INSERT INTO recuperacoes_acesso (id, usuario_id, pin_hash, expira_em) VALUES (?, ?, ?, ?)`,
      linha.id,
      linha.usuario_id,
      linha.pin_hash,
      linha.expira_em,
    );
  },
  async buscarRecuperacoesValidas(usuarioId: string): Promise<LinhaRecuperacao[]> {
    return bd.consultar<LinhaRecuperacao>(
      `SELECT id, usuario_id, pin_hash, expira_em, usado_em, criado_em
         FROM recuperacoes_acesso
         WHERE usuario_id = ? AND usado_em IS NULL AND expira_em > datetime('now')
         ORDER BY criado_em DESC`,
      usuarioId,
    );
  },
  async marcarRecuperacaoUsada(id: string): Promise<void> {
    await bd.executar(
      `UPDATE recuperacoes_acesso SET usado_em = datetime('now') WHERE id = ?`,
      id,
    );
  },
});
