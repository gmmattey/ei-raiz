import type {
  SimulacaoSaida, SimulacaoCriarEntrada, TipoSimulacao,
  ConfiancaContextoFinanceiro,
} from '@ei/contratos';
import type { Bd } from '../../infra/bd';
import { gerarId } from '../../infra/bd';
import { erro, sucesso, type ServiceResponse } from '../../infra/http';
import { repositorioDecisoes, type LinhaSimulacao } from './decisoes.repositorio';
import { servicoPatrimonio, type ContextoFinanceiroSaida } from '../patrimonio/patrimonio.servico';

const paraSaida = (l: LinhaSimulacao): SimulacaoSaida => {
  const lerJson = (s: string) => { try { return JSON.parse(s); } catch { return {}; } };
  return {
    id: l.id,
    usuarioId: l.usuario_id,
    tipo: l.tipo as TipoSimulacao,
    premissasJson: lerJson(l.premissas_json),
    resultadoJson: lerJson(l.resultado_json),
    criadoEm: l.criado_em,
  };
};

// Busca o contexto financeiro canônico (patrimonio) de forma resiliente:
// falha de leitura (D1 fora do ar, etc.) nunca deve derrubar Vera ou
// simulações — só degrada a confiança para 'indisponivel'.
async function obterContextoFinanceiro(bd: Bd, usuarioId: string): Promise<ContextoFinanceiroSaida | null> {
  try {
    const resposta = await servicoPatrimonio(bd).contextoFinanceiro(usuarioId);
    return resposta.ok ? resposta.dados : null;
  } catch {
    return null;
  }
}

export const servicoDecisoes = (bd: Bd) => {
  const repo = repositorioDecisoes(bd);

  return {
    async listar(usuarioId: string): Promise<ServiceResponse<{ itens: SimulacaoSaida[] }>> {
      const linhas = await repo.listar(usuarioId);
      return sucesso({ itens: linhas.map(paraSaida) });
    },

    async obter(usuarioId: string, id: string): Promise<ServiceResponse<SimulacaoSaida>> {
      const l = await repo.buscar(usuarioId, id);
      if (!l) return erro('simulacao_nao_encontrada', 'Simulação não encontrada', 404);
      return sucesso(paraSaida(l));
    },

    async criar(usuarioId: string, e: SimulacaoCriarEntrada): Promise<ServiceResponse<SimulacaoSaida>> {
      if (!e.tipo || !e.premissasJson) return erro('dados_incompletos', 'tipo e premissas são obrigatórios', 400);
      const id = gerarId();
      // Toda simulação é ancorada na versão do resumo patrimonial usada no
      // momento da criação — nunca em totais recalculados pelo cliente.
      const contexto = await obterContextoFinanceiro(bd, usuarioId);
      const resultadoJson = {
        ...(e.resultadoJson ?? {}),
        contextoFinanceiro: {
          versao: contexto?.versao ?? null,
          confianca: (contexto?.confianca ?? 'indisponivel') satisfies ConfiancaContextoFinanceiro,
        },
      };
      await repo.inserir(
        id, usuarioId, e.tipo,
        JSON.stringify(e.premissasJson),
        JSON.stringify(resultadoJson),
      );
      return this.obter(usuarioId, id);
    },
  };
};
