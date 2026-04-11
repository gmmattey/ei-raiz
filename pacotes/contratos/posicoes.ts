export type TipoPosicaoFinanceira =
  | "investimento"
  | "caixa"
  | "poupanca"
  | "cofrinho"
  | "imovel"
  | "veiculo"
  | "divida";

export type LiquidezPosicao = "imediata" | "curto_prazo" | "medio_prazo" | "baixa";
export type RiscoPosicao = "baixo" | "medio" | "alto";

export type PosicaoFinanceira = {
  id: string;
  usuarioId: string;
  tipo: TipoPosicaoFinanceira;
  nome: string;
  valorAtual: number;
  custoAquisicao?: number;
  liquidez: LiquidezPosicao;
  risco: RiscoPosicao;
  categoria: string;
  metadata?: Record<string, unknown>;
  criadoEm: string;
  atualizadoEm: string;
};

export type CriarPosicaoFinanceiraEntrada = {
  tipo: TipoPosicaoFinanceira;
  nome: string;
  valorAtual: number;
  custoAquisicao?: number;
  liquidez: LiquidezPosicao;
  risco: RiscoPosicao;
  categoria: string;
  metadata?: Record<string, unknown>;
};

export type AtualizarPosicaoFinanceiraEntrada = Partial<CriarPosicaoFinanceiraEntrada>;

export interface ServicoPosicoesFinanceiras {
  listar(usuarioId: string): Promise<PosicaoFinanceira[]>;
  criar(usuarioId: string, entrada: CriarPosicaoFinanceiraEntrada): Promise<PosicaoFinanceira>;
  atualizar(usuarioId: string, id: string, entrada: AtualizarPosicaoFinanceiraEntrada): Promise<PosicaoFinanceira>;
}
