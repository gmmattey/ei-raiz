import type {
  EntrarEntrada,
  EntrarSaida,
  RecuperarAcessoPorCpfEntrada,
  RecuperarAcessoPorCpfSaida,
  RecuperarSenhaPorEmailEntrada,
  RecuperarSenhaPorEmailSaida,
  RedefinirSenhaEntrada,
  RedefinirSenhaSaida,
  RegistrarEntrada,
  RegistrarSaida,
  ServicoAutenticacao,
  SessaoUsuarioSaida,
  UsuarioAutenticado,
  VerificarCadastroEntrada,
  VerificarCadastroSaida,
} from "@ei/contratos";
import {
  entrarEntradaSchema,
  recuperarAcessoPorCpfEntradaSchema,
  recuperarSenhaPorEmailEntradaSchema,
  redefinirSenhaEntradaSchema,
  registrarEntradaSchema,
  verificarCadastroEntradaSchema,
} from "@ei/validacao";
import { ErroAutenticacao } from "./erros";
import { emitirTokenAcesso, validarTokenAcesso } from "./jwt";
import { type RepositorioAutenticacao } from "./repositorio";
import { gerarHashSenha, validarSenha } from "./senha";

type DependenciasServicoAutenticacao = {
  repositorio: RepositorioAutenticacao;
  segredoJWT: string;
  gerarId?: () => string;
  notificarRecuperacaoSenha?: (payload: { email: string; token: string; expiraEm: string }) => Promise<void>;
};

export class ServicoAutenticacaoPadrao implements ServicoAutenticacao {
  private readonly gerarId: () => string;
  private readonly notificarRecuperacaoSenha?: (payload: { email: string; token: string; expiraEm: string }) => Promise<void>;

  constructor(private readonly deps: DependenciasServicoAutenticacao) {
    this.gerarId = deps.gerarId ?? (() => crypto.randomUUID());
    this.notificarRecuperacaoSenha = deps.notificarRecuperacaoSenha;
  }

  async registrar(entrada: RegistrarEntrada): Promise<RegistrarSaida> {
    const input = registrarEntradaSchema.parse(entrada);
    const cpf = normalizarCpf(input.cpf);
    const [existenteCpf, existenteEmail] = await Promise.all([
      this.deps.repositorio.buscarPorCpf(cpf),
      this.deps.repositorio.buscarPorEmail(input.email.toLowerCase().trim()),
    ]);
    if (existenteCpf) {
      const cadastroInterrompido = !existenteCpf.senhaHash;
      if (!cadastroInterrompido) {
        throw new ErroAutenticacao("CPF_JA_CADASTRADO", 409, "CPF já cadastrado");
      }

      const criadoEmMs = new Date(existenteCpf.criadoEm).getTime();
      const expirado = Number.isFinite(criadoEmMs) ? Date.now() - criadoEmMs > 24 * 60 * 60 * 1000 : false;
      const emailNormalizado = input.email.toLowerCase().trim();

      if (expirado) {
        await this.deps.repositorio.removerTokensRecuperacaoPorUsuario(existenteCpf.id);
        await this.deps.repositorio.removerUsuarioPorId(existenteCpf.id);
      } else {
        if (existenteCpf.email !== emailNormalizado) {
          throw new ErroAutenticacao(
            "CADASTRO_INTERROMPIDO_EMAIL_DIVERGENTE",
            409,
            "Cadastro interrompido encontrado para este CPF. Continue com o e-mail original.",
          );
        }
        const senhaHashInterrompido = await gerarHashSenha(input.senha);
        await this.deps.repositorio.atualizarCadastroInterrompido({
          usuarioId: existenteCpf.id,
          nome: input.nome.trim(),
          email: emailNormalizado,
          senhaHash: senhaHashInterrompido,
        });
        const usuarioAtualizado = await this.deps.repositorio.buscarPorId(existenteCpf.id);
        if (!usuarioAtualizado) {
          throw new ErroAutenticacao("ERRO_INTERNO_AUTENTICACAO", 500, "Falha ao atualizar cadastro interrompido");
        }
        const sessao = await emitirTokenAcesso(
          { usuarioId: usuarioAtualizado.id, email: usuarioAtualizado.email },
          this.deps.segredoJWT,
        );
        return {
          usuario: mapUsuario(usuarioAtualizado),
          sessao: {
            token: sessao.token,
            tipo: "Bearer",
            expiraEm: sessao.expiraEm,
          },
        };
      }
    }
    if (existenteEmail) {
      throw new ErroAutenticacao("EMAIL_JA_CADASTRADO", 409, "E-mail já cadastrado");
    }

    const senhaHash = await gerarHashSenha(input.senha);
    const usuario = await this.deps.repositorio.criarUsuario({
      id: this.gerarId(),
      nome: input.nome.trim(),
      cpf,
      email: input.email.toLowerCase().trim(),
      senhaHash,
    });

    const sessao = await emitirTokenAcesso(
      { usuarioId: usuario.id, email: usuario.email },
      this.deps.segredoJWT,
    );
    return {
      usuario: mapUsuario(usuario),
      sessao: {
        token: sessao.token,
        tipo: "Bearer",
        expiraEm: sessao.expiraEm,
      },
    };
  }

  async entrar(entrada: EntrarEntrada): Promise<EntrarSaida> {
    const input = entrarEntradaSchema.parse(entrada);
    const usuario = await this.deps.repositorio.buscarPorEmail(input.email.toLowerCase().trim());
    if (!usuario) {
      throw new ErroAutenticacao("CREDENCIAIS_INVALIDAS", 401, "Credenciais inválidas");
    }

    if (!usuario.senhaHash) {
      throw new ErroAutenticacao("CADASTRO_INCOMPLETO", 409, "Cadastro interrompido: redefina a senha para concluir");
    }
    const senhaValida = await validarSenha(input.senha, usuario.senhaHash);
    if (!senhaValida) {
      throw new ErroAutenticacao("CREDENCIAIS_INVALIDAS", 401, "Credenciais inválidas");
    }

    const sessao = await emitirTokenAcesso(
      { usuarioId: usuario.id, email: usuario.email },
      this.deps.segredoJWT,
    );

    return {
      usuario: mapUsuario(usuario),
      sessao: {
        token: sessao.token,
        tipo: "Bearer",
        expiraEm: sessao.expiraEm,
      },
    };
  }

  async obterSessao(token: string): Promise<SessaoUsuarioSaida> {
    const sessao = await validarTokenAcesso(token, this.deps.segredoJWT);
    const usuario = await this.deps.repositorio.buscarPorId(sessao.usuarioId);
    if (!usuario) {
      throw new ErroAutenticacao("SESSAO_INVALIDA", 401, "Sessão inválida");
    }
    return { usuario: mapUsuario(usuario) };
  }

  async verificarCadastro(entrada: VerificarCadastroEntrada): Promise<VerificarCadastroSaida> {
    const input = verificarCadastroEntradaSchema.parse(entrada);
    const cpf = normalizarCpf(input.cpf);
    const email = input.email.toLowerCase().trim();
    const [existenteCpf, existenteEmail] = await Promise.all([
      this.deps.repositorio.buscarPorCpf(cpf),
      this.deps.repositorio.buscarPorEmail(email),
    ]);
    const cadastroInterrompido = !!existenteCpf && !existenteCpf.senhaHash;
    const emailEhDaContaInterrompida = cadastroInterrompido && existenteCpf.email === email;
    return {
      cpfDisponivel: !existenteCpf || cadastroInterrompido,
      emailDisponivel: !existenteEmail || emailEhDaContaInterrompida,
      cadastroInterrompido,
      destinoMascara: cadastroInterrompido ? mascararEmail(existenteCpf.email) : undefined,
    };
  }

  async solicitarRecuperacaoPorEmail(entrada: RecuperarSenhaPorEmailEntrada): Promise<RecuperarSenhaPorEmailSaida> {
    const input = recuperarSenhaPorEmailEntradaSchema.parse(entrada);
    const email = input.email.toLowerCase().trim();
    const usuario = await this.deps.repositorio.buscarPorEmail(email);
    await this.criarRecuperacaoSeUsuarioExiste(usuario);
    return criarRespostaGenericaRecuperacao(usuario?.email ?? email);
  }

  async solicitarRecuperacaoPorCpf(entrada: RecuperarAcessoPorCpfEntrada): Promise<RecuperarAcessoPorCpfSaida> {
    const input = recuperarAcessoPorCpfEntradaSchema.parse(entrada);
    const usuario = await this.deps.repositorio.buscarPorCpf(normalizarCpf(input.cpf));
    await this.criarRecuperacaoSeUsuarioExiste(usuario);
    return criarRespostaGenericaRecuperacao(usuario?.email);
  }

  async redefinirSenha(entrada: RedefinirSenhaEntrada): Promise<RedefinirSenhaSaida> {
    const input = redefinirSenhaEntradaSchema.parse(entrada);
    const tokenHash = await gerarHashToken(input.token.trim());
    const token = await this.deps.repositorio.buscarTokenRecuperacao(tokenHash);
    return this.aplicarRedefinicao(token, input.novaSenha);
  }

  async redefinirSenhaPorPin(pin: string, novaSenha: string): Promise<RedefinirSenhaSaida> {
    const token = await this.deps.repositorio.buscarTokenRecuperacaoPorPin(pin.trim());
    return this.aplicarRedefinicao(token, novaSenha);
  }

  private async aplicarRedefinicao(
    token: { id: string; usuarioId: string; expiraEm: string; usadoEm: string | null } | null,
    novaSenha: string,
  ): Promise<RedefinirSenhaSaida> {
    if (!token) {
      throw new ErroAutenticacao("TOKEN_RECUPERACAO_INVALIDO", 400, "Token de recuperação inválido");
    }
    if (token.usadoEm) {
      throw new ErroAutenticacao("TOKEN_RECUPERACAO_JA_UTILIZADO", 400, "Token de recuperação já utilizado");
    }
    if (new Date(token.expiraEm).getTime() < Date.now()) {
      throw new ErroAutenticacao("TOKEN_RECUPERACAO_EXPIRADO", 400, "Token de recuperação expirado");
    }
    const novaSenhaHash = await gerarHashSenha(novaSenha);
    await this.deps.repositorio.atualizarSenha(token.usuarioId, novaSenhaHash);
    await this.deps.repositorio.marcarTokenRecuperacaoComoUsado(token.id);
    return { redefinido: true };
  }

  private async criarRecuperacaoSeUsuarioExiste(usuario: { id: string; email: string } | null): Promise<void> {
    if (!usuario) return;
    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const tokenHash = await gerarHashToken(token);
    const pin = gerarPinSeisDígitos(token);
    const expiraEm = new Date(Date.now() + 1000 * 60 * 30).toISOString();
    await this.deps.repositorio.criarTokenRecuperacao({
      id: crypto.randomUUID(),
      usuarioId: usuario.id,
      tokenHash,
      destinoEmail: usuario.email,
      expiraEm,
      pin,
    });
    if (this.notificarRecuperacaoSenha) {
      try {
        await this.notificarRecuperacaoSenha({ email: usuario.email, token, expiraEm });
      } catch {
        // Não falha a requisição para evitar vazamento de existência de conta.
      }
    }
  }
}

function mapUsuario(usuario: {
  id: string;
  nome: string;
  email: string;
  criadoEm: string;
}): UsuarioAutenticado {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    criadoEm: usuario.criadoEm,
  };
}

function normalizarCpf(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

async function gerarHashToken(token: string): Promise<string> {
  const bytes = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function gerarPinSeisDígitos(token: string): string {
  let pin = '';
  const primeiros6 = (token || '').substring(0, 6);
  for (let i = 0; i < 6; i++) {
    const char = primeiros6[i] || '0';
    if (/\d/.test(char)) {
      pin += char;
    } else {
      pin += (char.charCodeAt(0) % 10);
    }
  }
  return pin;
}

function mascararEmail(email: string): string {
  const [local, dominio] = email.split("@");
  if (!local || !dominio) return "***";
  const primeiro = local.charAt(0);
  return `${primeiro}***@${dominio}`;
}

function criarRespostaGenericaRecuperacao(email?: string): RecuperarSenhaPorEmailSaida {
  return {
    solicitado: true,
    canal: "email",
    destinoMascara: email ? mascararEmail(email) : "***@***",
    observacao: "Se existir conta vinculada, você receberá instruções de recuperação no canal cadastrado.",
  };
}
