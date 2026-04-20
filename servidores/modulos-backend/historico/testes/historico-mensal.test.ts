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

test("calcularRetornosMensais: mesmo totalInvestido (sem aporte) → rendimento puro", () => {
  // valorInv sobe 1000 → 1100 sem mudança de totalInvestido: rendimento = 10%
  const r = calcularRetornosMensais(1100, 1000, {
    valorInvestimentos: 1000,
    totalInvestido: 1000,
    rentabilidadeAcumPct: 0,
  });
  assert.equal(r.rentabilidadeMesPct, 10);
  assert.equal(r.rentabilidadeAcumPct, 10);
});

test("calcularRetornosMensais: sem mês anterior → 0 em ambos (primeiro ponto)", () => {
  assert.deepEqual(calcularRetornosMensais(1000, 1000, null), {
    rentabilidadeMesPct: 0,
    rentabilidadeAcumPct: 0,
  });
});

test("calcularRetornosMensais: mês anterior com bases zeradas retorna 0", () => {
  const r = calcularRetornosMensais(1000, 1000, {
    valorInvestimentos: 0,
    totalInvestido: 0,
    rentabilidadeAcumPct: 0,
  });
  assert.deepEqual(r, { rentabilidadeMesPct: 0, rentabilidadeAcumPct: 0 });
});

test("calcularRetornosMensais: Δ totalInvestido é tratado como aporte (TWR Dietz)", () => {
  // mês anterior: valorInv=1000, totalInv=1000. Atual: valorInv=1200, totalInv=1100 → aporte=100
  // ganho de mercado = (1200 - 1000 - 100) / 1000 = 10% (não 20%)
  const r = calcularRetornosMensais(1200, 1100, {
    valorInvestimentos: 1000,
    totalInvestido: 1000,
    rentabilidadeAcumPct: 0,
  });
  assert.equal(r.rentabilidadeMesPct, 10);
});

test("calcularRetornosMensais: acumulado é encadeado (TWR) a partir do acumAnterior", () => {
  // acumAnterior = 10%, mesAtual = 10% → acumNovo = 1.10 * 1.10 - 1 = 21%
  const r = calcularRetornosMensais(1210, 1000, {
    valorInvestimentos: 1100,
    totalInvestido: 1000,
    rentabilidadeAcumPct: 10,
  });
  assert.equal(r.rentabilidadeMesPct, 10);
  assert.equal(r.rentabilidadeAcumPct, 21);
});

test("calcularRetornosMensais: aportes proporcionais (valorInv e totalInv sobem juntos) → retorno 0", () => {
  // cenário real do bug: valorInv e totalInv sobem em paralelo (dinheiro novo, sem marcação).
  // Antes: (1200-1000)/1000 = 20% (ingênuo); agora: aporte=200, retorno = (1200-1000-200)/1000 = 0%.
  const r = calcularRetornosMensais(1200, 1200, {
    valorInvestimentos: 1000,
    totalInvestido: 1000,
    rentabilidadeAcumPct: 0,
  });
  assert.equal(r.rentabilidadeMesPct, 0);
  assert.equal(r.rentabilidadeAcumPct, 0);
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
    valorInvestimentos: number,
    totalAtual: number,
    rentabilidadeMesPct: number,
    rentabilidadeAcumPct: number,
    confiavel: boolean,
    payload: PayloadHistoricoMensal,
    origem: OrigemHistoricoMensal,
  ): Promise<PontoHistoricoMensal> {
    const ponto: PontoHistoricoMensal = {
      id: `hist_${usuarioId}_${anoMes}`,
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
    const existente = this.pontos.findIndex((p) => p.anoMes === anoMes);
    if (existente >= 0) {
      this.pontos[existente] = { ...ponto, payload };
    } else {
      this.pontos.push({ ...ponto, payload });
    }
    return ponto;
  }
}

const payloadFake = (
  valorInvestimentos: number,
  totalInvestido: number = valorInvestimentos,
): PayloadHistoricoMensal => ({
  ativos: [
    {
      id: "a1",
      ticker: "PETR4",
      nome: "Petrobras",
      categoria: "acao",
      valorAtual: valorInvestimentos,
      totalInvestido,
      retornoAcumulado: 0,
      participacao: 100,
      confiavel: true,
    },
  ],
  valorInvestimentos,
  patrimonioInvestimentos: valorInvestimentos,
  patrimonioBens: 0,
  patrimonioPoupanca: 0,
  patrimonioDividas: 0,
  patrimonioTotal: valorInvestimentos,
  distribuicaoPatrimonio: [
    { id: "investimentos", label: "Investimentos", valor: valorInvestimentos, percentual: 100 },
  ],
  confiavel: true,
});

test("ServicoHistoricoMensalPadrao: registra primeiro mês com retornos zerados", async () => {
  const repo = new RepoFakeHistoricoMensal();
  const servico = new ServicoHistoricoMensalPadrao(repo);

  const ponto = await servico.registrarFechamentoMensal("u1", "2026-01", payloadFake(1000));

  assert.equal(ponto.totalAtual, 1000);
  assert.equal(ponto.valorInvestimentos, 1000);
  assert.equal(ponto.rentabilidadeMesPct, 0);
  assert.equal(ponto.rentabilidadeAcumPct, 0);
  assert.equal(ponto.confiavel, true);
  assert.equal(ponto.origem, "fechamento_mensal");
});

test("ServicoHistoricoMensalPadrao: encadeia rentabilidade acumulada (TWR) ao longo de vários meses", async () => {
  const repo = new RepoFakeHistoricoMensal();
  const servico = new ServicoHistoricoMensalPadrao(repo);

  // Cenário: totalInvestido estável em 1000, só valorInv cresce (valorização pura).
  await servico.registrarFechamentoMensal("u1", "2026-01", payloadFake(1000, 1000));
  await servico.registrarFechamentoMensal("u1", "2026-02", payloadFake(1100, 1000));
  const ponto = await servico.registrarFechamentoMensal("u1", "2026-03", payloadFake(1210, 1000));

  assert.ok(Math.abs(ponto.rentabilidadeMesPct - 10) < 0.01); // (1210-1100)/1100
  assert.ok(Math.abs(ponto.rentabilidadeAcumPct - 21) < 0.01); // 1.10 * 1.10 - 1
});

test("ServicoHistoricoMensalPadrao: aporte proporcional não infla rentabilidade (bug do 3705%)", async () => {
  const repo = new RepoFakeHistoricoMensal();
  const servico = new ServicoHistoricoMensalPadrao(repo);

  // Reproduz o cenário real: totalInvestido e valorInvestimentos sobem em paralelo.
  // Antes da correção: acum = ((56675-1489)/1489)*100 = 3705% — totalmente enganoso.
  // Agora: aportes = Δ totalInvestido, retorno real = 0% em todos os meses.
  await servico.registrarFechamentoMensal("u1", "2026-01", payloadFake(1489, 1489));
  await servico.registrarFechamentoMensal("u1", "2026-02", payloadFake(3175, 3175));
  const ponto = await servico.registrarFechamentoMensal("u1", "2026-03", payloadFake(56675, 56675));

  assert.equal(ponto.rentabilidadeMesPct, 0);
  assert.equal(ponto.rentabilidadeAcumPct, 0);
});

// ─── avaliarRentabilidadeMensal ─────────────────────────────────────────────
const criarPonto = (
  anoMes: string,
  totalInvestido: number,
  valorInvestimentos: number,
  overrides: Partial<PontoHistoricoMensal> = {},
): PontoHistoricoMensal => ({
  id: `p_${anoMes}`,
  usuarioId: "u1",
  anoMes,
  dataFechamento: `${anoMes}-28T23:59:59Z`,
  totalInvestido,
  valorInvestimentos,
  totalAtual: valorInvestimentos,
  rentabilidadeMesPct: 0,
  rentabilidadeAcumPct: 0,
  confiavel: true,
  origem: "fechamento_mensal",
  ...overrides,
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
  assert.equal(r.points[0]!.month, "2026-01");
  assert.equal(r.points[0]!.base100, 100);
  assert.equal(r.points[0]!.returnPercent, 0);
  assert.equal(r.points[1]!.month, "2026-02");
  assert.equal(r.points[1]!.base100, 105);
  assert.equal(r.points[1]!.returnPercent, 5);
});

test("avaliarRentabilidadeMensal: base 100 ancora no primeiro mês, mesmo com rentabilidade inicial != 0", () => {
  // mês 1: 1000 investido, 1100 valorInvestimentos (razão 1.10)
  // mês 2: 1000 investido, 1210 valorInvestimentos (razão 1.21)
  // base100[0] = 100; base100[1] = (1.21 / 1.10) * 100 = 110
  const r = avaliarRentabilidadeMensal([
    criarPonto("2026-01", 1000, 1100),
    criarPonto("2026-02", 1000, 1210),
  ]);
  assert.equal(r.available, true);
  assert.equal(r.points[0]!.base100, 100);
  assert.ok(Math.abs(r.points[1]!.base100 - 110) < 0.001);
  assert.ok(Math.abs(r.points[1]!.returnPercent - 10) < 0.001);
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
  const antigo = criarPonto("2026-01", 1000, 1000, { dataFechamento: "2026-01-10T00:00:00Z" });
  const novo = criarPonto("2026-01", 1000, 1080, { dataFechamento: "2026-01-31T23:59:59Z" });
  const r = avaliarRentabilidadeMensal([antigo, novo, criarPonto("2026-02", 1000, 1100)]);
  assert.equal(r.available, true);
  assert.equal(r.points.length, 2);
  assert.equal(r.points[0]!.valorInvestimentos, 1080);
});

test("avaliarRentabilidadeMensal: pontos com totalInvestido=0 são descartados", () => {
  // apenas 1 ponto válido após filtro -> indisponível
  const r = avaliarRentabilidadeMensal([
    criarPonto("2026-01", 0, 0),
    criarPonto("2026-02", 1000, 1050),
  ]);
  assert.equal(r.available, false);
});

test("avaliarRentabilidadeMensal: pontos com valorInvestimentos=0 são descartados", () => {
  // bens/poupança não devem segurar mês sem investimentos — descarta ponto
  const r = avaliarRentabilidadeMensal([
    criarPonto("2026-01", 1000, 0),
    criarPonto("2026-02", 1000, 1050),
    criarPonto("2026-03", 1000, 1100),
  ]);
  assert.equal(r.available, true);
  assert.deepEqual(r.points.map((p) => p.month), ["2026-02", "2026-03"]);
});

test("avaliarRentabilidadeMensal: valores NaN ou anoMes inválido são descartados", () => {
  const r = avaliarRentabilidadeMensal([
    criarPonto("2026-01", 1000, 1000, { valorInvestimentos: Number.NaN }),
    criarPonto("2026-13", 1000, 1050), // mês inválido
    criarPonto("2026-02", 1000, 1050),
    criarPonto("2026-03", 1000, 1100),
  ]);
  assert.equal(r.available, true);
  assert.deepEqual(r.points.map((p) => p.month), ["2026-02", "2026-03"]);
});
