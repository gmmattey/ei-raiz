import type { PerfilSaida, PerfilAtualizarEntrada } from '@ei/contratos';
import type { Bd } from '../../infra/bd';
import { sucesso, type ServiceResponse } from '../../infra/http';
import { repositorioPerfil, type LinhaPerfil } from './perfil.repositorio';

const perfilVazio = (usuarioId: string): LinhaPerfil => ({
  usuario_id: usuarioId,
  renda_mensal_brl: null,
  aporte_mensal_brl: null,
  horizonte_meses: null,
  tolerancia_risco: null,
  objetivos_json: '[]',
  atualizado_em: new Date().toISOString(),
});

const montarSaida = (l: LinhaPerfil): PerfilSaida => ({
  usuarioId: l.usuario_id,
  rendaMensalBrl: l.renda_mensal_brl,
  aporteMensalBrl: l.aporte_mensal_brl,
  horizonteMeses: l.horizonte_meses,
  toleranciaRisco: l.tolerancia_risco,
  objetivos: (() => { try { return JSON.parse(l.objetivos_json) as string[]; } catch { return []; } })(),
  atualizadoEm: l.atualizado_em,
});

export const servicoPerfil = (bd: Bd) => {
  const repo = repositorioPerfil(bd);

  return {
    async obter(usuarioId: string): Promise<ServiceResponse<PerfilSaida>> {
      const linha = (await repo.buscar(usuarioId)) ?? perfilVazio(usuarioId);
      return sucesso(montarSaida(linha));
    },

    async salvar(usuarioId: string, e: PerfilAtualizarEntrada): Promise<ServiceResponse<PerfilSaida>> {
      const atual = (await repo.buscar(usuarioId)) ?? perfilVazio(usuarioId);
      const mescla: LinhaPerfil = {
        usuario_id: usuarioId,
        renda_mensal_brl: e.rendaMensalBrl ?? atual.renda_mensal_brl,
        aporte_mensal_brl: e.aporteMensalBrl ?? atual.aporte_mensal_brl,
        horizonte_meses: e.horizonteMeses ?? atual.horizonte_meses,
        tolerancia_risco: e.toleranciaRisco ?? atual.tolerancia_risco,
        objetivos_json: e.objetivos ? JSON.stringify(e.objetivos) : atual.objetivos_json,
        atualizado_em: new Date().toISOString(),
      };
      await repo.salvar(mescla);
      return this.obter(usuarioId);
    },
  };
};
