export type TipoSimulacao = "imovel" | "carro" | "reserva_ou_financiar" | "gastar_ou_investir" | "livre";

export type Simulacao = {
  id: string;
  usuarioId: string;
  tipo: TipoSimulacao;
  nome: string;
  status: "rascunho" | "salva";
  scoreAtual?: number;
  scoreProjetado?: number;
  deltaScore?: number;
  diagnosticoTitulo?: string;
  diagnosticoDescricao?: string;
  diagnosticoAcao?: string;
  resumoCurto?: string;
  premissas: Record<string, unknown>;
  resultado: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  criadoEm: string;
  atualizadoEm: string;
  salvoEm?: string;
};

export type HistoricoSimulacao = {
  id: string;
  simulacaoId: string;
  versao: number;
  premissas: Record<string, unknown>;
  resultado: Record<string, unknown>;
  diagnostico: Record<string, unknown>;
  criadoEm: string;
  criadoPor: string;
};

export type ResultadoSimulacao = {
  cenarioA: Array<{ label: string; value: string; description?: string }>;
  cenarioB: Array<{ label: string; value: string; description?: string }>;
  impactoScore: {
    scoreAtual: number;
    scoreProjetado: number;
    delta: number;
    pilares?: Record<string, number>;
    regraDominante: string;
  };
  diagnostico: {
    titulo: string;
    descricao: string;
    acao: string;
  };
};

export type CalcularSimulacaoEntrada = {
  tipo: TipoSimulacao;
  nome?: string;
  premissas: Record<string, unknown>;
};

export type PremissaMercado = {
  chave: string;
  label: string;
  valor: number;
  valorFormatado: string;
  fonte: string;
};

export type PremissasMercadoSimulador = {
  tipo: TipoSimulacao;
  premissas: PremissaMercado[];
};

export interface ServicoDecisoes {
  obterPremissasMercado(tipo: TipoSimulacao): Promise<PremissasMercadoSimulador>;
  calcular(usuarioId: string, entrada: CalcularSimulacaoEntrada): Promise<ResultadoSimulacao>;
  salvar(usuarioId: string, entrada: CalcularSimulacaoEntrada): Promise<Simulacao>;
  listar(usuarioId: string): Promise<Simulacao[]>;
  obter(usuarioId: string, simulacaoId: string): Promise<Simulacao | null>;
  recalcular(usuarioId: string, simulacaoId: string): Promise<Simulacao | null>;
  duplicar(usuarioId: string, simulacaoId: string): Promise<Simulacao | null>;
  listarHistorico(usuarioId: string, simulacaoId: string): Promise<HistoricoSimulacao[]>;
}
