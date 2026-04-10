import type { PerfilFinanceiro, ScoreCarteira } from "@ei/contratos";

export type MetricasCarteira = {
  patrimonioTotal: number;
  quantidadeAtivos: number;
  quantidadeCategorias: number;
  maiorParticipacao: number;
  top3Participacao: number;
  percentualRendaVariavel: number;
  percentualRendaFixa: number;
  percentualDefensivo: number;
  percentualInternacional: number;
  evolucaoPatrimonio6m: number;
  evolucaoPatrimonio12m: number;
  idadeCarteiraMeses: number;
  mesesComAporteUltimos6m: number;
};

type SnapshotScorePersistido = {
  score: number;
  criadoEm: string;
};

type BlocosScore = ScoreCarteira["blocos"];
type Fator = { label: string; impacto: number };

export interface RepositorioInsights {
  obterPerfil(usuarioId: string): Promise<PerfilFinanceiro | null>;
  obterMetricasCarteira(usuarioId: string): Promise<MetricasCarteira>;
  obterConfiguracaoScore(): Promise<Record<string, unknown> | null>;
  obterUltimoSnapshotScore(usuarioId: string): Promise<SnapshotScorePersistido | null>;
  salvarSnapshotScore(
    usuarioId: string,
    payload: {
      score: number;
      faixa: ScoreCarteira["faixa"];
      riscoPrincipal: string;
      acaoPrioritaria: string;
      blocos: BlocosScore;
      fatoresPositivos: Fator[];
      fatoresNegativos: Fator[];
    },
  ): Promise<void>;
}

export class RepositorioInsightsD1 implements RepositorioInsights {
  constructor(private readonly db: D1Database) {}

  async obterPerfil(usuarioId: string): Promise<PerfilFinanceiro | null> {
    const row = await this.db
      .prepare(
        "SELECT id, usuario_id, renda_mensal, aporte_mensal, horizonte, perfil_risco, objetivo, maturidade FROM perfil_financeiro WHERE usuario_id = ?",
      )
      .bind(usuarioId)
      .first<{
        id: string;
        usuario_id: string;
        renda_mensal: number;
        aporte_mensal: number;
        horizonte: string;
        perfil_risco: string;
        objetivo: string;
        maturidade: number;
      }>();

    if (!row) return null;
    return {
      id: row.id,
      usuarioId: row.usuario_id,
      rendaMensal: row.renda_mensal ?? 0,
      aporteMensal: row.aporte_mensal ?? 0,
      horizonte: row.horizonte ?? "",
      perfilRisco: row.perfil_risco ?? "",
      objetivo: row.objetivo ?? "",
      maturidade: row.maturidade ?? 1,
    };
  }

  async obterMetricasCarteira(usuarioId: string): Promise<MetricasCarteira> {
    const ativos = await this.db
      .prepare(
        "SELECT categoria, valor_atual, participacao FROM ativos WHERE usuario_id = ? ORDER BY valor_atual DESC",
      )
      .bind(usuarioId)
      .all<{ categoria: string; valor_atual: number; participacao: number }>();

    const linhas = ativos.results ?? [];
    const patrimonioTotal = linhas.reduce((acc, item) => acc + (item.valor_atual ?? 0), 0);
    const quantidadeAtivos = linhas.length;
    const categorias = new Set(linhas.map((item) => item.categoria));
    const quantidadeCategorias = categorias.size;
    const maiorParticipacao = linhas.reduce((max, item) => Math.max(max, item.participacao ?? 0), 0);
    const top3Participacao = linhas.slice(0, 3).reduce((acc, item) => acc + (item.participacao ?? 0), 0);

    const valorRendaVariavel = linhas
      .filter((item) => item.categoria === "acao")
      .reduce((acc, item) => acc + (item.valor_atual ?? 0), 0);
    const valorDefensivo = linhas
      .filter((item) => item.categoria === "renda_fixa" || item.categoria === "previdencia")
      .reduce((acc, item) => acc + (item.valor_atual ?? 0), 0);
    const valorRendaFixa = linhas
      .filter((item) => item.categoria === "renda_fixa")
      .reduce((acc, item) => acc + (item.valor_atual ?? 0), 0);

    const snapshots = await this.db
      .prepare(
        "SELECT data, valor_total FROM snapshots_patrimonio WHERE usuario_id = ? ORDER BY data DESC LIMIT 12",
      )
      .bind(usuarioId)
      .all<{ data: string; valor_total: number }>();
    const hist = snapshots.results ?? [];

    const atual = hist[0]?.valor_total ?? patrimonioTotal;
    const seisMeses = hist[5]?.valor_total ?? atual;
    const dozeMeses = hist[11]?.valor_total ?? atual;
    const evolucaoPatrimonio6m = seisMeses > 0 ? ((atual - seisMeses) / seisMeses) * 100 : 0;
    const evolucaoPatrimonio12m = dozeMeses > 0 ? ((atual - dozeMeses) / dozeMeses) * 100 : 0;
    const idadeCarteiraMeses = hist.length;
    const mesesComAporteUltimos6m = hist.slice(0, 6).filter((item) => (item.valor_total ?? 0) > 0).length;

    return {
      patrimonioTotal,
      quantidadeAtivos,
      quantidadeCategorias,
      maiorParticipacao,
      top3Participacao,
      percentualRendaVariavel: patrimonioTotal > 0 ? (valorRendaVariavel / patrimonioTotal) * 100 : 0,
      percentualRendaFixa: patrimonioTotal > 0 ? (valorRendaFixa / patrimonioTotal) * 100 : 0,
      percentualDefensivo: patrimonioTotal > 0 ? (valorDefensivo / patrimonioTotal) * 100 : 0,
      percentualInternacional: 0,
      evolucaoPatrimonio6m,
      evolucaoPatrimonio12m,
      idadeCarteiraMeses,
      mesesComAporteUltimos6m,
    };
  }

  async obterConfiguracaoScore(): Promise<Record<string, unknown> | null> {
    let row: { valor_json: string } | null = null;
    try {
      row = await this.db
        .prepare("SELECT valor_json FROM configuracoes_produto WHERE chave = 'score.v1' LIMIT 1")
        .first<{ valor_json: string }>();
    } catch {
      return null;
    }
    if (!row?.valor_json) return null;
    try {
      const parsed = JSON.parse(row.valor_json) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
      return parsed as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  async obterUltimoSnapshotScore(usuarioId: string): Promise<SnapshotScorePersistido | null> {
    const row = await this.db
      .prepare("SELECT score, criado_em FROM snapshots_score WHERE usuario_id = ? ORDER BY criado_em DESC LIMIT 1")
      .bind(usuarioId)
      .first<{ score: number; criado_em: string }>();
    if (!row) return null;
    return {
      score: row.score ?? 0,
      criadoEm: row.criado_em,
    };
  }

  async salvarSnapshotScore(
    usuarioId: string,
    payload: {
      score: number;
      faixa: ScoreCarteira["faixa"];
      riscoPrincipal: string;
      acaoPrioritaria: string;
      blocos: BlocosScore;
      fatoresPositivos: Fator[];
      fatoresNegativos: Fator[];
    },
  ): Promise<void> {
    await this.db
      .prepare(
        [
          "INSERT INTO snapshots_score",
          "(id, usuario_id, score, faixa, risco_principal, acao_prioritaria, blocos_json, fatores_positivos_json, fatores_negativos_json, criado_em)",
          "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ].join(" "),
      )
      .bind(
        crypto.randomUUID(),
        usuarioId,
        payload.score,
        payload.faixa,
        payload.riscoPrincipal,
        payload.acaoPrioritaria,
        JSON.stringify(payload.blocos),
        JSON.stringify(payload.fatoresPositivos),
        JSON.stringify(payload.fatoresNegativos),
        new Date().toISOString(),
      )
      .run();
  }
}
