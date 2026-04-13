export type PerfilFinanceiro = {
  id: string;
  usuarioId: string;
  rendaMensal: number;
  gastoMensal?: number;
  aporteMensal: number;
  reservaCaixa?: number;
  horizonte: string;
  perfilRisco: string;
  objetivo: string;
  frequenciaAporte?: string;
  experienciaInvestimentos?: string;
  toleranciaRiscoReal?: string;
  maturidade: number;
  /** Faixa etária declarada pelo usuário. Exemplos: "18-25", "26-35", "36-45", "46-55", "56+" */
  faixaEtaria?: string;
};

export type ImovelContexto = {
  id: string;
  tipo: string;
  valorEstimado: number;
  saldoFinanciamento?: number;
  geraRenda?: boolean;
};

export type VeiculoContexto = {
  id: string;
  tipo: string;
  valorEstimado: number;
  quitado?: boolean;
};

export type DividaContexto = {
  id: string;
  tipo: string;
  saldoDevedor: number;
  parcelaMensal?: number;
};

export type ContextoFinanceiroUsuario = {
  usuarioId: string;
  objetivoPrincipal?: string;
  objetivosSecundarios?: string[];
  horizonte?: "curto" | "medio" | "longo";
  dependentes?: boolean;
  faixaEtaria?: string;
  rendaMensal?: number;
  gastoMensal?: number;
  aporteMensal?: number;
  perfilRiscoDeclarado?: string;
  maturidadeInvestidor?: number;
  frequenciaAporte?: string;
  experienciaInvestimentos?: string;
  toleranciaRiscoReal?: string;
  patrimonioExterno: {
    imoveis: ImovelContexto[];
    veiculos: VeiculoContexto[];
    /** Valor declarado em poupança (campo explícito). */
    poupanca?: number;
    /** @deprecated Use `poupanca`. Mantido por compatibilidade. */
    caixaDisponivel: number;
  };
  dividas: DividaContexto[];
  atualizadoEm?: string;
};

export type PlataformaVinculada = {
  id: string;
  usuarioId: string;
  nome: string;
  ultimoImport: string | null;
  status: "ativo" | "inativo";
};

export interface ServicoPerfil {
  obterPerfil(usuarioId: string): Promise<PerfilFinanceiro | null>;
  salvarPerfil(perfil: PerfilFinanceiro): Promise<PerfilFinanceiro>;
  obterContextoFinanceiro(usuarioId: string): Promise<ContextoFinanceiroUsuario | null>;
  salvarContextoFinanceiro(contexto: ContextoFinanceiroUsuario): Promise<ContextoFinanceiroUsuario>;
  listarPlataformas(usuarioId: string): Promise<PlataformaVinculada[]>;
}
