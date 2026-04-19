import type {
  HistoricoMensalCompleto,
  OrigemHistoricoMensal,
  PayloadHistoricoMensal,
  PontoHistoricoMensal,
  PontoRentabilidadeMensal,
  RentabilidadeMensal,
  ServicoHistoricoMensal,
} from "@ei/contratos";
import { MIN_PONTOS_RENTABILIDADE_MENSAL } from "@ei/contratos";

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

const ANO_MES_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

const pontoValido = (p: PontoHistoricoMensal | null | undefined): p is PontoHistoricoMensal => {
  if (!p) return false;
  if (typeof p.anoMes !== "string" || !ANO_MES_REGEX.test(p.anoMes)) return false;
  const investido = Number(p.totalInvestido);
  const atual = Number(p.totalAtual);
  if (!Number.isFinite(investido) || !Number.isFinite(atual)) return false;
  if (investido <= 0) return false;
  return true;
};

/**
 * Avalia se há histórico mensal real suficiente para compor o gráfico de
 * rentabilidade e, em caso positivo, devolve a série ordenada cronologicamente
 * com base 100 ancorada no primeiro ponto.
 *
 * Regras de suficiência:
 *  - pelo menos {@link MIN_PONTOS_RENTABILIDADE_MENSAL} pontos válidos
 *  - cada ponto precisa ter anoMes no formato YYYY-MM
 *  - totalInvestido > 0 e totalAtual finito (sem NaN)
 *  - duplicatas por mês são deduplicadas (mantém o mais recente por dataFechamento)
 *
 * Se não atender, retorna `{ available: false, points: [] }` — o frontend
 * deve ocultar o card por completo.
 */
export function avaliarRentabilidadeMensal(
  pontos: ReadonlyArray<PontoHistoricoMensal>,
): RentabilidadeMensal {
  const porMes = new Map<string, PontoHistoricoMensal>();
  for (const p of pontos) {
    if (!pontoValido(p)) continue;
    const existente = porMes.get(p.anoMes);
    if (!existente || (p.dataFechamento ?? "") > (existente.dataFechamento ?? "")) {
      porMes.set(p.anoMes, p);
    }
  }

  const ordenados = Array.from(porMes.values()).sort((a, b) =>
    a.anoMes.localeCompare(b.anoMes),
  );

  if (ordenados.length < MIN_PONTOS_RENTABILIDADE_MENSAL) {
    return { available: false, points: [] };
  }

  const primeiro = ordenados[0];
  const razaoBase = primeiro.totalAtual / primeiro.totalInvestido;
  if (!Number.isFinite(razaoBase) || razaoBase <= 0) {
    return { available: false, points: [] };
  }

  const points: PontoRentabilidadeMensal[] = ordenados.map((p) => {
    const razao = p.totalAtual / p.totalInvestido;
    const base100 = (razao / razaoBase) * 100;
    const returnPercent = base100 - 100;
    return {
      month: p.anoMes,
      totalInvestido: Number(p.totalInvestido.toFixed(2)),
      totalAtual: Number(p.totalAtual.toFixed(2)),
      base100: Number(base100.toFixed(4)),
      returnPercent: Number(returnPercent.toFixed(4)),
    };
  });

  return { available: true, points };
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
