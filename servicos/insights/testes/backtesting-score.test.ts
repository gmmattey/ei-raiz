import assert from "node:assert/strict";
import test from "node:test";
import type { PerfilFinanceiro, ScoreCarteira } from "@ei/contratos";
import { type MetricasCarteira, type RepositorioInsights } from "../src/repositorio";
import { ServicoInsightsPadrao } from "../src/servico";

class RepoBacktest implements RepositorioInsights {
  constructor(
    private readonly perfil: PerfilFinanceiro | null,
    private readonly metricas: MetricasCarteira,
  ) {}

  async obterPerfil(): Promise<PerfilFinanceiro | null> {
    return this.perfil;
  }

  async obterMetricasCarteira(): Promise<MetricasCarteira> {
    return this.metricas;
  }

  async obterConfiguracaoScore(): Promise<Record<string, unknown> | null> {
    return null;
  }

  async obterUltimoSnapshotScore(): Promise<{ score: number; criadoEm: string } | null> {
    return null;
  }

  async salvarSnapshotScore(): Promise<void> {}
}

const basePerfil: PerfilFinanceiro = {
  id: "perf_base",
  usuarioId: "usr_base",
  rendaMensal: 8000,
  aporteMensal: 1200,
  horizonte: "longo prazo",
  perfilRisco: "moderado",
  objetivo: "crescimento",
  maturidade: 3,
};

function criarServico(perfil: PerfilFinanceiro, metricas: MetricasCarteira): ServicoInsightsPadrao {
  return new ServicoInsightsPadrao(new RepoBacktest(perfil, metricas));
}

test("backtesting: cenários críticos, médios e bons", async () => {
  const critico = await criarServico(basePerfil, {
    patrimonioTotal: 15000,
    quantidadeAtivos: 2,
    quantidadeCategorias: 1,
    maiorParticipacao: 70,
    top3Participacao: 100,
    percentualRendaVariavel: 80,
    percentualRendaFixa: 5,
    percentualDefensivo: 0,
    percentualInternacional: 0,
    evolucaoPatrimonio6m: -10,
    evolucaoPatrimonio12m: -5,
    idadeCarteiraMeses: 6,
    mesesComAporteUltimos6m: 1,
  }).calcularScore("usr_critico");

  const regular = await criarServico(basePerfil, {
    patrimonioTotal: 50000,
    quantidadeAtivos: 5,
    quantidadeCategorias: 2,
    maiorParticipacao: 35,
    top3Participacao: 70,
    percentualRendaVariavel: 55,
    percentualRendaFixa: 20,
    percentualDefensivo: 20,
    percentualInternacional: 0,
    evolucaoPatrimonio6m: 3,
    evolucaoPatrimonio12m: 7,
    idadeCarteiraMeses: 10,
    mesesComAporteUltimos6m: 4,
  }).calcularScore("usr_regular");

  const bom = await criarServico(basePerfil, {
    patrimonioTotal: 120000,
    quantidadeAtivos: 9,
    quantidadeCategorias: 4,
    maiorParticipacao: 18,
    top3Participacao: 48,
    percentualRendaVariavel: 45,
    percentualRendaFixa: 30,
    percentualDefensivo: 35,
    percentualInternacional: 8,
    evolucaoPatrimonio6m: 12,
    evolucaoPatrimonio12m: 22,
    idadeCarteiraMeses: 12,
    mesesComAporteUltimos6m: 6,
  }).calcularScore("usr_bom");

  assert.ok(critico.score < regular.score);
  assert.ok(regular.score < bom.score);
  assert.ok(["critico", "fragil"].includes(critico.faixa));
  assert.ok(["regular", "bom", "muito_bom"].includes(regular.faixa));
  assert.ok(["bom", "muito_bom"].includes(bom.faixa));
});

test("sensibilidade: aumento de concentração reduz score de forma coerente", async () => {
  const perfil = { ...basePerfil };
  const baseMetricas: MetricasCarteira = {
    patrimonioTotal: 80000,
    quantidadeAtivos: 7,
    quantidadeCategorias: 3,
    maiorParticipacao: 20,
    top3Participacao: 50,
    percentualRendaVariavel: 50,
    percentualRendaFixa: 25,
    percentualDefensivo: 25,
    percentualInternacional: 0,
    evolucaoPatrimonio6m: 8,
    evolucaoPatrimonio12m: 15,
    idadeCarteiraMeses: 12,
    mesesComAporteUltimos6m: 5,
  };

  const baixo = await criarServico(perfil, baseMetricas).calcularScore("usr_sens_1");
  const medio = await criarServico(perfil, { ...baseMetricas, maiorParticipacao: 32, top3Participacao: 62 }).calcularScore("usr_sens_2");
  const alto = await criarServico(perfil, { ...baseMetricas, maiorParticipacao: 48, top3Participacao: 80 }).calcularScore("usr_sens_3");

  assert.ok(baixo.score > alto.score);
  assert.ok(alto.riscoPrincipal === "concentracao_renda_variavel");
  assert.ok((baixo.score - alto.score) >= 8);
});
