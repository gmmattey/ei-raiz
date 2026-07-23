# Front e componentes

## Regra base

A interface nova não deve nascer como um HTML gigante acoplado ao backend.
Ela deve ser feita por blocos reutilizáveis.

## Blocos principais

### Shell
- AppShell
- PageScaffold
- Header
- BottomNav
- RetryBanner

### Estados
- LoadingSkeleton
- ErrorState
- EmptyState
- SourceWarningBanner
- GhostValue

### Home
- PortfolioHeroCard
- PrimaryProblemCard
- PrimaryActionCard
- ScoreCard
- DistributionCard
- InsightCard

### Carteira
- PortfolioSummaryCard
- FilterBar
- CategorySectionCard
- HoldingTile
- OrdersSuggestionCard

### Detalhe do ativo
- HoldingHeaderCard
- HoldingMetricsGrid
- HoldingReasonList
- CategoryContextCard
- ExternalLinkCTA

### Perfil e onboarding
- EntryCard
- OnboardingStepHeader
- ProgressStepper
- ChoiceChip
- ProfileContextCard

### Importação
- FilePickerCard
- ImportStatusCard
- ImportTotalsCard
- ImportRowList
- ConflictResolutionCard

### Histórico e radar
- SnapshotCard
- SnapshotComparePanel
- EventTimeline
- RadarAlertCard
- RecommendationCard

## Regras de implementação
- tela não chama serviço direto
- componente não importa mock direto
- componente recebe view model ou props
- ghost mode precisa ser transversal
- loading, empty e erro precisam existir desde o começo

## Objetivo
Deixar o front bom para humano e previsível para o Codex.
