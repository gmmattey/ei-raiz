export type CategoriaAtivo = "acao" | "fundo" | "previdencia" | "renda_fixa" | "poupanca" | "bens";

export type AtivoResumo = {
  id: string;
  ticker: string;
  nome: string;
  categoria: CategoriaAtivo;
  plataforma: string;
  quantidade?: number;
  precoMedio?: number;
  preco_medio?: number;
  precoAtual?: number;
  variacaoPercentual?: number;
  ganhoPerda?: number;
  ganhoPerdaPercentual?: number;
  ultimaAtualizacao?: string;
  fontePreco?: "brapi" | "cvm" | "nenhuma";
  statusAtualizacao?: "atualizado" | "atrasado" | "indisponivel";
  ultima_atualizacao?: string;
  fonte_preco?: "brapi" | "cvm" | "nenhuma";
  status_atualizacao?: "atualizado" | "atrasado" | "indisponivel";
  dataCadastro?: string;
  dataAquisicao?: string;
  data_cadastro?: string;
  data_aquisicao?: string;
  valorAtual: number;
  participacao: number;
  /** Rendimento acumulado desde a aquisição (ganho/perda sobre preço médio). Não é retorno de 12 meses. */
  retorno12m: number;
};

export type ResumoCarteira = {
  patrimonioTotal: number;
  patrimonioInvestimentos?: number;
  patrimonioBens?: number;
  patrimonioPoupanca?: number;
  distribuicaoPatrimonio?: Array<{
    id: string;
    label: string;
    valor: number;
    percentual: number;
  }>;
  /** Retorno acumulado desde a data de aquisição dos ativos (não é retorno de 12 meses). */
  retorno12m: number;
  retornoDisponivel?: boolean;
  motivoRetornoIndisponivel?: string;
  /** @deprecated Não usar como score de saúde financeira. Use scoreUnificado da API de insights. */
  score: number;
  quantidadeAtivos: number;
};

export type PontoSerieComparativa = {
  data: string;
  carteira: number;
  cdi: number;
};

export type ComparativoBenchmarkCarteira = {
  periodoMeses: number;
  carteiraRetornoPeriodo: number;
  cdiRetornoPeriodo: number;
  excessoRetorno: number;
  fonteBenchmark: string;
  statusAtualizacaoBenchmark: "atualizado" | "atrasado" | "indisponivel";
  atualizadoEmBenchmark: string | null;
  serie: PontoSerieComparativa[];
};

export type DetalheCategoria = {
  categoria: CategoriaAtivo;
  valorTotal: number;
  participacao: number;
  ativos: AtivoResumo[];
};

export interface ServicoCarteira {
  listarAtivos(usuarioId: string): Promise<AtivoResumo[]>;
  obterResumo(usuarioId: string): Promise<ResumoCarteira>;
  obterDetalhePorCategoria(usuarioId: string, categoria: CategoriaAtivo): Promise<DetalheCategoria>;
  obterComparativoBenchmark(usuarioId: string, periodoMeses: number): Promise<ComparativoBenchmarkCarteira>;
}
