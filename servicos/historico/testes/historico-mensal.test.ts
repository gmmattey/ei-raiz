import test from "node:test";
import assert from "node:assert/strict";
import {
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
