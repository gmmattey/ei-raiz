import { test } from "node:test";
import assert from "node:assert/strict";
import { ServicoAutenticacaoPadrao } from "../src/servico";
import {
  type CriarTokenRecuperacaoInput,
  type CriarUsuarioInput,
  type RepositorioAutenticacao,
  type TokenRecuperacaoPersistido,
  type UsuarioPersistido,
} from "../src/repositorio";
import { ErroAutenticacao } from "../src/erros";

class RepositorioMemoria implements RepositorioAutenticacao {
  private readonly usuarios: UsuarioPersistido[] = [];
  private readonly tokens: TokenRecuperacaoPersistido[] = [];

  async buscarPorEmail(email: string): Promise<UsuarioPersistido | null> {
    return this.usuarios.find((usuario) => usuario.email === email) ?? null;
  }

  async buscarPorCpf(cpf: string): Promise<UsuarioPersistido | null> {
    return this.usuarios.find((usuario) => usuario.cpf === cpf) ?? null;
  }

  async buscarPorId(id: string): Promise<UsuarioPersistido | null> {
    return this.usuarios.find((usuario) => usuario.id === id) ?? null;
  }

  async criarUsuario(input: CriarUsuarioInput): Promise<UsuarioPersistido> {
    const usuario: UsuarioPersistido = {
      id: input.id,
      nome: input.nome,
      cpf: input.cpf,
      email: input.email,
      senhaHash: input.senhaHash,
      criadoEm: new Date().toISOString(),
    };
    this.usuarios.push(usuario);
    return usuario;
  }

  async criarTokenRecuperacao(input: CriarTokenRecuperacaoInput): Promise<void> {
    this.tokens.push({
      id: input.id,
      usuarioId: input.usuarioId,
      tokenHash: input.tokenHash,
      destinoEmail: input.destinoEmail,
      expiraEm: input.expiraEm,
      usadoEm: null,
    });
  }

  async buscarTokenRecuperacao(tokenHash: string): Promise<TokenRecuperacaoPersistido | null> {
    return this.tokens.find((token) => token.tokenHash === tokenHash) ?? null;
  }

  async marcarTokenRecuperacaoComoUsado(id: string): Promise<void> {
    const token = this.tokens.find((item) => item.id === id);
    if (token) token.usadoEm = new Date().toISOString();
  }

  async atualizarSenha(usuarioId: string, senhaHash: string): Promise<void> {
    const usuario = this.usuarios.find((item) => item.id === usuarioId);
    if (usuario) usuario.senhaHash = senhaHash;
  }
}

test("deve registrar e entrar com credenciais válidas", async () => {
  const repositorio = new RepositorioMemoria();
  const servico = new ServicoAutenticacaoPadrao({
    repositorio,
    segredoJWT: "segredo-teste",
    gerarId: () => "usr_teste",
  });

  const registro = await servico.registrar({
    nome: "Teste",
    cpf: "12345678901",
    email: "teste@ei.com",
    senha: "Senha@123",
  });
  assert.equal(registro.usuario.id, "usr_teste");
  assert.equal(registro.usuario.email, "teste@ei.com");
  assert.ok(registro.sessao.token.length > 20);

  const login = await servico.entrar({
    email: "teste@ei.com",
    senha: "Senha@123",
  });
  assert.equal(login.usuario.id, "usr_teste");
  assert.equal(login.sessao.tipo, "Bearer");
});

test("deve retornar sessão do usuário com token válido", async () => {
  const repositorio = new RepositorioMemoria();
  const servico = new ServicoAutenticacaoPadrao({
    repositorio,
    segredoJWT: "segredo-teste",
    gerarId: () => "usr_sessao",
  });
  const registro = await servico.registrar({
    nome: "Sessao",
    cpf: "12345678902",
    email: "sessao@ei.com",
    senha: "Senha@123",
  });
  const sessao = await servico.obterSessao(registro.sessao.token);
  assert.equal(sessao.usuario.id, "usr_sessao");
  assert.equal(sessao.usuario.email, "sessao@ei.com");
});

test("deve falhar com credenciais inválidas", async () => {
  const repositorio = new RepositorioMemoria();
  const servico = new ServicoAutenticacaoPadrao({
    repositorio,
    segredoJWT: "segredo-teste",
    gerarId: () => "usr_erro",
  });
  await servico.registrar({
    nome: "Erro",
    cpf: "12345678903",
    email: "erro@ei.com",
    senha: "Senha@123",
  });

  await assert.rejects(
    () =>
      servico.entrar({
        email: "erro@ei.com",
        senha: "senha_errada",
      }),
    (error: unknown) => error instanceof ErroAutenticacao && error.codigo === "CREDENCIAIS_INVALIDAS",
  );
});
