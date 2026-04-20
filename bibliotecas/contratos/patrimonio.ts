// Contratos do domínio patrimonio — itens, aportes, histórico, score, importações.

export type TipoItemPatrimonio =
  | 'acao' | 'fii' | 'etf' | 'fundo' | 'renda_fixa' | 'previdencia' | 'cripto'
  | 'caixa' | 'poupanca' | 'imovel' | 'veiculo' | 'divida' | 'outro';

export type OrigemItemPatrimonio = 'manual' | 'importacao' | 'vinculo_corretora' | 'sincronizado';

export type TipoAporte = 'aporte' | 'retirada' | 'transferencia' | 'ajuste';

export interface ItemPatrimonioSaida {
  id: string;
  usuarioId: string;
  ativoId: string | null;
  tipo: TipoItemPatrimonio;
  origem: OrigemItemPatrimonio;
  nome: string;
  ticker: string | null;
  cnpj: string | null;
  classeAtivo: string | null;
  subclasseAtivo: string | null;
  quantidade: number | null;
  precoMedioBrl: number | null;
  precoAtualBrl: number | null;
  valorAtualBrl: number | null;
  rentabilidadePct: number | null;
  pesoPct: number | null;
  moeda: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ItemPatrimonioCriarEntrada {
  ativoId?: string | null;
  tipo: TipoItemPatrimonio;
  nome: string;
  quantidade?: number | null;
  precoMedioBrl?: number | null;
  valorAtualBrl?: number | null;
  moeda?: string;
  dadosJson?: Record<string, unknown>;
}

export interface ItemPatrimonioAtualizarEntrada {
  tipo?: TipoItemPatrimonio;
  nome?: string;
  quantidade?: number | null;
  precoMedioBrl?: number | null;
  valorAtualBrl?: number | null;
  moeda?: string;
  estaAtivo?: boolean;
  dadosJson?: Record<string, unknown>;
}

export interface AporteSaida {
  id: string;
  usuarioId: string;
  itemId: string | null;
  tipo: TipoAporte;
  valorBrl: number;
  data: string;
  descricao: string | null;
  origem: string;
  criadoEm: string;
}

export interface AporteCriarEntrada {
  itemId?: string | null;
  tipo: TipoAporte;
  valorBrl: number;
  data: string;
  descricao?: string | null;
}

export interface HistoricoMensalItem {
  anoMes: string;
  patrimonioBrutoBrl: number;
  patrimonioLiquidoBrl: number;
  dividaBrl: number;
  aporteMesBrl: number;
  rentabilidadeMesPct: number | null;
  ehConfiavel: boolean;
}

export interface HistoricoMensalSaida {
  itens: HistoricoMensalItem[];
}

export interface AlocacaoClasse {
  tipo: string;
  classe: string | null;
  subclasse: string | null;
  quantidadeItens: number;
  valorBrl: number;
  pesoPct: number;
}

export interface PatrimonioResumoSaida {
  patrimonioBrutoBrl: number;
  patrimonioLiquidoBrl: number;
  dividaBrl: number;
  quantidadeItens: number;
  aporteMesBrl: number;
  rentabilidadeMesPct: number | null;
  scoreTotal: number | null;
  scoreFaixa: string | null;
  scoreCalculadoEm: string | null;
  alocacao: AlocacaoClasse[];
  evolucao: HistoricoMensalItem[];
  principaisAtivos: ItemPatrimonioSaida[];
  atualizadoEm: string;
}

export type ScoreFaixa = 'critico' | 'baixo' | 'medio' | 'bom' | 'excelente';

export interface ScorePilar {
  chave: string;
  rotulo: string;
  valor: number;
  peso: number;
}

export interface PatrimonioScoreSaida {
  scoreTotal: number | null;
  faixa: ScoreFaixa | null;
  pilares: ScorePilar[];
  historico: { anoMes: string; score: number; faixa: ScoreFaixa }[];
  calculadoEm: string | null;
}

export interface ImportacaoSaida {
  id: string;
  usuarioId: string;
  origem: string;
  status: 'pendente' | 'validado' | 'confirmado' | 'falhou';
  iniciadoEm: string;
  concluidoEm: string | null;
}

export interface ImportacaoCriarEntrada {
  origem: string;
  itens: ImportacaoItemEntrada[];
}

export interface ImportacaoItemEntrada {
  linha: number;
  tipo: string;
  dadosJson: Record<string, unknown>;
}
