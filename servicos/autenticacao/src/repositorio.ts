export type UsuarioPersistido = {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  senhaHash: string;
  criadoEm: string;
};

export type CriarUsuarioInput = {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  senhaHash: string;
};

export type CriarTokenRecuperacaoInput = {
  id: string;
  usuarioId: string;
  tokenHash: string;
  destinoEmail: string;
  expiraEm: string;
};

export type TokenRecuperacaoPersistido = {
  id: string;
  usuarioId: string;
  tokenHash: string;
  destinoEmail: string;
  expiraEm: string;
  usadoEm: string | null;
};

export interface RepositorioAutenticacao {
  buscarPorEmail(email: string): Promise<UsuarioPersistido | null>;
  buscarPorCpf(cpf: string): Promise<UsuarioPersistido | null>;
  buscarPorId(id: string): Promise<UsuarioPersistido | null>;
  criarUsuario(input: CriarUsuarioInput): Promise<UsuarioPersistido>;
  criarTokenRecuperacao(input: CriarTokenRecuperacaoInput): Promise<void>;
  buscarTokenRecuperacao(tokenHash: string): Promise<TokenRecuperacaoPersistido | null>;
  marcarTokenRecuperacaoComoUsado(id: string): Promise<void>;
  atualizarSenha(usuarioId: string, senhaHash: string): Promise<void>;
}

export class RepositorioAutenticacaoD1 implements RepositorioAutenticacao {
  constructor(private readonly db: D1Database) {}

  async buscarPorEmail(email: string): Promise<UsuarioPersistido | null> {
    const row = await this.db
      .prepare("SELECT id, nome, cpf, email, senha_hash, criado_em FROM usuarios WHERE email = ?")
      .bind(email)
      .first<{
        id: string;
        nome: string;
        cpf: string;
        email: string;
        senha_hash: string;
        criado_em: string;
      }>();

    if (!row) return null;
    return {
      id: row.id,
      nome: row.nome,
      cpf: row.cpf ?? "",
      email: row.email,
      senhaHash: row.senha_hash,
      criadoEm: row.criado_em,
    };
  }

  async buscarPorCpf(cpf: string): Promise<UsuarioPersistido | null> {
    const row = await this.db
      .prepare("SELECT id, nome, cpf, email, senha_hash, criado_em FROM usuarios WHERE cpf = ?")
      .bind(cpf)
      .first<{
        id: string;
        nome: string;
        cpf: string;
        email: string;
        senha_hash: string;
        criado_em: string;
      }>();
    if (!row) return null;
    return {
      id: row.id,
      nome: row.nome,
      cpf: row.cpf ?? "",
      email: row.email,
      senhaHash: row.senha_hash,
      criadoEm: row.criado_em,
    };
  }

  async buscarPorId(id: string): Promise<UsuarioPersistido | null> {
    const row = await this.db
      .prepare("SELECT id, nome, cpf, email, senha_hash, criado_em FROM usuarios WHERE id = ?")
      .bind(id)
      .first<{
        id: string;
        nome: string;
        cpf: string;
        email: string;
        senha_hash: string;
        criado_em: string;
      }>();
    if (!row) return null;
    return {
      id: row.id,
      nome: row.nome,
      cpf: row.cpf ?? "",
      email: row.email,
      senhaHash: row.senha_hash,
      criadoEm: row.criado_em,
    };
  }

  async criarUsuario(input: CriarUsuarioInput): Promise<UsuarioPersistido> {
    await this.db
      .prepare("INSERT INTO usuarios (id, nome, cpf, email, senha_hash) VALUES (?, ?, ?, ?, ?)")
      .bind(input.id, input.nome, input.cpf, input.email, input.senhaHash)
      .run();

    const usuario = await this.buscarPorId(input.id);
    if (!usuario) {
      throw new Error("Falha ao recuperar usuário após criação");
    }
    return usuario;
  }

  async criarTokenRecuperacao(input: CriarTokenRecuperacaoInput): Promise<void> {
    await this.db
      .prepare(
        "INSERT INTO recuperacoes_acesso (id, usuario_id, token_hash, destino_email, expira_em) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(input.id, input.usuarioId, input.tokenHash, input.destinoEmail, input.expiraEm)
      .run();
  }

  async buscarTokenRecuperacao(tokenHash: string): Promise<TokenRecuperacaoPersistido | null> {
    const row = await this.db
      .prepare(
        "SELECT id, usuario_id, token_hash, destino_email, expira_em, usado_em FROM recuperacoes_acesso WHERE token_hash = ? LIMIT 1",
      )
      .bind(tokenHash)
      .first<{
        id: string;
        usuario_id: string;
        token_hash: string;
        destino_email: string;
        expira_em: string;
        usado_em: string | null;
      }>();
    if (!row) return null;
    return {
      id: row.id,
      usuarioId: row.usuario_id,
      tokenHash: row.token_hash,
      destinoEmail: row.destino_email,
      expiraEm: row.expira_em,
      usadoEm: row.usado_em,
    };
  }

  async marcarTokenRecuperacaoComoUsado(id: string): Promise<void> {
    await this.db
      .prepare("UPDATE recuperacoes_acesso SET usado_em = datetime('now') WHERE id = ?")
      .bind(id)
      .run();
  }

  async atualizarSenha(usuarioId: string, senhaHash: string): Promise<void> {
    await this.db
      .prepare("UPDATE usuarios SET senha_hash = ? WHERE id = ?")
      .bind(senhaHash, usuarioId)
      .run();
  }
}
