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
};

export class ServicoAutenticacaoPadrao implements ServicoAutenticacao {
  private readonly gerarId: () => string;

  constructor(private readonly deps: DependenciasServicoAutenticacao) {
    this.gerarId = deps.gerarId ?? (() => crypto.randomUUID());
  }

  async registrar(entrada: RegistrarEntrada): Promise<RegistrarSaida> {
    const input = registrarEntradaSchema.parse(entrada);
    const cpf = normalizarCpf(input.cpf);
    const [existenteCpf, existenteEmail] = await Promise.all([
      this.deps.repositorio.buscarPorCpf(cpf),
      this.deps.repositorio.buscarPorEmail(input.email.toLowerCase().trim()),
    ]);
    if (existenteCpf) {
      throw new ErroAutenticacao("CPF_JA_CADASTRADO", 409, "CPF já cadastrado");
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
    return {
      cpfDisponivel: !existenteCpf,
      emailDisponivel: !existenteEmail,
    };
  }

  async solicitarRecuperacaoPorEmail(entrada: RecuperarSenhaPorEmailEntrada): Promise<RecuperarSenhaPorEmailSaida> {
    const input = recuperarSenhaPorEmailEntradaSchema.parse(entrada);
    const email = input.email.toLowerCase().trim();
    const usuario = await this.deps.repositorio.buscarPorEmail(email);
    if (!usuario) {
      throw new ErroAutenticacao("EMAIL_NAO_ENCONTRADO", 404, "Nao existe conta com este e-mail");
    }
    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const tokenHash = await gerarHashToken(token);
    const expiraEm = new Date(Date.now() + 1000 * 60 * 30).toISOString();
    await this.deps.repositorio.criarTokenRecuperacao({
      id: crypto.randomUUID(),
      usuarioId: usuario.id,
      tokenHash,
      destinoEmail: usuario.email,
      expiraEm,
    });
    console.log(`[auth] recovery token for ${usuario.email}: ${token}`);
    return {
      solicitado: true,
      canal: "email",
      destinoMascara: mascararEmail(usuario.email),
      observacao: "Se a infraestrutura de e-mail estiver ativa, o link/codigo sera enviado.",
    };
  }

  async solicitarRecuperacaoPorCpf(entrada: RecuperarAcessoPorCpfEntrada): Promise<RecuperarAcessoPorCpfSaida> {
    const input = recuperarAcessoPorCpfEntradaSchema.parse(entrada);
    const usuario = await this.deps.repositorio.buscarPorCpf(normalizarCpf(input.cpf));
    if (!usuario) {
      throw new ErroAutenticacao("CPF_NAO_ENCONTRADO", 404, "Nao existe conta vinculada a este CPF");
    }
    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const tokenHash = await gerarHashToken(token);
    const expiraEm = new Date(Date.now() + 1000 * 60 * 30).toISOString();
    await this.deps.repositorio.criarTokenRecuperacao({
      id: crypto.randomUUID(),
      usuarioId: usuario.id,
      tokenHash,
      destinoEmail: usuario.email,
      expiraEm,
    });
    console.log(`[auth] recovery token by cpf for ${usuario.email}: ${token}`);
    return {
      solicitado: true,
      canal: "email",
      destinoMascara: mascararEmail(usuario.email),
      observacao: "Se a infraestrutura de e-mail estiver ativa, o link/codigo sera enviado.",
    };
  }

  async redefinirSenha(entrada: RedefinirSenhaEntrada): Promise<RedefinirSenhaSaida> {
    const input = redefinirSenhaEntradaSchema.parse(entrada);
    const tokenHash = await gerarHashToken(input.token.trim());
    const token = await this.deps.repositorio.buscarTokenRecuperacao(tokenHash);
    if (!token) {
      throw new ErroAutenticacao("TOKEN_RECUPERACAO_INVALIDO", 400, "Token de recuperação inválido");
    }
    if (token.usadoEm) {
      throw new ErroAutenticacao("TOKEN_RECUPERACAO_JA_UTILIZADO", 400, "Token de recuperação já utilizado");
    }
    if (new Date(token.expiraEm).getTime() < Date.now()) {
      throw new ErroAutenticacao("TOKEN_RECUPERACAO_EXPIRADO", 400, "Token de recuperação expirado");
    }
    const novaSenhaHash = await gerarHashSenha(input.novaSenha);
    await this.deps.repositorio.atualizarSenha(token.usuarioId, novaSenhaHash);
    await this.deps.repositorio.marcarTokenRecuperacaoComoUsado(token.id);
    return { redefinido: true };
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

function mascararEmail(email: string): string {
  const [local, dominio] = email.split("@");
  if (!local || !dominio) return "***";
  const primeiro = local.charAt(0);
  return `${primeiro}***@${dominio}`;
}
