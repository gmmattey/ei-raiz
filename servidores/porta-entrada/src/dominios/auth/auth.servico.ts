import type {
  RegistrarEntrada,
  EntrarEntrada,
  SessaoSaida,
  TokenSaida,
  RecuperarIniciarEntrada,
  RecuperarConfirmarEntrada,
  RecuperarRedefinirEntrada,
} from '@ei/contratos';
import type { Bd, Env } from '../../infra/bd';
import { gerarId } from '../../infra/bd';
import { emitirToken, gerarHashSenha, gerarPin, validarSenha } from '../../infra/cripto';
import { erro, sucesso, type ServiceResponse } from '../../infra/http';
import { repositorioAuth, type LinhaRecuperacao } from './auth.repositorio';

const TAMANHO_SENHA_MIN = 8;
const VALIDADE_PIN_MINUTOS = 15;

const limparEmail = (e: string) => e.trim().toLowerCase();
const limparCpf = (c: string) => c.replace(/\D/g, '');

async function encontrarRecuperacaoPelo(pin: string, linhas: LinhaRecuperacao[]): Promise<LinhaRecuperacao | null> {
  for (const linha of linhas) {
    if (await validarSenha(pin, linha.pin_hash)) return linha;
  }
  return null;
}

export const servicoAuth = (bd: Bd, env: Env) => {
  const repo = repositorioAuth(bd);

  return {
    async registrar(e: RegistrarEntrada): Promise<ServiceResponse<TokenSaida>> {
      if (!e.nome || !e.email || !e.senha || !e.cpf) return erro('dados_incompletos', 'Informe nome, CPF, email e senha', 400);
      if (e.senha.length < TAMANHO_SENHA_MIN) return erro('senha_curta', 'Senha deve ter ao menos 8 caracteres', 400);
      const email = limparEmail(e.email);
      const cpf = limparCpf(e.cpf);
      if (cpf.length !== 11) return erro('cpf_invalido', 'CPF inválido', 400);

      if (await repo.buscarUsuarioPorEmail(email)) return erro('email_em_uso', 'Email já cadastrado', 409);
      if (await repo.buscarUsuarioPorCpf(cpf)) return erro('cpf_em_uso', 'CPF já cadastrado', 409);

      const id = gerarId();
      const senhaHash = await gerarHashSenha(e.senha);
      await repo.inserirUsuario({ id, nome: e.nome.trim(), cpf, email, senha_hash: senhaHash });

      const token = await emitirToken({ usuarioId: id, email }, env.JWT_SECRET);
      return sucesso(token);
    },

    async entrar(e: EntrarEntrada): Promise<ServiceResponse<TokenSaida>> {
      if (!e.email || !e.senha) return erro('credenciais_invalidas', 'Email ou senha inválidos', 401);
      const usuario = await repo.buscarUsuarioPorEmail(limparEmail(e.email));
      if (!usuario) return erro('credenciais_invalidas', 'Email ou senha inválidos', 401);
      const valida = await validarSenha(e.senha, usuario.senha_hash);
      if (!valida) return erro('credenciais_invalidas', 'Email ou senha inválidos', 401);

      const token = await emitirToken({ usuarioId: usuario.id, email: usuario.email }, env.JWT_SECRET);
      return sucesso(token);
    },

    async sessao(usuarioId: string): Promise<ServiceResponse<SessaoSaida>> {
      const u = await repo.buscarUsuarioPorId(usuarioId);
      if (!u) return erro('sessao_invalida', 'Sessão inválida', 401);
      const ehAdmin = await repo.ehAdmin(u.email);
      return sucesso({
        usuarioId: u.id,
        email: u.email,
        nome: u.nome,
        ehAdmin,
        criadoEm: u.criado_em,
      });
    },

    async recuperarIniciar(e: RecuperarIniciarEntrada): Promise<ServiceResponse<{ enviado: true }>> {
      const u = await repo.buscarUsuarioPorEmail(limparEmail(e.email));
      if (!u) return sucesso({ enviado: true });
      const pin = gerarPin();
      const pinHash = await gerarHashSenha(pin);
      const expira = new Date(Date.now() + VALIDADE_PIN_MINUTOS * 60_000).toISOString();
      await repo.inserirRecuperacao({ id: gerarId(), usuario_id: u.id, pin_hash: pinHash, expira_em: expira });
      // Envio real do PIN por email fica em provedor dedicado (fora do escopo deste serviço).
      return sucesso({ enviado: true });
    },

    async recuperarConfirmar(e: RecuperarConfirmarEntrada): Promise<ServiceResponse<{ valido: true }>> {
      const u = await repo.buscarUsuarioPorEmail(limparEmail(e.email));
      if (!u) return erro('pin_invalido', 'PIN inválido ou expirado', 400);
      const linhas = await repo.buscarRecuperacoesValidas(u.id);
      const linha = await encontrarRecuperacaoPelo(e.pin, linhas);
      if (!linha) return erro('pin_invalido', 'PIN inválido ou expirado', 400);
      return sucesso({ valido: true });
    },

    async recuperarRedefinir(e: RecuperarRedefinirEntrada): Promise<ServiceResponse<TokenSaida>> {
      if (!e.novaSenha || e.novaSenha.length < TAMANHO_SENHA_MIN) {
        return erro('senha_curta', 'Senha deve ter ao menos 8 caracteres', 400);
      }
      const u = await repo.buscarUsuarioPorEmail(limparEmail(e.email));
      if (!u) return erro('pin_invalido', 'PIN inválido ou expirado', 400);
      const linhas = await repo.buscarRecuperacoesValidas(u.id);
      const linha = await encontrarRecuperacaoPelo(e.pin, linhas);
      if (!linha) return erro('pin_invalido', 'PIN inválido ou expirado', 400);

      const novo = await gerarHashSenha(e.novaSenha);
      await repo.atualizarSenha(u.id, novo);
      await repo.marcarRecuperacaoUsada(linha.id);

      const token = await emitirToken({ usuarioId: u.id, email: u.email }, env.JWT_SECRET);
      return sucesso(token);
    },
  };
};

export type ServicoAuth = ReturnType<typeof servicoAuth>;
