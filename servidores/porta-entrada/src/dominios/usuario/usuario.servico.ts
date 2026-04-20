import type {
  UsuarioSaida, UsuarioAtualizarEntrada, PreferenciasSaida, PreferenciasAtualizarEntrada, PlataformaVinculadaSaida,
} from '@ei/contratos';
import type { Bd } from '../../infra/bd';
import { erro, sucesso, type ServiceResponse } from '../../infra/http';
import { repositorioUsuario } from './usuario.repositorio';

export const servicoUsuario = (bd: Bd) => {
  const repo = repositorioUsuario(bd);

  return {
    async obter(usuarioId: string): Promise<ServiceResponse<UsuarioSaida>> {
      const u = await repo.buscar(usuarioId);
      if (!u) return erro('usuario_nao_encontrado', 'Usuário não encontrado', 404);
      return sucesso({
        id: u.id, nome: u.nome, cpf: u.cpf, email: u.email,
        criadoEm: u.criado_em, atualizadoEm: u.atualizado_em,
      });
    },

    async atualizar(usuarioId: string, e: UsuarioAtualizarEntrada): Promise<ServiceResponse<UsuarioSaida>> {
      await repo.atualizar(usuarioId, { nome: e.nome, email: e.email });
      return this.obter(usuarioId);
    },

    async obterPreferencias(usuarioId: string): Promise<ServiceResponse<PreferenciasSaida>> {
      const linhas = await repo.listarPreferencias(usuarioId);
      const itens = linhas.map((l) => ({
        chave: l.chave,
        valor: (() => { try { return JSON.parse(l.valor_json); } catch { return null; } })(),
        atualizadoEm: l.atualizado_em,
      }));
      return sucesso({ itens });
    },

    async atualizarPreferencias(usuarioId: string, e: PreferenciasAtualizarEntrada): Promise<ServiceResponse<PreferenciasSaida>> {
      for (const item of e.itens) {
        await repo.salvarPreferencia(usuarioId, item.chave, JSON.stringify(item.valor ?? null));
      }
      return this.obterPreferencias(usuarioId);
    },

    async listarPlataformas(usuarioId: string): Promise<ServiceResponse<{ itens: PlataformaVinculadaSaida[] }>> {
      const linhas = await repo.listarPlataformas(usuarioId);
      return sucesso({
        itens: linhas.map((l) => ({
          id: l.id, corretoraId: l.corretora_id, corretoraNome: l.corretora_nome,
          status: l.status === 'desconectada' ? 'inativa' : l.status, vinculadaEm: l.vinculado_em,
        })),
      });
    },
  };
};
