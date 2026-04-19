import assert from "node:assert/strict";
import test from "node:test";
import type { PerfilFinanceiro, ScoreCarteira } from "@ei/contratos";
import { type MetricasCarteira, type RepositorioInsights } from "../src/repositorio";
import { ServicoInsightsPadrao } from "../src/servico";

const metricasDefault = (patrimonioTotal: number): MetricasCarteira => ({
  patrimonioTotal,
  patrimonioBruto: patrimonioTotal,
  patrimonioLiquido: patrimonioTotal,
  ativosLiquidos: patrimonioTotal,
  ativosIliquidos: 0,
  passivoTotal: 0,
  quantidadeAtivos: 0,
  quantidadeCategorias: 0,
  maiorParticipacao: 0,
  top3Participacao: 0,
  percentualRendaVariavel: 0,
  percentualRendaFixa: 0,
  percentualDefensivo: 0,
  percentualInternacional: 0,
  evolucaoPatrimonio6m: 0,
  evolucaoPatrimonio12m: 0,
  idadeCarteiraMeses: 0,
  mesesComAporteUltimos6m: 0,
  percentualLiquidezImediata: 0,
  percentualDinheiroParado: 0,
  percentualIliquido: 0,
  percentualDividaSobrePatrimonio: 0,
  percentualEmImoveis: 0,
  percentualEmVeiculos: 0,
  percentualEmInvestimentos: 100,
  percentualEmCaixa: 0,
  percentualEmOutros: 0,
});

class RepositorioFake implements RepositorioInsights {
  public ultimoSnapshot: { score: number; criadoEm: string } | null = null;
  public salvos: number = 0;

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
    return this.ultimoSnapshot;
  }

  async obterImpactoDecisoesRecentes(): Promise<{ quantidade: number; deltaMedio: number; deltaTotal: number }> {
    return { quantidade: 0, deltaMedio: 0, deltaTotal: 0 };
  }

  async salvarSnapshotScore(
    _usuarioId: string,
    payload: {
      score: number;
      faixa: ScoreCarteira["faixa"];
      riscoPrincipal: string;
      acaoPrioritaria: string;
      pilares: ScoreCarteira["pilares"];
      fatoresPositivos: Array<{ label: string; impacto: number }>;
      fatoresNegativos: Array<{ label: string; impacto: number }>;
    },
  ): Promise<void> {
    this.salvos += 1;
    this.ultimoSnapshot = { score: payload.score, criadoEm: new Date().toISOString() };
  }
}

test("deve calcular score único com explicabilidade e snapshot", async () => {
  const repo = new RepositorioFake(
    {
      id: "perf_1",
      usuarioId: "usr_1",
      rendaMensal: 12000,
      aporteMensal: 1500,
      horizonte: "longo prazo",
      perfilRisco: "moderado",
      objetivo: "crescimento",
      maturidade: 3,
    },
    {
      ...metricasDefault(100000),
      quantidadeAtivos: 8,
      quantidadeCategorias: 3,
      maiorParticipacao: 20,
      top3Participacao: 50,
      percentualRendaVariavel: 45,
      percentualRendaFixa: 30,
      percentualDefensivo: 35,
      evolucaoPatrimonio6m: 12,
      evolucaoPatrimonio12m: 22,
      idadeCarteiraMeses: 12,
      mesesComAporteUltimos6m: 6,
      percentualLiquidezImediata: 20,
      percentualDinheiroParado: 8,
      percentualIliquido: 15,
      percentualDividaSobrePatrimonio: 5,
    },
  );

  const servico = new ServicoInsightsPadrao(repo);
  const score = await servico.calcularScore("usr_1");

  assert.ok(score.score >= 0 && score.score <= 100);
  assert.ok(score.faixa === "bom" || score.faixa === "muito_bom");
  assert.ok(score.fatoresPositivos.length > 0);
  assert.ok(score.riscoPrincipal.length > 0);
  assert.ok(score.acaoPrioritaria.length > 0);
  assert.equal(repo.salvos, 1);
});

test("deve calcular variação contra snapshot anterior", async () => {
  const repo = new RepositorioFake(
    {
      id: "perf_2",
      usuarioId: "usr_2",
      rendaMensal: 4000,
      aporteMensal: 500,
      horizonte: "curto",
      perfilRisco: "conservador",
      objetivo: "preservacao",
      maturidade: 1,
    },
    {
      ...metricasDefault(20000),
      quantidadeAtivos: 2,
      quantidadeCategorias: 1,
      maiorParticipacao: 65,
      top3Participacao: 100,
      percentualRendaVariavel: 70,
      percentualRendaFixa: 5,
      evolucaoPatrimonio6m: -3,
      evolucaoPatrimonio12m: 1,
      idadeCarteiraMeses: 6,
      mesesComAporteUltimos6m: 2,
      percentualLiquidezImediata: 3,
      percentualDinheiroParado: 30,
      percentualIliquido: 65,
      percentualDividaSobrePatrimonio: 40,
    },
  );
  repo.ultimoSnapshot = { score: 70, criadoEm: "2026-04-01T00:00:00.000Z" };

  const servico = new ServicoInsightsPadrao(repo);
  const score = await servico.calcularScore("usr_2");

  assert.equal(typeof score.variacao, "number");
  assert.equal(score.scoreAnterior, 70);
  assert.ok(score.score < 70);
});

test("fatores refletem fonte real de aporte quando disponível", async () => {
  const metricasReais = {
    ...metricasDefault(40000),
    quantidadeAtivos: 4,
    quantidadeCategorias: 2,
    maiorParticipacao: 30,
    top3Participacao: 65,
    percentualRendaVariavel: 30,
    percentualRendaFixa: 40,
    percentualDefensivo: 30,
    evolucaoPatrimonio6m: 4,
    evolucaoPatrimonio12m: 8,
    idadeCarteiraMeses: 10,
    mesesComAporteUltimos6m: 1,
    fonteMesesComAporte: "real" as const,
    percentualLiquidezImediata: 12,
    percentualDinheiroParado: 18,
    percentualIliquido: 20,
    percentualDividaSobrePatrimonio: 10,
  };
  const repoReal = new RepositorioFake(
    {
      id: "perf_r",
      usuarioId: "usr_r",
      rendaMensal: 5000,
      aporteMensal: 800,
      horizonte: "longo prazo",
      perfilRisco: "moderado",
      objetivo: "crescimento",
      maturidade: 2,
    },
    metricasReais,
  );
  const resumoReal = await new ServicoInsightsPadrao(repoReal).gerarResumo("usr_r");
  const labelsReais = resumoReal.penalidadesAplicadas.map((p) => p.descricao).join(" | ");
  assert.ok(labelsReais.includes("Poucos aportes registrados"), `esperava linguagem transacional, veio: ${labelsReais}`);

  const repoIndireto = new RepositorioFake(
    {
      id: "perf_i",
      usuarioId: "usr_i",
      rendaMensal: 5000,
      aporteMensal: 800,
      horizonte: "longo prazo",
      perfilRisco: "moderado",
      objetivo: "crescimento",
      maturidade: 2,
    },
    { ...metricasReais, fonteMesesComAporte: "indireto" as const },
  );
  const resumoIndireto = await new ServicoInsightsPadrao(repoIndireto).gerarResumo("usr_i");
  const labelsIndiretos = resumoIndireto.penalidadesAplicadas.map((p) => p.descricao).join(" | ");
  assert.ok(labelsIndiretos.includes("crescimento patrimonial"), `esperava linguagem indireta, veio: ${labelsIndiretos}`);
});
