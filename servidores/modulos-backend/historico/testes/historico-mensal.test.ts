import test from "node:test";
import assert from "node:assert/strict";
import {
  avaliarRentabilidadeMensal,
  calcularRetornosMensais,
  calcularUltimoDiaDoMes,
  extrairAnoMes,
  proximoAnoMes,
  ServicoHistoricoMensalPadrao,
  type RepositorioHistoricoMensal,
} from "../src/historico-mensal";
import type {
  HistoricoMensalCompleto,
  OrigemHistoricoMensal,
  PayloadHistoricoMensal,
  PontoHistoricoMensal,
} from "@ei/contratos";

test("extrairAnoMes formata YYYY-MM em UTC", () => {
  assert.equal(extrairAnoMes("2026-04-15T10:00:00Z"), "2026-04");
  assert.equal(extrairAnoMes("2026-12-31T23:59:59Z"), "2026-12");
  assert.equal(extrairAnoMes("2026-01-01T00:00:00Z"), "2026-01");
});

test("proximoAnoMes incrementa corretamente, inclusive virada de ano", () => {
  assert.equal(proximoAnoMes("2026-04"), "2026-05");
  assert.equal(proximoAnoMes("2026-12"), "2027-01");
  assert.equal(proximoAnoMes("2026-02"), "2026-03");
});

test("calcularUltimoDiaDoMes retorna ISO do último dia", () => {
  assert.ok(calcularUltimoDiaDoMes("2026-02").startsWith("2026-02-28"));
  assert.ok(calcularUltimoDiaDoMes("2024-02").startsWith("2024-02-29")); // bissexto
  assert.ok(calcularUltimoDiaDoMes("2026-04").startsWith("2026-04-30"));
});

test("calcularRetornosMensais: retorno do mês e acumulado", () => {
  const r = calcularRetornosMensais(1100, 1000, 800);
  assert.equal(r.retornoMes, 10);
  assert.equal(r.retornoAcum, 37.5);
});

test("calcularRetornosMensais: bases nulas ou zeradas retornam 0", () => {
  assert.deepEqual(calcularRetornosMensais(1000, null, null), { retornoMes: 0, retornoAcum: 0 });
  assert.deepEqual(calcularRetornosMensais(1000, 0, 0), { retornoMes: 0, retornoAcum: 0 });
});

class RepoFakeHistoricoMensal implements RepositorioHistoricoMensal {
  public pontos: Array<PontoHistoricoMensal & { payload: PayloadHistoricoMensal }> = [];

  async listarPontos(_u: string, limite: number): Promise<PontoHistoricoMensal[]> {
    return this.pontos
      .map(({ payload: _p, ...resto }) => resto)
      .sort((a, b) => b.anoMes.localeCompare(a.anoMes))
      .slice(0, limite);
  }

  async obterMes(_u: string, anoMes: string): Promise<HistoricoMensalCompleto | null> {
    const found = this.pontos.find((p) => p.anoMes === anoMes);
    return found ?? null;
  }

  async obterMesAnterior(_u: string, anoMes: string): Promise<PontoHistoricoMensal | null> {
    const anteriores = this.pontos
      .filter((p) => p.anoMes < anoMes)
      .sort((a, b) => b.anoMes.localeCompare(a.anoMes));
    return anteriores[0] ?? null;
  }

  async obterMesMaisAntigo(_u: string): Promise<PontoHistoricoMensal | null> {
    const ordenados = [...this.pontos].sort((a, b) => a.anoMes.localeCompare(b.anoMes));
    return ordenados[0] ?? null;
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
    const ponto: PontoHistoricoMensal = {
      id: `hist_${usuarioId}_${anoMes}`,
      usuarioId,
      anoMes,
      dataFechamento,
      totalInvestido,
      totalAtual,
      retornoMes,
      retornoAcum,
      origem,
    };
    const existente = this.pontos.findIndex((p) => p.anoMes === anoMes);
    if (existente >= 0) {
      this.pontos[existente] = { ...ponto, payload };
    } else {
      this.pontos.push({ ...ponto, payload });
    }
    return ponto;
  }
}

const payloadFake = (patrimonio: number): PayloadHistoricoMensal => ({
  ativos: [
    {
      id: "a1",
      ticker: "PETR4",
      nome: "Petrobras",
      categoria: "acao",
      valorAtual: patrimonio,
      totalInvestido: patrimonio,
      retornoAcumulado: 0,
      participacao: 100,
    },
  ],
  patrimonioInvestimentos: patrimonio,
  patrimonioBens: 0,
  patrimonioPoupanca: 0,
  patrimonioTotal: patrimonio,
  distribuicaoPatrimonio: [{ id: "investimentos", label: "Investimentos", valor: patrimonio, percentual: 100 }],
});

test("ServicoHistoricoMensalPadrao: registra primeiro mês com retornos zerados", async () => {
  const repo = new RepoFakeHistoricoMensal();
  const servico = new ServicoHistoricoMensalPadrao(repo);

  const ponto = await servico.registrarFechamentoMensal("u1", "2026-01", payloadFake(1000));

  assert.equal(ponto.totalAtual, 1000);
  assert.equal(ponto.retornoMes, 0);
  assert.equal(ponto.retornoAcum, 0);
  assert.equal(ponto.origem, "fechamento_mensal");
});

test("ServicoHistoricoMensalPadrao: calcula retorno mensal e acumulado vs primeiro mês", async () => {
  const repo = new RepoFakeHistoricoMensal();
  const servico = new ServicoHistoricoMensalPadrao(repo);

  await servico.registrarFechamentoMensal("u1", "2026-01", payloadFake(1000));
  await servico.registrarFechamentoMensal("u1", "2026-02", payloadFake(1100));
  const ponto = await servico.registrarFechamentoMensal("u1", "2026-03", payloadFake(1200));

  assert.ok(Math.abs(ponto.retornoMes - 9.0909) < 0.01); // (1200-1100)/1100
  assert.equal(ponto.retornoAcum, 20); // (1200-1000)/1000
});

// ─── avaliarRentabilidadeMensal ─────────────────────────────────────────────
const criarPonto = (
  anoMes: string,
  totalInvestido: number,
  totalAtual: number,
): PontoHistoricoMensal => ({
  id: `p_${anoMes}`,
  usuarioId: "u1",
  anoMes,
  dataFechamento: `${anoMes}-28T23:59:59Z`,
  totalInvestido,
  totalAtual,
  retornoMes: 0,
  retornoAcum: 0,
  origem: "fechamento_mensal",
});

test("avaliarRentabilidadeMensal: zero pontos -> indisponível", () => {
  const r = avaliarRentabilidadeMensal([]);
  assert.equal(r.available, false);
  assert.equal(r.points.length, 0);
});

test("avaliarRentabilidadeMensal: um ponto único -> indisponível", () => {
  const r = avaliarRentabilidadeMensal([criarPonto("2026-01", 1000, 1050)]);
  assert.equal(r.available, false);
  assert.equal(r.points.length, 0);
});

test("avaliarRentabilidadeMensal: 2 pontos válidos -> disponível com base100 e returnPercent", () => {
  const r = avaliarRentabilidadeMensal([
    criarPonto("2026-01", 1000, 1000),
    criarPonto("2026-02", 1000, 1050),
  ]);
  assert.equal(r.available, true);
  assert.equal(r.points.length, 2);
  assert.equal(r.points[0].month, "2026-01");
  assert.equal(r.points[0].base100, 100);
  assert.equal(r.points[0].returnPercent, 0);
  assert.equal(r.points[1].month, "2026-02");
  assert.equal(r.points[1].base100, 105);
  assert.equal(r.points[1].returnPercent, 5);
});

test("avaliarRentabilidadeMensal: base 100 ancora no primeiro mês, mesmo com rentabilidade inicial != 0", () => {
  // mês 1: 1000 -> 1100 (retorno 10%); mês 2: 1000 investido, 1210 atual (retorno 21%)
  // base100[0] = 100, base100[1] = (1.21 / 1.10) * 100 = 110
  const r = avaliarRentabilidadeMensal([
    criarPonto("2026-01", 1000, 1100),
    criarPonto("2026-02", 1000, 1210),
  ]);
  assert.equal(r.available, true);
  assert.equal(r.points[0].base100, 100);
  assert.ok(Math.abs(r.points[1].base100 - 110) < 0.001);
  assert.ok(Math.abs(r.points[1].returnPercent - 10) < 0.001);
});

test("avaliarRentabilidadeMensal: pontos fora de ordem são reordenados cronologicamente", () => {
  const r = avaliarRentabilidadeMensal([
    criarPonto("2026-03", 1000, 1100),
    criarPonto("2026-01", 1000, 1000),
    criarPonto("2026-02", 1000, 1050),
  ]);
  assert.equal(r.available, true);
  assert.deepEqual(r.points.map((p) => p.month), ["2026-01", "2026-02", "2026-03"]);
});

test("avaliarRentabilidadeMensal: pontos duplicados por anoMes são deduplicados (mantém mais recente)", () => {
  const antigo: PontoHistoricoMensal = { ...criarPonto("2026-01", 1000, 1000), dataFechamento: "2026-01-10T00:00:00Z" };
  const novo: PontoHistoricoMensal = { ...criarPonto("2026-01", 1000, 1080), dataFechamento: "2026-01-31T23:59:59Z" };
  const r = avaliarRentabilidadeMensal([antigo, novo, criarPonto("2026-02", 1000, 1100)]);
  assert.equal(r.available, true);
  assert.equal(r.points.length, 2);
  assert.equal(r.points[0].totalAtual, 1080);
});

test("avaliarRentabilidadeMensal: pontos com totalInvestido=0 são descartados", () => {
  // apenas 1 ponto válido após filtro -> indisponível
  const r = avaliarRentabilidadeMensal([
    criarPonto("2026-01", 0, 0),
    criarPonto("2026-02", 1000, 1050),
  ]);
  assert.equal(r.available, false);
});

test("avaliarRentabilidadeMensal: valores NaN ou anoMes inválido são descartados", () => {
  const r = avaliarRentabilidadeMensal([
    { ...criarPonto("2026-01", 1000, 1000), totalAtual: Number.NaN },
    { ...criarPonto("2026-13", 1000, 1050) }, // mês inválido
    criarPonto("2026-02", 1000, 1050),
    criarPonto("2026-03", 1000, 1100),
  ]);
  assert.equal(r.available, true);
  assert.deepEqual(r.points.map((p) => p.month), ["2026-02", "2026-03"]);
});

test("avaliarRentabilidadeMensal: razão base inválida no primeiro ponto -> indisponível", () => {
  // totalInvestido válido mas totalAtual = 0 faz razão = 0 -> não é ancorável
  const r = avaliarRentabilidadeMensal([
    criarPonto("2026-01", 1000, 0),
    criarPonto("2026-02", 1000, 1050),
  ]);
  assert.equal(r.available, false);
});
