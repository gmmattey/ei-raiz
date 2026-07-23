import type { Env } from '../types/env';
import { buildEntityId } from './auth_crypto';
import { d1 } from './d1';
import { insertPortfolioAnalysis, replaceAnalysisInsights } from '../repositories/analysis_write_repository';

type InsightSeed = { type: string; title: string; message: string; priority: number };

export async function generateDeterministicAnalysisForSnapshot(env: Env, input: {
  userId: string;
  portfolioId: string;
  snapshotId: string;
  importId: string;
  totals: { totalEquity: number; totalInvested: number; totalProfitLoss: number; totalProfitLossPct: number };
  createdAssets: Array<{ assetId: string; quantity: number; currentPrice: number | null; currentValue: number }>;
}): Promise<{ analysisId: string; insightsCount: number }> {
  const totalEquity = Number(input.totals.totalEquity || 0);
  const positionsCount = input.createdAssets.length;

  const top = pickTopHolding(input.createdAssets);
  const topSharePct = totalEquity > 0 ? (top.currentValue / totalEquity) * 100 : 0;
  const topMeta = top.assetId
    ? await d1(env).first<{ code: string | null; name: string }>(
        `SELECT code, name FROM assets WHERE id = ? LIMIT 1`,
        [top.assetId]
      )
    : null;
  const topLabel = topMeta ? `${topMeta.code ? `${topMeta.code} ` : ''}${topMeta.name}`.trim() : 'um único ativo';

  const scoreValue = clampInt(
    Math.round(
      75
        - (topSharePct >= 60 ? 25 : topSharePct >= 40 ? 15 : topSharePct >= 25 ? 8 : 0)
        - (positionsCount < 4 ? 10 : positionsCount < 8 ? 5 : 0)
        - (totalEquity > 0 && totalEquity < 1000 ? 5 : 0)
    ),
    0,
    100
  );
  const scoreStatus = scoreValue >= 80 ? 'Saudável' : scoreValue >= 60 ? 'Ok' : 'Precisa de atenção';

  let primaryProblem = 'analysis_ready';
  let primaryAction = 'review_portfolio';
  let portfolioDecision = 'manter_e_revisar';
  const actionPlan: string[] = [];
  const insights: InsightSeed[] = [];

  if (positionsCount === 0 || totalEquity <= 0) {
    primaryProblem = 'empty_portfolio';
    primaryAction = 'import_first_file';
    portfolioDecision = 'import_required';
    actionPlan.push('Importar a carteira no template CSV v1 oficial');
    insights.push({
      type: 'import_needed',
      title: 'Carteira ainda não importada',
      message: 'Importe sua carteira para gerar a primeira leitura e liberar recomendações.',
      priority: 1
    });
  } else {
    if (topSharePct >= 60) {
      primaryProblem = 'concentracao_excessiva';
      primaryAction = 'diversificar_carteira';
      portfolioDecision = 'reduzir_concentracao';
      actionPlan.push('Reduzir concentração do ativo principal');
      actionPlan.push('Adicionar 2-3 ativos descorrelacionados');
      insights.push({
        type: 'concentration_high',
        title: 'Concentração elevada',
        message: `Sua carteira está muito concentrada em ${topLabel} (${topSharePct.toFixed(1)}% do total).`,
        priority: 1
      });
    } else if (topSharePct >= 40) {
      primaryProblem = 'concentracao_media';
      primaryAction = 'balancear_alocacao';
      portfolioDecision = 'balancear';
      actionPlan.push('Balancear alocação para reduzir risco específico');
      insights.push({
        type: 'concentration_medium',
        title: 'Concentração acima do ideal',
        message: `Um ativo representa ${topSharePct.toFixed(1)}% do total. Considere diluir a exposição.`,
        priority: 3
      });
    }

    if (positionsCount < 4) {
      if (primaryProblem === 'analysis_ready') primaryProblem = 'diversificacao_baixa';
      if (primaryAction === 'review_portfolio') primaryAction = 'adicionar_ativos';
      insights.push({
        type: 'low_diversification',
        title: 'Diversificação baixa',
        message: `Você tem ${positionsCount} posição(ões). Carteiras muito pequenas tendem a sofrer mais com oscilações.`,
        priority: 5
      });
      actionPlan.push('Adicionar mais posições para reduzir volatilidade específica');
    }

    if (input.totals.totalProfitLossPct <= -10) {
      insights.push({
        type: 'drawdown_attention',
        title: 'Queda relevante no período',
        message: `A carteira está com variação de ${input.totals.totalProfitLossPct.toFixed(2)}%. Revise o racional e os riscos.`,
        priority: 4
      });
      if (primaryProblem === 'analysis_ready') primaryProblem = 'queda_relevante';
      actionPlan.push('Revisar posições com maior contribuição negativa');
    }

    if (insights.length === 0) {
      insights.push({
        type: 'no_critical_alerts',
        title: 'Nada crítico no momento',
        message: 'Sua carteira está consistente para esta leitura inicial. Continue acompanhando e refinando seu contexto.',
        priority: 8
      });
    }
  }

  const summaryText = buildSummaryText({
    scoreValue,
    scoreStatus,
    topSharePct,
    positionsCount,
    primaryProblem
  });

  const analysisId = buildEntityId('anl');
  await insertPortfolioAnalysis(env, {
    analysisId,
    portfolioId: input.portfolioId,
    snapshotId: input.snapshotId,
    scoreValue,
    scoreStatus,
    primaryProblem,
    primaryAction,
    portfolioDecision,
    actionPlanText: actionPlan.slice(0, 8).join('\n'),
    summaryText,
    messagingJson: JSON.stringify({
      summary: summaryText,
      provenance: {
        kind: 'deterministic_v1',
        generatedAt: new Date().toISOString(),
        importId: input.importId
      }
    })
  });

  await replaceAnalysisInsights(
    env,
    analysisId,
    insights
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 12)
      .map((item) => ({
        id: buildEntityId('ins'),
        insightType: item.type,
        title: item.title,
        message: item.message,
        priority: item.priority
      }))
  );

  return { analysisId, insightsCount: insights.length };
}

function pickTopHolding(items: Array<{ assetId: string; currentValue: number }>): { assetId: string; currentValue: number } {
  if (!items.length) return { assetId: '', currentValue: 0 };
  let best = items[0];
  for (const item of items) {
    if (Number(item.currentValue || 0) > Number(best.currentValue || 0)) best = item;
  }
  return { assetId: best.assetId, currentValue: Number(best.currentValue || 0) };
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

function buildSummaryText(input: {
  scoreValue: number;
  scoreStatus: string;
  topSharePct: number;
  positionsCount: number;
  primaryProblem: string;
}): string {
  const parts: string[] = [];
  parts.push(`Score ${input.scoreValue} (${input.scoreStatus}).`);
  if (input.positionsCount > 0) parts.push(`Você tem ${input.positionsCount} posição(ões).`);
  if (input.topSharePct > 0) parts.push(`Maior concentração: ${input.topSharePct.toFixed(1)}% do total.`);
  if (input.primaryProblem === 'analysis_ready') parts.push('Nenhum alerta crítico foi detectado nesta leitura inicial.');
  if (input.primaryProblem === 'concentracao_excessiva') parts.push('Risco específico alto por concentração.');
  if (input.primaryProblem === 'diversificacao_baixa') parts.push('Carteira pequena tende a oscilar mais.');
  return parts.join(' ');
}

