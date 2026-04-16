import type { EstadoReconstrucaoCarteira, StatusReconstrucao } from "@ei/contratos";
import type { RepositorioFilaReconstrucao } from "./reconstrucao";

type LinhaFila = {
  id: string;
  usuario_id: string;
  status: string;
  ano_mes_inicial: string | null;
  ano_mes_cursor: string | null;
  ano_mes_final: string | null;
  meses_processados: number;
  meses_totais: number;
  iniciado_em: string | null;
  concluido_em: string | null;
  erro_mensagem: string | null;
  tentativas: number;
  atualizado_em: string;
};

const linhaParaEstado = (row: LinhaFila): EstadoReconstrucaoCarteira => ({
  usuarioId: row.usuario_id,
  status: (row.status as StatusReconstrucao) ?? "pendente",
  anoMesInicial: row.ano_mes_inicial,
  anoMesCursor: row.ano_mes_cursor,
  anoMesFinal: row.ano_mes_final,
  mesesProcessados: row.meses_processados ?? 0,
  mesesTotais: row.meses_totais ?? 0,
  iniciadoEm: row.iniciado_em,
  concluidoEm: row.concluido_em,
  erroMensagem: row.erro_mensagem,
  tentativas: row.tentativas ?? 0,
  atualizadoEm: row.atualizado_em,
});

const calcularMesesTotais = (inicial: string, final: string): number => {
  const [ai, mi] = inicial.split("-").map(Number);
  const [af, mf] = final.split("-").map(Number);
  if (!ai || !mi || !af || !mf) return 0;
  return Math.max(0, (af - ai) * 12 + (mf - mi) + 1);
};

export class RepositorioFilaReconstrucaoD1 implements RepositorioFilaReconstrucao {
  constructor(private readonly db: D1Database) {}

  async obter(usuarioId: string): Promise<EstadoReconstrucaoCarteira | null> {
    const row = await this.db
      .prepare("SELECT * FROM fila_reconstrucao_carteira WHERE usuario_id = ?")
      .bind(usuarioId)
      .first<LinhaFila>();
    return row ? linhaParaEstado(row) : null;
  }

  async criar(
    usuarioId: string,
    anoMesInicial: string,
    anoMesFinal: string,
  ): Promise<EstadoReconstrucaoCarteira> {
    const id = `recon_${usuarioId}`;
    const agora = new Date().toISOString();
    const mesesTotais = calcularMesesTotais(anoMesInicial, anoMesFinal);

    await this.db
      .prepare(
        [
          "INSERT INTO fila_reconstrucao_carteira",
          "(id, usuario_id, status, ano_mes_inicial, ano_mes_cursor, ano_mes_final,",
          " meses_processados, meses_totais, tentativas, criado_em, atualizado_em)",
          "VALUES (?, ?, 'pendente', ?, NULL, ?, 0, ?, 0, ?, ?)",
          "ON CONFLICT(usuario_id) DO UPDATE SET",
          "status = 'pendente',",
          "ano_mes_inicial = excluded.ano_mes_inicial,",
          "ano_mes_cursor = NULL,",
          "ano_mes_final = excluded.ano_mes_final,",
          "meses_processados = 0,",
          "meses_totais = excluded.meses_totais,",
          "iniciado_em = NULL,",
          "concluido_em = NULL,",
          "erro_mensagem = NULL,",
          "tentativas = 0,",
          "atualizado_em = excluded.atualizado_em",
        ].join(" "),
      )
      .bind(id, usuarioId, anoMesInicial, anoMesFinal, mesesTotais, agora, agora)
      .run();

    const estado = await this.obter(usuarioId);
    if (!estado) throw new Error("falha ao criar fila de reconstrucao");
    return estado;
  }

  async atualizar(
    usuarioId: string,
    patch: Partial<EstadoReconstrucaoCarteira>,
  ): Promise<EstadoReconstrucaoCarteira> {
    const atual = await this.obter(usuarioId);
    if (!atual) throw new Error(`fila nao encontrada para usuario ${usuarioId}`);

    const merged: EstadoReconstrucaoCarteira = {
      ...atual,
      ...patch,
      atualizadoEm: new Date().toISOString(),
    };

    await this.db
      .prepare(
        [
          "UPDATE fila_reconstrucao_carteira SET",
          "status = ?,",
          "ano_mes_cursor = ?,",
          "meses_processados = ?,",
          "iniciado_em = ?,",
          "concluido_em = ?,",
          "erro_mensagem = ?,",
          "tentativas = ?,",
          "atualizado_em = ?",
          "WHERE usuario_id = ?",
        ].join(" "),
      )
      .bind(
        merged.status,
        merged.anoMesCursor,
        merged.mesesProcessados,
        merged.iniciadoEm,
        merged.concluidoEm,
        merged.erroMensagem,
        merged.tentativas,
        merged.atualizadoEm,
        usuarioId,
      )
      .run();

    return merged;
  }
}
