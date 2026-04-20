import type {
  AdminEntrarEntrada, AdminUsuarioSaida, AdminAuditoriaItem, AdminIngestaoCvmItem,
  TokenSaida, IngestaoCvmModo, IngestaoCvmStatus,
} from '@ei/contratos';
import type { Bd, Env } from '../../infra/bd';
import { emitirToken, validarSenha } from '../../infra/cripto';
import { erro, sucesso, type ServiceResponse } from '../../infra/http';
import { repositorioAuth } from '../auth/auth.repositorio';
import { repositorioAdmin, type LinhaAuditoria, type LinhaIngestaoCvm } from './admin.repositorio';

const paraAuditoria = (l: LinhaAuditoria): AdminAuditoriaItem => ({
  id: l.id,
  autorEmail: l.autor_email,
  acao: l.acao,
  recurso: l.recurso,
  dadosJson: (() => { try { return JSON.parse(l.dados_json); } catch { return {}; } })(),
  ocorridoEm: l.ocorrido_em,
});

const paraIngestao = (l: LinhaIngestaoCvm): AdminIngestaoCvmItem => ({
  id: l.id,
  modo: l.modo as IngestaoCvmModo,
  status: l.status as IngestaoCvmStatus,
  iniciadoEm: l.iniciado_em,
  concluidoEm: l.concluido_em,
  duracaoSegundos: l.duracao_segundos,
  parametrosJson: (() => { try { return JSON.parse(l.parametros_json); } catch { return {}; } })(),
  resultadoJson: (() => { try { return JSON.parse(l.resultado_json); } catch { return {}; } })(),
  erro: l.erro,
});

export const servicoAdmin = (bd: Bd, env: Env) => {
  const repo = repositorioAdmin(bd);
  const repoAuth = repositorioAuth(bd);

  return {
    async entrar(e: AdminEntrarEntrada): Promise<ServiceResponse<TokenSaida>> {
      const u = await repoAuth.buscarUsuarioPorEmail(e.email);
      if (!u) return erro('credenciais_invalidas', 'Email ou senha inválidos', 401);
      const valida = await validarSenha(e.senha, u.senha_hash);
      if (!valida) return erro('credenciais_invalidas', 'Email ou senha inválidos', 401);
      const ehAdmin = await repo.ehAdmin(u.email);
      if (!ehAdmin) return erro('sem_permissao', 'Acesso administrativo negado', 403);
      const token = await emitirToken({ usuarioId: u.id, email: u.email }, env.JWT_SECRET);
      return sucesso(token);
    },

    async listarUsuarios(sessaoEmail: string): Promise<ServiceResponse<{ itens: AdminUsuarioSaida[] }>> {
      if (!(await repo.ehAdmin(sessaoEmail))) return erro('sem_permissao', 'Acesso administrativo negado', 403);
      const linhas = await repo.listarUsuarios();
      return sucesso({
        itens: linhas.map((l) => ({
          id: l.id, nome: l.nome, email: l.email, cpf: l.cpf, criadoEm: l.criado_em,
        })),
      });
    },

    async auditoria(sessaoEmail: string): Promise<ServiceResponse<{ itens: AdminAuditoriaItem[] }>> {
      if (!(await repo.ehAdmin(sessaoEmail))) return erro('sem_permissao', 'Acesso administrativo negado', 403);
      const linhas = await repo.auditoria();
      return sucesso({ itens: linhas.map(paraAuditoria) });
    },

    async ingestoesCvm(sessaoEmail: string): Promise<ServiceResponse<{ itens: AdminIngestaoCvmItem[] }>> {
      if (!(await repo.ehAdmin(sessaoEmail))) return erro('sem_permissao', 'Acesso administrativo negado', 403);
      const linhas = await repo.ingestoesCvm();
      return sucesso({ itens: linhas.map(paraIngestao) });
    },
  };
};
