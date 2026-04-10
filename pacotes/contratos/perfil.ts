export type PerfilFinanceiro = {
  id: string;
  usuarioId: string;
  rendaMensal: number;
  aporteMensal: number;
  horizonte: string;
  perfilRisco: string;
  objetivo: string;
  maturidade: number;
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
  listarPlataformas(usuarioId: string): Promise<PlataformaVinculada[]>;
}
