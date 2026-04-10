import type { PerfilFinanceiro, PlataformaVinculada, ServicoPerfil } from "@ei/contratos";
import type { RepositorioPerfil } from "./repositorio";

export class ServicoPerfilPadrao implements ServicoPerfil {
  constructor(private readonly repositorio: RepositorioPerfil) {}

  obterPerfil(usuarioId: string): Promise<PerfilFinanceiro | null> {
    return this.repositorio.obterPerfil(usuarioId);
  }

  salvarPerfil(perfil: PerfilFinanceiro): Promise<PerfilFinanceiro> {
    return this.repositorio.salvarPerfil(perfil);
  }

  listarPlataformas(usuarioId: string): Promise<PlataformaVinculada[]> {
    return this.repositorio.listarPlataformas(usuarioId);
  }
}
