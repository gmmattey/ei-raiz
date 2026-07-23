/**
 * PORTFOLIO METRICS
 * Resumos, metricas consolidadas, alertas e copy executiva da carteira.
 */

function buildPortfolioSummaryFromDomains_(actions, investments, previdencias, preOrders) {
  const acoesRaw = sumBy_(actions, 'valorAtualRaw');
  const fundosRaw = sumBy_(investments, 'valorAtualRaw');
  const previdenciaRaw = sumBy_(previdencias, 'valorAtualRaw');
  const preOrdensRaw = sumBy_(preOrders, 'valorPotencialRaw');
  const acoesInvestidoRaw = sumBy_(actions, 'valorInvestidoRaw');
  const fundosInvestidoRaw = sumBy_(investments, 'valorInvestidoRaw');
  const previdenciaInvestidoRaw = sumBy_(previdencias, 'totalAportadoRaw');
  const totalRaw = acoesRaw + fundosRaw + previdenciaRaw;
  const totalInvestidoRaw = acoesInvestidoRaw + fundosInvestidoRaw + previdenciaInvestidoRaw;
  const acoesPerformanceRaw = calculatePortfolioCategoryPerformance_(acoesRaw, acoesInvestidoRaw);
  const fundosPerformanceRaw = calculatePortfolioCategoryPerformance_(fundosRaw, fundosInvestidoRaw);
  const previdenciaPerformanceRaw = calculatePortfolioCategoryPerformance_(previdenciaRaw, previdenciaInvestidoRaw);
  const totalPerformanceRaw = calculatePortfolioCategoryPerformance_(totalRaw, totalInvestidoRaw);

  return {
    acoes: formatMoney_(acoesRaw),
    fundos: formatMoney_(fundosRaw),
    previdencia: formatMoney_(previdenciaRaw),
    preOrdens: formatMoney_(preOrdensRaw),
    total: formatMoney_(totalRaw),
    acoesRaw: acoesRaw,
    fundosRaw: fundosRaw,
    previdenciaRaw: previdenciaRaw,
    totalRaw: totalRaw,
    acoesInvestidoRaw: acoesInvestidoRaw,
    fundosInvestidoRaw: fundosInvestidoRaw,
    previdenciaInvestidoRaw: previdenciaInvestidoRaw,
    totalInvestidoRaw: totalInvestidoRaw,
    acoesPerformanceRaw: acoesPerformanceRaw,
    fundosPerformanceRaw: fundosPerformanceRaw,
    previdenciaPerformanceRaw: previdenciaPerformanceRaw,
    totalPerformanceRaw: totalPerformanceRaw
  };
}

function buildFundsTopFromMappedItems_(items) {
  return (items || [])
    .slice()
    .sort(function (a, b) {
      return (b?.valorAtualRaw || 0) - (a?.valorAtualRaw || 0);
    })
    .slice(0, 2)
    .map(function (item) {
      return {
        name: item.name,
        value: formatMoney_(item.valorAtualRaw)
      };
    });
}

function buildPrevidenciaInfoFromMappedItems_(items) {
  const platformTotals = {};
  let topPlan = { name: '', value: 0 };

  (items || []).forEach(function (item) {
    const currentValue = item?.valorAtualRaw || 0;
    if (!currentValue) return;

    if (item.institution) {
      platformTotals[item.institution] = (platformTotals[item.institution] || 0) + currentValue;
    }

    if (currentValue > topPlan.value) {
      topPlan = {
        name: item.name || '',
        value: currentValue
      };
    }
  });

  let topPlatformName = '';
  let topPlatformValue = 0;
  Object.keys(platformTotals).forEach(function (platformName) {
    if (platformTotals[platformName] > topPlatformValue) {
      topPlatformValue = platformTotals[platformName];
      topPlatformName = platformName;
    }
  });

  return {
    platform: topPlatformName,
    platformValue: topPlatformValue ? formatMoney_(topPlatformValue) : 'Sem dados',
    topPlan: topPlan.name,
    topPlanValue: topPlan.name ? formatMoney_(topPlan.value) : 'Sem dados'
  };
}

function calculatePortfolioCategoryPerformance_(currentRaw, investedRaw) {
  const currentValue = Number(currentRaw || 0);
  const investedValue = Number(investedRaw || 0);
  if (!investedValue) return null;
  return currentValue / investedValue - 1;
}

function buildNormalizedPortfolioCollections_(summary, actions, investments, previdencias) {
  const portfolioTotalRaw = Number(summary?.totalRaw || 0);

  return {
    actions: attachAllocationMetricsToItems_(actions, portfolioTotalRaw, Number(summary?.acoesRaw || 0)),
    investments: attachAllocationMetricsToItems_(investments, portfolioTotalRaw, Number(summary?.fundosRaw || 0)),
    previdencias: attachAllocationMetricsToItems_(previdencias, portfolioTotalRaw, Number(summary?.previdenciaRaw || 0))
  };
}

function attachAllocationMetricsToItems_(items, totalPortfolioRaw, totalCategoryRaw) {
  return (items || []).map(function (item) {
    const currentRaw = Number(item?.valorAtualRaw || 0);
    const portfolioShareRaw = totalPortfolioRaw > 0 ? currentRaw / totalPortfolioRaw : 0;
    const categoryShareRaw = totalCategoryRaw > 0 ? currentRaw / totalCategoryRaw : 0;

    return Object.assign({}, item, {
      portfolioShareRaw: portfolioShareRaw,
      portfolioShareLabel: portfolioShareRaw > 0 ? formatPct_(portfolioShareRaw) : '',
      categoryShareRaw: categoryShareRaw,
      categoryShareLabel: categoryShareRaw > 0 ? formatPct_(categoryShareRaw) : '',
      performanceRaw: item?.rentRaw,
      performanceLabel: item?.rentPct || ''
    });
  });
}

function buildCategorySnapshots_(summary, categories) {
  const summaryData = summary || {};
  const totalRaw = Number(summaryData.totalRaw || 0);
  const snapshots = [
    {
      key: 'acoes',
      label: 'Ações',
      totalRaw: Number(summaryData.acoesRaw || 0),
      totalLabel: summaryData.acoes || formatMoney_(summaryData.acoesRaw || 0),
      performanceRaw: summaryData.acoesPerformanceRaw,
      category: categories?.actions || null,
      color: '#34d399',
      sourceType: 'mercado'
    },
    {
      key: 'fundos',
      label: 'Fundos de Investimento',
      totalRaw: Number(summaryData.fundosRaw || 0),
      totalLabel: summaryData.fundos || formatMoney_(summaryData.fundosRaw || 0),
      performanceRaw: summaryData.fundosPerformanceRaw,
      category: categories?.funds || null,
      color: '#c084fc',
      sourceType: 'registro-fundo'
    },
    {
      key: 'previdencia',
      label: 'Previdência',
      totalRaw: Number(summaryData.previdenciaRaw || 0),
      totalLabel: summaryData.previdencia || formatMoney_(summaryData.previdenciaRaw || 0),
      performanceRaw: summaryData.previdenciaPerformanceRaw,
      category: categories?.previdencia || null,
      color: '#60a5fa',
      sourceType: 'registro-plano'
    }
  ];

  return snapshots
    .filter(function (item) {
      return item.totalRaw > 0;
    })
    .map(function (item) {
      const shareRaw = totalRaw > 0 ? item.totalRaw / totalRaw : 0;
      const performanceRaw = Number(item.performanceRaw);
      const isPerformanceKnown = item.performanceRaw !== null && item.performanceRaw !== undefined && !isNaN(performanceRaw);

      return {
        key: item.key,
        label: item.label,
        totalRaw: item.totalRaw,
        totalLabel: item.totalLabel,
        shareRaw: shareRaw,
        shareLabel: shareRaw > 0 ? formatPct_(shareRaw) : '',
        performanceRaw: isPerformanceKnown ? performanceRaw : null,
        performanceLabel: isPerformanceKnown ? formatPct_(performanceRaw) : '—',
        trend: !isPerformanceKnown
          ? 'neutral'
          : (performanceRaw > 0 ? 'positive' : (performanceRaw < 0 ? 'negative' : 'neutral')),
        status: item.category?.status || '',
        recommendation: item.category?.recommendation || '',
        color: item.color,
        sourceType: item.sourceType
      };
    });
}

/**
 * Orquestra o novo motor de decisao usando apenas dados confiaveis.
 * Entrada: dominio normalizado do dashboard.
 * Saida: metricas, avaliacoes, decisao consolidada e mensagens de apoio.
 */
function buildPortfolioDecisionEngine_(domainData) {
  const metrics = buildPortfolioMetricsFromDomains_(
    domainData.actions,
    domainData.investments,
    domainData.previdencias
  );
  const scoredActions = buildScoredActions_(domainData.actions, metrics);
  domainData.actions = scoredActions;
  const assetRanking = getAssetRanking_(scoredActions, metrics);
  const categories = {
    actions: evaluateStocks_(scoredActions, metrics),
    funds: evaluateFunds_(domainData.investments, metrics),
    previdencia: evaluatePension_(domainData.previdencias, metrics)
  };
  const portfolioDecision = buildPortfolioDecision_(categories, metrics);
  const investorLevel = buildInvestorLevel_(metrics, categories);
  const alerts = buildPortfolioAlerts_(categories);
  const score = buildPortfolioScoreFromLevel_(investorLevel, metrics, categories);
  const profile = buildInvestorProfile_(metrics, categories, investorLevel);
  const generalAdvice = buildPortfolioGeneralAdvice_(metrics, portfolioDecision, investorLevel);

  return {
    metrics: metrics,
    assetRanking: assetRanking,
    categories: categories,
    portfolioDecision: portfolioDecision,
    investorLevel: investorLevel,
    alerts: alerts,
    score: score,
    profile: profile,
    generalAdvice: generalAdvice
  };
}

/**
 * Consolida metricas da carteira sem depender de Dashboard ou Aportes.
 * Entrada: listas normalizadas de acoes, fundos e previdencia.
 * Saida: metricas brutas para score, perfil e decisao.
 */
function buildPortfolioMetricsFromDomains_(actions, investments, previdencias) {
  const totalAcoes = sumBy_(actions, 'valorAtualRaw');
  const totalFundos = sumBy_(investments, 'valorAtualRaw');
  const totalPrev = sumBy_(previdencias, 'valorAtualRaw');
  const totalAtual = totalAcoes + totalFundos + totalPrev;
  const totalInvestido = sumBy_(actions, 'valorInvestidoRaw')
    + sumBy_(investments, 'valorInvestidoRaw')
    + sumBy_(previdencias, 'totalAportadoRaw');
  const performance = totalInvestido ? (totalAtual / totalInvestido - 1) : 0;

  const institutions = new Set();
  (actions || []).forEach(function (item) { if (item.institution) institutions.add(item.institution); });
  (investments || []).forEach(function (item) { if (item.institution) institutions.add(item.institution); });
  (previdencias || []).forEach(function (item) { if (item.institution) institutions.add(item.institution); });

  const activeCategoriesCount = [totalAcoes, totalFundos, totalPrev].filter(function (value) {
    return value > 0;
  }).length;
  const stopCount = (actions || []).filter(function (item) {
    return item.stopRaw && item.currentPriceRaw && item.currentPriceRaw <= item.stopRaw;
  }).length;

  return {
    totalAtual: totalAtual,
    totalInvestido: totalInvestido,
    performance: performance,
    institutionsCount: institutions.size,
    activeCategoriesCount: activeCategoriesCount,
    stopCount: stopCount,
    equityShare: totalAtual ? totalAcoes / totalAtual : 0,
    fundsShare: totalAtual ? totalFundos / totalAtual : 0,
    previdenciaShare: totalAtual ? totalPrev / totalAtual : 0,
    totals: {
      actions: totalAcoes,
      funds: totalFundos,
      previdencia: totalPrev
    }
  };
}

/**
 * Avalia a categoria de acoes usando perda, stop e concentracao.
 * Entrada: lista de acoes normalizadas e metricas consolidadas.
 * Saida: status da categoria, recomendacao e principal ponto critico.
 */
function evaluateStocks_(actions, metrics) {
  const items = actions || [];
  const totalCategory = sumBy_(items, 'valorAtualRaw');
  const totalPortfolio = metrics?.totalAtual || 0;
  const counters = { critical: 0, attention: 0, stable: 0, strong: 0 };
  let dominantItem = null;
  let primaryIssue = null;

  items.forEach(function (item) {
    const categoryShare = totalCategory ? item.valorAtualRaw / totalCategory : 0;
    const portfolioShare = totalPortfolio ? item.valorAtualRaw / totalPortfolio : 0;
    const belowStop = item.stopRaw && item.currentPriceRaw && item.currentPriceRaw <= item.stopRaw;

    if (belowStop || item.rent <= -0.15) {
      counters.critical++;
      primaryIssue = pickPriorityIssue_(primaryIssue, {
        type: 'Crítico',
        asset: item.ticker,
        categoryLabel: 'Ações',
        kind: belowStop ? 'stop' : 'loss',
        weight: Math.max(categoryShare, portfolioShare),
        message: belowStop
          ? (item.ticker + ' abaixo do stop. Melhor reduzir.')
          : (item.ticker + ' em queda forte. Melhor revisar.')
      });
    } else if (item.rent < -0.05) {
      counters.attention++;
      primaryIssue = pickPriorityIssue_(primaryIssue, {
        type: 'Atenção',
        asset: item.ticker,
        categoryLabel: 'Ações',
        kind: 'loss',
        weight: Math.max(categoryShare, portfolioShare),
        message: item.ticker + ' em zona quente. Melhor revisar.'
      });
    } else if (item.rent >= 0.10) {
      counters.strong++;
    } else {
      counters.stable++;
    }

    if (!dominantItem || portfolioShare > dominantItem.portfolioShare) {
      dominantItem = {
        asset: item.ticker,
        categoryShare: categoryShare,
        portfolioShare: portfolioShare
      };
    }
  });

  if (dominantItem && (dominantItem.categoryShare > 0.40 || dominantItem.portfolioShare > 0.20)) {
    primaryIssue = pickPriorityIssue_(primaryIssue, {
      type: 'Crítico',
      asset: dominantItem.asset,
      categoryLabel: 'Ações',
      kind: 'concentration',
      weight: Math.max(dominantItem.categoryShare, dominantItem.portfolioShare),
      message: dominantItem.asset + ' concentrando demais a carteira.'
    });
  } else if (dominantItem && (dominantItem.categoryShare > 0.25 || dominantItem.portfolioShare > 0.12)) {
    primaryIssue = pickPriorityIssue_(primaryIssue, {
      type: 'Atenção',
      asset: dominantItem.asset,
      categoryLabel: 'Ações',
      kind: 'concentration',
      weight: Math.max(dominantItem.categoryShare, dominantItem.portfolioShare),
      message: dominantItem.asset + ' com peso alto. Vale revisar.'
    });
  }

  let status = 'Seguro';
  if (primaryIssue && primaryIssue.type === 'Crítico') status = 'Crítico';
  else if (primaryIssue && primaryIssue.type === 'Atenção') status = 'Atenção';
  else if (items.length && (counters.stable + counters.strong) / items.length >= 0.60) status = 'Forte';

  let recommendation = 'Manter';
  if (status === 'Crítico') {
    recommendation = primaryIssue && (primaryIssue.kind === 'stop' || primaryIssue.kind === 'concentration')
      ? 'Reduzir'
      : 'Revisar';
  } else if (status === 'Atenção') {
    recommendation = 'Revisar';
  }

  return {
    key: 'actions',
    label: 'Ações',
    status: status,
    risk: status === 'Crítico' ? 'Alto' : (status === 'Atenção' ? 'Médio' : 'Controlado'),
    recommendation: recommendation,
    totalCurrentRaw: totalCategory,
    portfolioShare: totalPortfolio ? totalCategory / totalPortfolio : 0,
    counters: counters,
    dominantItem: dominantItem,
    primaryIssue: primaryIssue
  };
}

/**
 * Avalia a categoria de fundos com foco em perda e concentracao.
 * Entrada: lista de fundos e metricas consolidadas da carteira.
 * Saida: status da categoria, recomendacao e principal ponto critico.
 */
function evaluateFunds_(items, metrics) {
  const funds = items || [];
  const totalCategory = sumBy_(funds, 'valorAtualRaw');
  const totalPortfolio = metrics?.totalAtual || 0;
  const counters = { critical: 0, attention: 0, stable: 0, strong: 0 };
  let dominantItem = null;
  let worstCriticalItem = null;

  funds.forEach(function (item) {
    const categoryShare = totalCategory ? item.valorAtualRaw / totalCategory : 0;
    const portfolioShare = totalPortfolio ? item.valorAtualRaw / totalPortfolio : 0;

    if (item.rentRaw <= -0.10) {
      counters.critical++;
      if (!worstCriticalItem || item.rentRaw < worstCriticalItem.rentRaw) {
        worstCriticalItem = {
          asset: item.name,
          rentRaw: item.rentRaw,
          categoryShare: categoryShare,
          portfolioShare: portfolioShare
        };
      }
    } else if (item.rentRaw < 0) {
      counters.attention++;
    } else if (item.rentRaw >= 0.08) {
      counters.strong++;
    } else {
      counters.stable++;
    }

    if (!dominantItem || portfolioShare > dominantItem.portfolioShare) {
      dominantItem = {
        asset: item.name,
        categoryShare: categoryShare,
        portfolioShare: portfolioShare,
        rentRaw: item.rentRaw
      };
    }
  });

  let primaryIssue = null;
  let status = 'Seguro';
  const negativeRatio = funds.length ? (counters.critical + counters.attention) / funds.length : 0;
  const criticalDominantLoss = worstCriticalItem && worstCriticalItem.categoryShare >= 0.25;

  if (criticalDominantLoss || (dominantItem && (dominantItem.categoryShare > 0.50 || dominantItem.portfolioShare > 0.25))) {
    status = 'Crítico';
    primaryIssue = dominantItem && (dominantItem.categoryShare > 0.50 || dominantItem.portfolioShare > 0.25)
      ? {
        type: 'Crítico',
        asset: dominantItem.asset,
        categoryLabel: 'Fundos',
        kind: 'concentration',
        weight: Math.max(dominantItem.categoryShare, dominantItem.portfolioShare),
        message: dominantItem.asset + ' travando a distribuicao dos fundos.'
      }
      : {
        type: 'Crítico',
        asset: worstCriticalItem.asset,
        categoryLabel: 'Fundos',
        kind: 'loss',
        weight: Math.max(worstCriticalItem.categoryShare, worstCriticalItem.portfolioShare),
        message: worstCriticalItem.asset + ' pressionando o bloco de fundos.'
      };
  } else if (negativeRatio > 0.5 || (dominantItem && (dominantItem.categoryShare > 0.35 || dominantItem.portfolioShare > 0.15))) {
    status = 'Atenção';
    primaryIssue = dominantItem && (dominantItem.categoryShare > 0.35 || dominantItem.portfolioShare > 0.15)
      ? {
        type: 'Atenção',
        asset: dominantItem.asset,
        categoryLabel: 'Fundos',
        kind: 'concentration',
        weight: Math.max(dominantItem.categoryShare, dominantItem.portfolioShare),
        message: dominantItem.asset + ' com peso alto nos fundos.'
      }
      : {
        type: 'Atenção',
        asset: 'Fundos',
        categoryLabel: 'Fundos',
        kind: 'negative_ratio',
        weight: negativeRatio,
        message: 'Fundos com pressao acima do ideal.'
      };
  } else if (funds.length && (counters.stable + counters.strong) / funds.length >= 0.60) {
    status = 'Forte';
  }

  let recommendation = 'Manter';
  if (status === 'Crítico') {
    recommendation = primaryIssue && primaryIssue.kind === 'concentration'
      ? 'Redistribuir'
      : 'Revisar';
  } else if (status === 'Atenção') {
    recommendation = 'Revisar';
  }

  return {
    key: 'funds',
    label: 'Fundos',
    status: status,
    risk: status === 'Crítico' ? 'Alto' : (status === 'Atenção' ? 'Médio' : 'Controlado'),
    recommendation: recommendation,
    totalCurrentRaw: totalCategory,
    portfolioShare: totalPortfolio ? totalCategory / totalPortfolio : 0,
    counters: counters,
    dominantItem: dominantItem,
    primaryIssue: primaryIssue
  };
}

/**
 * Avalia a categoria de previdencia com foco em perda relevante e concentracao.
 * Entrada: lista de planos e metricas consolidadas da carteira.
 * Saida: status da categoria, recomendacao e principal ponto critico.
 */
function evaluatePension_(items, metrics) {
  const plans = items || [];
  const totalCategory = sumBy_(plans, 'valorAtualRaw');
  const counters = { critical: 0, attention: 0, stable: 0, strong: 0 };
  let dominantItem = null;
  let worstCriticalItem = null;

  plans.forEach(function (item) {
    const categoryShare = totalCategory ? item.valorAtualRaw / totalCategory : 0;

    if (item.rentRaw <= -0.08) {
      counters.critical++;
      if (!worstCriticalItem || item.rentRaw < worstCriticalItem.rentRaw) {
        worstCriticalItem = {
          asset: item.name,
          rentRaw: item.rentRaw,
          categoryShare: categoryShare
        };
      }
    } else if (item.rentRaw < 0) {
      counters.attention++;
    } else if (item.rentRaw >= 0.06) {
      counters.strong++;
    } else {
      counters.stable++;
    }

    if (!dominantItem || categoryShare > dominantItem.categoryShare) {
      dominantItem = {
        asset: item.name,
        categoryShare: categoryShare,
        rentRaw: item.rentRaw
      };
    }
  });

  let primaryIssue = null;
  let status = 'Seguro';
  const negativeRatio = plans.length ? (counters.critical + counters.attention) / plans.length : 0;
  const criticalDominantLoss = worstCriticalItem && worstCriticalItem.categoryShare >= 0.35;

  if (criticalDominantLoss || (dominantItem && dominantItem.categoryShare > 0.70)) {
    status = 'Crítico';
    primaryIssue = dominantItem && dominantItem.categoryShare > 0.70
      ? {
        type: 'Crítico',
        asset: dominantItem.asset,
        categoryLabel: 'Previdência',
        kind: 'concentration',
        weight: dominantItem.categoryShare,
        message: dominantItem.asset + ' dominando a previdencia.'
      }
      : {
        type: 'Crítico',
        asset: worstCriticalItem.asset,
        categoryLabel: 'Previdência',
        kind: 'loss',
        weight: worstCriticalItem.categoryShare,
        message: worstCriticalItem.asset + ' pressionando a previdencia.'
      };
  } else if (negativeRatio > 0.5 || (dominantItem && dominantItem.categoryShare > 0.50)) {
    status = 'Atenção';
    primaryIssue = dominantItem && dominantItem.categoryShare > 0.50
      ? {
        type: 'Atenção',
        asset: dominantItem.asset,
        categoryLabel: 'Previdência',
        kind: 'concentration',
        weight: dominantItem.categoryShare,
        message: dominantItem.asset + ' com peso alto na previdencia.'
      }
      : {
        type: 'Atenção',
        asset: 'Previdência',
        categoryLabel: 'Previdência',
        kind: 'negative_ratio',
        weight: negativeRatio,
        message: 'Previdencia pedindo revisao curta.'
      };
  } else if (plans.length && (counters.stable + counters.strong) / plans.length >= 0.60) {
    status = 'Forte';
  }

  const recommendation = status === 'Crítico' || status === 'Atenção'
    ? 'Revisar plano'
    : 'Manter';

  return {
    key: 'previdencia',
    label: 'Previdência',
    status: status,
    risk: status === 'Crítico' ? 'Alto' : (status === 'Atenção' ? 'Médio' : 'Controlado'),
    recommendation: recommendation,
    totalCurrentRaw: totalCategory,
    portfolioShare: metrics?.totalAtual ? totalCategory / metrics.totalAtual : 0,
    counters: counters,
    dominantItem: dominantItem,
    primaryIssue: primaryIssue
  };
}

/**
 * Consolida a decisao principal da carteira a partir das categorias avaliadas.
 * Entrada: avaliacoes por categoria e metricas consolidadas.
 * Saida: foco principal, urgencia e proxima acao do backend.
 */
function buildPortfolioDecision_(categories, metrics) {
  const orderedCategories = [categories?.actions, categories?.funds, categories?.previdencia].filter(Boolean);
  const criticalCategory = orderedCategories.find(function (category) {
    return category.status === 'Crítico';
  });

  if (criticalCategory) {
    return buildDecisionFromCategory_(criticalCategory, 'Imediata');
  }

  const attentionCategories = orderedCategories.filter(function (category) {
    return category.status === 'Atenção';
  }).sort(function (a, b) {
    return (b?.portfolioShare || 0) - (a?.portfolioShare || 0);
  });

  if (attentionCategories.length) {
    return buildDecisionFromCategory_(attentionCategories[0], 'Curta');
  }

  return {
    urgency: 'Baixa',
    actionText: 'Manter plano',
    focusCategoryLabel: 'Carteira',
    criticalPoint: '',
    categoryKey: 'portfolio',
    issueKind: 'stable',
    status: 'Seguro'
  };
}

function buildDecisionFromCategory_(category, urgency) {
  const issueKind = category?.primaryIssue?.kind || 'watch';
  const asset = category?.primaryIssue?.asset || category?.label || '';
  let actionText = 'Revisar posição';

  if (category?.key === 'actions') {
    actionText = issueKind === 'stop' || issueKind === 'concentration'
      ? 'Reduzir exposição'
      : 'Revisar posição';
  } else if (category?.key === 'funds' || category?.key === 'previdencia') {
    actionText = issueKind === 'concentration'
      ? 'Redistribuir carteira'
      : 'Revisar posição';
  }

  return {
    urgency: urgency,
    actionText: actionText,
    focusCategoryLabel: category?.label || 'Carteira',
    criticalPoint: asset,
    categoryKey: category?.key || 'portfolio',
    issueKind: issueKind,
    status: category?.status || 'Seguro'
  };
}

/**
 * Calcula o nivel do investidor em faixas objetivas sem depender de aportes.
 * Entrada: metricas consolidadas e avaliacoes por categoria.
 * Saida: pontos, nivel Warzone e detalhamento de pontuacao.
 */
function buildInvestorLevel_(metrics, categories) {
  const totalAtual = metrics?.totalAtual || 0;
  const institutionsCount = metrics?.institutionsCount || 0;
  const activeCategoriesCount = metrics?.activeCategoriesCount || 0;
  const performance = metrics?.performance || 0;
  const hasCritical = hasCategoryStatus_(categories, 'Crítico');
  const hasAttention = hasCategoryStatus_(categories, 'Atenção');

  let capitalPoints = 5;
  if (totalAtual >= 300000) capitalPoints = 25;
  else if (totalAtual >= 150000) capitalPoints = 20;
  else if (totalAtual >= 75000) capitalPoints = 15;
  else if (totalAtual >= 25000) capitalPoints = 10;

  let categoryPoints = 5;
  if (activeCategoriesCount >= 3) categoryPoints = 25;
  else if (activeCategoriesCount >= 2) categoryPoints = 15;

  let institutionPoints = 5;
  if (institutionsCount >= 5) institutionPoints = 25;
  else if (institutionsCount >= 4) institutionPoints = 20;
  else if (institutionsCount >= 3) institutionPoints = 15;
  else if (institutionsCount >= 2) institutionPoints = 10;

  let healthPoints = 25;
  if (hasCritical) healthPoints = 5;
  else if (hasAttention || performance < 0) healthPoints = 15;

  const points = capitalPoints + categoryPoints + institutionPoints + healthPoints;
  let name = 'Recruta';
  if (points >= 81) name = 'Prestigio';
  else if (points >= 61) name = 'Elite';
  else if (points >= 41) name = 'Veterano';
  else if (points >= 21) name = 'Operador';

  return {
    points: points,
    name: name,
    breakdown: {
      capitalPoints: capitalPoints,
      categoryPoints: categoryPoints,
      institutionPoints: institutionPoints,
      healthPoints: healthPoints
    }
  };
}

/**
 * Traduz o nivel calculado em um score compatível com o contrato atual do frontend.
 * Entrada: nivel do investidor, metricas e estados consolidados das categorias.
 * Saida: score numerico, status textual e explicacao curta do breakdown.
 */
function buildPortfolioScoreFromLevel_(investorLevel, metrics, categories) {
  let status = 'Saudável';
  if (hasCategoryStatus_(categories, 'Crítico')) status = 'Crítico';
  else if (hasCategoryStatus_(categories, 'Atenção')) status = 'Instável';
  else if (metrics?.performance >= 0 && areAllCategoriesStrongOrSafe_(categories)) status = 'Otimizado';

  return {
    score: investorLevel?.points || 0,
    status: status,
    explanation: [
      'Capital: ' + (investorLevel?.breakdown?.capitalPoints || 0) + '/25',
      'Categorias: ' + (investorLevel?.breakdown?.categoryPoints || 0) + '/25',
      'Instituições: ' + (investorLevel?.breakdown?.institutionPoints || 0) + '/25',
      'Saúde: ' + (investorLevel?.breakdown?.healthPoints || 0) + '/25'
    ].join(' | '),
    breakdown: investorLevel?.breakdown || {}
  };
}

/**
 * Monta o perfil tatico consumido pelo topo do dashboard.
 * Entrada: metricas de alocacao, avaliacoes por categoria e nivel calculado.
 * Saida: squad operacional e nivel em nomenclatura Warzone.
 */
function buildInvestorProfile_(metrics, categories, investorLevel) {
  let squad = 'Squad Balanceado';
  if ((metrics?.equityShare || 0) >= 0.45 || categories?.actions?.status === 'Crítico') {
    squad = 'Squad Agressivo';
  } else if ((metrics?.equityShare || 0) <= 0.20 && (metrics?.previdenciaShare || 0) >= 0.45) {
    squad = 'Squad Conservador';
  }

  return {
    squad: squad,
    level: investorLevel?.name || 'Recruta',
    levelScore: investorLevel?.points || 0
  };
}

/**
 * Converte as avaliacoes por categoria em alertas curtos e ordenaveis.
 * Entrada: categorias avaliadas pelo novo motor.
 * Saida: lista de alertas ja pronta para uso nas mensagens e no payload.
 */
function buildPortfolioAlerts_(categories) {
  const alerts = [];
  [categories?.actions, categories?.funds, categories?.previdencia].forEach(function (category) {
    if (!category || !category.primaryIssue) return;
    if (category.status !== 'Crítico' && category.status !== 'Atenção') return;

    alerts.push({
      type: category.status === 'Crítico' ? 'Crítico' : 'Atenção',
      message: category.primaryIssue.message,
      asset: category.primaryIssue.asset || category.label
    });
  });

  return sortAlertsByPriority_(alerts);
}

/**
 * Gera o conselho geral da carteira em linhas curtas para o frontend.
 * Mantem o resumo tatico direto e sem texto longo.
 */
function buildPortfolioGeneralAdvice_(metrics, portfolioDecision, investorLevel) {
  const lines = [];
  lines.push('Patrimonio em campo: ' + formatMoney_(metrics?.totalAtual || 0) + '.');
  lines.push('Performance consolidada: ' + formatPct_(metrics?.performance || 0) + '.');
  lines.push((portfolioDecision?.actionText || 'Manter plano') + ' | ' + (portfolioDecision?.focusCategoryLabel || 'Carteira') + '.');
  lines.push('Nivel ' + (investorLevel?.name || 'Recruta') + '.');
  return lines.join('\n');
}

function buildOrdersPayload_(actions, preOrders) {
  let sell = null;
  const sellCandidates = (actions || []).filter(function (action) {
    return action.recommendation === 'Vender';
  }).sort(function (a, b) {
    return (a?.rent || 0) - (b?.rent || 0);
  });

  if (sellCandidates.length) {
    sell = {
      symbol: sellCandidates[0].ticker,
      value: sellCandidates[0].positionValue
    };
  }

  let buy = null;
  const pendingBuy = (preOrders || []).find(function (order) {
    const normalizedStatus = String(order?.status || '').toLowerCase();
    return normalizedStatus.indexOf('aguardando') >= 0
      || normalizedStatus.indexOf('pendente') >= 0
      || normalizedStatus.indexOf('aberta') >= 0;
  });

  if (pendingBuy) {
    buy = {
      symbol: pendingBuy.ticker,
      value: formatMoney_(pendingBuy.valorPotencialRaw)
    };
  }

  return { sell: sell, buy: buy };
}

/**
 * Faz a ponte entre o novo motor de decisao e a camada atual de mensagens.
 * Entrada: engine consolidado da carteira.
 * Saida: bloco messaging pronto para o payload do dashboard.
 */
function buildPortfolioMessagingFromEngine_(engine) {
  const executiveDecision = selectExecutiveStatusDecision_(engine?.score, engine?.alerts);

  return {
    executiveSummary: buildExecutiveSummary_(engine?.metrics, engine?.score, executiveDecision),
    primaryRecommendation: buildPrimaryRecommendationFromEngine_(engine?.portfolioDecision),
    alertsSummary: buildAlertsSummary_(engine?.alerts),
    supportNotes: buildSupportNotes_(engine?.score, engine?.profile)
  };
}

/**
 * Monta a recomendacao principal a partir da decisao consolidada da carteira.
 * Entrada: decisao principal do novo motor.
 * Saida: titulo, motivo e impacto curtos prontos para renderizacao.
 */
function buildPrimaryRecommendationFromEngine_(portfolioDecision) {
  const decision = portfolioDecision || {};
  const asset = decision.criticalPoint || decision.focusCategoryLabel || 'Plano';
  const messageKeys = getPortfolioDecisionMessageKeys_(decision);
  let title = 'MANTER PLANO';

  if (decision.actionText === 'Reduzir exposição') {
    title = asset ? ('REDUZIR ' + String(asset).toUpperCase()) : 'REDUZIR EXPOSICAO';
  } else if (decision.actionText === 'Redistribuir carteira') {
    title = 'REDISTRIBUIR CARTEIRA';
  } else if (decision.actionText === 'Revisar posição') {
    title = asset ? ('REVISAR ' + String(asset).toUpperCase()) : 'REVISAR POSICAO';
  }

  return {
    actionText: decision.actionText || 'Manter plano',
    asset: asset,
    title: title,
    reason: buildWarzoneCopy_(messageKeys.reasonKey, {
      asset: asset,
      category: decision.focusCategoryLabel || 'Carteira'
    }),
    impact: buildWarzoneCopy_(messageKeys.impactKey, {
      asset: asset,
      category: decision.focusCategoryLabel || 'Carteira'
    })
  };
}

function getPortfolioDecisionMessageKeys_(decision) {
  if (decision?.actionText === 'Reduzir exposição') {
    return {
      reasonKey: 'decision-reduce-exposure-reason',
      impactKey: 'decision-reduce-exposure-impact'
    };
  }

  if (decision?.actionText === 'Redistribuir carteira') {
    return {
      reasonKey: 'decision-redistribute-portfolio-reason',
      impactKey: 'decision-redistribute-portfolio-impact'
    };
  }

  if (decision?.actionText === 'Revisar posição') {
    return {
      reasonKey: 'decision-review-position-reason',
      impactKey: 'decision-review-position-impact'
    };
  }

  return {
    reasonKey: 'decision-hold-plan-reason',
    impactKey: 'decision-hold-plan-impact'
  };
}

function pickPriorityIssue_(currentIssue, candidateIssue) {
  if (!candidateIssue) return currentIssue;
  if (!currentIssue) return candidateIssue;

  const currentPriority = getIssuePriority_(currentIssue);
  const candidatePriority = getIssuePriority_(candidateIssue);

  if (candidatePriority < currentPriority) return candidateIssue;
  if (candidatePriority > currentPriority) return currentIssue;

  return (candidateIssue.weight || 0) > (currentIssue.weight || 0)
    ? candidateIssue
    : currentIssue;
}

function getIssuePriority_(issue) {
  if (!issue) return 99;
  if (issue.type === 'Crítico') return 0;
  if (issue.type === 'Atenção') return 1;
  return 2;
}

function hasCategoryStatus_(categories, status) {
  return [categories?.actions, categories?.funds, categories?.previdencia].some(function (category) {
    return category?.status === status;
  });
}

function areAllCategoriesStrongOrSafe_(categories) {
  return [categories?.actions, categories?.funds, categories?.previdencia]
    .filter(Boolean)
    .every(function (category) {
      return category.status === 'Seguro' || category.status === 'Forte';
    });
}

// -----------------------------------------------------------------------------
// Camada de mensagens da carteira
// -----------------------------------------------------------------------------

/**
 * Determina o estado executivo principal da carteira a partir de score e alertas.
 * Retorna apenas a decisao, sem gerar o texto final.
 */
function selectExecutiveStatusDecision_(score, alerts) {
  const criticalAlert = findCriticalAlert_(alerts);
  if (criticalAlert) {
    return {
      state: 'hot_zone',
      asset: criticalAlert.asset || criticalAlert.symbol || '',
      scoreStatus: score?.status || ''
    };
  }

  const normalizedStatus = normalizePortfolioStatus_(score?.status);
  if (normalizedStatus === 'critical') {
    return { state: 'danger', asset: '', scoreStatus: score?.status || '' };
  }

  if (normalizedStatus === 'unstable') {
    return { state: 'watch', asset: '', scoreStatus: score?.status || '' };
  }

  return { state: 'stable', asset: '', scoreStatus: score?.status || '' };
}

/**
 * Monta a mensagem executiva pronta para o topo do dashboard.
 * Usa metricas e a decisao executiva para entregar status e performance prontos.
 */
function buildExecutiveSummary_(metrics, score, decision) {
  return {
    statusText: buildWarzoneCopy_(decision?.state || 'stable', {
      asset: decision?.asset || ''
    }),
    performanceText: buildPerformanceBadgeText_(metrics?.performance),
    scoreStatusText: score?.status || ''
  };
}


/**
 * Resume os alertas em linhas curtas prontas para o bloco de apoio do frontend.
 * O cliente passa a exibir texto pronto sem ordenar nem compor copy final.
 */
function buildAlertsSummary_(alerts) {
  const sortedAlerts = sortAlertsByPriority_(alerts);
  if (!sortedAlerts.length) {
    const clearLine = buildWarzoneCopy_('alerts-clear', {});
    return {
      headline: clearLine,
      lines: [clearLine]
    };
  }

  const lines = sortedAlerts.slice(0, 3).map(function (alert) {
    return buildAlertSummaryLine_(alert);
  });

  return {
    headline: lines[0],
    lines: lines
  };
}

/**
 * Gera notas auxiliares curtas para o painel lateral sem depender de copy local.
 * Entrega linhas prontas em linguagem Warzone para score e postura do squad.
 */
function buildSupportNotes_(score, profile) {
  const normalizedStatus = normalizePortfolioStatus_(score?.status);
  const scoreTextKey = normalizedStatus === 'critical'
    ? 'support-score-hot'
    : (normalizedStatus === 'unstable' ? 'support-score-watch' : 'support-score-safe');

  let squadTextKey = 'support-squad-balanced';
  const squadName = String(profile?.squad || '');
  if (/agressivo/i.test(squadName)) squadTextKey = 'support-squad-aggressive';
  else if (/conservador/i.test(squadName)) squadTextKey = 'support-squad-conservative';

  return {
    scoreNote: 'Score ' + (score?.score ?? '--') + '. ' + buildWarzoneCopy_(scoreTextKey, {}),
    squadTip: buildWarzoneCopy_(squadTextKey, {})
  };
}

/**
 * Centraliza a copy curta estilo Warzone para manter consistencia entre cards.
 * Entrada: chave da mensagem e contexto opcional.
 * Saida: texto curto pronto para renderizacao.
 */
function buildWarzoneCopy_(key, context) {
  const asset = context?.asset ? String(context.asset) : 'a carteira';

  switch (key) {
    case 'hot_zone':
      return 'Zona quente em ' + asset + '.';
    case 'danger':
      return 'Blindagem baixa. Carteira em risco.';
    case 'watch':
      return 'Contato no radar. Melhor revisar.';
    case 'stable':
      return 'Squad firme. Mantem o plano.';
    case 'recommendation-reduce-reason':
      return 'Zona quente em ' + asset + '.';
    case 'recommendation-reduce-impact':
      return 'Corta dano e protege caixa.';
    case 'recommendation-review-reason':
      return 'Loot fraco em ' + asset + '.';
    case 'recommendation-review-impact':
      return 'Ajusta a rota antes da pressao subir.';
    case 'recommendation-monitor-reason':
      return 'Contato no radar em ' + asset + '.';
    case 'recommendation-monitor-impact':
      return 'Fica no radar sem queimar caixa.';
    case 'recommendation-hold-reason':
      return 'Drop seguro. Carteira estavel.';
    case 'recommendation-hold-impact':
      return 'Squad firme. Mantem o plano.';
    case 'decision-reduce-exposure-reason':
      return 'Zona quente em ' + asset + '.';
    case 'decision-reduce-exposure-impact':
      return 'Reduz dano e alivia a pressao.';
    case 'decision-redistribute-portfolio-reason':
      return 'Base travada em ' + asset + '.';
    case 'decision-redistribute-portfolio-impact':
      return 'Redistribui o peso e melhora a blindagem.';
    case 'decision-review-position-reason':
      return 'Contato no radar em ' + asset + '.';
    case 'decision-review-position-impact':
      return 'Revisa a posicao antes da pressao subir.';
    case 'decision-hold-plan-reason':
      return 'Drop seguro. Mantem o plano.';
    case 'decision-hold-plan-impact':
      return 'Squad firme. Segue a rota.';
    case 'alert-critical':
      return 'CRITICO: Zona quente em ' + asset + '.';
    case 'alert-attention':
      return 'ATENCAO: Contato em ' + asset + '.';
    case 'alert-info':
      return 'INFO: Loot em leitura em ' + asset + '.';
    case 'alerts-clear':
      return 'AREA LIMPA: Sem alerta critico.';
    case 'support-score-hot':
      return 'Blindagem baixa. Reforca a cobertura.';
    case 'support-score-watch':
      return 'Contato no radar. Vale revisar as linhas.';
    case 'support-score-safe':
      return 'Blindagem em dia. Mantem a rota.';
    case 'support-squad-aggressive':
      return 'Squad agressivo. Nao avanca sem revisar stop.';
    case 'support-squad-conservative':
      return 'Squad conservador. Segue no cover e mantem caixa.';
    case 'support-squad-balanced':
    default:
      return 'Squad balanceado. Mantem formacao e disciplina.';
  }
}

/**
 * Gera a linha curta de alerta pronta para o frontend.
 */
function buildAlertSummaryLine_(alert) {
  const normalizedType = normalizeAlertType_(alert?.type);
  const asset = alert?.asset || alert?.symbol || 'a carteira';

  if (normalizedType === 'critical') {
    return buildWarzoneCopy_('alert-critical', { asset: asset });
  }

  if (normalizedType === 'attention') {
    return buildWarzoneCopy_('alert-attention', { asset: asset });
  }

  return buildWarzoneCopy_('alert-info', { asset: asset });
}

function buildPerformanceBadgeText_(performance) {
  if (performance === null || performance === undefined || isNaN(Number(performance))) return '';

  const pct = Number(performance) * 100;
  const absFormatted = Math.abs(pct).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }) + '%';

  if (pct > 0) return '+' + absFormatted + ' no round';
  if (pct < 0) return '-' + absFormatted + ' no round';
  return '0,0% no round';
}

function sortAlertsByPriority_(alerts) {
  return (alerts || []).slice().sort(function (a, b) {
    return (ALERT_PRIORITY_[a?.type] ?? 9) - (ALERT_PRIORITY_[b?.type] ?? 9);
  });
}

function findCriticalAlert_(alerts) {
  return (alerts || []).find(function (alert) {
    return normalizeAlertType_(alert?.type) === 'critical';
  }) || null;
}

function normalizeAlertType_(type) {
  const normalized = String(type || '').toLowerCase();
  if (normalized === 'crítico' || normalized === 'critico') return 'critical';
  if (normalized === 'atenção' || normalized === 'atencao') return 'attention';
  return 'info';
}

function normalizePortfolioStatus_(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'crítico' || normalized === 'critico') return 'critical';
  if (normalized === 'instável' || normalized === 'instavel') return 'unstable';
  return 'stable';
}

function getPrimaryAlert_(alerts) {
  if (!alerts || !alerts.length) return null;

  const sortedAlerts = alerts.slice().sort(function (a, b) {
    return (ALERT_PRIORITY_[a.type] ?? 9) - (ALERT_PRIORITY_[b.type] ?? 9);
  });
  const firstAlert = sortedAlerts[0];

  if (!firstAlert) return null;
  return {
    text: firstAlert.message,
    symbol: firstAlert.asset || ''
  };
}

function getRecommendation_(rentPct, atual, stop) {
  if (rentPct <= -0.15 || (Number(atual) && Number(stop) && Number(atual) <= Number(stop))) return 'Vender';
  if (rentPct < -0.05) return 'Revisar';
  if (rentPct < 0.03) return 'Monitorar';
  return 'Manter';
}

function getSoftRecommendation_(rentPct) {
  if (rentPct < -0.02) return 'Revisar';
  if (rentPct < 0.05) return 'Monitorar';
  return 'Manter';
}
