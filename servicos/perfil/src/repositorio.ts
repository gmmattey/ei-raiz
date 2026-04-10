import type { PerfilFinanceiro, PlataformaVinculada } from "@ei/contratos";

export type SalvarPerfilInput = Omit<PerfilFinanceiro, "id"> & { id?: string };

export interface RepositorioPerfil {
  obterPerfil(usuarioId: string): Promise<PerfilFinanceiro | null>;
  salvarPerfil(input: SalvarPerfilInput): Promise<PerfilFinanceiro>;
  listarPlataformas(usuarioId: string): Promise<PlataformaVinculada[]>;
}

export class RepositorioPerfilD1 implements RepositorioPerfil {
  constructor(private readonly db: D1Database) {}

  async obterPerfil(usuarioId: string): Promise<PerfilFinanceiro | null> {
    const row = await this.db
      .prepare(
        "SELECT id, usuario_id, renda_mensal, aporte_mensal, horizonte, perfil_risco, objetivo, maturidade FROM perfil_financeiro WHERE usuario_id = ?",
      )
      .bind(usuarioId)
      .first<{
        id: string;
        usuario_id: string;
        renda_mensal: number;
        aporte_mensal: number;
        horizonte: string;
        perfil_risco: string;
        objetivo: string;
        maturidade: number;
      }>();

    if (!row) return null;
    return {
      id: row.id,
      usuarioId: row.usuario_id,
      rendaMensal: row.renda_mensal ?? 0,
      aporteMensal: row.aporte_mensal ?? 0,
      horizonte: row.horizonte ?? "",
      perfilRisco: row.perfil_risco ?? "",
      objetivo: row.objetivo ?? "",
      maturidade: row.maturidade ?? 1,
    };
  }

  async salvarPerfil(input: SalvarPerfilInput): Promise<PerfilFinanceiro> {
    const id = input.id ?? `perf_${input.usuarioId}`;
    const existente = await this.obterPerfil(input.usuarioId);

    if (existente) {
      await this.db
        .prepare(
          "UPDATE perfil_financeiro SET renda_mensal = ?, aporte_mensal = ?, horizonte = ?, perfil_risco = ?, objetivo = ?, maturidade = ? WHERE usuario_id = ?",
        )
        .bind(
          input.rendaMensal,
          input.aporteMensal,
          input.horizonte,
          input.perfilRisco,
          input.objetivo,
          input.maturidade,
          input.usuarioId,
        )
        .run();
    } else {
      await this.db
        .prepare(
          "INSERT INTO perfil_financeiro (id, usuario_id, renda_mensal, aporte_mensal, horizonte, perfil_risco, objetivo, maturidade) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(
          id,
          input.usuarioId,
          input.rendaMensal,
          input.aporteMensal,
          input.horizonte,
          input.perfilRisco,
          input.objetivo,
          input.maturidade,
        )
        .run();
    }

    const atualizado = await this.obterPerfil(input.usuarioId);
    if (!atualizado) throw new Error("Falha ao salvar perfil");
    return atualizado;
  }

  async listarPlataformas(usuarioId: string): Promise<PlataformaVinculada[]> {
    const result = await this.db
      .prepare(
        "SELECT id, usuario_id, nome, ultimo_import, status FROM plataformas_vinculadas WHERE usuario_id = ? ORDER BY nome ASC",
      )
      .bind(usuarioId)
      .all<{
        id: string;
        usuario_id: string;
        nome: string;
        ultimo_import: string | null;
        status: "ativo" | "inativo";
      }>();

    return (result.results ?? []).map((row) => ({
      id: row.id,
      usuarioId: row.usuario_id,
      nome: row.nome,
      ultimoImport: row.ultimo_import,
      status: row.status ?? "ativo",
    }));
  }
}
