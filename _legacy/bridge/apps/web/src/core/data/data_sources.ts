import type {
  ApiAnalysisEnvelope,
  ApiDashboardHomeEnvelope,
  ApiHoldingDetailEnvelope,
  ApiImportCommitEnvelope,
  ApiImportPreviewEnvelope,
  ApiImportStartEnvelope,
  ApiImportsCenterEnvelope,
  ApiPortfolioEnvelope,
  ApiHistorySnapshotsEnvelope,
  ApiHistoryTimelineEnvelope,
  ApiProfileContextGetEnvelope,
  ApiProfileContextPutEnvelope,
  ProfileContextPutRequest
} from './contracts';

export interface AnalysisDataSource {
  getAnalysis(): Promise<ApiAnalysisEnvelope>;
}

export interface DashboardDataSource {
  getDashboardHome(): Promise<ApiDashboardHomeEnvelope>;
}

export interface HistoryDataSource {
  getHistorySnapshots(input?: { limit?: number }): Promise<ApiHistorySnapshotsEnvelope>;
  getHistoryTimeline(input?: { limit?: number }): Promise<ApiHistoryTimelineEnvelope>;
}

export interface PortfolioDataSource {
  getPortfolio(input?: { performance?: 'all' | 'best' | 'worst' }): Promise<ApiPortfolioEnvelope>;
}

export interface HoldingDetailDataSource {
  getHoldingDetail(input: { portfolioId: string; holdingId: string }): Promise<ApiHoldingDetailEnvelope>;
}

export interface ProfileDataSource {
  getProfileContext(): Promise<ApiProfileContextGetEnvelope>;
  putProfileContext(input: ProfileContextPutRequest): Promise<ApiProfileContextPutEnvelope>;
}

export interface ImportsCenterDataSource {
  getImportsCenter(): Promise<ApiImportsCenterEnvelope>;
}

export interface ImportsDataSource {
  startImport(input?: { payload?: unknown }): Promise<ApiImportStartEnvelope>;
  getImportPreview(input: { importId: string }): Promise<ApiImportPreviewEnvelope>;
  commitImport(input: { importId: string }): Promise<ApiImportCommitEnvelope>;
}

export interface AppDataSources {
  dashboard: DashboardDataSource;
  analysis: AnalysisDataSource;
  history: HistoryDataSource;
  portfolio: PortfolioDataSource;
  holdingDetail: HoldingDetailDataSource;
  profile: ProfileDataSource;
  importsCenter: ImportsCenterDataSource;
  imports: ImportsDataSource;
}

