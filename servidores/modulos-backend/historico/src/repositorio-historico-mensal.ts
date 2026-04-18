import type {
  HistoricoMensalCompleto,
  OrigemHistoricoMensal,
  PayloadHistoricoMensal,
  PontoHistoricoMensal,
} from "@ei/contratos";
import type { RepositorioHistoricoMensal } from "./historico-mensal";

type LinhaHistoricoMensal = {
  id: string;
  usuario_id: string;
  ano_mes: string;
  data_fechamento: string;
  total_investido: number;
  total_atual: number;
  retorno_mes: number;
  retorno_acum: number;
  origem: string;
  payload_json?: string;
};

const linhaParaPonto = (row: LinhaHistoricoMensal): PontoHistoricoMensal => ({
  id: row.id,
  usuarioId: row.usuario_id,
  anoMes: row.ano_mes,
  dataFechamento: row.data_fechamento,
  totalInvestido: row.total_investido ?? 0,
  totalAtual: row.total_atual ?? 0,
  retornoMes: row.retorno_mes ?? 0,
  retornoAcum: row.retorno_acum ?? 0,
  origem: (row.origem as OrigemHistoricoMensal) ?? "fechamento_mensal",
});

export class RepositorioHistoricoMensalD1 implements RepositorioHistoricoMensal {
  constructor(private readonly db: D1Database) {}

  async listarPontos(usuarioId: string, limite: number): Promise<PontoHistoricoMensal[]> {
    const result = await this.db
      .prepare(
        [
          "SELECT id, usuario_id, ano_mes, data_fechamento, total_investido, total_atual,",
          "retorno_mes, retorno_acum, origem",
          "FROM historico_carteira_mensal",
          "WHERE usuario_id = ?",
          "ORDER BY ano_mes DESC",
          "LIMIT ?",
        ].join(" "),
      )
      .bind(usuarioId, limite)
      .all<LinhaHistoricoMensal>();

    return (result.results ?? []).map(linhaParaPonto);
  }

  async obterMes(
    usuarioId: string,
    anoMes: string,
  ): Promise<HistoricoMensalCompleto | null> {
    const row = await this.db
      .prepare(
        [
          "SELECT id, usuario_id, ano_mes, data_fechamento, total_investido, total_atual,",
          "retorno_mes, retorno_acum, origem, payload_json",
          "FROM historico_carteira_mensal",
          "WHERE usuario_id = ? AND ano_mes = ?",
        ].join(" "),
      )
      .bind(usuarioId, anoMes)
      .first<LinhaHistoricoMensal>();

    if (!row) return null;

    const ponto = linhaParaPonto(row);
    const payload = row.payload_json
      ? (JSON.parse(row.payload_json) as PayloadHistoricoMensal)
      : {
          ativos: [],
          patrimonioInvestimentos: 0,
          patrimonioBens: 0,
          patrimonioPoupanca: 0,
          patrimonioTotal: 0,
          distribuicaoPatrimonio: [],
        };

    return { ...ponto, payload };
  }

  async obterMesAnterior(
    usuarioId: string,
    anoMes: string,
  ): Promise<PontoHistoricoMensal | null> {
    const row = await this.db
      .prepare(
        [
          "SELECT id, usuario_id, ano_mes, data_fechamento, total_investido, total_atual,",
          "retorno_mes, retorno_acum, origem",
          "FROM historico_carteira_mensal",
          "WHERE usuario_id = ? AND ano_mes < ?",
          "ORDER BY ano_mes DESC LIMIT 1",
        ].join(" "),
      )
      .bind(usuarioId, anoMes)
      .first<LinhaHistoricoMensal>();

    return row ? linhaParaPonto(row) : null;
  }

  async obterMesMaisAntigo(usuarioId: string): Promise<PontoHistoricoMensal | null> {
    const row = await this.db
      .prepare(
        [
          "SELECT id, usuario_id, ano_mes, data_fechamento, total_investido, total_atual,",
          "retorno_mes, retorno_acum, origem",
          "FROM historico_carteira_mensal",
          "WHERE usuario_id = ?",
          "ORDER BY ano_mes ASC LIMIT 1",
        ].join(" "),
      )
      .bind(usuarioId)
      .first<LinhaHistoricoMensal>();

    return row ? linhaParaPonto(row) : null;
  }

  async gravar(
    usuarioId: string,
    anoMes: string,
    dataFechamento: string,
    totalInvestido: number,
    totalAtual: number,
    retornoMes: number,
    retornoAcum: number,
    payload: PayloadHistoricoMensal,
    origem: OrigemHistoricoMensal,
  ): Promise<PontoHistoricoMensal> {
    const id = `hist_${usuarioId}_${anoMes}`;
    const agora = new Date().toISOString();

    await this.db
      .prepare(
        [
          "INSERT INTO historico_carteira_mensal",
          "(id, usuario_id, ano_mes, data_fechamento, total_investido, total_atual,",
          " retorno_mes, retorno_acum, payload_json, origem, criado_em, atualizado_em)",
          "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          "ON CONFLICT(usuario_id, ano_mes) DO UPDATE SET",
          "data_fechamento = excluded.data_fechamento,",
          "total_investido = excluded.total_investido,",
          "total_atual = excluded.total_atual,",
          "retorno_mes = excluded.retorno_mes,",
          "retorno_acum = excluded.retorno_acum,",
          "payload_json = excluded.payload_json,",
          "origem = excluded.origem,",
          "atualizado_em = excluded.atualizado_em",
        ].join(" "),
      )
      .bind(
        id,
        usuarioId,
        anoMes,
        dataFechamento,
        totalInvestido,
        totalAtual,
        retornoMes,
        retornoAcum,
        JSON.stringify(payload),
        origem,
        agora,
        agora,
      )
      .run();

    return {
      id,
      usuarioId,
      anoMes,
      dataFechamento,
      totalInvestido,
      totalAtual,
      retornoMes,
      retornoAcum,
      origem,
    };
  }
}
