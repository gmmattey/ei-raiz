import type {
  HistoricoMensalCompleto,
  OrigemHistoricoMensal,
  PayloadHistoricoMensal,
  PontoHistoricoMensal,
  ServicoHistoricoMensal,
} from "@ei/contratos";

export interface RepositorioHistoricoMensal {
  listarPontos(usuarioId: string, limite: number): Promise<PontoHistoricoMensal[]>;
  obterMes(usuarioId: string, anoMes: string): Promise<HistoricoMensalCompleto | null>;
  obterMesAnterior(usuarioId: string, anoMes: string): Promise<PontoHistoricoMensal | null>;
  obterMesMaisAntigo(usuarioId: string): Promise<PontoHistoricoMensal | null>;
  gravar(
    usuarioId: string,
    anoMes: string,
    dataFechamento: string,
    totalInvestido: number,
    totalAtual: number,
    retornoMes: number,
    retornoAcum: number,
    payload: PayloadHistoricoMensal,
    origem: OrigemHistoricoMensal,
  ): Promise<PontoHistoricoMensal>;
}

const arredondarPercentual = (valor: number): number => Number(valor.toFixed(4));

/**
 * Calcula retorno do mês (vs mês anterior) e retorno acumulado (vs primeiro mês).
 * Valores inválidos ou bases zeradas retornam 0 — não lança exceção para permitir
 * reconstrução contínua mesmo em meses-buraco.
 */
export function calcularRetornosMensais(
  totalAtual: number,
  totalAtualMesAnterior: number | null,
  totalAtualPrimeiroMes: number | null,
): { retornoMes: number; retornoAcum: number } {
  const retornoMes =
    totalAtualMesAnterior && totalAtualMesAnterior > 0
      ? ((totalAtual - totalAtualMesAnterior) / totalAtualMesAnterior) * 100
      : 0;

  const retornoAcum =
    totalAtualPrimeiroMes && totalAtualPrimeiroMes > 0
      ? ((totalAtual - totalAtualPrimeiroMes) / totalAtualPrimeiroMes) * 100
      : 0;

  return {
    retornoMes: arredondarPercentual(retornoMes),
    retornoAcum: arredondarPercentual(retornoAcum),
  };
}

export class ServicoHistoricoMensalPadrao implements ServicoHistoricoMensal {
  constructor(private readonly repositorio: RepositorioHistoricoMensal) {}

  listarPontos(usuarioId: string, limite = 24): Promise<PontoHistoricoMensal[]> {
    return this.repositorio.listarPontos(usuarioId, limite);
  }

  obterMes(usuarioId: string, anoMes: string): Promise<HistoricoMensalCompleto | null> {
    return this.repositorio.obterMes(usuarioId, anoMes);
  }

  async registrarFechamentoMensal(
    usuarioId: string,
    anoMes: string,
    payload: PayloadHistoricoMensal,
    origem: OrigemHistoricoMensal = "fechamento_mensal",
  ): Promise<PontoHistoricoMensal> {
    const [mesAnterior, primeiroMes] = await Promise.all([
      this.repositorio.obterMesAnterior(usuarioId, anoMes),
      this.repositorio.obterMesMaisAntigo(usuarioId),
    ]);

    const { retornoMes, retornoAcum } = calcularRetornosMensais(
      payload.patrimonioTotal,
      mesAnterior?.totalAtual ?? null,
      primeiroMes?.totalAtual ?? null,
    );

    const totalInvestido = payload.ativos.reduce(
      (acc, a) => acc + Number(a.totalInvestido ?? 0),
      0,
    );

    const dataFechamento = calcularUltimoDiaDoMes(anoMes);

    return this.repositorio.gravar(
      usuarioId,
      anoMes,
      dataFechamento,
      Number(totalInvestido.toFixed(2)),
      Number(payload.patrimonioTotal.toFixed(2)),
      retornoMes,
      retornoAcum,
      payload,
      origem,
    );
  }
}

/**
 * Retorna ISO 8601 do último dia do mês (ex: "2026-04" -> "2026-04-30T23:59:59Z").
 */
export function calcularUltimoDiaDoMes(anoMes: string): string {
  const [ano, mes] = anoMes.split("-").map(Number);
  if (!ano || !mes) {
    throw new Error(`anoMes inválido: ${anoMes}`);
  }
  const ultimoDia = new Date(Date.UTC(ano, mes, 0, 23, 59, 59));
  return ultimoDia.toISOString();
}

/**
 * Gera string "YYYY-MM" a partir de uma data ISO.
 */
export function extrairAnoMes(dataIso: string): string {
  const d = new Date(dataIso);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`data inválida: ${dataIso}`);
  }
  const ano = d.getUTCFullYear();
  const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}

/**
 * Incrementa "YYYY-MM" em 1 mês.
 */
export function proximoAnoMes(anoMes: string): string {
  const [ano, mes] = anoMes.split("-").map(Number);
  if (!ano || !mes) {
    throw new Error(`anoMes inválido: ${anoMes}`);
  }
  const d = new Date(Date.UTC(ano, mes, 1));
  return extrairAnoMes(d.toISOString());
}
