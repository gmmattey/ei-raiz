import type { ContextoFinanceiroUsuario, PerfilFinanceiro, PlataformaVinculada } from "@ei/contratos";

export type SalvarPerfilInput = Omit<PerfilFinanceiro, "id"> & { id?: string };

export interface RepositorioPerfil {
  obterPerfil(usuarioId: string): Promise<PerfilFinanceiro | null>;
  salvarPerfil(input: SalvarPerfilInput): Promise<PerfilFinanceiro>;
  obterContextoFinanceiro(usuarioId: string): Promise<ContextoFinanceiroUsuario | null>;
  salvarContextoFinanceiro(contexto: ContextoFinanceiroUsuario): Promise<ContextoFinanceiroUsuario>;
  listarPlataformas(usuarioId: string): Promise<PlataformaVinculada[]>;
}

export class RepositorioPerfilD1 implements RepositorioPerfil {
  constructor(private readonly db: D1Database) {}

  async obterPerfil(usuarioId: string): Promise<PerfilFinanceiro | null> {
    const row = await this.db
      .prepare(
        "SELECT id, usuario_id, renda_mensal, gasto_mensal, aporte_mensal, reserva_caixa, horizonte, perfil_risco, objetivo, frequencia_aporte, experiencia_investimentos, tolerancia_risco_real, maturidade FROM perfil_financeiro WHERE usuario_id = ?",
      )
      .bind(usuarioId)
      .first<{
        id: string;
        usuario_id: string;
        renda_mensal: number;
        gasto_mensal: number | null;
        aporte_mensal: number;
        reserva_caixa: number | null;
        horizonte: string;
        perfil_risco: string;
        objetivo: string;
        frequencia_aporte: string | null;
        experiencia_investimentos: string | null;
        tolerancia_risco_real: string | null;
        maturidade: number;
      }>();

    if (!row) return null;
    return {
      id: row.id,
      usuarioId: row.usuario_id,
      rendaMensal: row.renda_mensal ?? 0,
      gastoMensal: row.gasto_mensal ?? 0,
      aporteMensal: row.aporte_mensal ?? 0,
      reservaCaixa: row.reserva_caixa ?? 0,
      horizonte: row.horizonte ?? "",
      perfilRisco: row.perfil_risco ?? "",
      objetivo: row.objetivo ?? "",
      frequenciaAporte: row.frequencia_aporte ?? "",
      experienciaInvestimentos: row.experiencia_investimentos ?? "",
      toleranciaRiscoReal: row.tolerancia_risco_real ?? "",
      maturidade: row.maturidade ?? 1,
    };
  }

  async salvarPerfil(input: SalvarPerfilInput): Promise<PerfilFinanceiro> {
    const id = input.id ?? `perf_${input.usuarioId}`;
    const existente = await this.obterPerfil(input.usuarioId);

    if (existente) {
      await this.db
        .prepare(
          "UPDATE perfil_financeiro SET renda_mensal = ?, gasto_mensal = ?, aporte_mensal = ?, reserva_caixa = ?, horizonte = ?, perfil_risco = ?, objetivo = ?, frequencia_aporte = ?, experiencia_investimentos = ?, tolerancia_risco_real = ?, maturidade = ? WHERE usuario_id = ?",
        )
        .bind(
          input.rendaMensal,
          input.gastoMensal ?? 0,
          input.aporteMensal,
          input.reservaCaixa ?? 0,
          input.horizonte,
          input.perfilRisco,
          input.objetivo,
          input.frequenciaAporte ?? "",
          input.experienciaInvestimentos ?? "",
          input.toleranciaRiscoReal ?? "",
          input.maturidade,
          input.usuarioId,
        )
        .run();
    } else {
      await this.db
        .prepare(
          "INSERT INTO perfil_financeiro (id, usuario_id, renda_mensal, gasto_mensal, aporte_mensal, reserva_caixa, horizonte, perfil_risco, objetivo, frequencia_aporte, experiencia_investimentos, tolerancia_risco_real, maturidade) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(
          id,
          input.usuarioId,
          input.rendaMensal,
          input.gastoMensal ?? 0,
          input.aporteMensal,
          input.reservaCaixa ?? 0,
          input.horizonte,
          input.perfilRisco,
          input.objetivo,
          input.frequenciaAporte ?? "",
          input.experienciaInvestimentos ?? "",
          input.toleranciaRiscoReal ?? "",
          input.maturidade,
        )
        .run();
    }

    const atualizado = await this.obterPerfil(input.usuarioId);
    if (!atualizado) throw new Error("Falha ao salvar perfil");
    return atualizado;
  }

  async obterContextoFinanceiro(usuarioId: string): Promise<ContextoFinanceiroUsuario | null> {
    const row = await this.db
      .prepare("SELECT contexto_json, atualizado_em FROM perfil_contexto_financeiro WHERE usuario_id = ? LIMIT 1")
      .bind(usuarioId)
      .first<{ contexto_json: string; atualizado_em: string }>();
    if (!row?.contexto_json) return null;
    try {
      const parsed = JSON.parse(row.contexto_json) as ContextoFinanceiroUsuario;
      return {
        ...parsed,
        usuarioId,
        atualizadoEm: row.atualizado_em,
        patrimonioExterno: {
          imoveis: parsed.patrimonioExterno?.imoveis ?? [],
          veiculos: parsed.patrimonioExterno?.veiculos ?? [],
          poupanca: parsed.patrimonioExterno?.poupanca ?? parsed.patrimonioExterno?.caixaDisponivel ?? 0,
          caixaDisponivel: parsed.patrimonioExterno?.caixaDisponivel ?? 0,
        },
        dividas: parsed.dividas ?? [],
      };
    } catch {
      return null;
    }
  }

  async salvarContextoFinanceiro(contexto: ContextoFinanceiroUsuario): Promise<ContextoFinanceiroUsuario> {
    const now = new Date().toISOString();
    const payload: ContextoFinanceiroUsuario = {
      ...contexto,
      patrimonioExterno: {
        imoveis: contexto.patrimonioExterno?.imoveis ?? [],
        veiculos: contexto.patrimonioExterno?.veiculos ?? [],
        poupanca: contexto.patrimonioExterno?.poupanca ?? contexto.patrimonioExterno?.caixaDisponivel ?? 0,
        caixaDisponivel: contexto.patrimonioExterno?.caixaDisponivel ?? 0,
      },
      dividas: contexto.dividas ?? [],
      atualizadoEm: now,
    };

    await this.db
      .prepare(
        [
          "INSERT INTO perfil_contexto_financeiro (id, usuario_id, contexto_json, atualizado_em)",
          "VALUES (?, ?, ?, ?)",
          "ON CONFLICT(usuario_id) DO UPDATE SET contexto_json = excluded.contexto_json, atualizado_em = excluded.atualizado_em",
        ].join(" "),
      )
      .bind(crypto.randomUUID(), contexto.usuarioId, JSON.stringify(payload), now)
      .run();

    return payload;
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
