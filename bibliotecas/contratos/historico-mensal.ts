export type OrigemHistoricoMensal = "fechamento_mensal" | "reconstrucao";

export type PontoHistoricoMensal = {
  id: string;
  usuarioId: string;
  anoMes: string;               // "YYYY-MM"
  dataFechamento: string;       // ISO 8601
  totalInvestido: number;
  totalAtual: number;
  retornoMes: number;           // percentual vs mês anterior
  retornoAcum: number;          // percentual desde o primeiro mês
  origem: OrigemHistoricoMensal;
};

export type DistribuicaoMensal = {
  id: string;
  label: string;
  valor: number;
  percentual: number;
};

export type AtivoResumoMensal = {
  id: string;
  ticker: string | null;
  nome: string;
  categoria: string;
  valorAtual: number;
  totalInvestido: number;
  retornoAcumulado: number;
  participacao: number;
};

export type PayloadHistoricoMensal = {
  ativos: AtivoResumoMensal[];
  patrimonioInvestimentos: number;
  patrimonioBens: number;
  patrimonioPoupanca: number;
  patrimonioTotal: number;
  distribuicaoPatrimonio: DistribuicaoMensal[];
};

export type HistoricoMensalCompleto = PontoHistoricoMensal & {
  payload: PayloadHistoricoMensal;
};

export type StatusReconstrucao =
  | "pendente"
  | "processando"
  | "concluido"
  | "erro";

export type EstadoReconstrucaoCarteira = {
  usuarioId: string;
  status: StatusReconstrucao;
  anoMesInicial: string | null;
  anoMesCursor: string | null;
  anoMesFinal: string | null;
  mesesProcessados: number;
  mesesTotais: number;
  iniciadoEm: string | null;
  concluidoEm: string | null;
  erroMensagem: string | null;
  tentativas: number;
  atualizadoEm: string;
};

export interface ServicoHistoricoMensal {
  listarPontos(usuarioId: string, limite?: number): Promise<PontoHistoricoMensal[]>;
  obterMes(usuarioId: string, anoMes: string): Promise<HistoricoMensalCompleto | null>;
  registrarFechamentoMensal(
    usuarioId: string,
    anoMes: string,
    payload: PayloadHistoricoMensal,
    origem?: OrigemHistoricoMensal,
  ): Promise<PontoHistoricoMensal>;
}

export interface ServicoReconstrucaoCarteira {
  enfileirar(usuarioId: string): Promise<EstadoReconstrucaoCarteira>;
  obterEstado(usuarioId: string): Promise<EstadoReconstrucaoCarteira | null>;
  processarProximoLote(
    usuarioId: string,
    tamanhoLote?: number,
  ): Promise<EstadoReconstrucaoCarteira>;
}

/**
 * Mapa de cotações históricas por ticker → (ano-mês → preço de fechamento).
 * Pré-carregado uma vez por lote para evitar N×M chamadas externas.
 */
export type MapaPrecosHistoricos = Map<string, Map<string, number>>;

/**
 * Provedor opcional de cotações históricas mensais.
 * Recebe lista de tickers e devolve o mapa consolidado.
 *
 * Implementação canônica: adapter sobre BRAPI getHistory(range="10y", interval="1mo").
 * Quando ausente, a reconstrução cai no fallback (quantidade × precoMedio).
 */
export interface ProvedorHistoricoCotacoes {
  obterPrecosHistoricosMensais(tickers: string[]): Promise<MapaPrecosHistoricos>;
}
