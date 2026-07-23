import type { ApiEnvelope } from "./types";

export type ScreenStateRedirect = {
  screenState: "redirect_onboarding";
  redirectTo: string;
};

export type EmptyState = {
  title: string;
  body: string;
  ctaLabel: string;
  target: string;
};

// ===== Dashboard (Home) =====

export type DashboardDistributionItem = {
  key: string;
  label: string;
  value: number;
  sharePct: number;
  performancePct: number;
  sourceType: string;
};

export type DashboardHomeReadyData = {
  screenState: "empty" | "portfolio_ready_analysis_pending" | "ready";
  portfolioId: string;
  hero: {
    totalEquity: number;
    totalInvested: number;
    totalProfitLoss: number;
    totalProfitLossPct: number;
    statusLabel: string;
  };
  score: { value: number; status: string; explanation: string };
  primaryProblem: { code: string; title: string; body: string; severity: string };
  primaryAction: { code: string; title: string; body: string; ctaLabel: string; target: string };
  distribution: DashboardDistributionItem[];
  insights: Array<{ kind: string; title: string; body: string }>;
  aiSuggestion?: { status: "disabled" | "ready" | "error"; text?: string; provider?: string; generatedAt?: string; message?: string };
  updatedAt: string;
};

export type DashboardHomeData = ScreenStateRedirect | DashboardHomeReadyData;
export type ApiDashboardHomeEnvelope = ApiEnvelope<DashboardHomeData>;

// ===== Analysis (Radar) =====

export type AnalysisPendingData = {
  screenState: "pending";
  portfolioId: string;
  pendingState: EmptyState;
};

export type AnalysisReadyData = {
  screenState: "ready";
  analysisId: string;
  portfolioId: string;
  snapshotId: string;
  score: { value: number; status: string; explanation: string };
  primaryProblem: { code: string; title: string; body: string; severity: string };
  primaryAction: { code: string; title: string; body: string; ctaLabel: string; target: string };
  portfolioDecision: string;
  actionPlan: string[];
  summary: string;
  insights: Array<{
    kind: string;
    title: string;
    body: string;
    priority: number;
    severity?: "info" | "warning" | "critical";
    ctaLabel?: string;
    target?: string;
  }>;
  generatedAt: string;
};

export type AnalysisData = ScreenStateRedirect | AnalysisPendingData | AnalysisReadyData;
export type ApiAnalysisEnvelope = ApiEnvelope<AnalysisData>;

// ===== Health =====

export type HealthData = {
  status: string;
  appEnv: string;
  version: string;
  services: Record<string, string>;
};
export type ApiHealthEnvelope = ApiEnvelope<HealthData>;

// ===== Profile / Context =====

export type ProfilePlatformsUsed = {
  platformIds: string[];
  otherPlatforms: string[];
};

export type ProfileDisplayPreferences = {
  ghostMode: boolean;
};

export type ProfileContextPayload = {
  financialGoal: string | null;
  monthlyIncomeRange: string | null;
  monthlyInvestmentTarget: number | null;
  availableToInvest: number | null;
  riskProfileSelfDeclared: string | null;
  riskProfileQuizResult: string | null;
  riskProfileEffective: string | null;
  investmentHorizon: string | null;
  platformsUsed: ProfilePlatformsUsed | null;
  displayPreferences: ProfileDisplayPreferences | null;
};

export type ProfileOnboardingState = {
  currentStep: string;
  completed: boolean;
  completedAt: string | null;
  homeUnlocked: boolean;
  completedSteps: string[];
  missing: string[];
};

export type ProfileBackendHealth = {
  status: string;
  appEnv: string;
  apiVersion: string;
  services: Record<string, string>;
};

export type ProfileContextGetData = {
  userId: string;
  portfolioId: string | null;
  context: ProfileContextPayload;
  onboarding: ProfileOnboardingState;
  backendHealth: ProfileBackendHealth;
};

export type ProfileContextPutData = Omit<ProfileContextGetData, "backendHealth">;

export type ProfileContextStep = "goal" | "risk_quiz" | "income_horizon" | "platforms";

export type ProfileContextPutRequest = {
  context?: Partial<ProfileContextPayload>;
  step?: ProfileContextStep;
} & Partial<ProfileContextPayload>;

export type ApiProfileContextGetEnvelope = ApiEnvelope<ProfileContextGetData>;
export type ApiProfileContextPutEnvelope = ApiEnvelope<ProfileContextPutData>;

// ===== Auth =====

export type AuthRegisterRequest = {
  cpf: string;
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  rememberDevice?: boolean;
};

export type AuthRegisterData = {
  user: { id: string; cpf: string; email: string; displayName: string; emailVerified: boolean };
  portfolio: { id: string; isPrimary: boolean };
  session: { id: string; rememberDevice: boolean; lockoutPolicy: { maxFailedAttempts: number; lockMinutes: number } };
  nextStep: string;
};

export type ApiAuthRegisterEnvelope = ApiEnvelope<AuthRegisterData>;

export type AuthLoginRequest = {
  identifier: string;
  password: string;
  rememberDevice?: boolean;
};

export type AuthLoginData = {
  authenticated: boolean;
  userId: string;
  portfolioId: string | null;
  rememberDevice: boolean;
  emailVerified: boolean;
  nextStep: string;
  lockoutPolicy: { maxFailedAttempts: number; lockMinutes: number };
};

export type ApiAuthLoginEnvelope = ApiEnvelope<AuthLoginData>;

export type AuthSessionData =
  | { authenticated: false; nextStep: string }
  | { authenticated: true; userId: string; portfolioId: string | null; emailVerified: boolean; nextStep: string };

export type ApiAuthSessionEnvelope = ApiEnvelope<AuthSessionData>;

export type AuthLogoutData = {
  authenticated: false;
  status: string;
  nextStep: string;
};

export type ApiAuthLogoutEnvelope = ApiEnvelope<AuthLogoutData>;

// ===== Portfolio =====

export type PortfolioFilters = {
  performance: "all" | "best" | "worst";
};

export type PortfolioHolding = {
  id: string;
  assetId: string;
  code: string | null;
  name: string;
  categoryKey: string;
  categoryLabel: string;
  platformId: string | null;
  platformName: string | null;
  quantity: number | null;
  averagePrice: number | null;
  currentPrice: number | null;
  currentValue: number;
  investedAmount: number | null;
  performanceValue: number | null;
  performancePct: number | null;
  allocationPct: number | null;
  quotationStatus: string;
};

export type PortfolioGroup = {
  categoryKey: string;
  categoryLabel: string;
  totalInvested: number;
  totalCurrent: number;
  totalProfitLoss: number;
  totalProfitLossPct: number;
  holdings: PortfolioHolding[];
};

export type PortfolioDataEmpty = {
  screenState: "empty";
  portfolioId: string;
  emptyState: EmptyState;
  summary: {
    totalEquity: number;
    totalInvested: number;
    totalProfitLoss: number;
    totalProfitLossPct: number;
    statusLabel: string;
  };
  groups: [];
  filters: PortfolioFilters;
  orders: unknown[];
};

export type PortfolioDataReady = {
  screenState: "ready";
  portfolioId: string;
  summary: {
    totalEquity: number;
    totalInvested: number;
    totalProfitLoss: number;
    totalProfitLossPct: number;
    statusLabel: string;
  };
  groups: PortfolioGroup[];
  filters: PortfolioFilters;
  orders: unknown[];
};

export type PortfolioData = ScreenStateRedirect | PortfolioDataEmpty | PortfolioDataReady;
export type ApiPortfolioEnvelope = ApiEnvelope<PortfolioData>;

// ===== Holding detail =====

export type HoldingDetailDataReady = {
  // O payload "ready" nao traz screenState/redirectTo no runtime.
  // Declaramos como opcionais (undefined) para permitir narrowing e evitar acesso ilegal em unions.
  screenState?: undefined;
  redirectTo?: undefined;
  holding: PortfolioHolding & {
    recommendation: string;
    statusLabel: string;
    notes: string;
    stopLoss: number | null;
    targetPrice: number | null;
    sourceKind: string;
    assetTypeCode: string;
  };
  ranking: {
    score: number;
    status: string;
    motives: string[];
    opportunityScore: number;
  };
  recommendation: {
    code: string;
    title: string;
    body: string;
  };
  categoryContext: {
    categoryKey: string;
    categoryLabel: string;
    categoryRisk: string;
    categoryRecommendation: string;
    primaryMessage: string;
    holdingsCount: number;
    totalCurrent: number;
    totalInvested: number;
    totalProfitLoss: number;
    totalProfitLossPct: number;
  };
  externalLink: string | null;
};

export type HoldingDetailData = ScreenStateRedirect | HoldingDetailDataReady;
export type ApiHoldingDetailEnvelope = ApiEnvelope<HoldingDetailData>;

// ===== History snapshots =====

export type HistorySnapshotsEmptyData = {
  screenState: "empty";
  portfolioId: string;
  emptyState: EmptyState;
  summary: { totalSnapshots: number; latestReferenceDate: string | null };
  snapshots: Array<unknown>;
};

export type HistorySnapshotsReadyData = {
  screenState: "ready";
  portfolioId: string;
  summary: { totalSnapshots: number; latestReferenceDate: string | null };
  snapshots: Array<{
    id: string;
    referenceDate: string;
    totalEquity: number;
    totalInvested: number;
    totalProfitLoss: number;
    totalProfitLossPct: number;
    createdAt: string;
    analysisBadge: null | { status: string; primaryProblem: string; primaryAction: string; scoreValue?: number };
  }>;
};

export type HistorySnapshotsData = ScreenStateRedirect | HistorySnapshotsEmptyData | HistorySnapshotsReadyData;
export type ApiHistorySnapshotsEnvelope = ApiEnvelope<HistorySnapshotsData>;

// ===== History timeline =====

export type HistoryTimelineItemSnapshot = {
  kind: "snapshot";
  id: string;
  occurredAt: string;
  referenceDate: string;
  createdAt: string;
  totals: {
    totalEquity: number;
    totalInvested: number;
    totalProfitLoss: number;
    totalProfitLossPct: number;
  };
  recommendation: null | {
    status: string;
    primaryProblem: string;
    primaryAction: string;
    scoreValue?: number;
  };
};

export type HistoryTimelineItemEvent = {
  kind: "event";
  id: string;
  occurredAt: string;
  portfolioId: string | null;
  type: string;
  status: string;
  message: string | null;
};

export type HistoryTimelineEmptyData = {
  screenState: "empty";
  portfolioId: string;
  emptyState: EmptyState;
  summary: { totalItems: number; totalSnapshots: number; totalEvents: number; latestOccurredAt: string | null };
  items: Array<never>;
};

export type HistoryTimelineReadyData = {
  screenState: "ready";
  portfolioId: string;
  summary: { totalItems: number; totalSnapshots: number; totalEvents: number; latestOccurredAt: string | null };
  items: Array<HistoryTimelineItemSnapshot | HistoryTimelineItemEvent>;
};

export type HistoryTimelineData = ScreenStateRedirect | HistoryTimelineEmptyData | HistoryTimelineReadyData;
export type ApiHistoryTimelineEnvelope = ApiEnvelope<HistoryTimelineData>;

// ===== History imports center =====

export type HistoryImportsEmptyData = {
  screenState: "empty";
  portfolioId: string;
  emptyState: EmptyState;
  summary: {
    totalImports: number;
    pendingImports: number;
    completedImports: number;
    failedImports: number;
  };
  imports: Array<never>;
};

export type HistoryImportsReadyData = {
  screenState: "ready";
  portfolioId: string;
  summary: {
    totalImports: number;
    pendingImports: number;
    completedImports: number;
    failedImports: number;
  };
  imports: Array<{
    id: string;
    origin: string;
    originLabel: string;
    status: string;
    statusLabel: string;
    fileName: string | null;
    mimeType: string | null;
    totals: ImportTotals;
    createdAt: string;
    updatedAt: string;
    snapshot: null | { id: string; referenceDate: string | null; target: string };
    primaryAction: { code: string; title: string; target: string };
    secondaryAction: null | { code: string; title: string; target: string };
  }>;
};

export type HistoryImportsData = ScreenStateRedirect | HistoryImportsEmptyData | HistoryImportsReadyData;
export type ApiHistoryImportsEnvelope = ApiEnvelope<HistoryImportsData>;

// ===== Imports =====

export type ImportTotals = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
};

export type ImportStartData = {
  importId: string;
  status: string;
  nextStep: string;
  totals: ImportTotals;
  document: unknown | null;
  importable: boolean;
};

export type ApiImportStartEnvelope = ApiEnvelope<ImportStartData>;

export type ImportPreviewRow = {
  id: string;
  rowNumber: number;
  source: Record<string, unknown>;
  normalized: Record<string, unknown>;
  resolutionStatus: string;
  errorMessage: string | null;
  warnings: string[];
  fieldSources: Record<string, unknown>;
  fieldConfidences: Record<string, unknown>;
  reviewMeta: Record<string, unknown>;
};

export type ImportPreviewData = {
  importId: string;
  status: string;
  origin: string;
  totals: ImportTotals;
  readyToCommit: boolean;
  document: unknown | null;
  importable: boolean;
  rows: ImportPreviewRow[];
};

export type ApiImportPreviewEnvelope = ApiEnvelope<ImportPreviewData>;

export type ImportCommitData = {
  importId: string;
  status: string;
  createdSnapshotId: string;
  affectedPositions: number;
  nextStep: string;
};

export type ApiImportCommitEnvelope = ApiEnvelope<ImportCommitData>;

// ===== Import ops (engine status) =====

export type ImportEngineStatusData = ScreenStateRedirect | {
  screenState: "ready";
  importId: string;
  origin: string;
  importStatus: string;
  engineStatus: {
    status: string;
    label: string;
    readyForReview: boolean;
    readyToCommit: boolean;
  };
  document: {
    parserMode: string;
    confidence: number;
    importable: boolean;
  };
  summary: {
    totalRows: number;
    processedRows: number;
    validRows: number;
    invalidRows: number;
    duplicateRows: number;
    lowConfidenceRows: number;
    blockedRows: number;
    failedRows: number;
    fallbackRows: number;
    manualDecisionRows: number;
    aiAssistedRows: number;
  };
  states: Record<string, boolean>;
  targets: {
    preview: string;
    detail: string;
    conflicts: string | null;
    commit: string | null;
  };
};

export type ApiImportEngineStatusEnvelope = ApiEnvelope<ImportEngineStatusData>;

// ===== Import ops detail =====

export type ImportDetailRow = {
  rowId: string;
  rowNumber: number;
  resolutionStatus: string;
  errorMessage: string | null;
  source: Record<string, unknown>;
  normalized: Record<string, unknown>;
  fieldSources: Record<string, unknown>;
  fieldConfidences: Record<string, unknown>;
  lowConfidenceFields: Array<{ field: string; confidence: number; source: string }>;
  warnings: string[];
  reviewMeta: Record<string, unknown>;
  documentMeta: Record<string, unknown>;
  duplicateCandidates: unknown[];
  operationalFlags: {
    hasError: boolean;
    hasConflict: boolean;
    hasLowConfidence: boolean;
    usedFallback: boolean;
    usedAi: boolean;
    usedManualDecision: boolean;
    nonImportable: boolean;
  };
  decision: { code: string; label: string; origin: string; details: string };
};

export type ImportDetailData = ScreenStateRedirect | {
  screenState: "ready";
  importId: string;
  importMeta: Record<string, unknown>;
  operationalSummary: Record<string, unknown>;
  issueSummary: Record<string, unknown>;
  decisionSummary: Record<string, unknown>;
  snapshot: null | { id: string; referenceDate: string; target: string };
  rows: ImportDetailRow[];
};

export type ApiImportDetailEnvelope = ApiEnvelope<ImportDetailData>;

// ===== Import conflicts (duplicate resolution) =====

export type ImportDuplicateAction =
  | "keep_current"
  | "replace_existing"
  | "consolidate"
  | "ignore_import";

export type ImportConflictItem = {
  rowId: string;
  rowNumber: number;
  resolutionStatus: string;
  errorMessage: string | null;
  incoming: {
    sourceKind: string;
    code: string;
    name: string;
    quantity: number;
    investedAmount: number;
    currentAmount: number;
    categoryLabel: string;
  };
  duplicateCandidates: Array<{
    assetId: string;
    assetCode: string;
    assetName: string;
    quantity: number;
    investedAmount: number;
    currentAmount: number;
  }>;
  allowedActions: Array<{ code: ImportDuplicateAction; label: string }>;
  target: {
    preview: string;
    resolve: string;
  };
};

export type ImportConflictsData =
  | ScreenStateRedirect
  | {
      screenState: "empty";
      importId: string;
      origin: string;
      summary: {
        totalConflicts: number;
        unresolvedConflicts: number;
        resolvedConflicts: number;
      };
      emptyState: EmptyState;
      conflicts: [];
    }
  | {
      screenState: "ready";
      importId: string;
      origin: string;
      summary: {
        totalConflicts: number;
        unresolvedConflicts: number;
        resolvedConflicts: number;
      };
      conflicts: ImportConflictItem[];
    };

export type ApiImportConflictsEnvelope = ApiEnvelope<ImportConflictsData>;

export type ImportResolveDuplicateRequest = {
  action: ImportDuplicateAction;
};

export type ImportResolveDuplicateData = {
  importId: string;
  rowId: string;
  status: string;
  action: ImportDuplicateAction;
  beforeStatus: string;
  afterStatus: string;
  nextStep: string;
};

export type ApiImportResolveDuplicateEnvelope = ApiEnvelope<ImportResolveDuplicateData>;
