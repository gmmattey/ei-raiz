/**
 * Família do ativo — dimensão que decide a estratégia de cálculo de valor e
 * rentabilidade. Substitui o uso ambíguo de `categoria` para decisão de fórmula:
 *
 *   A (renda_variavel_listada): ação, FII, ETF, BDR — preço × quantidade via BRAPI
 *   B (fundo_cvm):              fundo com cota CVM — custo × (cota_atual / cota_aquisicao)
 *   C (renda_fixa_contratada):  CDB, LCI/LCA, Tesouro, Debêntures — valor_contratado × fator(indexador, taxa, tempo)
 *   D (bens):                   imóvel, veículo — valor declarado; sem rentabilidade computada
 *   E (caixa_poupanca):         caixa, poupança, cofrinho — sem marcação a mercado; poupança pode usar TR+0.5%
 *
 * `categoria` é preservada para exibição e filtros de UI; `familia` é a verdade
 * semântica para cálculo.
 */
export type FamiliaAtivo =
  | "renda_variavel_listada"
  | "fundo_cvm"
  | "renda_fixa_contratada"
  | "bens"
  | "caixa_poupanca";

export type CategoriaAtivo =
  | "acao"
  | "fundo"
  | "previdencia"
  | "renda_fixa"
  | "poupanca"
  | "bens";

/**
 * Indexador de renda fixa / previdência.
 * A ausência (null/undefined) significa "não é renda fixa contratada" — não cai
 * em default silencioso. Código que recebe undefined em RF deve tratar como dado
 * faltando e marcar `rentabilidadeConfiavel=false`.
 */
export type IndexadorRendaFixa = "CDI" | "IPCA" | "PRE" | "SELIC" | "IGPM";

export type AtivoResumo = {
  id: string;
  ticker: string;
  nome: string;
  categoria: CategoriaAtivo;
  familia: FamiliaAtivo;
  plataforma: string;
  quantidade?: number;
  precoMedio?: number;
  precoAtual?: number;
  variacaoPercentual?: number;
  ganhoPerda?: number;
  ganhoPerdaPercentual?: number;
  ultimaAtualizacao?: string;
  fontePreco?: "brapi" | "cvm" | "calculado" | "nenhuma";
  statusAtualizacao?: "atualizado" | "atrasado" | "indisponivel";
  dataCadastro?: string;
  dataAquisicao?: string;
  valorAtual: number;
  participacao: number;

  /**
   * Rendimento acumulado desde a aquisição (valorAtual − custo) / custo × 100.
   * Único nome canônico. Substitui os antigos `retorno12m` (nome mentiroso) e
   * `retorno_desde_aquisicao` (snake redundante).
   */
  rentabilidadeDesdeAquisicaoPct: number | null;

  /**
   * Indica se `rentabilidadeDesdeAquisicaoPct` é auditável:
   *   true  — dados completos (preço médio reconciliado, cotação atual disponível,
   *           cotaAquisicao presente para fundos CVM, indexador/taxa completos para RF).
   *   false — faltou algum insumo e o valor retornado é null. UI deve exibir "—",
   *           nunca 0 como se fosse rentabilidade real.
   */
  rentabilidadeConfiavel: boolean;

  /** Motivo legível para o usuário quando `rentabilidadeConfiavel=false`. */
  motivoRentabilidadeIndisponivel?: string;

  /**
   * Confiabilidade do preço médio exibido.
   *   confiavel:            dado importado bateu com valor atual
   *   ajustado_heuristica:  valor foi dividido/ajustado por suspeita de unidade incorreta
   *   inconsistente:        preço médio não pôde ser reconciliado
   */
  statusPrecoMedio?: "confiavel" | "ajustado_heuristica" | "inconsistente";

  // Campos específicos de renda fixa contratada / previdência (família C).
  // Null em outras famílias.
  indexador?: IndexadorRendaFixa | null;
  /** Percentual — 110 = "110% CDI"; 6.5 = "IPCA+6.5%"; 12.5 = "12.5% a.a. prefixado". */
  taxa?: number | null;
  dataInicio?: string | null;
  vencimento?: string | null;
};

export type ResumoCarteira = {
  /**
   * Soma marcada a mercado dos ativos investidos (famílias A, B, C).
   * Único número que representa "o quanto eu tenho investido hoje".
   * Não é patrimônio líquido — não inclui bens/poupança/dívidas.
   */
  valorInvestimentos: number;
  /** Custo acumulado Σ(qtd × preço) dos ativos, com preço médio reconciliado. */
  custoTotalAcumulado: number;

  /**
   * Rentabilidade agregada dos investimentos desde a aquisição.
   * Computado APENAS sobre valorInvestimentos — bens e poupança NÃO entram.
   * null + rentabilidadeConfiavel=false ⇒ UI deve exibir "—".
   */
  rentabilidadeDesdeAquisicaoPct: number | null;
  rentabilidadeConfiavel: boolean;
  motivoRentabilidadeIndisponivel?: string;

  quantidadeAtivos: number;

  // Composição patrimonial opcional. Preenchida pela camada que tem acesso ao
  // contexto financeiro completo (porta-entrada / snapshot). Quando presente,
  // `patrimonioLiquido` = valorInvestimentos + bens + poupança − dívidas.
  patrimonioLiquido?: number;
  patrimonioBens?: number;
  patrimonioPoupanca?: number;
  patrimonioDividas?: number;
  distribuicaoPatrimonio?: Array<{
    id: string;
    label: string;
    valor: number;
    percentual: number;
  }>;
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

/**
 * Mapeia uma categoria de ativo para sua família de cálculo canônica.
 * Dispatch exaustivo — se categorias novas forem adicionadas, o `never` no
 * default força o mapeamento explícito em tempo de compilação.
 */
export const familiaDeCategoria = (categoria: CategoriaAtivo): FamiliaAtivo => {
  switch (categoria) {
    case "acao":
      return "renda_variavel_listada";
    case "fundo":
      return "fundo_cvm";
    case "renda_fixa":
    case "previdencia":
      return "renda_fixa_contratada";
    case "bens":
      return "bens";
    case "poupanca":
      return "caixa_poupanca";
    default: {
      const _exhaustive: never = categoria;
      return _exhaustive;
    }
  }
};
