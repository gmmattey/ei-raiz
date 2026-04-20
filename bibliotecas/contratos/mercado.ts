// Contratos do domínio mercado — catálogo de ativos, cotações, fundos CVM.

export type TipoAtivo = 'acao' | 'fii' | 'etf' | 'fundo' | 'renda_fixa' | 'previdencia' | 'cripto' | 'outro';

export interface AtivoSaida {
  id: string;
  ticker: string | null;
  cnpj: string | null;
  isin: string | null;
  nome: string;
  tipo: TipoAtivo;
  classe: string | null;
  subclasse: string | null;
  moeda: string;
  indexador: string | null;
  taxaPct: number | null;
  dataInicio: string | null;
  dataVencimento: string | null;
  atualizadoEm: string;
}

// Alias histórico para não quebrar imports; representa a mesma ideia que TipoAtivo.
export type ClasseAtivo = TipoAtivo;

export interface AtivoBuscaEntrada {
  q: string;
  tipo?: TipoAtivo;
  limite?: number;
}

export interface AtivoBuscaSaida {
  itens: AtivoSaida[];
  total: number;
}

export interface CotacaoSaida {
  ativoId: string;
  ticker: string | null;
  fonte: string;
  precoBrl: number;
  cotadoEm: string;
  expiraEm: string;
}

export interface AtivoDetalheSaida {
  ativo: AtivoSaida;
  cotacao: CotacaoSaida | null;
}

export interface CotacaoHistoricoItem {
  data: string;
  fechamentoBrl: number;
}

export interface CotacaoHistoricoSaida {
  ticker: string;
  periodo: '1d' | '5d' | '1m' | '3m' | '6m' | '1a' | '5a' | 'max';
  itens: CotacaoHistoricoItem[];
}

export interface FundoCvmSaida {
  cnpj: string;
  nome: string;
  classe: string | null;
  situacao: string | null;
  ultimaCota: { data: string; valorCota: number; patrimonioLiquidoBrl: number | null } | null;
  atualizadoEm: string;
}
