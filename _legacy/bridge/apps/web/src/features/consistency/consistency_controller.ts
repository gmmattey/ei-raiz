import type { AnalysisReadyData, DashboardHomeReadyData, PortfolioDataReady } from '../../core/data/contracts';
import type { AnalysisDataSource, DashboardDataSource, PortfolioDataSource } from '../../core/data/data_sources';
import { createAnalysisController } from '../analysis/analysis_controller';
import { createHomeController } from '../home/home_controller';
import { createPortfolioController } from '../portfolio/portfolio_controller';

export type ConsistencyIssue =
  | { kind: 'missing_home_ready' }
  | { kind: 'missing_analysis_ready' }
  | { kind: 'score_mismatch'; homeScore: number; analysisScore: number }
  | { kind: 'primary_problem_mismatch'; homeCode: string; analysisCode: string }
  | { kind: 'primary_action_mismatch'; homeCode: string; analysisCode: string };

export type ConsistencyReport = {
  ok: boolean;
  issues: ConsistencyIssue[];
  home?: DashboardHomeReadyData;
  analysis?: AnalysisReadyData;
  portfolio?: PortfolioDataReady;
};

/**
 * Controller headless para E2E-021: garante coerencia entre Home/Radar/Carteira.
 * Não "corrige" nada; só sinaliza inconsistencias para a UI/testes.
 */
export function createConsistencyController(input: {
  dashboard: DashboardDataSource;
  analysis: AnalysisDataSource;
  portfolio: PortfolioDataSource;
}): { run(): Promise<ConsistencyReport> } {
  const homeCtrl = createHomeController({ dashboard: input.dashboard });
  const analysisCtrl = createAnalysisController({ analysis: input.analysis });
  const portfolioCtrl = createPortfolioController({ portfolio: input.portfolio });

  return {
    async run() {
      const [home, analysis, portfolio] = await Promise.all([
        homeCtrl.load(),
        analysisCtrl.load(),
        portfolioCtrl.load()
      ]);

      const issues: ConsistencyIssue[] = [];

      const homeReady = home.envelope.ok && home.envelope.data.screenState === 'ready' ? (home.envelope.data as DashboardHomeReadyData) : null;
      const analysisReady = analysis.envelope.ok && analysis.envelope.data.screenState === 'ready' ? (analysis.envelope.data as AnalysisReadyData) : null;
      const portfolioReady = portfolio.envelope.ok && portfolio.envelope.data.screenState === 'ready' ? (portfolio.envelope.data as PortfolioDataReady) : null;

      if (!homeReady) issues.push({ kind: 'missing_home_ready' });
      if (!analysisReady) issues.push({ kind: 'missing_analysis_ready' });

      if (homeReady && analysisReady) {
        if (homeReady.score.value !== analysisReady.score.value) {
          issues.push({ kind: 'score_mismatch', homeScore: homeReady.score.value, analysisScore: analysisReady.score.value });
        }
        if (homeReady.primaryProblem.code !== analysisReady.primaryProblem.code) {
          issues.push({ kind: 'primary_problem_mismatch', homeCode: homeReady.primaryProblem.code, analysisCode: analysisReady.primaryProblem.code });
        }
        if (homeReady.primaryAction.code !== analysisReady.primaryAction.code) {
          issues.push({ kind: 'primary_action_mismatch', homeCode: homeReady.primaryAction.code, analysisCode: analysisReady.primaryAction.code });
        }
      }

      return {
        ok: issues.length === 0,
        issues,
        home: homeReady ?? undefined,
        analysis: analysisReady ?? undefined,
        portfolio: portfolioReady ?? undefined
      };
    }
  };
}

