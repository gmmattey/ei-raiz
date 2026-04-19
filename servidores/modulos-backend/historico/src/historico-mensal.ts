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
    valorInvestimentos: number,
    totalAtual: number,
    rentabilidadeMesPct: number,
    rentabilidadeAcumPct: number,
    confiavel: boolean,
    payload: PayloadHistoricoMensal,
    origem: OrigemHistoricoMensal,
  ): Promise<PontoHistoricoMensal>;
}

const arredondarPercentual = (valor: number): number => Number(valor.toFixed(4));

/**
 * Rentabilidade mensal e acumulada calculadas EXCLUSIVAMENTE sobre o escopo de
 * investimentos (famílias A, B, C). Bens e poupança NÃO entram — senão uma
 * valorização imobiliária aparece como "rendimento" da carteira.
 *
 * Quando `aportesMes` é informado, aplica-se aproximação TWR (Time-Weighted
 * Return) de um período: o numerador desconta aportes líquidos do mês, isolando
 * ganho de mercado de dinheiro novo que entrou. Sem aportes, reduz à variação
 * simples mês-a-mês.
 *
 * Bases zeradas ou inválidas retornam 0 (não lança) para manter reconstrução
 * contínua em meses-buraco.
 */
export function calcularRetornosMensais(
  valorInvestimentosAtual: number,
  valorInvestimentosMesAnterior: number | null,
  valorInvestimentosPrimeiroMes: number | null,
  aportesMes: number = 0,
): { rentabilidadeMesPct: number; rentabilidadeAcumPct: number } {
  const rentabilidadeMesPct =
    valorInvestimentosMesAnterior && valorInvestimentosMesAnterior > 0
      ? ((valorInvestimentosAtual - valorInvestimentosMesAnterior - aportesMes) /
          valorInvestimentosMesAnterior) *
        100
      : 0;

  const rentabilidadeAcumPct =
    valorInvestimentosPrimeiroMes && valorInvestimentosPrimeiroMes > 0
      ? ((valorInvestimentosAtual - valorInvestimentosPrimeiroMes) /
          valorInvestimentosPrimeiroMes) *
        100
      : 0;

  return {
    rentabilidadeMesPct: arredondarPercentual(rentabilidadeMesPct),
    rentabilidadeAcumPct: arredondarPercentual(rentabilidadeAcumPct),
  };
}

const ANO_MES_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

const pontoValido = (p: PontoHistoricoMensal | null | undefined): p is PontoHistoricoMensal => {
  if (!p) return false;
  if (typeof p.anoMes !== "string" || !ANO_MES_REGEX.test(p.anoMes)) return false;
  const investido = Number(p.totalInvestido);
  const valorInv = Number(p.valorInvestimentos);
  if (!Number.isFinite(investido) || !Number.isFinite(valorInv)) return false;
  if (investido <= 0) return false;
  if (valorInv <= 0) return false;
  return true;
};

/**
 * Avalia se há histórico mensal real suficiente para compor o gráfico de
 * rentabilidade e, em caso positivo, devolve a série ordenada cronologicamente
 * com base 100 ancorada no primeiro ponto.
 *
 * A base 100 é ancorada em `valorInvestimentos / totalInvestido` (razão
 * rentabilidade do primeiro ponto) — bens e poupança NÃO contaminam a curva.
 *
 * Regras de suficiência:
 *  - pelo menos {@link MIN_PONTOS_RENTABILIDADE_MENSAL} pontos válidos
 *  - cada ponto precisa ter anoMes no formato YYYY-MM
 *  - totalInvestido > 0 e valorInvestimentos > 0
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
  const razaoBase = primeiro.valorInvestimentos / primeiro.totalInvestido;
  if (!Number.isFinite(razaoBase) || razaoBase <= 0) {
    return { available: false, points: [] };
  }

  const points: PontoRentabilidadeMensal[] = ordenados.map((p) => {
    const razao = p.valorInvestimentos / p.totalInvestido;
    const base100 = (razao / razaoBase) * 100;
    const returnPercent = base100 - 100;
    return {
      month: p.anoMes,
      valorInvestimentos: Number(p.valorInvestimentos.toFixed(2)),
      totalInvestido: Number(p.totalInvestido.toFixed(2)),
      base100: Number(base100.toFixed(4)),
      returnPercent: Number(returnPercent.toFixed(4)),
      confiavel: p.confiavel !== false,
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

    const { rentabilidadeMesPct, rentabilidadeAcumPct } = calcularRetornosMensais(
      payload.valorInvestimentos,
      mesAnterior?.valorInvestimentos ?? null,
      primeiroMes?.valorInvestimentos ?? null,
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
      Number(payload.valorInvestimentos.toFixed(2)),
      Number(payload.patrimonioTotal.toFixed(2)),
      rentabilidadeMesPct,
      rentabilidadeAcumPct,
      payload.confiavel !== false,
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
