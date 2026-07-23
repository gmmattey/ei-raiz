class DashboardPayload {
  const DashboardPayload({
    required this.summary,
    required this.actions,
    required this.primaryAlert,
    required this.alerts,
    required this.orders,
    required this.topFunds,
    required this.investments,
    required this.previdencias,
    required this.previdenciaInfo,
    required this.tip,
    required this.profile,
    required this.score,
    required this.generalAdvice,
    required this.messaging,
    required this.actionPlan,
    required this.decisionHistory,
    required this.intelligentAlerts,
    required this.assetRanking,
    required this.dataSource,
    required this.sourceWarning,
    required this.categorySnapshots,
    required this.dataProfiles,
    required this.operations,
    required this.categories,
    required this.portfolioDecision,
    required this.mobileHome,
    required this.updatedAt,
  });

  factory DashboardPayload.fromJson(Map<String, dynamic> json) {
    final actions = _asMapList(
      json['actions'],
    ).map(PortfolioHolding.fromActionJson).toList();
    final investments = _asMapList(
      json['investments'],
    ).map(PortfolioHolding.fromFundJson).toList();
    final previdencias = _asMapList(
      json['previdencias'],
    ).map(PortfolioHolding.fromPensionJson).toList();

    return DashboardPayload(
      summary: PortfolioSummary.fromJson(_asMap(json['summary'])),
      actions: actions,
      primaryAlert: PrimaryAlert.fromJson(_asMap(json['alert'])),
      alerts: _asMapList(json['alerts']).map(DashboardAlert.fromJson).toList(),
      orders: OrderBook.fromJson(_asMap(json['orders'])),
      topFunds: _asMapList(json['fundosTop']).map(TopFundEntry.fromJson).toList(),
      investments: investments,
      previdencias: previdencias,
      previdenciaInfo: PensionOverview.fromJson(
        _asMap(json['previdenciaInfo']),
      ),
      tip: _stringFrom(json['tip']),
      profile: PortfolioProfile.fromJson(_asMap(json['profile'])),
      score: PortfolioScore.fromJson(_asMap(json['score'])),
      generalAdvice: _stringFrom(json['generalAdvice']),
      messaging: PortfolioMessaging.fromJson(_asMap(json['messaging'])),
      actionPlan: ActionPlan.fromJson(_asMap(json['actionPlan'])),
      decisionHistory: _asMapList(
        json['decisionHistory'],
      ).map(DecisionRecord.fromJson).toList(),
      intelligentAlerts: _asMapList(
        json['intelligentAlerts'],
      ).map(IntelligentAlert.fromJson).toList(),
      assetRanking: AssetRanking.fromJson(_asMap(json['assetRanking'])),
      dataSource: _stringFrom(json['dataSource']),
      sourceWarning: _stringFrom(json['sourceWarning']),
      categorySnapshots: _asMapList(
        json['categorySnapshots'],
      ).map(CategorySnapshot.fromJson).toList(),
      dataProfiles: DashboardDataProfiles.fromJson(_asMap(json['dataProfiles'])),
      operations: OperationsCapabilities.fromJson(_asMap(json['operations'])),
      categories: CategoryHealthSet.fromJson(_asMap(json['categories'])),
      portfolioDecision: PortfolioDecision.fromJson(
        _asMap(json['portfolioDecision']),
      ),
      mobileHome: MobileHomeSnapshot.fromJson(_asMap(json['mobileHome'])),
      updatedAt: _dateFrom(json['updatedAt']),
    );
  }

  final PortfolioSummary summary;
  final List<PortfolioHolding> actions;
  final PrimaryAlert primaryAlert;
  final List<DashboardAlert> alerts;
  final OrderBook orders;
  final List<TopFundEntry> topFunds;
  final List<PortfolioHolding> investments;
  final List<PortfolioHolding> previdencias;
  final PensionOverview previdenciaInfo;
  final String tip;
  final PortfolioProfile profile;
  final PortfolioScore score;
  final String generalAdvice;
  final PortfolioMessaging messaging;
  final ActionPlan actionPlan;
  final List<DecisionRecord> decisionHistory;
  final List<IntelligentAlert> intelligentAlerts;
  final AssetRanking assetRanking;
  final String dataSource;
  final String sourceWarning;
  final List<CategorySnapshot> categorySnapshots;
  final DashboardDataProfiles dataProfiles;
  final OperationsCapabilities operations;
  final CategoryHealthSet categories;
  final PortfolioDecision portfolioDecision;
  final MobileHomeSnapshot mobileHome;
  final DateTime? updatedAt;

  Map<String, List<PortfolioHolding>> get holdingsByCategory {
    return <String, List<PortfolioHolding>>{
      'acoes': actions,
      'fundos': investments,
      'previdencia': previdencias,
    };
  }

  String get dataSourceLabel {
    switch (dataSource) {
      case 'bigquery':
        return 'BigQuery';
      case 'spreadsheet-fallback':
        return 'Base operacional secundaria';
      default:
        return dataSource.isEmpty ? 'Fonte nao informada' : dataSource;
    }
  }

  String get executiveStatusText {
    return messaging.executiveSummary.statusText.isNotEmpty
        ? messaging.executiveSummary.statusText
        : 'Leitura operacional em progresso.';
  }

  String get performanceText {
    if (messaging.executiveSummary.performanceText.isNotEmpty) {
      return messaging.executiveSummary.performanceText;
    }
    return _buildPerformanceCompact(summary.totalPerformanceRaw, signed: true);
  }

  String get missionTitle {
    if (actionPlan.actionLabel.isNotEmpty) {
      return actionPlan.actionLabel;
    }
    if (messaging.primaryRecommendation.title.isNotEmpty) {
      return messaging.primaryRecommendation.title;
    }
    return 'Manter plano';
  }

  String get missionSupport {
    if (actionPlan.justification.isNotEmpty) {
      return actionPlan.justification;
    }
    if (messaging.primaryRecommendation.reason.isNotEmpty) {
      return messaging.primaryRecommendation.reason;
    }
    return executiveStatusText;
  }

  List<PortfolioHolding> holdingsFor(String categoryKey) {
    return holdingsByCategory[_normalizeCategoryKey(categoryKey)] ??
        const <PortfolioHolding>[];
  }

  CategorySnapshot? snapshotFor(String categoryKey) {
    final normalized = _normalizeCategoryKey(categoryKey);
    for (final snapshot in categorySnapshots) {
      if (_normalizeCategoryKey(snapshot.key) == normalized) {
        return snapshot;
      }
    }
    return null;
  }

  CategoryHealth? healthFor(String categoryKey) {
    return categories.forKey(categoryKey);
  }

  PortfolioHolding? holdingById(String categoryKey, String holdingId) {
    final normalizedId = holdingId.trim().toLowerCase();
    for (final holding in holdingsFor(categoryKey)) {
      if (holding.id.trim().toLowerCase() == normalizedId) {
        return holding;
      }
    }
    return null;
  }

  RankedAsset? rankingForTicker(String ticker) {
    return assetRanking.itemByTicker(ticker);
  }
}

class PortfolioSummary {
  const PortfolioSummary({
    required this.totalLabel,
    required this.totalRaw,
    required this.totalInvestedRaw,
    required this.totalPerformanceRaw,
    required this.actionsLabel,
    required this.actionsRaw,
    required this.actionsInvestedRaw,
    required this.actionsPerformanceRaw,
    required this.fundsLabel,
    required this.fundsRaw,
    required this.fundsInvestedRaw,
    required this.fundsPerformanceRaw,
    required this.pensionLabel,
    required this.pensionRaw,
    required this.pensionInvestedRaw,
    required this.pensionPerformanceRaw,
    required this.preOrdersLabel,
  });

  factory PortfolioSummary.fromJson(Map<String, dynamic> json) {
    return PortfolioSummary(
      totalLabel: _stringFrom(json['total'], fallback: 'Sem dados'),
      totalRaw: _doubleFrom(json['totalRaw']),
      totalInvestedRaw: _doubleFrom(json['totalInvestidoRaw']),
      totalPerformanceRaw: _doubleFrom(json['totalPerformanceRaw']),
      actionsLabel: _stringFrom(json['acoes'], fallback: 'Sem dados'),
      actionsRaw: _doubleFrom(json['acoesRaw']),
      actionsInvestedRaw: _doubleFrom(json['acoesInvestidoRaw']),
      actionsPerformanceRaw: _doubleFrom(json['acoesPerformanceRaw']),
      fundsLabel: _stringFrom(json['fundos'], fallback: 'Sem dados'),
      fundsRaw: _doubleFrom(json['fundosRaw']),
      fundsInvestedRaw: _doubleFrom(json['fundosInvestidoRaw']),
      fundsPerformanceRaw: _doubleFrom(json['fundosPerformanceRaw']),
      pensionLabel: _stringFrom(json['previdencia'], fallback: 'Sem dados'),
      pensionRaw: _doubleFrom(json['previdenciaRaw']),
      pensionInvestedRaw: _doubleFrom(json['previdenciaInvestidoRaw']),
      pensionPerformanceRaw: _doubleFrom(json['previdenciaPerformanceRaw']),
      preOrdersLabel: _stringFrom(json['preOrdens'], fallback: 'Sem ordens'),
    );
  }

  final String totalLabel;
  final double totalRaw;
  final double totalInvestedRaw;
  final double totalPerformanceRaw;
  final String actionsLabel;
  final double actionsRaw;
  final double actionsInvestedRaw;
  final double actionsPerformanceRaw;
  final String fundsLabel;
  final double fundsRaw;
  final double fundsInvestedRaw;
  final double fundsPerformanceRaw;
  final String pensionLabel;
  final double pensionRaw;
  final double pensionInvestedRaw;
  final double pensionPerformanceRaw;
  final String preOrdersLabel;
}

class PortfolioScore {
  const PortfolioScore({
    required this.value,
    required this.status,
    required this.explanation,
    required this.breakdown,
  });

  factory PortfolioScore.fromJson(Map<String, dynamic> json) {
    return PortfolioScore(
      value: _intFrom(json['score']),
      status: _stringFrom(json['status'], fallback: 'Em leitura'),
      explanation: _stringFrom(json['explanation']),
      breakdown: ScoreBreakdown.fromJson(_asMap(json['breakdown'])),
    );
  }

  final int value;
  final String status;
  final String explanation;
  final ScoreBreakdown breakdown;
}

class ScoreBreakdown {
  const ScoreBreakdown({
    required this.capitalPoints,
    required this.categoryPoints,
    required this.institutionPoints,
    required this.healthPoints,
  });

  factory ScoreBreakdown.fromJson(Map<String, dynamic> json) {
    return ScoreBreakdown(
      capitalPoints: _intFrom(json['capitalPoints']),
      categoryPoints: _intFrom(json['categoryPoints']),
      institutionPoints: _intFrom(json['institutionPoints']),
      healthPoints: _intFrom(json['healthPoints']),
    );
  }

  final int capitalPoints;
  final int categoryPoints;
  final int institutionPoints;
  final int healthPoints;
}

class PortfolioMessaging {
  const PortfolioMessaging({
    required this.executiveSummary,
    required this.primaryRecommendation,
    required this.supportNotes,
    required this.alertsSummary,
  });

  factory PortfolioMessaging.fromJson(Map<String, dynamic> json) {
    return PortfolioMessaging(
      executiveSummary: ExecutiveSummary.fromJson(
        _asMap(json['executiveSummary']),
      ),
      primaryRecommendation: PrimaryRecommendation.fromJson(
        _asMap(json['primaryRecommendation']),
      ),
      supportNotes: SupportNotes.fromJson(_asMap(json['supportNotes'])),
      alertsSummary: AlertsSummary.fromJson(_asMap(json['alertsSummary'])),
    );
  }

  final ExecutiveSummary executiveSummary;
  final PrimaryRecommendation primaryRecommendation;
  final SupportNotes supportNotes;
  final AlertsSummary alertsSummary;
}

class ExecutiveSummary {
  const ExecutiveSummary({
    required this.statusText,
    required this.performanceText,
    required this.scoreStatusText,
  });

  factory ExecutiveSummary.fromJson(Map<String, dynamic> json) {
    return ExecutiveSummary(
      statusText: _stringFrom(json['statusText']),
      performanceText: _stringFrom(json['performanceText']),
      scoreStatusText: _stringFrom(json['scoreStatusText']),
    );
  }

  final String statusText;
  final String performanceText;
  final String scoreStatusText;
}

class PrimaryRecommendation {
  const PrimaryRecommendation({
    required this.title,
    required this.reason,
    required this.impact,
    required this.actionText,
    required this.asset,
  });

  factory PrimaryRecommendation.fromJson(Map<String, dynamic> json) {
    return PrimaryRecommendation(
      title: _stringFrom(json['title']),
      reason: _stringFrom(json['reason']),
      impact: _stringFrom(json['impact']),
      actionText: _stringFrom(json['actionText']),
      asset: _stringFrom(json['asset']),
    );
  }

  final String title;
  final String reason;
  final String impact;
  final String actionText;
  final String asset;
}

class SupportNotes {
  const SupportNotes({required this.scoreNote, required this.squadTip});

  factory SupportNotes.fromJson(Map<String, dynamic> json) {
    return SupportNotes(
      scoreNote: _stringFrom(json['scoreNote']),
      squadTip: _stringFrom(json['squadTip']),
    );
  }

  final String scoreNote;
  final String squadTip;
}

class AlertsSummary {
  const AlertsSummary({required this.headline, required this.lines});

  factory AlertsSummary.fromJson(Map<String, dynamic> json) {
    return AlertsSummary(
      headline: _stringFrom(json['headline']),
      lines: _dynamicListFrom(json['lines'])
          .map((item) => _stringFrom(item))
          .where((line) => line.isNotEmpty)
          .toList(),
    );
  }

  final String headline;
  final List<String> lines;
}

class ActionPlan {
  const ActionPlan({
    required this.actionLabel,
    required this.priority,
    required this.justification,
    required this.impact,
    required this.alternatives,
    required this.context,
  });

  factory ActionPlan.fromJson(Map<String, dynamic> json) {
    return ActionPlan(
      actionLabel: _stringFrom(json['acao_principal']),
      priority: _stringFrom(json['prioridade']),
      justification: _stringFrom(json['justificativa']),
      impact: _stringFrom(json['impacto']),
      alternatives: _dynamicListFrom(json['alternativas'])
          .map((item) => _stringFrom(item))
          .where((line) => line.isNotEmpty)
          .toList(),
      context: ActionContext.fromJson(_asMap(json['context'])),
    );
  }

  final String actionLabel;
  final String priority;
  final String justification;
  final String impact;
  final List<String> alternatives;
  final ActionContext context;
}

class ActionContext {
  const ActionContext({
    required this.urgency,
    required this.focusCategory,
    required this.priorityReason,
    required this.topRiskAsset,
    required this.topOpportunityAsset,
  });

  factory ActionContext.fromJson(Map<String, dynamic> json) {
    return ActionContext(
      urgency: _stringFrom(json['urgency']),
      focusCategory: _stringFrom(json['focusCategory']),
      priorityReason: _stringFrom(json['priorityReason']),
      topRiskAsset: _stringFrom(json['topRiskAsset']),
      topOpportunityAsset: _stringFrom(json['topOpportunityAsset']),
    );
  }

  final String urgency;
  final String focusCategory;
  final String priorityReason;
  final String topRiskAsset;
  final String topOpportunityAsset;
}

class PortfolioDecision {
  const PortfolioDecision({
    required this.actionText,
    required this.focusCategoryLabel,
    required this.urgency,
    required this.status,
    required this.criticalPoint,
    required this.categoryKey,
    required this.issueKind,
  });

  factory PortfolioDecision.fromJson(Map<String, dynamic> json) {
    return PortfolioDecision(
      actionText: _stringFrom(json['actionText']),
      focusCategoryLabel: _stringFrom(json['focusCategoryLabel']),
      urgency: _stringFrom(json['urgency']),
      status: _stringFrom(json['status']),
      criticalPoint: _stringFrom(json['criticalPoint']),
      categoryKey: _normalizeCategoryKey(_stringFrom(json['categoryKey'])),
      issueKind: _stringFrom(json['issueKind']),
    );
  }

  final String actionText;
  final String focusCategoryLabel;
  final String urgency;
  final String status;
  final String criticalPoint;
  final String categoryKey;
  final String issueKind;
}

class CategorySnapshot {
  const CategorySnapshot({
    required this.key,
    required this.label,
    required this.totalLabel,
    required this.totalRaw,
    required this.shareLabel,
    required this.shareRaw,
    required this.performanceLabel,
    required this.performanceRaw,
    required this.status,
    required this.recommendation,
    required this.colorHex,
    required this.sourceType,
    required this.trend,
  });

  factory CategorySnapshot.fromJson(Map<String, dynamic> json) {
    return CategorySnapshot(
      key: _normalizeCategoryKey(_stringFrom(json['key'])),
      label: _stringFrom(json['label'], fallback: 'Carteira'),
      totalLabel: _stringFrom(json['totalLabel'], fallback: 'Sem dados'),
      totalRaw: _doubleFrom(json['totalRaw']),
      shareLabel: _stringFrom(json['shareLabel'], fallback: '0,0%'),
      shareRaw: _doubleFrom(json['shareRaw']),
      performanceLabel: _stringFrom(
        json['performanceLabel'],
        fallback: _buildPerformanceCompact(_doubleFrom(json['performanceRaw'])),
      ),
      performanceRaw: _doubleFrom(json['performanceRaw']),
      status: _stringFrom(json['status'], fallback: 'Seguro'),
      recommendation: _stringFrom(json['recommendation'], fallback: 'Manter'),
      colorHex: _stringFrom(json['color'], fallback: '#68D8FF'),
      sourceType: _stringFrom(json['sourceType']),
      trend: _stringFrom(json['trend']),
    );
  }

  final String key;
  final String label;
  final String totalLabel;
  final double totalRaw;
  final String shareLabel;
  final double shareRaw;
  final String performanceLabel;
  final double performanceRaw;
  final String status;
  final String recommendation;
  final String colorHex;
  final String sourceType;
  final String trend;
}

class CategoryHealthSet {
  const CategoryHealthSet({
    required this.actions,
    required this.funds,
    required this.pension,
  });

  factory CategoryHealthSet.fromJson(Map<String, dynamic> json) {
    return CategoryHealthSet(
      actions: CategoryHealth.fromJson('acoes', _asMap(json['actions'])),
      funds: CategoryHealth.fromJson('fundos', _asMap(json['funds'])),
      pension: CategoryHealth.fromJson(
        'previdencia',
        _asMap(json['previdencia']),
      ),
    );
  }

  final CategoryHealth actions;
  final CategoryHealth funds;
  final CategoryHealth pension;

  CategoryHealth? forKey(String key) {
    switch (_normalizeCategoryKey(key)) {
      case 'acoes':
        return actions;
      case 'fundos':
        return funds;
      case 'previdencia':
        return pension;
      default:
        return null;
    }
  }
}

class CategoryHealth {
  const CategoryHealth({
    required this.key,
    required this.label,
    required this.status,
    required this.risk,
    required this.recommendation,
    required this.primaryAsset,
    required this.primaryMessage,
  });

  factory CategoryHealth.fromJson(String key, Map<String, dynamic> json) {
    final primaryIssue = _asMap(json['primaryIssue']);
    return CategoryHealth(
      key: _normalizeCategoryKey(key),
      label: _stringFrom(json['label'], fallback: _defaultCategoryLabel(key)),
      status: _stringFrom(json['status'], fallback: 'Seguro'),
      risk: _stringFrom(json['risk'], fallback: 'Controlado'),
      recommendation: _stringFrom(json['recommendation'], fallback: 'Manter'),
      primaryAsset: _stringFrom(primaryIssue['asset']),
      primaryMessage: _stringFrom(primaryIssue['message']),
    );
  }

  final String key;
  final String label;
  final String status;
  final String risk;
  final String recommendation;
  final String primaryAsset;
  final String primaryMessage;
}

class PortfolioHolding {
  const PortfolioHolding({
    required this.id,
    required this.categoryKey,
    required this.title,
    required this.subtitle,
    required this.institution,
    required this.institutionIcon,
    required this.observation,
    required this.entryLabel,
    required this.quantityLabel,
    required this.quantityRaw,
    required this.averagePriceLabel,
    required this.averagePriceRaw,
    required this.currentPriceLabel,
    required this.currentPriceRaw,
    required this.currentValueLabel,
    required this.currentValueRaw,
    required this.investedValueRaw,
    required this.absoluteResultLabel,
    required this.performanceLabel,
    required this.performanceRaw,
    required this.shareLabel,
    required this.shareRaw,
    required this.categoryShareLabel,
    required this.categoryShareRaw,
    required this.recommendation,
    required this.statusLabel,
    required this.tagLabel,
    required this.supportLabel,
    required this.detailUrl,
    required this.sourceProfile,
    required this.assetScore,
    required this.smartRecommendation,
    required this.stopRaw,
  });

  factory PortfolioHolding.fromActionJson(Map<String, dynamic> json) {
    return PortfolioHolding(
      id: _stringFrom(
        json['ticker'],
        fallback: _stringFrom(json['name'], fallback: 'acao'),
      ),
      categoryKey: 'acoes',
      title: _stringFrom(json['ticker'], fallback: 'Ativo'),
      subtitle: _stringFrom(json['name']),
      institution: _stringFrom(json['institution']),
      institutionIcon: _stringFrom(json['institutionIcon']),
      observation: _stringFrom(json['observation']),
      entryLabel: _stringFrom(json['entryLabel']),
      quantityLabel: _stringFrom(json['qty']),
      quantityRaw: _doubleFrom(json['qtyRaw']),
      averagePriceLabel: _stringFrom(json['avgPrice']),
      averagePriceRaw: _doubleFrom(json['avgPriceRaw']),
      currentPriceLabel: _stringFrom(json['currentPrice']),
      currentPriceRaw: _doubleFrom(json['currentPriceRaw']),
      currentValueLabel: _stringFrom(json['positionValue'], fallback: 'Sem dados'),
      currentValueRaw: _doubleFrom(json['valorAtualRaw']),
      investedValueRaw: _doubleFrom(json['valorInvestidoRaw']),
      absoluteResultLabel: _stringFrom(json['rendimentoAbs']),
      performanceLabel: _stringFrom(
        json['performanceLabel'],
        fallback: _stringFrom(
          json['rendimentoPct'],
          fallback: _buildPerformanceCompact(_doubleFrom(json['rent'])),
        ),
      ),
      performanceRaw: _doubleFrom(json['rent']),
      shareLabel: _stringFrom(json['portfolioShareLabel']),
      shareRaw: _doubleFrom(json['portfolioShareRaw']),
      categoryShareLabel: _stringFrom(json['categoryShareLabel']),
      categoryShareRaw: _doubleFrom(json['categoryShareRaw']),
      recommendation: _stringFrom(
        json['recommendation'],
        fallback: 'Monitorar',
      ),
      statusLabel: _stringFrom(json['statusLabel'], fallback: 'Comprado'),
      tagLabel: _stringFrom(json['currentPrice'], fallback: 'Mercado'),
      supportLabel: <String>[
        _stringFrom(json['avgPrice']),
        _stringFrom(json['qty']),
      ].where((value) => value.isNotEmpty).join(' | '),
      detailUrl: _stringFrom(json['chartUrl']),
      sourceProfile: SourceDescriptor.empty,
      assetScore: AssetScoreDetails.fromJson(_asMap(json['assetScore'])),
      smartRecommendation: SmartRecommendation.fromJson(
        _asMap(json['smartRecommendation']),
      ),
      stopRaw: _doubleFrom(json['stopRaw']),
    );
  }

  factory PortfolioHolding.fromFundJson(Map<String, dynamic> json) {
    return PortfolioHolding(
      id: _stringFrom(json['name'], fallback: 'fundo'),
      categoryKey: 'fundos',
      title: _stringFrom(json['name'], fallback: 'Fundo'),
      subtitle: _stringFrom(
        json['classification'],
        fallback: _stringFrom(json['strategy']),
      ),
      institution: _stringFrom(json['institution']),
      institutionIcon: _stringFrom(json['institutionIcon']),
      observation: _stringFrom(json['observation']),
      entryLabel: _stringFrom(json['startedAt']),
      quantityLabel: '',
      quantityRaw: 0,
      averagePriceLabel: '',
      averagePriceRaw: 0,
      currentPriceLabel: '',
      currentPriceRaw: _doubleFrom(json['currentPriceRaw']),
      currentValueLabel: _stringFrom(json['valorAtual'], fallback: 'Sem dados'),
      currentValueRaw: _doubleFrom(json['valorAtualRaw']),
      investedValueRaw: _doubleFrom(json['valorInvestidoRaw']),
      absoluteResultLabel: '',
      performanceLabel: _stringFrom(
        json['performanceLabel'],
        fallback: _stringFrom(
          json['rentPct'],
          fallback: _buildPerformanceCompact(_doubleFrom(json['rentRaw'])),
        ),
      ),
      performanceRaw: _doubleFrom(json['rentRaw']),
      shareLabel: _stringFrom(json['portfolioShareLabel']),
      shareRaw: _doubleFrom(json['portfolioShareRaw']),
      categoryShareLabel: _stringFrom(json['categoryShareLabel']),
      categoryShareRaw: _doubleFrom(json['categoryShareRaw']),
      recommendation: _stringFrom(
        json['recommendation'],
        fallback: 'Monitorar',
      ),
      statusLabel: _stringFrom(json['statusLabel'], fallback: 'Ativo'),
      tagLabel: _stringFrom(json['benchmark'], fallback: 'Fundo'),
      supportLabel: <String>[
        _stringFrom(json['strategy']),
        _stringFrom(json['profileLabel']),
      ].where((value) => value.isNotEmpty).join(' | '),
      detailUrl: _stringFrom(
        json['detailUrl'],
        fallback: _stringFrom(json['urlDetalhe']),
      ),
      sourceProfile: SourceDescriptor.fromJson(_asMap(json['sourceProfile'])),
      assetScore: AssetScoreDetails.empty,
      smartRecommendation: SmartRecommendation.empty,
      stopRaw: 0,
    );
  }

  factory PortfolioHolding.fromPensionJson(Map<String, dynamic> json) {
    return PortfolioHolding(
      id: _stringFrom(json['name'], fallback: 'previdencia'),
      categoryKey: 'previdencia',
      title: _stringFrom(json['name'], fallback: 'Plano'),
      subtitle: _stringFrom(
        json['classification'],
        fallback: _stringFrom(json['profileLabel']),
      ),
      institution: _stringFrom(json['institution']),
      institutionIcon: _stringFrom(json['institutionIcon']),
      observation: _stringFrom(json['observation']),
      entryLabel: _stringFrom(json['startedAt']),
      quantityLabel: '',
      quantityRaw: 0,
      averagePriceLabel: '',
      averagePriceRaw: 0,
      currentPriceLabel: '',
      currentPriceRaw: _doubleFrom(json['currentPriceRaw']),
      currentValueLabel: _stringFrom(json['valorAtual'], fallback: 'Sem dados'),
      currentValueRaw: _doubleFrom(json['valorAtualRaw']),
      investedValueRaw: _doubleFrom(
        json['totalAportadoRaw'],
        fallback: _doubleFrom(json['valorInvestidoRaw']),
      ),
      absoluteResultLabel: '',
      performanceLabel: _stringFrom(
        json['performanceLabel'],
        fallback: _stringFrom(
          json['rentPct'],
          fallback: _buildPerformanceCompact(_doubleFrom(json['rentRaw'])),
        ),
      ),
      performanceRaw: _doubleFrom(
        json['performanceRaw'],
        fallback: _doubleFrom(json['rentRaw']),
      ),
      shareLabel: _stringFrom(json['portfolioShareLabel']),
      shareRaw: _doubleFrom(json['portfolioShareRaw']),
      categoryShareLabel: _stringFrom(json['categoryShareLabel']),
      categoryShareRaw: _doubleFrom(json['categoryShareRaw']),
      recommendation: _stringFrom(
        json['recommendation'],
        fallback: 'Monitorar',
      ),
      statusLabel: _stringFrom(json['statusLabel'], fallback: 'Ativo'),
      tagLabel: _stringFrom(json['profileLabel'], fallback: 'Previdencia'),
      supportLabel: <String>[
        _stringFrom(json['classification']),
        _stringFrom(json['institution']),
      ].where((value) => value.isNotEmpty).join(' | '),
      detailUrl: _stringFrom(
        json['detailUrl'],
        fallback: _stringFrom(json['urlDetalhe']),
      ),
      sourceProfile: SourceDescriptor.fromJson(_asMap(json['sourceProfile'])),
      assetScore: AssetScoreDetails.empty,
      smartRecommendation: SmartRecommendation.empty,
      stopRaw: 0,
    );
  }

  final String id;
  final String categoryKey;
  final String title;
  final String subtitle;
  final String institution;
  final String institutionIcon;
  final String observation;
  final String entryLabel;
  final String quantityLabel;
  final double quantityRaw;
  final String averagePriceLabel;
  final double averagePriceRaw;
  final String currentPriceLabel;
  final double currentPriceRaw;
  final String currentValueLabel;
  final double currentValueRaw;
  final double investedValueRaw;
  final String absoluteResultLabel;
  final String performanceLabel;
  final double performanceRaw;
  final String shareLabel;
  final double shareRaw;
  final String categoryShareLabel;
  final double categoryShareRaw;
  final String recommendation;
  final String statusLabel;
  final String tagLabel;
  final String supportLabel;
  final String detailUrl;
  final SourceDescriptor sourceProfile;
  final AssetScoreDetails assetScore;
  final SmartRecommendation smartRecommendation;
  final double stopRaw;

  bool get hasDetailUrl => detailUrl.trim().isNotEmpty;
}

class SourceDescriptor {
  const SourceDescriptor({
    required this.key,
    required this.label,
    required this.sourceType,
    required this.description,
  });

  factory SourceDescriptor.fromJson(Map<String, dynamic> json) {
    return SourceDescriptor(
      key: _normalizeCategoryKey(_stringFrom(json['key'])),
      label: _stringFrom(json['label']),
      sourceType: _stringFrom(json['sourceType']),
      description: _stringFrom(json['description']),
    );
  }

  static const SourceDescriptor empty = SourceDescriptor(
    key: '',
    label: '',
    sourceType: '',
    description: '',
  );

  final String key;
  final String label;
  final String sourceType;
  final String description;

  bool get isEmpty =>
      key.isEmpty && label.isEmpty && sourceType.isEmpty && description.isEmpty;
}

class AssetScoreDetails {
  const AssetScoreDetails({
    required this.score,
    required this.status,
    required this.motives,
  });

  factory AssetScoreDetails.fromJson(Map<String, dynamic> json) {
    return AssetScoreDetails(
      score: _intFrom(json['score']),
      status: _stringFrom(json['status']),
      motives: _dynamicListFrom(json['motivos'])
          .map((item) => _stringFrom(item))
          .where((line) => line.isNotEmpty)
          .toList(),
    );
  }

  static const AssetScoreDetails empty = AssetScoreDetails(
    score: 0,
    status: '',
    motives: <String>[],
  );

  final int score;
  final String status;
  final List<String> motives;
}

class SmartRecommendation {
  const SmartRecommendation({
    required this.action,
    required this.title,
    required this.reason,
    required this.impact,
  });

  factory SmartRecommendation.fromJson(Map<String, dynamic> json) {
    return SmartRecommendation(
      action: _stringFrom(json['action']),
      title: _stringFrom(json['title']),
      reason: _stringFrom(json['reason']),
      impact: _stringFrom(json['impact']),
    );
  }

  static const SmartRecommendation empty = SmartRecommendation(
    action: '',
    title: '',
    reason: '',
    impact: '',
  );

  final String action;
  final String title;
  final String reason;
  final String impact;

  bool get isEmpty =>
      action.isEmpty && title.isEmpty && reason.isEmpty && impact.isEmpty;
}

class PrimaryAlert {
  const PrimaryAlert({required this.symbol, required this.text});

  factory PrimaryAlert.fromJson(Map<String, dynamic> json) {
    return PrimaryAlert(
      symbol: _stringFrom(json['symbol']),
      text: _stringFrom(json['text']),
    );
  }

  final String symbol;
  final String text;

  bool get isEmpty => symbol.isEmpty && text.isEmpty;
}

class DashboardAlert {
  const DashboardAlert({
    required this.type,
    required this.message,
    required this.asset,
  });

  factory DashboardAlert.fromJson(Map<String, dynamic> json) {
    return DashboardAlert(
      type: _stringFrom(json['type']),
      message: _stringFrom(json['message']),
      asset: _stringFrom(json['asset']),
    );
  }

  final String type;
  final String message;
  final String asset;
}

class OrderBook {
  const OrderBook({required this.buy, required this.sell});

  factory OrderBook.fromJson(Map<String, dynamic> json) {
    return OrderBook(
      buy: OrderSuggestion.fromNullable(json['buy']),
      sell: OrderSuggestion.fromNullable(json['sell']),
    );
  }

  final OrderSuggestion? buy;
  final OrderSuggestion? sell;

  bool get hasSuggestions => buy != null || sell != null;
}

class OrderSuggestion {
  const OrderSuggestion({required this.symbol, required this.value});

  factory OrderSuggestion.fromJson(Map<String, dynamic> json) {
    return OrderSuggestion(
      symbol: _stringFrom(json['symbol']),
      value: _stringFrom(json['value']),
    );
  }

  static OrderSuggestion? fromNullable(Object? value) {
    if (value == null) return null;
    final map = _asMap(value);
    if (map.isEmpty) return null;
    final suggestion = OrderSuggestion.fromJson(map);
    if (suggestion.symbol.isEmpty && suggestion.value.isEmpty) {
      return null;
    }
    return suggestion;
  }

  final String symbol;
  final String value;
}

class TopFundEntry {
  const TopFundEntry({required this.name, required this.value});

  factory TopFundEntry.fromJson(Map<String, dynamic> json) {
    return TopFundEntry(
      name: _stringFrom(json['name']),
      value: _stringFrom(json['value']),
    );
  }

  final String name;
  final String value;
}

class PensionOverview {
  const PensionOverview({
    required this.platform,
    required this.platformValue,
    required this.topPlan,
    required this.topPlanValue,
  });

  factory PensionOverview.fromJson(Map<String, dynamic> json) {
    return PensionOverview(
      platform: _stringFrom(json['platform']),
      platformValue: _stringFrom(json['platformValue']),
      topPlan: _stringFrom(json['topPlan']),
      topPlanValue: _stringFrom(json['topPlanValue']),
    );
  }

  final String platform;
  final String platformValue;
  final String topPlan;
  final String topPlanValue;
}

class PortfolioProfile {
  const PortfolioProfile({
    required this.squad,
    required this.level,
    required this.levelScore,
  });

  factory PortfolioProfile.fromJson(Map<String, dynamic> json) {
    return PortfolioProfile(
      squad: _stringFrom(json['squad']),
      level: _stringFrom(json['level']),
      levelScore: _intFrom(json['levelScore']),
    );
  }

  final String squad;
  final String level;
  final int levelScore;
}

class DecisionRecord {
  const DecisionRecord({
    required this.date,
    required this.action,
    required this.asset,
    required this.context,
    required this.status,
    required this.outcome,
  });

  factory DecisionRecord.fromJson(Map<String, dynamic> json) {
    return DecisionRecord(
      date: _dateFrom(json['data']),
      action: _stringFrom(json['acao']),
      asset: _stringFrom(json['ativo']),
      context: _stringFrom(json['contexto']),
      status: _stringFrom(json['status']),
      outcome: DecisionOutcome.fromJson(_asMap(json['outcome'])),
    );
  }

  final DateTime? date;
  final String action;
  final String asset;
  final String context;
  final String status;
  final DecisionOutcome outcome;
}

class DecisionOutcome {
  const DecisionOutcome({required this.label, required this.summary});

  factory DecisionOutcome.fromJson(Map<String, dynamic> json) {
    return DecisionOutcome(
      label: _stringFrom(json['label']),
      summary: _stringFrom(json['summary']),
    );
  }

  final String label;
  final String summary;
}

class IntelligentAlert {
  const IntelligentAlert({
    required this.key,
    required this.type,
    required this.title,
    required this.message,
    required this.asset,
  });

  factory IntelligentAlert.fromJson(Map<String, dynamic> json) {
    return IntelligentAlert(
      key: _stringFrom(json['key']),
      type: _stringFrom(json['type']),
      title: _stringFrom(json['title']),
      message: _stringFrom(json['message']),
      asset: _stringFrom(json['asset']),
    );
  }

  final String key;
  final String type;
  final String title;
  final String message;
  final String asset;
}

class AssetRanking {
  const AssetRanking({
    required this.items,
    required this.topOpportunity,
    required this.topRisk,
  });

  factory AssetRanking.fromJson(Map<String, dynamic> json) {
    return AssetRanking(
      items: _asMapList(json['items']).map(RankedAsset.fromJson).toList(),
      topOpportunity: RankedAsset.fromNullable(json['topOpportunity']),
      topRisk: RankedAsset.fromNullable(json['topRisk']),
    );
  }

  final List<RankedAsset> items;
  final RankedAsset? topOpportunity;
  final RankedAsset? topRisk;

  RankedAsset? itemByTicker(String ticker) {
    final normalized = ticker.trim().toLowerCase();
    if (normalized.isEmpty) return null;
    for (final item in items) {
      if (item.ticker.trim().toLowerCase() == normalized) {
        return item;
      }
    }
    return null;
  }
}

class RankedAsset {
  const RankedAsset({
    required this.ticker,
    required this.name,
    required this.score,
    required this.status,
    required this.motives,
    required this.recommendation,
    required this.smartRecommendation,
    required this.riskPriority,
    required this.riskLabel,
    required this.marketSignal,
    required this.marketContext,
    required this.portfolioShare,
    required this.categoryShare,
    required this.impactWeight,
    required this.opportunityScore,
    required this.marketMomentum,
    required this.rent,
  });

  factory RankedAsset.fromJson(Map<String, dynamic> json) {
    return RankedAsset(
      ticker: _stringFrom(json['ticker']),
      name: _stringFrom(json['name']),
      score: _intFrom(json['score']),
      status: _stringFrom(json['status']),
      motives: _dynamicListFrom(json['motivos'])
          .map((item) => _stringFrom(item))
          .where((line) => line.isNotEmpty)
          .toList(),
      recommendation: _stringFrom(json['recommendation']),
      smartRecommendation: SmartRecommendation.fromJson(
        _asMap(json['smartRecommendation']),
      ),
      riskPriority: _intFrom(json['riskPriority']),
      riskLabel: _stringFrom(json['riskLabel']),
      marketSignal: _stringFrom(json['marketSignal']),
      marketContext: MarketContext.fromJson(_asMap(json['marketContext'])),
      portfolioShare: _doubleFrom(json['portfolioShare']),
      categoryShare: _doubleFrom(json['categoryShare']),
      impactWeight: _doubleFrom(json['impactWeight']),
      opportunityScore: _intFrom(json['opportunityScore']),
      marketMomentum: _nullableDoubleFrom(json['marketMomentum']),
      rent: _doubleFrom(json['rent']),
    );
  }

  static RankedAsset? fromNullable(Object? value) {
    if (value == null) return null;
    final map = _asMap(value);
    if (map.isEmpty) return null;
    final item = RankedAsset.fromJson(map);
    return item.ticker.isEmpty ? null : item;
  }

  final String ticker;
  final String name;
  final int score;
  final String status;
  final List<String> motives;
  final String recommendation;
  final SmartRecommendation smartRecommendation;
  final int riskPriority;
  final String riskLabel;
  final String marketSignal;
  final MarketContext marketContext;
  final double portfolioShare;
  final double categoryShare;
  final double impactWeight;
  final int opportunityScore;
  final double? marketMomentum;
  final double rent;
}

class MarketContext {
  const MarketContext({
    required this.hasExternalData,
    required this.currentPriceRaw,
    required this.dailyChangePct,
    required this.monthlyChangePct,
    required this.priceGapPct,
    required this.signal,
    required this.message,
  });

  factory MarketContext.fromJson(Map<String, dynamic> json) {
    return MarketContext(
      hasExternalData: _boolFrom(json['hasExternalData']),
      currentPriceRaw: _nullableDoubleFrom(json['currentPriceRaw']),
      dailyChangePct: _nullableDoubleFrom(json['dailyChangePct']),
      monthlyChangePct: _nullableDoubleFrom(json['monthlyChangePct']),
      priceGapPct: _nullableDoubleFrom(json['priceGapPct']),
      signal: _stringFrom(json['signal']),
      message: _stringFrom(json['message']),
    );
  }

  final bool hasExternalData;
  final double? currentPriceRaw;
  final double? dailyChangePct;
  final double? monthlyChangePct;
  final double? priceGapPct;
  final String signal;
  final String message;
}

class DashboardDataProfiles {
  const DashboardDataProfiles({
    required this.actions,
    required this.funds,
    required this.pension,
  });

  factory DashboardDataProfiles.fromJson(Map<String, dynamic> json) {
    return DashboardDataProfiles(
      actions: SourceDescriptor.fromJson(_asMap(json['actions'])),
      funds: SourceDescriptor.fromJson(_asMap(json['funds'])),
      pension: SourceDescriptor.fromJson(_asMap(json['previdencia'])),
    );
  }

  final SourceDescriptor actions;
  final SourceDescriptor funds;
  final SourceDescriptor pension;

  List<SourceDescriptor> get all => <SourceDescriptor>[actions, funds, pension];
}

class OperationsCapabilities {
  const OperationsCapabilities({
    required this.canChangeStatus,
    required this.canDelete,
    required this.canUpdate,
    required this.canCreate,
    required this.financialExecutionEnabled,
  });

  factory OperationsCapabilities.fromJson(Map<String, dynamic> json) {
    return OperationsCapabilities(
      canChangeStatus: _boolFrom(json['canChangeStatus']),
      canDelete: _boolFrom(json['canDelete']),
      canUpdate: _boolFrom(json['canUpdate']),
      canCreate: _boolFrom(json['canCreate']),
      financialExecutionEnabled: _boolFrom(json['financialExecutionEnabled']),
    );
  }

  final bool canChangeStatus;
  final bool canDelete;
  final bool canUpdate;
  final bool canCreate;
  final bool financialExecutionEnabled;
}

class MobileHomeSnapshot {
  const MobileHomeSnapshot({
    required this.total,
    required this.variation,
    required this.status,
    required this.update,
    required this.risk,
    required this.distribution,
    required this.recommendation,
    required this.score,
    required this.insights,
  });

  factory MobileHomeSnapshot.fromJson(Map<String, dynamic> json) {
    return MobileHomeSnapshot(
      total: MobileLabeledValue.fromJson(_asMap(json['total'])),
      variation: MobileVariation.fromJson(_asMap(json['variation'])),
      status: MobileStatusSnapshot.fromJson(_asMap(json['status'])),
      update: MobileUpdateSnapshot.fromJson(_asMap(json['update'])),
      risk: MobileRiskSnapshot.fromJson(_asMap(json['risk'])),
      distribution: _asMapList(
        json['distribution'],
      ).map(MobileDistributionItem.fromJson).toList(),
      recommendation: MobileRecommendationSnapshot.fromJson(
        _asMap(json['recommendation']),
      ),
      score: MobileScoreSnapshot.fromJson(_asMap(json['score'])),
      insights: _asMapList(
        json['insights'],
      ).map(MobileInsightSnapshot.fromJson).toList(),
    );
  }

  final MobileLabeledValue total;
  final MobileVariation variation;
  final MobileStatusSnapshot status;
  final MobileUpdateSnapshot update;
  final MobileRiskSnapshot risk;
  final List<MobileDistributionItem> distribution;
  final MobileRecommendationSnapshot recommendation;
  final MobileScoreSnapshot score;
  final List<MobileInsightSnapshot> insights;
}

class MobileLabeledValue {
  const MobileLabeledValue({required this.label, required this.raw});

  factory MobileLabeledValue.fromJson(Map<String, dynamic> json) {
    return MobileLabeledValue(
      label: _stringFrom(json['label']),
      raw: _doubleFrom(json['raw']),
    );
  }

  final String label;
  final double raw;
}

class MobileVariation {
  const MobileVariation({
    required this.label,
    required this.raw,
    required this.isPositive,
  });

  factory MobileVariation.fromJson(Map<String, dynamic> json) {
    return MobileVariation(
      label: _stringFrom(json['label']),
      raw: _doubleFrom(json['raw']),
      isPositive: _boolFrom(json['isPositive']),
    );
  }

  final String label;
  final double raw;
  final bool isPositive;
}

class MobileStatusSnapshot {
  const MobileStatusSnapshot({
    required this.label,
    required this.summary,
    required this.detail,
  });

  factory MobileStatusSnapshot.fromJson(Map<String, dynamic> json) {
    return MobileStatusSnapshot(
      label: _stringFrom(json['label']),
      summary: _stringFrom(json['summary']),
      detail: _stringFrom(json['detail']),
    );
  }

  final String label;
  final String summary;
  final String detail;
}

class MobileUpdateSnapshot {
  const MobileUpdateSnapshot({
    required this.label,
    required this.updatedAt,
    required this.sourceLabel,
  });

  factory MobileUpdateSnapshot.fromJson(Map<String, dynamic> json) {
    return MobileUpdateSnapshot(
      label: _stringFrom(json['label']),
      updatedAt: _dateFrom(json['updatedAt']),
      sourceLabel: _stringFrom(json['sourceLabel']),
    );
  }

  final String label;
  final DateTime? updatedAt;
  final String sourceLabel;
}

class MobileRiskSnapshot {
  const MobileRiskSnapshot({
    required this.label,
    required this.focusLabel,
    required this.focusKey,
    required this.shareLabel,
    required this.reason,
    required this.meterValue,
  });

  factory MobileRiskSnapshot.fromJson(Map<String, dynamic> json) {
    return MobileRiskSnapshot(
      label: _stringFrom(json['label']),
      focusLabel: _stringFrom(json['focusLabel']),
      focusKey: _normalizeCategoryKey(_stringFrom(json['focusKey'])),
      shareLabel: _stringFrom(json['shareLabel']),
      reason: _stringFrom(json['reason']),
      meterValue: _doubleFrom(json['meterValue']),
    );
  }

  final String label;
  final String focusLabel;
  final String focusKey;
  final String shareLabel;
  final String reason;
  final double meterValue;
}

class MobileDistributionItem {
  const MobileDistributionItem({
    required this.key,
    required this.label,
    required this.valueLabel,
    required this.shareLabel,
    required this.performanceLabel,
    required this.statusLabel,
    required this.color,
  });

  factory MobileDistributionItem.fromJson(Map<String, dynamic> json) {
    return MobileDistributionItem(
      key: _normalizeCategoryKey(_stringFrom(json['key'])),
      label: _stringFrom(json['label']),
      valueLabel: _stringFrom(json['valueLabel']),
      shareLabel: _stringFrom(json['shareLabel']),
      performanceLabel: _stringFrom(json['performanceLabel']),
      statusLabel: _stringFrom(json['statusLabel']),
      color: _stringFrom(json['color']),
    );
  }

  final String key;
  final String label;
  final String valueLabel;
  final String shareLabel;
  final String performanceLabel;
  final String statusLabel;
  final String color;
}

class MobileRecommendationSnapshot {
  const MobileRecommendationSnapshot({
    required this.title,
    required this.reason,
    required this.primaryActionLabel,
    required this.secondaryActionLabel,
    required this.focusCategoryKey,
    required this.secondaryCategoryKey,
  });

  factory MobileRecommendationSnapshot.fromJson(Map<String, dynamic> json) {
    return MobileRecommendationSnapshot(
      title: _stringFrom(json['title']),
      reason: _stringFrom(json['reason']),
      primaryActionLabel: _stringFrom(json['primaryActionLabel']),
      secondaryActionLabel: _stringFrom(json['secondaryActionLabel']),
      focusCategoryKey: _normalizeCategoryKey(
        _stringFrom(json['focusCategoryKey']),
      ),
      secondaryCategoryKey: _normalizeCategoryKey(
        _stringFrom(json['secondaryCategoryKey']),
      ),
    );
  }

  final String title;
  final String reason;
  final String primaryActionLabel;
  final String secondaryActionLabel;
  final String focusCategoryKey;
  final String secondaryCategoryKey;
}

class MobileScoreSnapshot {
  const MobileScoreSnapshot({
    required this.valueLabel,
    required this.valueRaw,
    required this.statusLabel,
    required this.summary,
    required this.problem,
  });

  factory MobileScoreSnapshot.fromJson(Map<String, dynamic> json) {
    return MobileScoreSnapshot(
      valueLabel: _stringFrom(json['valueLabel']),
      valueRaw: _doubleFrom(json['valueRaw']),
      statusLabel: _stringFrom(json['statusLabel']),
      summary: _stringFrom(json['summary']),
      problem: _stringFrom(json['problem']),
    );
  }

  final String valueLabel;
  final double valueRaw;
  final String statusLabel;
  final String summary;
  final String problem;
}

class MobileInsightSnapshot {
  const MobileInsightSnapshot({required this.title, required this.body});

  factory MobileInsightSnapshot.fromJson(Map<String, dynamic> json) {
    return MobileInsightSnapshot(
      title: _stringFrom(json['title']),
      body: _stringFrom(json['body']),
    );
  }

  final String title;
  final String body;
}

Map<String, dynamic> _asMap(Object? source) {
  if (source is Map<String, dynamic>) return source;
  if (source is Map) {
    return source.map((key, value) => MapEntry(key.toString(), value));
  }
  return const <String, dynamic>{};
}

List<Map<String, dynamic>> _asMapList(Object? source) {
  return _dynamicListFrom(source).map(_asMap).toList();
}

List<dynamic> _dynamicListFrom(Object? source) {
  if (source is List<dynamic>) return source;
  if (source is List) return List<dynamic>.from(source);
  return const <dynamic>[];
}

String _stringFrom(Object? source, {String fallback = ''}) {
  if (source == null) return fallback;
  if (source is String) {
    final trimmed = source.trim();
    return trimmed.isEmpty ? fallback : trimmed;
  }
  if (source is num || source is bool) return source.toString();
  return fallback;
}

double _doubleFrom(Object? source, {double fallback = 0}) {
  if (source is num) return source.toDouble();
  if (source is String) {
    final normalized = source
        .replaceAll('R\$', '')
        .replaceAll('%', '')
        .replaceAll('.', '')
        .replaceAll(',', '.')
        .trim();
    final parsed = double.tryParse(normalized);
    if (parsed != null) return parsed;

    final relaxed = source.replaceAll('%', '').replaceAll(',', '.').trim();
    return double.tryParse(relaxed) ?? fallback;
  }
  return fallback;
}

double? _nullableDoubleFrom(Object? source) {
  if (source == null) return null;
  if (source is String && source.trim().isEmpty) return null;
  final parsed = _doubleFrom(source, fallback: double.nan);
  return parsed.isNaN ? null : parsed;
}

int _intFrom(Object? source, {int fallback = 0}) {
  if (source is int) return source;
  return _doubleFrom(source, fallback: fallback.toDouble()).round();
}

bool _boolFrom(Object? source, {bool fallback = false}) {
  if (source is bool) return source;
  if (source is num) return source != 0;
  if (source is String) {
    final normalized = source.trim().toLowerCase();
    if (normalized == 'true' || normalized == '1') return true;
    if (normalized == 'false' || normalized == '0') return false;
  }
  return fallback;
}

DateTime? _dateFrom(Object? source) {
  final value = _stringFrom(source);
  return value.isEmpty ? null : DateTime.tryParse(value);
}

String _buildPerformanceCompact(double value, {bool signed = false}) {
  final pct = (value * 100).toStringAsFixed(1).replaceAll('.', ',');
  if (!signed) return '$pct%';
  if (value > 0) return '+$pct%';
  if (value < 0) return '$pct%';
  return '0,0%';
}

String _defaultCategoryLabel(String key) {
  switch (_normalizeCategoryKey(key)) {
    case 'acoes':
      return 'Acoes';
    case 'fundos':
      return 'Fundos';
    case 'previdencia':
      return 'Previdencia';
    default:
      return 'Carteira';
  }
}

String _normalizeCategoryKey(String value) {
  final normalized = value
      .trim()
      .toLowerCase()
      .replaceAll('á', 'a')
      .replaceAll('à', 'a')
      .replaceAll('ã', 'a')
      .replaceAll('â', 'a')
      .replaceAll('é', 'e')
      .replaceAll('ê', 'e')
      .replaceAll('í', 'i')
      .replaceAll('ó', 'o')
      .replaceAll('ô', 'o')
      .replaceAll('õ', 'o')
      .replaceAll('ú', 'u')
      .replaceAll('ç', 'c');

  if (normalized == 'actions' || normalized == 'acao' || normalized == 'acoes') {
    return 'acoes';
  }
  if (normalized == 'funds' || normalized == 'fundo' || normalized == 'fundos') {
    return 'fundos';
  }
  if (normalized.startsWith('previd')) return 'previdencia';
  return normalized;
}
