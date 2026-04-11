export type CategoriaAtivo = "acao" | "fundo" | "previdencia" | "renda_fixa";

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
  retorno12m: number;
};

export type ResumoCarteira = {
  patrimonioTotal: number;
  retorno12m: number;
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
