import type {
  AtivoBuscaEntrada, AtivoBuscaSaida, AtivoDetalheSaida, AtivoSaida, TipoAtivo,
  CotacaoHistoricoSaida, CotacaoSaida, FundoCvmSaida,
} from '@ei/contratos';
import type { Bd } from '../../infra/bd';
import { erro, sucesso, type ServiceResponse } from '../../infra/http';
import { repositorioMercado, type LinhaAtivo, type LinhaCotacaoCache, type LinhaFundoCvm } from './mercado.repositorio';

const LIMITE_PADRAO = 20;
const LIMITE_MAXIMO = 100;

const paraAtivoSaida = (l: LinhaAtivo): AtivoSaida => ({
  id: l.id,
  ticker: l.ticker,
  cnpj: l.cnpj,
  isin: l.isin,
  nome: l.nome,
  tipo: l.tipo as TipoAtivo,
  classe: l.classe,
  subclasse: l.subclasse,
  moeda: l.moeda,
  indexador: l.indexador,
  taxaPct: l.taxa_pct,
  dataInicio: l.data_inicio,
  dataVencimento: l.data_vencimento,
  atualizadoEm: l.atualizado_em,
});

const paraCotacao = (l: LinhaCotacaoCache, ticker: string | null): CotacaoSaida => ({
  ativoId: l.ativo_id,
  ticker,
  fonte: l.fonte,
  precoBrl: l.preco_brl,
  cotadoEm: l.cotado_em,
  expiraEm: l.expira_em,
});

const paraFundoCvm = (
  f: LinhaFundoCvm,
  ultima: { data: string; valorCota: number; patrimonioLiquidoBrl: number | null } | null,
): FundoCvmSaida => ({
  cnpj: f.cnpj,
  nome: f.nome,
  classe: f.classe,
  situacao: f.situacao,
  ultimaCota: ultima,
  atualizadoEm: f.atualizado_em,
});

export const servicoMercado = (bd: Bd) => {
  const repo = repositorioMercado(bd);

  return {
    async buscar(e: AtivoBuscaEntrada): Promise<ServiceResponse<AtivoBuscaSaida>> {
      if (!e.q || e.q.trim().length < 1) return sucesso({ itens: [], total: 0 });
      const limite = Math.min(e.limite ?? LIMITE_PADRAO, LIMITE_MAXIMO);
      const linhas = await repo.buscarAtivosPorTexto(e.q.trim(), e.tipo ?? null, limite);
      const itens = linhas.map(paraAtivoSaida);
      return sucesso({ itens, total: itens.length });
    },

    async obterPorTicker(ticker: string): Promise<ServiceResponse<AtivoDetalheSaida>> {
      const ativo = await repo.buscarAtivoPorTicker(ticker);
      if (!ativo) return erro('ativo_nao_encontrado', 'Ativo não encontrado', 404);
      const cot = await repo.buscarCotacao(ativo.id, 'brapi');
      return sucesso({
        ativo: paraAtivoSaida(ativo),
        cotacao: cot ? paraCotacao(cot, ativo.ticker) : null,
      });
    },

    async historico(ticker: string): Promise<ServiceResponse<CotacaoHistoricoSaida>> {
      // Histórico por ticker virá de provedor externo; implementação fora deste serviço.
      return sucesso({ ticker: ticker.toUpperCase(), periodo: '1a', itens: [] });
    },

    async obterFundo(cnpj: string): Promise<ServiceResponse<FundoCvmSaida>> {
      const f = await repo.buscarFundoCvm(cnpj);
      if (!f) return erro('fundo_nao_encontrado', 'Fundo CVM não encontrado', 404);
      const u = await repo.ultimaCota(cnpj);
      return sucesso(paraFundoCvm(
        f,
        u ? { data: u.data, valorCota: u.valor_cota, patrimonioLiquidoBrl: u.patrimonio_liquido_brl } : null,
      ));
    },
  };
};
