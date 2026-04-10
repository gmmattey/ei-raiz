export type CategoriaAtivo = "acao" | "fundo" | "previdencia" | "renda_fixa";

export type AtivoResumo = {
  id: string;
  ticker: string;
  nome: string;
  categoria: CategoriaAtivo;
  plataforma: string;
  precoAtual?: number;
  variacaoPercentual?: number;
  ganhoPerda?: number;
  ganhoPerdaPercentual?: number;
  ultimaAtualizacao?: string;
  fontePreco?: "brapi" | "cvm" | "nenhuma";
  statusAtualizacao?: "atualizado" | "atrasado" | "indisponivel";
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
}
