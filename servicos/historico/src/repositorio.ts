import type { EventoRelevante, SnapshotPatrimonio } from "@ei/contratos";

export interface RepositorioHistorico {
  listarSnapshots(usuarioId: string, limite: number): Promise<SnapshotPatrimonio[]>;
  listarEventos(usuarioId: string, limite: number): Promise<EventoRelevante[]>;
}

export class RepositorioHistoricoD1 implements RepositorioHistorico {
  constructor(private readonly db: D1Database) {}

  async listarSnapshots(usuarioId: string, limite: number): Promise<SnapshotPatrimonio[]> {
    const result = await this.db
      .prepare(
        "SELECT id, usuario_id, data, valor_total, variacao_percentual FROM snapshots_patrimonio WHERE usuario_id = ? ORDER BY data DESC LIMIT ?",
      )
      .bind(usuarioId, limite)
      .all<{
        id: string;
        usuario_id: string;
        data: string;
        valor_total: number;
        variacao_percentual: number;
      }>();

    return (result.results ?? []).map((row) => ({
      id: row.id,
      usuarioId: row.usuario_id,
      data: row.data,
      valorTotal: row.valor_total ?? 0,
      variacaoPercentual: row.variacao_percentual ?? 0,
    }));
  }

  async listarEventos(usuarioId: string, limite: number): Promise<EventoRelevante[]> {
    const importacoes = await this.db
      .prepare(
        "SELECT id, criado_em, arquivo_nome, validos FROM importacoes WHERE usuario_id = ? ORDER BY criado_em DESC LIMIT ?",
      )
      .bind(usuarioId, limite)
      .all<{
        id: string;
        criado_em: string;
        arquivo_nome: string | null;
        validos: number | null;
      }>();

    const eventosImportacao = (importacoes.results ?? []).map((item) => ({
      id: `evento_import_${item.id}`,
      usuarioId,
      data: item.criado_em,
      tipo: "importacao" as const,
      descricao: `Importação ${item.arquivo_nome ?? "manual"} com ${item.validos ?? 0} itens válidos`,
    }));

    const snapshots = await this.listarSnapshots(usuarioId, limite);
    const eventosSnapshot = snapshots
      .filter((item) => item.variacaoPercentual < 0)
      .map((item) => ({
        id: `evento_alerta_${item.id}`,
        usuarioId,
        data: item.data,
        tipo: "alerta" as const,
        descricao: `Variação mensal negativa de ${item.variacaoPercentual.toFixed(2)}%`,
      }));

    return [...eventosImportacao, ...eventosSnapshot]
      .sort((a, b) => (a.data < b.data ? 1 : -1))
      .slice(0, limite);
  }
}
