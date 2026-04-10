import assert from "node:assert/strict";
import test from "node:test";
import type { PerfilFinanceiro, ScoreCarteira } from "@ei/contratos";
import { type MetricasCarteira, type RepositorioInsights } from "../src/repositorio";
import { ServicoInsightsPadrao } from "../src/servico";

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

  async salvarSnapshotScore(
    _usuarioId: string,
    payload: {
      score: number;
      faixa: ScoreCarteira["faixa"];
      riscoPrincipal: string;
      acaoPrioritaria: string;
      blocos: ScoreCarteira["blocos"];
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
      patrimonioTotal: 100000,
      quantidadeAtivos: 8,
      quantidadeCategorias: 3,
      maiorParticipacao: 20,
      top3Participacao: 50,
      percentualRendaVariavel: 45,
      percentualRendaFixa: 30,
      percentualDefensivo: 35,
      percentualInternacional: 0,
      evolucaoPatrimonio6m: 12,
      evolucaoPatrimonio12m: 22,
      idadeCarteiraMeses: 12,
      mesesComAporteUltimos6m: 6,
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
      patrimonioTotal: 20000,
      quantidadeAtivos: 2,
      quantidadeCategorias: 1,
      maiorParticipacao: 65,
      top3Participacao: 100,
      percentualRendaVariavel: 70,
      percentualRendaFixa: 5,
      percentualDefensivo: 0,
      percentualInternacional: 0,
      evolucaoPatrimonio6m: -3,
      evolucaoPatrimonio12m: 1,
      idadeCarteiraMeses: 6,
      mesesComAporteUltimos6m: 2,
    },
  );
  repo.ultimoSnapshot = { score: 70, criadoEm: "2026-04-01T00:00:00.000Z" };

  const servico = new ServicoInsightsPadrao(repo);
  const score = await servico.calcularScore("usr_2");

  assert.equal(typeof score.variacao, "number");
  assert.equal(score.scoreAnterior, 70);
  assert.ok(score.score < 70);
});
