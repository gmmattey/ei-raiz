export type OrigemHistoricoMensal = "fechamento_mensal" | "reconstrucao";

/**
 * Mínimo de pontos mensais válidos para renderizar o gráfico de rentabilidade.
 * Abaixo disso o gráfico deve ser ocultado — nunca placeholder.
 */
export const MIN_PONTOS_RENTABILIDADE_MENSAL = 2;

export type PontoRentabilidadeMensal = {
  month: string;                       // "YYYY-MM"
  valorInvestimentos: number;          // escopo correto: apenas investimentos (A, B, C)
  totalInvestido: number;              // custo acumulado (Σ qtd × preço) dos ativos no mês
  base100: number;                     // índice base 100 no primeiro ponto (sobre valorInvestimentos)
  returnPercent: number;               // retorno acumulado desde o primeiro ponto (%)
  confiavel: boolean;                  // false se algum ativo do mês caiu em fallback
};

export type RentabilidadeMensal = {
  available: boolean;
  points: PontoRentabilidadeMensal[];
};

export type RespostaHistoricoMensal = {
  pontos: PontoHistoricoMensal[];
  monthlyPerformance: RentabilidadeMensal;
};

/**
 * Um ponto mensal persistido.
 *
 * Escopos separados por construção:
 *   valorInvestimentos — soma marcada a mercado dos ativos (famílias A, B, C).
 *                        É este valor que entra na base de rentabilidade.
 *   totalAtual         — patrimônio líquido consolidado (inv + bens + poupança − dívidas).
 *                        NÃO é base de rentabilidade; serve para composição patrimonial.
 *   totalInvestido     — custo acumulado Σ(qtd × preço) dos ativos.
 *
 * rentabilidadeMesPct e rentabilidadeAcumPct são calculados SOBRE valorInvestimentos,
 * ajustados por aportes do mês (TWR) quando disponíveis.
 */
export type PontoHistoricoMensal = {
  id: string;
  usuarioId: string;
  anoMes: string;                      // "YYYY-MM"
  dataFechamento: string;              // ISO 8601
  totalInvestido: number;
  valorInvestimentos: number;
  totalAtual: number;                  // patrimônio líquido consolidado
  rentabilidadeMesPct: number;         // % vs mês anterior (TWR)
  rentabilidadeAcumPct: number;        // % desde o primeiro mês registrado
  confiavel: boolean;
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
  confiavel: boolean;
};

export type PayloadHistoricoMensal = {
  ativos: AtivoResumoMensal[];
  /** Soma marcada a mercado dos ativos — base de rentabilidade. */
  valorInvestimentos: number;
  patrimonioInvestimentos: number;     // alias de valorInvestimentos, preservado p/ telas que consomem
  patrimonioBens: number;
  patrimonioPoupanca: number;
  patrimonioDividas: number;
  /** Patrimônio líquido: investimentos + bens + poupança − dívidas. */
  patrimonioTotal: number;
  distribuicaoPatrimonio: DistribuicaoMensal[];
  /** Snapshot confiável se TODOS os ativos do mês tiveram valor auditável. */
  confiavel: boolean;
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
