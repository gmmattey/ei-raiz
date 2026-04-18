/**
 * Adapter D1 → ProvedorCotacaoFundosCvm.
 *
 * Consome o cache local em `cotas_fundos_cvm` (alimentado por script de
 * ingestão offline) e serve cotas a serviços de carteira e reconstrução.
 *
 * Não faz fetch à CVM — a ingestão acontece fora do Worker (volume de dados
 * incompatível com limites de CPU/memória do Worker).
 */

import type { CotaFundoCvm, ProvedorCotacaoFundosCvm } from "@ei/contratos";
import type { Env } from "../types/gateway";

export class CvmFundosProviderD1 implements ProvedorCotacaoFundosCvm {
  constructor(private readonly db: D1Database) {}

  async obterCotaMaisRecente(cnpj: string, ateData?: string): Promise<CotaFundoCvm | null> {
    const cnpjLimpo = normalizarCnpj(cnpj);
    if (!cnpjLimpo) return null;

    const sql = ateData
      ? "SELECT cnpj, data_ref, vl_quota, vl_patrim_liq, nr_cotst FROM cotas_fundos_cvm WHERE cnpj = ? AND data_ref <= ? ORDER BY data_ref DESC LIMIT 1"
      : "SELECT cnpj, data_ref, vl_quota, vl_patrim_liq, nr_cotst FROM cotas_fundos_cvm WHERE cnpj = ? ORDER BY data_ref DESC LIMIT 1";

    const row = ateData
      ? await this.db.prepare(sql).bind(cnpjLimpo, ateData).first<RowCota>()
      : await this.db.prepare(sql).bind(cnpjLimpo).first<RowCota>();

    if (!row) return null;
    return mapearLinha(row);
  }

  async obterFechamentosMensais(
    cnpjs: string[],
    anoMesInicial: string,
    anoMesFinal: string,
  ): Promise<Map<string, Map<string, number>>> {
    const resultado = new Map<string, Map<string, number>>();
    if (cnpjs.length === 0) return resultado;

    const cnpjsLimpos = Array.from(
      new Set(cnpjs.map(normalizarCnpj).filter((v): v is string => Boolean(v))),
    );
    if (cnpjsLimpos.length === 0) return resultado;

    // Busca a última cota de cada mês por CNPJ com uma única query.
    // O SQLite não tem window functions universalmente disponíveis em D1
    // clássico, mas D1 atual (2024+) suporta. Usamos ROW_NUMBER para pegar
    // a última cota por (cnpj, YYYY-MM).
    const placeholders = cnpjsLimpos.map(() => "?").join(",");
    const dataInicial = `${anoMesInicial}-01`;
    const dataFinal = ultimoDiaMes(anoMesFinal);

    const sql = `
      SELECT cnpj, substr(data_ref, 1, 7) AS ano_mes, data_ref, vl_quota
      FROM cotas_fundos_cvm
      WHERE cnpj IN (${placeholders})
        AND data_ref BETWEEN ? AND ?
      ORDER BY cnpj, data_ref DESC
    `;

    const bindings = [...cnpjsLimpos, dataInicial, dataFinal];
    const rs = await this.db.prepare(sql).bind(...bindings).all<RowFechamento>();
    const linhas = rs.results ?? [];

    // Para cada (cnpj, ano_mes), guarda apenas a primeira ocorrência
    // (que é a mais recente pois ordenamos por data_ref DESC).
    for (const linha of linhas) {
      let porMes = resultado.get(linha.cnpj);
      if (!porMes) {
        porMes = new Map<string, number>();
        resultado.set(linha.cnpj, porMes);
      }
      if (!porMes.has(linha.ano_mes)) {
        porMes.set(linha.ano_mes, Number(linha.vl_quota));
      }
    }

    return resultado;
  }
}

type RowCota = {
  cnpj: string;
  data_ref: string;
  vl_quota: number;
  vl_patrim_liq: number | null;
  nr_cotst: number | null;
};

type RowFechamento = {
  cnpj: string;
  ano_mes: string;
  data_ref: string;
  vl_quota: number;
};

function mapearLinha(row: RowCota): CotaFundoCvm {
  return {
    cnpj: row.cnpj,
    dataRef: row.data_ref,
    vlQuota: Number(row.vl_quota),
    vlPatrimLiq: row.vl_patrim_liq ?? null,
    nrCotst: row.nr_cotst ?? null,
  };
}

export function normalizarCnpj(cnpj: string | null | undefined): string | null {
  if (!cnpj) return null;
  const digitos = String(cnpj).replace(/\D/g, "");
  if (digitos.length !== 14) return null;
  return digitos;
}

function ultimoDiaMes(anoMes: string): string {
  // anoMes no formato "YYYY-MM". Retorna "YYYY-MM-DD" do último dia.
  const [ano, mes] = anoMes.split("-").map((v) => Number(v));
  const data = new Date(Date.UTC(ano, mes, 0)); // dia 0 do mês seguinte = último dia do mês atual
  return data.toISOString().slice(0, 10);
}

/**
 * Factory para o provider. Retorna null-object se não precisar ser injetado.
 * Sempre retorna instância — o overhead de uma query que devolve vazio é trivial.
 */
export function construirCvmFundosProvider(env: Env): CvmFundosProviderD1 {
  return new CvmFundosProviderD1(env.DB);
}
