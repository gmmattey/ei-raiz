export type UnifiedScoreBand = "critical" | "fragile" | "stable" | "good" | "strong";
export type ScoreCompletenessStatus = "empty" | "partial" | "complete";

export interface UnifiedScorePillar {
  id: "liquidity" | "financial_health" | "patrimonial_structure" | "investment_behavior" | "efficiency_evolution";
  name: string;
  score: number;
  weightedContribution: number;
  reasons: string[];
}

export interface UnifiedScoreInsight {
  type: "positive" | "warning" | "risk" | "opportunity";
  title: string;
  message: string;
}

export interface UnifiedScoreBreakdown {
  patrimonyGross: number;
  patrimonyNet: number;
  liquidAssets: number;
  illiquidAssets: number;
  investedAssets: number;
  totalDebt: number;
  monthlyIncome: number;
  monthlyEssentialCost: number;
  monthlyDebtPayment: number;
  emergencyReserveMonths: number | null;
  debtToIncomeRatio: number | null;
  debtToPatrimonyRatio: number | null;
  liquidityRatio: number | null;
  concentrationLargestClassRatio: number | null;
  investmentDiversificationRatio: number | null;
  marketUpdatedAt: string | null;
  sessionUpdatedAt: string;
}

export interface UnifiedScoreResult {
  score: number;
  band: UnifiedScoreBand;
  completenessStatus: ScoreCompletenessStatus;
  pillars: UnifiedScorePillar[];
  insights: UnifiedScoreInsight[];
  breakdown: UnifiedScoreBreakdown;
  disclaimer: string;
  calculatedAt: string;
}

type UserInputs = {
  monthlyIncome: number;
  monthlyEssentialCost: number;
  monthlyDebtPayment: number;
  patrimonyGross: number;
  patrimonyNet: number;
  liquidAssets: number;
  illiquidAssets: number;
  investedAssets: number;
  totalDebt: number;
  largestClassRatio: number | null;
  investmentDiversificationRatio: number | null;
  listedLargestTickerRatio: number | null;
  goalCoverageRatio: number | null;
  marketUpdatedAt: string | null;
  /** Últimos N scores unificados (do mais recente ao mais antigo). Null se sem histórico. */
  scoreHistory: number[] | null;
};

const DISCLAIMER =
  "Este score é um indicador proprietário baseado em liquidez, patrimônio, endividamento, investimentos e objetivos financeiros. Ele não constitui aconselhamento financeiro, oferta de crédito ou recomendação profissional.";

const clamp = (n: number, min: number, max: number): number => Math.max(min, Math.min(max, n));

const scoreByRanges = (value: number | null, ranges: Array<{ when: (v: number | null) => boolean; score: number }>, fallback = 500): number => {
  for (const r of ranges) {
    if (r.when(value)) return r.score;
  }
  return fallback;
};

export class UnifiedScoreService {
  constructor(private readonly db: D1Database) {}

  async calculateForUser(userId: string): Promise<UnifiedScoreResult> {
    const inputs = await this.loadUserInputs(userId);
    const result = await this.calculateFromInputs(inputs);
    await this.saveSnapshot(userId, result, inputs);
    return result;
  }

  async preview(payload: Record<string, unknown>): Promise<UnifiedScoreResult> {
    const profile = (payload.profile ?? {}) as Record<string, unknown>;
    const patrimony = (payload.patrimony ?? {}) as Record<string, unknown>;
    const portfolio = (payload.portfolio ?? {}) as Record<string, unknown>;
    const goals = (payload.goals ?? {}) as Record<string, unknown>;

    const inputs: UserInputs = {
      monthlyIncome: Number(profile.monthlyIncome ?? 0),
      monthlyEssentialCost: Number(profile.monthlyEssentialCost ?? 0),
      monthlyDebtPayment: Number(profile.monthlyDebtPayment ?? 0),
      patrimonyGross: Number(patrimony.patrimonyGross ?? 0),
      patrimonyNet: Number(patrimony.patrimonyNet ?? 0),
      liquidAssets: Number(patrimony.liquidAssets ?? 0),
      illiquidAssets: Number(patrimony.illiquidAssets ?? 0),
      investedAssets: Number(patrimony.investedAssets ?? 0),
      totalDebt: Number(patrimony.totalDebt ?? 0),
      largestClassRatio: typeof patrimony.concentrationLargestClassRatio === "number" ? Number(patrimony.concentrationLargestClassRatio) : null,
      investmentDiversificationRatio:
        typeof portfolio.investmentDiversificationRatio === "number" ? Number(portfolio.investmentDiversificationRatio) : null,
      listedLargestTickerRatio: typeof portfolio.listedLargestTickerRatio === "number" ? Number(portfolio.listedLargestTickerRatio) : null,
      goalCoverageRatio: typeof goals.goalCoverageRatio === "number" ? Number(goals.goalCoverageRatio) : null,
      marketUpdatedAt: typeof portfolio.marketUpdatedAt === "string" ? String(portfolio.marketUpdatedAt) : null,
      scoreHistory: null, // preview não tem histórico real
    };
    return this.calculateFromInputs(inputs);
  }

  async getHistory(userId: string): Promise<Array<{ score: number; band: UnifiedScoreBand; createdAt: string }>> {
    const rows = await this.db
      .prepare("SELECT score, faixa, criado_em FROM snapshots_score_unificado WHERE usuario_id = ? ORDER BY criado_em DESC LIMIT 50")
      .bind(userId)
      .all<{ score: number; faixa: UnifiedScoreBand; criado_em: string }>();
    return (rows.results || []).map((item) => ({ score: item.score, band: item.faixa, createdAt: item.criado_em }));
  }

  private async loadModelConfig(): Promise<{
    pillarWeights: { liquidity: number; financial_health: number; patrimonial_structure: number; investment_behavior: number; efficiency_evolution: number };
    ranges: { criticalMax: number; fragileMax: number; stableMax: number; goodMax: number };
  }> {
    const defaults = {
      pillarWeights: { liquidity: 0.25, financial_health: 0.25, patrimonial_structure: 0.2, investment_behavior: 0.15, efficiency_evolution: 0.15 },
      ranges: { criticalMax: 299, fragileMax: 499, stableMax: 699, goodMax: 849 },
    };
    const row = await this.db
      .prepare("SELECT valor_json FROM configuracoes_produto WHERE chave = 'score.v1' LIMIT 1")
      .first<{ valor_json: string | null }>();
    if (!row?.valor_json) return defaults;
    try {
      const parsed = JSON.parse(row.valor_json) as { unifiedModel?: { pillarWeights?: typeof defaults.pillarWeights; ranges?: typeof defaults.ranges } };
      return {
        pillarWeights: { ...defaults.pillarWeights, ...(parsed.unifiedModel?.pillarWeights ?? {}) },
        ranges: { ...defaults.ranges, ...(parsed.unifiedModel?.ranges ?? {}) },
      };
    } catch {
      return defaults;
    }
  }

  private async calculateFromInputs(inputs: UserInputs): Promise<UnifiedScoreResult> {
    const modelConfig = await this.loadModelConfig();
    const calculatedAt = new Date().toISOString();
    const completenessStatus = this.getCompletenessStatus(inputs);
    const isEmpty = completenessStatus === "empty";
    const isPartial = completenessStatus === "partial";
    if (isEmpty) {
      return {
        score: 0,
        band: "critical",
        completenessStatus: "empty",
        pillars: [],
        insights: [],
        breakdown: {
          patrimonyGross: inputs.patrimonyGross,
          patrimonyNet: inputs.patrimonyNet,
          liquidAssets: inputs.liquidAssets,
          illiquidAssets: inputs.illiquidAssets,
          investedAssets: inputs.investedAssets,
          totalDebt: inputs.totalDebt,
          monthlyIncome: inputs.monthlyIncome,
          monthlyEssentialCost: inputs.monthlyEssentialCost,
          monthlyDebtPayment: inputs.monthlyDebtPayment,
          emergencyReserveMonths: null,
          debtToIncomeRatio: null,
          debtToPatrimonyRatio: null,
          liquidityRatio: null,
          concentrationLargestClassRatio: inputs.largestClassRatio,
          investmentDiversificationRatio: inputs.investmentDiversificationRatio,
          marketUpdatedAt: inputs.marketUpdatedAt,
          sessionUpdatedAt: new Date().toISOString(),
        },
        disclaimer: DISCLAIMER,
        calculatedAt,
      };
    }

    const emergencyReserveMonths = inputs.monthlyEssentialCost > 0 ? inputs.liquidAssets / inputs.monthlyEssentialCost : null;
    const debtToIncomeRatio = inputs.monthlyIncome > 0 ? inputs.totalDebt / (inputs.monthlyIncome * 12) : null;
    const debtToPatrimonyRatio = inputs.patrimonyGross > 0 ? inputs.totalDebt / inputs.patrimonyGross : null;
    const debtServiceRatio = inputs.monthlyIncome > 0 ? inputs.monthlyDebtPayment / inputs.monthlyIncome : null;
    const liquidityRatio = inputs.patrimonyGross > 0 ? inputs.liquidAssets / inputs.patrimonyGross : null;
    const freeCashCapacity = inputs.monthlyIncome - inputs.monthlyEssentialCost - inputs.monthlyDebtPayment;
    const freeCashCapacityRatio = inputs.monthlyIncome > 0 ? freeCashCapacity / inputs.monthlyIncome : null;
    const liquidVsIlliquidRatio = inputs.illiquidAssets > 0 ? inputs.liquidAssets / inputs.illiquidAssets : inputs.liquidAssets > 0 ? 1 : 0;
    const investedPatrimonyRatio = inputs.patrimonyGross > 0 ? inputs.investedAssets / inputs.patrimonyGross : 0;

    const reserveScore = scoreByRanges(
      emergencyReserveMonths,
      [
        { when: (v) => v === null, score: 400 },
        { when: (v) => (v ?? 0) < 1, score: 50 },
        { when: (v) => (v ?? 0) < 3, score: 250 },
        { when: (v) => (v ?? 0) < 6, score: 600 },
        { when: (v) => (v ?? 0) < 12, score: 850 },
        { when: (v) => (v ?? 0) >= 12, score: 1000 },
      ],
    );
    const liquidityRatioScore = scoreByRanges(
      liquidityRatio,
      [
        { when: (v) => (v ?? 0) <= 0.05, score: 100 },
        { when: (v) => (v ?? 0) <= 0.15, score: 300 },
        { when: (v) => (v ?? 0) <= 0.30, score: 550 },
        { when: (v) => (v ?? 0) <= 0.50, score: 800 },
        { when: (v) => (v ?? 0) > 0.50, score: 1000 },
      ],
      100,
    );
    const freeCashScore = scoreByRanges(
      freeCashCapacityRatio,
      [
        { when: (_v) => inputs.monthlyIncome <= 0, score: 100 },
        { when: (v) => (v ?? 0) <= 0, score: 50 },
        { when: (v) => (v ?? 0) <= 0.05, score: 250 },
        { when: (v) => (v ?? 0) <= 0.15, score: 500 },
        { when: (v) => (v ?? 0) <= 0.30, score: 800 },
        { when: (v) => (v ?? 0) > 0.30, score: 1000 },
      ],
      100,
    );
    const liquidityScore = Math.round(reserveScore * 0.45 + liquidityRatioScore * 0.35 + freeCashScore * 0.2);

    const debtToIncomeScore = scoreByRanges(
      debtToIncomeRatio,
      [
        { when: (_v) => inputs.monthlyIncome <= 0, score: 50 },
        { when: (v) => (v ?? 9) > 2.0, score: 50 },
        { when: (v) => (v ?? 9) > 1.2, score: 250 },
        { when: (v) => (v ?? 9) > 0.6, score: 500 },
        { when: (v) => (v ?? 9) > 0.2, score: 800 },
        { when: (v) => (v ?? 9) <= 0.2, score: 1000 },
      ],
      50,
    );
    const debtToPatrimonyScore = scoreByRanges(
      debtToPatrimonyRatio,
      [
        { when: (_v) => inputs.patrimonyGross <= 0, score: 50 },
        { when: (v) => (v ?? 9) > 0.8, score: 50 },
        { when: (v) => (v ?? 9) > 0.5, score: 250 },
        { when: (v) => (v ?? 9) > 0.3, score: 500 },
        { when: (v) => (v ?? 9) > 0.1, score: 800 },
        { when: (v) => (v ?? 9) <= 0.1, score: 1000 },
      ],
      50,
    );
    const debtServiceScore = scoreByRanges(
      debtServiceRatio,
      [
        { when: (_v) => inputs.monthlyIncome <= 0, score: 50 },
        { when: (v) => (v ?? 9) > 0.50, score: 50 },
        { when: (v) => (v ?? 9) > 0.35, score: 250 },
        { when: (v) => (v ?? 9) > 0.20, score: 500 },
        { when: (v) => (v ?? 9) > 0.10, score: 800 },
        { when: (v) => (v ?? 9) <= 0.10, score: 1000 },
      ],
      50,
    );
    const financialHealthScore = Math.round(debtToIncomeScore * 0.35 + debtToPatrimonyScore * 0.35 + debtServiceScore * 0.3);

    const patrimonyNetAbsoluteScore = scoreByRanges(
      inputs.patrimonyNet,
      [
        { when: (v) => (v ?? 0) <= 0, score: 50 },
        { when: (v) => (v ?? 0) <= 20000, score: 200 },
        { when: (v) => (v ?? 0) <= 100000, score: 450 },
        { when: (v) => (v ?? 0) <= 300000, score: 650 },
        { when: (v) => (v ?? 0) <= 1000000, score: 850 },
        { when: (v) => (v ?? 0) > 1000000, score: 1000 },
      ],
    );
    const concentrationLargestClassScore = scoreByRanges(
      inputs.largestClassRatio,
      [
        { when: (v) => (v ?? 0) > 0.8, score: 100 },
        { when: (v) => (v ?? 0) > 0.65, score: 300 },
        { when: (v) => (v ?? 0) > 0.5, score: 550 },
        { when: (v) => (v ?? 0) > 0.35, score: 800 },
        { when: (v) => (v ?? 0) <= 0.35, score: 1000 },
      ],
      500,
    );
    const liquidVsIlliquidBalanceScore = scoreByRanges(
      liquidVsIlliquidRatio,
      [
        { when: (v) => (v ?? 0) <= 0.05, score: 50 },
        { when: (v) => (v ?? 0) <= 0.15, score: 250 },
        { when: (v) => (v ?? 0) <= 0.30, score: 450 },
        { when: (v) => (v ?? 0) <= 0.60, score: 700 },
        { when: (v) => (v ?? 0) > 0.60, score: 1000 },
      ],
      500,
    );
    const patrimonialStructureScore = Math.round(
      patrimonyNetAbsoluteScore * 0.3 + concentrationLargestClassScore * 0.35 + liquidVsIlliquidBalanceScore * 0.35,
    );

    const investedPatrimonyRatioScore = scoreByRanges(
      investedPatrimonyRatio,
      [
        { when: (v) => (v ?? 0) <= 0.01, score: 100 },
        { when: (v) => (v ?? 0) <= 0.05, score: 300 },
        { when: (v) => (v ?? 0) <= 0.15, score: 550 },
        { when: (v) => (v ?? 0) <= 0.35, score: 800 },
        { when: (v) => (v ?? 0) > 0.35, score: 1000 },
      ],
      100,
    );
    const investmentDiversificationScore = scoreByRanges(
      inputs.investmentDiversificationRatio,
      [
        { when: (v) => v === null, score: 500 },
        { when: (v) => (v ?? 0) <= 0, score: 50 },
        { when: (v) => (v ?? 0) <= 0.25, score: 300 },
        { when: (v) => (v ?? 0) <= 0.5, score: 600 },
        { when: (v) => (v ?? 0) <= 0.75, score: 800 },
        { when: (v) => (v ?? 0) > 0.75, score: 1000 },
      ],
      500,
    );
    const listedAssetsDisciplineScore = scoreByRanges(
      inputs.listedLargestTickerRatio,
      [
        { when: (v) => v === null, score: 500 },
        { when: (v) => (v ?? 0) > 0.70, score: 200 },
        { when: (v) => (v ?? 0) > 0.50, score: 450 },
        { when: (v) => (v ?? 0) > 0.30, score: 700 },
        { when: (v) => (v ?? 0) <= 0.30, score: 1000 },
      ],
      500,
    );
    const investmentBehaviorScore = Math.round(
      investedPatrimonyRatioScore * 0.35 + investmentDiversificationScore * 0.4 + listedAssetsDisciplineScore * 0.25,
    );

    // Tendência real: compara os últimos scores salvos (mais recente primeiro).
    // Sem histórico = neutro (500). Com histórico, avalia direção e magnitude.
    const patrimonyTrendScore = (() => {
      const hist = inputs.scoreHistory;
      if (!hist || hist.length < 2) return 500; // sem dados suficientes → neutro
      const mais_recente = hist[0];
      const referencia = hist[hist.length - 1]; // score mais antigo disponível
      const delta = mais_recente - referencia;
      const deltaPct = referencia > 0 ? delta / referencia : 0;
      if (deltaPct > 0.10) return 1000;  // cresceu >10% → excelente
      if (deltaPct > 0.04) return 850;   // cresceu 4-10% → bom
      if (deltaPct > 0)    return 700;   // cresceu levemente → acima do neutro
      if (deltaPct === 0)  return 500;   // estável
      if (deltaPct > -0.05) return 350;  // caiu levemente
      if (deltaPct > -0.10) return 200;  // caiu 5-10%
      return 50;                          // caiu >10% → crítico
    })();
    const savingsProgressScore = scoreByRanges(
      freeCashCapacityRatio,
      [
        { when: (v) => (v ?? 0) <= 0, score: 100 },
        { when: (v) => (v ?? 0) <= 0.05, score: 300 },
        { when: (v) => (v ?? 0) <= 0.15, score: 550 },
        { when: (v) => (v ?? 0) <= 0.30, score: 800 },
        { when: (v) => (v ?? 0) > 0.30, score: 1000 },
      ],
      500,
    );
    const goalAlignmentScore = scoreByRanges(
      inputs.goalCoverageRatio,
      [
        { when: (v) => v === null, score: 500 },
        { when: (v) => (v ?? 0) <= 0.25, score: 100 },
        { when: (v) => (v ?? 0) <= 0.50, score: 300 },
        { when: (v) => (v ?? 0) <= 0.80, score: 600 },
        { when: (v) => (v ?? 0) <= 1.0, score: 850 },
        { when: (v) => (v ?? 0) > 1.0, score: 1000 },
      ],
      500,
    );
    const efficiencyEvolutionScore = Math.round(patrimonyTrendScore * 0.35 + savingsProgressScore * 0.35 + goalAlignmentScore * 0.3);

    const pillars: UnifiedScorePillar[] = [
      {
        id: "liquidity",
        name: "Liquidez",
        score: liquidityScore,
        weightedContribution: liquidityScore * modelConfig.pillarWeights.liquidity,
        reasons: [`Reserva: ${reserveScore}`, `Liquidez patrimonial: ${liquidityRatioScore}`],
      },
      {
        id: "financial_health",
        name: "Saúde Financeira",
        score: financialHealthScore,
        weightedContribution: financialHealthScore * modelConfig.pillarWeights.financial_health,
        reasons: [`Dívida/renda: ${debtToIncomeScore}`, `Dívida/patrimônio: ${debtToPatrimonyScore}`],
      },
      {
        id: "patrimonial_structure",
        name: "Estrutura Patrimonial",
        score: patrimonialStructureScore,
        weightedContribution: patrimonialStructureScore * modelConfig.pillarWeights.patrimonial_structure,
        reasons: [`Concentração classe: ${concentrationLargestClassScore}`, `Liquidez vs iliquidez: ${liquidVsIlliquidBalanceScore}`],
      },
      {
        id: "investment_behavior",
        name: "Comportamento de Investimento",
        score: investmentBehaviorScore,
        weightedContribution: investmentBehaviorScore * modelConfig.pillarWeights.investment_behavior,
        reasons: [`% investido: ${investedPatrimonyRatioScore}`, `Diversificação: ${investmentDiversificationScore}`],
      },
      {
        id: "efficiency_evolution",
        name: "Eficiência e Evolução",
        score: efficiencyEvolutionScore,
        weightedContribution: efficiencyEvolutionScore * modelConfig.pillarWeights.efficiency_evolution,
        reasons: [`Progresso de poupança: ${savingsProgressScore}`, `Alinhamento objetivos: ${goalAlignmentScore}`],
      },
    ];

    const rawScore = pillars.reduce((acc, p) => acc + p.weightedContribution, 0);
    const partialPenalty = isPartial ? 0.85 : 1;
    const score = clamp(Math.round(rawScore * partialPenalty), 0, 1000);
    const band: UnifiedScoreBand =
      score <= modelConfig.ranges.criticalMax
        ? "critical"
        : score <= modelConfig.ranges.fragileMax
          ? "fragile"
          : score <= modelConfig.ranges.stableMax
            ? "stable"
            : score <= modelConfig.ranges.goodMax
              ? "good"
              : "strong";

    const insights = this.generateInsights({
      emergencyReserveMonths,
      debtServiceRatio,
      largestClassRatio: inputs.largestClassRatio,
      investmentDiversificationScore,
      goalCoverageRatio: inputs.goalCoverageRatio,
      liquidityRatio,
      score,
    });
    if (isPartial) {
      insights.unshift({
        type: "warning",
        title: "Leitura parcial",
        message: "O score foi calculado com dados incompletos e está em modo conservador.",
      });
    }

    return {
      score,
      band,
      completenessStatus,
      pillars,
      insights,
      breakdown: {
        patrimonyGross: inputs.patrimonyGross,
        patrimonyNet: inputs.patrimonyNet,
        liquidAssets: inputs.liquidAssets,
        illiquidAssets: inputs.illiquidAssets,
        investedAssets: inputs.investedAssets,
        totalDebt: inputs.totalDebt,
        monthlyIncome: inputs.monthlyIncome,
        monthlyEssentialCost: inputs.monthlyEssentialCost,
        monthlyDebtPayment: inputs.monthlyDebtPayment,
        emergencyReserveMonths,
        debtToIncomeRatio,
        debtToPatrimonyRatio,
        liquidityRatio,
        concentrationLargestClassRatio: inputs.largestClassRatio,
        investmentDiversificationRatio: inputs.investmentDiversificationRatio,
        marketUpdatedAt: inputs.marketUpdatedAt,
        sessionUpdatedAt: new Date().toISOString(),
      },
      disclaimer: DISCLAIMER,
      calculatedAt,
    };
  }

  private generateInsights(args: {
    emergencyReserveMonths: number | null;
    debtServiceRatio: number | null;
    largestClassRatio: number | null;
    investmentDiversificationScore: number;
    goalCoverageRatio: number | null;
    liquidityRatio: number | null;
    score: number;
  }): UnifiedScoreInsight[] {
    const insights: UnifiedScoreInsight[] = [];
    const reservaMeses = args.emergencyReserveMonths;

    if ((reservaMeses ?? 0) < 1) {
      insights.push({
        type: "risk",
        title: "Reserva de emergência ausente",
        message: `Você não tem liquidez para cobrir nem 1 mês de gastos essenciais. Construir uma reserva de 3 a 6 meses é a correção de maior impacto que você pode fazer agora — pode adicionar até 250 pontos ao pilar de Liquidez.`,
      });
    } else if ((reservaMeses ?? 0) < 3) {
      insights.push({
        type: "risk",
        title: "Reserva de emergência insuficiente",
        message: `Sua liquidez cobre ${reservaMeses?.toFixed(1)} mês de gastos essenciais. O recomendado é 3 a 6 meses. Aumentar a reserva pode adicionar até 150 pontos ao pilar de Liquidez.`,
      });
    } else if ((reservaMeses ?? 0) < 6) {
      insights.push({
        type: "warning",
        title: "Reserva de emergência parcial",
        message: `Sua reserva cobre ${reservaMeses?.toFixed(1)} meses. Chegar a 6 meses é o próximo nível e pode adicionar até 80 pontos ao pilar de Liquidez.`,
      });
    }

    if ((args.debtServiceRatio ?? 0) > 0.5) {
      insights.push({
        type: "risk",
        title: "Comprometimento crítico da renda com dívidas",
        message: `Mais de 50% da sua renda mensal vai para pagamento de dívidas. Isso deixa pouca margem para emergências e aportes. Reduzir esse índice abaixo de 35% pode adicionar até 250 pontos ao pilar de Saúde Financeira.`,
      });
    } else if ((args.debtServiceRatio ?? 0) > 0.35) {
      insights.push({
        type: "warning",
        title: "Comprometimento alto da renda com dívidas",
        message: `${Math.round((args.debtServiceRatio ?? 0) * 100)}% da renda mensal está comprometida com parcelas. O ideal é manter abaixo de 20%. Reduzir esse índice pode adicionar até 150 pontos ao pilar de Saúde Financeira.`,
      });
    }

    if ((args.largestClassRatio ?? 0) > 0.8) {
      insights.push({
        type: "risk",
        title: "Concentração extrema em uma classe de ativos",
        message: `Mais de 80% do patrimônio está em uma única categoria. Um evento adverso nessa classe pode comprometer a maior parte do seu patrimônio. Diversificar pode adicionar até 200 pontos ao pilar de Estrutura Patrimonial.`,
      });
    } else if ((args.largestClassRatio ?? 0) > 0.65) {
      insights.push({
        type: "warning",
        title: "Patrimônio concentrado em uma classe de ativos",
        message: `${Math.round((args.largestClassRatio ?? 0) * 100)}% do patrimônio está em uma única categoria. Distribuir por pelo menos 3 classes pode adicionar até 100 pontos ao pilar de Estrutura Patrimonial.`,
      });
    }

    if (args.investmentDiversificationScore >= 800) {
      insights.push({
        type: "positive",
        title: "Boa diversificação entre classes",
        message: "Seus investimentos estão distribuídos por múltiplas classes de ativos — isso reduz o risco de concentração e contribui positivamente para o seu score.",
      });
    }

    if ((args.goalCoverageRatio ?? 1) < 0.25) {
      insights.push({
        type: "opportunity",
        title: "Objetivos financeiros muito defasados",
        message: "O fluxo mensal disponível cobre menos de 25% do necessário para seus objetivos. Revisar metas ou aumentar o aporte mensal pode adicionar até 150 pontos ao pilar de Eficiência e Evolução.",
      });
    } else if ((args.goalCoverageRatio ?? 1) < 0.5) {
      insights.push({
        type: "opportunity",
        title: "Objetivos subfinanciados",
        message: "Seu fluxo mensal cobre menos da metade do que seria necessário para seus objetivos. Pequenos ajustes no aporte ou nos gastos podem melhorar significativamente esse índice.",
      });
    }

    if ((args.liquidityRatio ?? 0) > 0.35 && insights.filter((i) => i.type === "positive").length === 0) {
      insights.push({
        type: "positive",
        title: "Liquidez patrimonial saudável",
        message: "Mais de 35% do seu patrimônio está em ativos de fácil conversão em dinheiro. Isso lhe dá capacidade de resposta a imprevistos sem precisar vender investimentos de longo prazo.",
      });
    }

    if (insights.length < 2) {
      insights.push({
        type: args.score >= 700 ? "positive" : "warning",
        title: args.score >= 700 ? "Estrutura financeira sólida" : "Estrutura financeira exige atenção",
        message: args.score >= 700
          ? "Seu score indica base patrimonial funcional. Continue com a disciplina de aportes e revisão periódica da carteira."
          : `Seu score está em ${args.score}/1000. As correções de maior impacto estão nos pilares com menor pontuação — Liquidez e Saúde Financeira costumam ser os mais alavancados.`,
      });
    }

    return insights.slice(0, 6);
  }

  private getCompletenessStatus(inputs: UserInputs): ScoreCompletenessStatus {
    const relevantSignals = [
      inputs.monthlyIncome > 0,
      inputs.monthlyEssentialCost > 0,
      inputs.patrimonyGross > 0 || inputs.totalDebt > 0,
      inputs.investedAssets > 0,
      inputs.goalCoverageRatio !== null,
      inputs.largestClassRatio !== null,
    ];
    const count = relevantSignals.filter(Boolean).length;
    if (count === 0) return "empty";
    if (count < 4) return "partial";
    return "complete";
  }

  private async loadUserInputs(userId: string): Promise<UserInputs> {
    const [perfil, contexto, ativos, scoreHistoryRows] = await Promise.all([
      this.db
        .prepare("SELECT renda_mensal, gasto_mensal, aporte_mensal, reserva_caixa FROM perfil_financeiro WHERE usuario_id = ? LIMIT 1")
        .bind(userId)
        .first<{ renda_mensal: number; gasto_mensal: number | null; aporte_mensal: number | null; reserva_caixa: number | null }>(),
      this.db
        .prepare("SELECT contexto_json, atualizado_em FROM perfil_contexto_financeiro WHERE usuario_id = ? LIMIT 1")
        .bind(userId)
        .first<{ contexto_json: string | null; atualizado_em: string | null }>(),
      this.db
        .prepare("SELECT ticker, categoria, valor_atual FROM ativos WHERE usuario_id = ?")
        .bind(userId)
        .all<{ ticker: string | null; categoria: string | null; valor_atual: number | null }>(),
      this.db
        .prepare("SELECT score FROM snapshots_score_unificado WHERE usuario_id = ? ORDER BY criado_em DESC LIMIT 5")
        .bind(userId)
        .all<{ score: number }>()
        .catch(() => ({ results: [] as Array<{ score: number }> })),
    ]);

    const ativosRows = ativos.results || [];
    const investedAssets = ativosRows.reduce((acc, item) => acc + Number(item.valor_atual ?? 0), 0);
    const classMap = new Map<string, number>();
    ativosRows.forEach((item) => {
      const cat = item.categoria || "outros";
      classMap.set(cat, (classMap.get(cat) || 0) + Number(item.valor_atual ?? 0));
    });
    const listedTickerMap = new Map<string, number>();
    ativosRows
      .filter((item) => item.ticker && String(item.ticker).trim().length > 0)
      .forEach((item) => listedTickerMap.set(String(item.ticker).toUpperCase(), (listedTickerMap.get(String(item.ticker).toUpperCase()) || 0) + Number(item.valor_atual ?? 0)));

    let imoveis = 0;
    let veiculos = 0;
    let caixaContexto = 0;
    let totalDebt = 0;
    let monthlyDebtPayment = 0;
    if (contexto?.contexto_json) {
      try {
        const parsed = JSON.parse(contexto.contexto_json) as {
          patrimonioExterno?: {
            imoveis?: Array<{ valorEstimado?: number; saldoFinanciamento?: number }>;
            veiculos?: Array<{ valorEstimado?: number }>;
            caixaDisponivel?: number;
          };
          dividas?: Array<{ saldoDevedor?: number; parcelaMensal?: number }>;
        };
        const imoveisBruto = (parsed.patrimonioExterno?.imoveis || []).reduce((acc, item) => acc + Number(item.valorEstimado ?? 0), 0);
        const saldoImoveis = (parsed.patrimonioExterno?.imoveis || []).reduce((acc, item) => acc + Number(item.saldoFinanciamento ?? 0), 0);
        imoveis = Math.max(0, imoveisBruto - saldoImoveis);
        veiculos = (parsed.patrimonioExterno?.veiculos || []).reduce((acc, item) => acc + Number(item.valorEstimado ?? 0), 0);
        caixaContexto = Number(parsed.patrimonioExterno?.caixaDisponivel ?? 0);
        totalDebt += saldoImoveis;
        totalDebt += (parsed.dividas || []).reduce((acc, item) => acc + Number(item.saldoDevedor ?? 0), 0);
        monthlyDebtPayment += (parsed.dividas || []).reduce((acc, item) => acc + Number(item.parcelaMensal ?? 0), 0);
      } catch {
        // noop
      }
    }

    const caixa = Math.max(Number(perfil?.reserva_caixa ?? 0), caixaContexto);
    const patrimonyGross = investedAssets + imoveis + veiculos + caixa;
    const patrimonyNet = patrimonyGross - totalDebt;
    const liquidAssets = investedAssets + caixa;
    const illiquidAssets = imoveis + veiculos;
    const largestClassRatio = patrimonyGross > 0 ? Math.max(investedAssets, imoveis, veiculos, caixa) / patrimonyGross : null;
    const investmentDiversificationRatio = classMap.size > 0 ? Math.min(1, classMap.size / 4) : 0;
    const listedLargestTickerRatio =
      investedAssets > 0 && listedTickerMap.size > 0 ? Math.max(...Array.from(listedTickerMap.values())) / investedAssets : null;
    const monthlyIncome = Number(perfil?.renda_mensal ?? 0);
    const monthlyEssentialCost = Number(perfil?.gasto_mensal ?? 0);
    const goalCoverageRatio = Number(perfil?.aporte_mensal ?? 0) > 0 ? (monthlyIncome - monthlyEssentialCost - monthlyDebtPayment) / Number(perfil?.aporte_mensal ?? 1) : null;
    const scoreHistory = (scoreHistoryRows.results ?? []).length > 0
      ? (scoreHistoryRows.results ?? []).map((r) => r.score)
      : null;

    return {
      monthlyIncome,
      monthlyEssentialCost,
      monthlyDebtPayment,
      patrimonyGross,
      patrimonyNet,
      liquidAssets,
      illiquidAssets,
      investedAssets,
      totalDebt,
      largestClassRatio,
      investmentDiversificationRatio,
      listedLargestTickerRatio,
      goalCoverageRatio,
      marketUpdatedAt: contexto?.atualizado_em ?? null,
      scoreHistory,
    };
  }

  private async saveSnapshot(userId: string, result: UnifiedScoreResult, inputs: UserInputs): Promise<void> {
    await this.db
      .prepare(
        [
          "INSERT INTO snapshots_score_unificado",
          "(id, usuario_id, score, faixa, pilares_json, patrimonio_bruto, patrimonio_liquido, divida_total, ativos_liquidos, inputs_resumo_json, criado_em)",
          "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ].join(" "),
      )
      .bind(
        crypto.randomUUID(),
        userId,
        result.score,
        result.band,
        JSON.stringify(result.pillars),
        inputs.patrimonyGross,
        inputs.patrimonyNet,
        inputs.totalDebt,
        inputs.liquidAssets,
        JSON.stringify({
          monthlyIncome: inputs.monthlyIncome,
          monthlyEssentialCost: inputs.monthlyEssentialCost,
          monthlyDebtPayment: inputs.monthlyDebtPayment,
          investmentDiversificationRatio: inputs.investmentDiversificationRatio,
          listedLargestTickerRatio: inputs.listedLargestTickerRatio,
          goalCoverageRatio: inputs.goalCoverageRatio,
        }),
        new Date().toISOString(),
      )
      .run();
  }
}
