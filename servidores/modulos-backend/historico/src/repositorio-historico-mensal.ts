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
  valor_investimentos: number;
  total_atual: number;
  rentabilidade_mes_pct: number;
  rentabilidade_acum_pct: number;
  confiavel: number;
  origem: string;
  payload_json?: string;
};

const linhaParaPonto = (row: LinhaHistoricoMensal): PontoHistoricoMensal => ({
  id: row.id,
  usuarioId: row.usuario_id,
  anoMes: row.ano_mes,
  dataFechamento: row.data_fechamento,
  totalInvestido: row.total_investido ?? 0,
  valorInvestimentos: row.valor_investimentos ?? row.total_atual ?? 0,
  totalAtual: row.total_atual ?? 0,
  rentabilidadeMesPct: row.rentabilidade_mes_pct ?? 0,
  rentabilidadeAcumPct: row.rentabilidade_acum_pct ?? 0,
  confiavel: Number(row.confiavel ?? 1) === 1,
  origem: (row.origem as OrigemHistoricoMensal) ?? "fechamento_mensal",
});

const COLUNAS_PONTO =
  "id, usuario_id, ano_mes, data_fechamento, total_investido, valor_investimentos, total_atual," +
  " rentabilidade_mes_pct, rentabilidade_acum_pct, confiavel, origem";

const PAYLOAD_VAZIO: PayloadHistoricoMensal = {
  ativos: [],
  valorInvestimentos: 0,
  patrimonioInvestimentos: 0,
  patrimonioBens: 0,
  patrimonioPoupanca: 0,
  patrimonioDividas: 0,
  patrimonioTotal: 0,
  distribuicaoPatrimonio: [],
  confiavel: false,
};

export class RepositorioHistoricoMensalD1 implements RepositorioHistoricoMensal {
  constructor(private readonly db: D1Database) {}

  async listarPontos(usuarioId: string, limite: number): Promise<PontoHistoricoMensal[]> {
    const result = await this.db
      .prepare(
        [
          `SELECT ${COLUNAS_PONTO}`,
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
          `SELECT ${COLUNAS_PONTO}, payload_json`,
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
      : PAYLOAD_VAZIO;

    return { ...ponto, payload };
  }

  async obterMesAnterior(
    usuarioId: string,
    anoMes: string,
  ): Promise<PontoHistoricoMensal | null> {
    const row = await this.db
      .prepare(
        [
          `SELECT ${COLUNAS_PONTO}`,
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
          `SELECT ${COLUNAS_PONTO}`,
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
    valorInvestimentos: number,
    totalAtual: number,
    rentabilidadeMesPct: number,
    rentabilidadeAcumPct: number,
    confiavel: boolean,
    payload: PayloadHistoricoMensal,
    origem: OrigemHistoricoMensal,
  ): Promise<PontoHistoricoMensal> {
    const id = `hist_${usuarioId}_${anoMes}`;
    const agora = new Date().toISOString();
    const confiavelInt = confiavel ? 1 : 0;

    await this.db
      .prepare(
        [
          "INSERT INTO historico_carteira_mensal",
          "(id, usuario_id, ano_mes, data_fechamento, total_investido, valor_investimentos,",
          " total_atual, rentabilidade_mes_pct, rentabilidade_acum_pct, confiavel,",
          " payload_json, origem, criado_em, atualizado_em)",
          "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          "ON CONFLICT(usuario_id, ano_mes) DO UPDATE SET",
          "data_fechamento = excluded.data_fechamento,",
          "total_investido = excluded.total_investido,",
          "valor_investimentos = excluded.valor_investimentos,",
          "total_atual = excluded.total_atual,",
          "rentabilidade_mes_pct = excluded.rentabilidade_mes_pct,",
          "rentabilidade_acum_pct = excluded.rentabilidade_acum_pct,",
          "confiavel = excluded.confiavel,",
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
        valorInvestimentos,
        totalAtual,
        rentabilidadeMesPct,
        rentabilidadeAcumPct,
        confiavelInt,
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
      valorInvestimentos,
      totalAtual,
      rentabilidadeMesPct,
      rentabilidadeAcumPct,
      confiavel,
      origem,
    };
  }
}
