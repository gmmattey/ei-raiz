/**
 * DECISION ENGINE
 * Score por ativo, ranking, plano de acao, historico e alertas inteligentes.
 */

function buildScoredActions_(actions, metrics) {
  return (actions || []).map(function (action) {
    const assetScore = getAssetScore_(action, metrics);
    return Object.assign({}, action, {
      assetScore: assetScore,
      smartRecommendation: getSmartRecommendation_(action, buildAssetDecisionContext_(action, metrics, assetScore))
    });
  });
}

/**
 * Calcula um score simples e explicavel por ativo.
 * Entrada: ativo individual e metricas consolidadas da carteira.
 * Saida: score de 0 a 100, status textual e motivos curtos.
 */
function getAssetScore_(asset, metrics) {
  const performanceBlock = getAssetPerformanceScoreBlock_(asset);
  const concentrationBlock = getAssetConcentrationScoreBlock_(asset, metrics);
  const riskBlock = getAssetRiskScoreBlock_(asset);
  const marketBlock = getAssetMarketScoreBlock_(asset);
  const volatilityBlock = getAssetVolatilityScoreBlock_(asset);
  const rawScore = performanceBlock.points
    + concentrationBlock.points
    + riskBlock.points
    + marketBlock.points
    + volatilityBlock.points;
  const score = clampNumber_(Math.round(rawScore), 0, 100);
  const motivos = compactAssetScoreReasons_([
    performanceBlock.reason,
    concentrationBlock.reason,
    riskBlock.reason,
    marketBlock.reason,
    volatilityBlock.reason
  ]);

  if (!motivos.length) {
    motivos.push('leitura neutra do ativo');
  }

  return {
    score: score,
    status: getAssetScoreStatus_(score),
    motivos: motivos
  };
}

function getAssetPerformanceScoreBlock_(asset) {
  const rent = Number(asset?.rent || 0);

  if (rent <= -0.15) return { points: 0, reason: 'queda forte no acumulado' };
  if (rent <= -0.05) return { points: 10, reason: 'performance fraca no acumulado' };
  if (rent < 0.03) return { points: 20, reason: 'performance ainda morna' };
  if (rent < 0.10) return { points: 28, reason: 'performance positiva' };
  return { points: 35, reason: 'performance forte' };
}

function getAssetConcentrationScoreBlock_(asset, metrics) {
  const totalActions = Number(metrics?.totals?.actions || 0);
  const totalPortfolio = Number(metrics?.totalAtual || 0);
  const actionValue = Number(asset?.valorAtualRaw || 0);
  const categoryShare = totalActions ? actionValue / totalActions : 0;
  const portfolioShare = totalPortfolio ? actionValue / totalPortfolio : 0;

  if (portfolioShare > 0.20 || categoryShare > 0.40) {
    return { points: 5, reason: 'peso critico na carteira' };
  }

  if (portfolioShare > 0.12 || categoryShare > 0.25) {
    return { points: 12, reason: 'peso alto na carteira' };
  }

  if (portfolioShare > 0.07 || categoryShare > 0.15) {
    return { points: 18, reason: 'peso moderado na carteira' };
  }

  return { points: 25, reason: 'peso controlado' };
}

function getAssetRiskScoreBlock_(asset) {
  const currentPrice = Number(asset?.currentPriceRaw || 0);
  const stopPrice = Number(asset?.stopRaw || 0);
  const rent = Number(asset?.rent || 0);

  if (stopPrice && currentPrice && currentPrice <= stopPrice) {
    return { points: 0, reason: 'abaixo do stop' };
  }

  if (stopPrice && currentPrice && currentPrice <= stopPrice * 1.05) {
    return { points: 10, reason: 'muito perto do stop' };
  }

  if (!stopPrice && rent <= -0.10) {
    return { points: 8, reason: 'queda relevante sem stop' };
  }

  if (stopPrice) {
    return { points: 25, reason: 'risco protegido por stop' };
  }

  return { points: 18, reason: 'sem stop definido' };
}

function getAssetMarketScoreBlock_(asset) {
  const marketContext = buildAssetMarketContext_(asset);
  const monthlyChangePct = marketContext.monthlyChangePct;
  const rent = Number(asset?.rent || 0);
  let points = 5;
  let reason = '';

  if (!marketContext.hasExternalData) {
    return { points: 5, reason: '' };
  }

  if (marketContext.priceGapPct !== null && Math.abs(marketContext.priceGapPct) >= 0.07) {
    return { points: 2, reason: 'cotacao publica distante da planilha' };
  }

  if (monthlyChangePct <= -0.10) {
    points = 2;
    reason = 'mercado 30d ainda pressionado';
  } else if (monthlyChangePct <= -0.03) {
    points = 4;
    reason = 'mercado 30d em queda';
  } else if (monthlyChangePct < 0.05) {
    points = 7;
    reason = 'mercado 30d neutro';
  } else {
    points = 10;
    reason = 'mercado 30d favoravel';
  }

  if (rent < 0 && monthlyChangePct >= 0.05) {
    points = clampNumber_(points - 2, 0, 10);
    reason = 'ativo fraco com mercado favoravel';
  } else if (rent > 0 && monthlyChangePct <= -0.05) {
    points = clampNumber_(points + 1, 0, 10);
    reason = 'ativo segurando melhor que o mercado';
  }

  return { points: points, reason: reason };
}

function getAssetVolatilityScoreBlock_(asset) {
  const dailyChangePct = Math.abs(Number(asset?.marketData?.dailyChangePct || 0));

  if (toNullableNumber_(asset?.marketData?.dailyChangePct) === null) {
    return { points: 3, reason: '' };
  }

  if (dailyChangePct >= 0.07) {
    return { points: 0, reason: 'volatilidade diaria elevada' };
  }

  if (dailyChangePct >= 0.04) {
    return { points: 2, reason: 'volatilidade diaria alta' };
  }

  if (dailyChangePct >= 0.02) {
    return { points: 4, reason: 'volatilidade diaria moderada' };
  }

  return { points: 5, reason: 'volatilidade diaria controlada' };
}

function getAssetScoreStatus_(score) {
  if (score <= 39) return 'Crítico';
  if (score <= 59) return 'Ruim';
  if (score <= 79) return 'Ok';
  return 'Forte';
}

function compactAssetScoreReasons_(reasons) {
  const seen = {};

  return (reasons || []).reduce(function (items, reason) {
    const normalized = String(reason || '').trim();
    if (!normalized || seen[normalized]) return items;
    seen[normalized] = true;
    items.push(normalized);
    return items;
  }, []);
}

function clampNumber_(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Resume o contexto decisorio de um ativo para recomendacoes mais inteligentes.
 * Mantem a logica pequena e reaproveitavel por ranking, IA e payload.
 */
function buildAssetDecisionContext_(asset, metrics, assetScore) {
  const totalActions = Number(metrics?.totals?.actions || 0);
  const totalPortfolio = Number(metrics?.totalAtual || 0);
  const actionValue = Number(asset?.valorAtualRaw || 0);
  const marketContext = buildAssetMarketContext_(asset);

  return {
    assetScore: assetScore || getAssetScore_(asset, metrics),
    categoryShare: totalActions ? actionValue / totalActions : 0,
    portfolioShare: totalPortfolio ? actionValue / totalPortfolio : 0,
    riskPriority: getAssetRiskPriority_(asset),
    marketMomentum: marketContext.monthlyChangePct,
    marketContext: marketContext,
    rent: Number(asset?.rent || 0)
  };
}

/**
 * Gera recomendacao curta com contexto, sem executar ordem financeira.
 * Mantem a recomendacao simples antiga e adiciona uma camada explicativa nova.
 */
function getSmartRecommendation_(asset, context) {
  const ticker = String(asset?.ticker || 'ATIVO');
  const assetScore = context?.assetScore || { score: 0, status: 'Ruim' };
  const riskPriority = Number(context?.riskPriority || 1);
  const portfolioShare = Number(context?.portfolioShare || 0);
  const marketMomentum = context?.marketMomentum;
  const marketContext = context?.marketContext || {};
  const rent = Number(context?.rent || 0);

  if (riskPriority >= 4) {
    return {
      action: 'Reduzir',
      title: ticker + ' abaixo do stop. Melhor reduzir.',
      reason: 'Risco perdeu a defesa principal.',
      impact: 'Pode cortar dano rapido na carteira.'
    };
  }

  if (riskPriority >= 3 && portfolioShare > 0.12) {
    return {
      action: 'Reduzir',
      title: ticker + ' pesa alto com risco quente.',
      reason: 'Peso alto combinado com risco elevado.',
      impact: 'Reduz concentracao exposta.'
    };
  }

  if (assetScore.score <= 39) {
    if (marketContext.priceGapPct !== null && marketContext.priceGapPct <= -0.05) {
      return {
        action: 'Revisar',
        title: ticker + ' abriu gap com a cotacao publica.',
        reason: 'Mercado aponta preco abaixo da leitura interna.',
        impact: 'Vale revisar a posicao e a base de preco.'
      };
    }

    if (marketMomentum !== null && marketMomentum <= -0.05) {
      return {
        action: 'Monitorar',
        title: ticker + ' caiu em mercado pressionado.',
        reason: 'Leitura critica, mas o contexto recente do ativo segue fraco.',
        impact: 'Pede sangue frio e revisao de tese.'
      };
    }

    return {
      action: 'Revisar',
      title: ticker + ' pede revisao imediata.',
      reason: 'Score critico no ativo.',
      impact: 'Evita carregar fraqueza por tempo demais.'
    };
  }

  if (assetScore.score <= 59) {
    if (marketContext.priceGapPct !== null && Math.abs(marketContext.priceGapPct) >= 0.05) {
      return {
        action: 'Revisar',
        title: ticker + ' pede checagem de preco.',
        reason: 'A cotacao publica divergiu da leitura interna.',
        impact: 'Ajuda a evitar decisao em base desatualizada.'
      };
    }

    if (marketMomentum !== null && marketMomentum >= 0.05 && rent < 0) {
      return {
        action: 'Revisar',
        title: ticker + ' ficou para tras do mercado.',
        reason: 'A posicao segue fraca mesmo com momento favoravel.',
        impact: 'Vale revisar a tese do ativo.'
      };
    }

    return {
      action: 'Monitorar',
      title: ticker + ' segue em zona de acompanhamento.',
      reason: 'Leitura ainda irregular, sem gatilho para mexer agora.',
      impact: 'Pede vigilancia sem pressa.'
    };
  }

  if (assetScore.score >= 80 && marketMomentum !== null && marketMomentum >= 0.05 && portfolioShare < 0.12) {
    return {
      action: 'Manter',
      title: ticker + ' segue forte no radar.',
      reason: 'Score alto com momento recente favoravel.',
      impact: 'Mantem o plano sem aumentar ruido.'
    };
  }

  if (assetScore.score >= 80) {
    if (marketContext.priceGapPct !== null && marketContext.priceGapPct >= 0.03) {
      return {
        action: 'Manter',
        title: ticker + ' segue firme com mercado apoiando.',
        reason: 'Score alto e cotacao publica sem sinal de fraqueza.',
        impact: 'Mantem a leitura positiva do ativo.'
      };
    }

    return {
      action: 'Manter',
      title: ticker + ' segue forte.',
      reason: 'Score alto e risco controlado.',
      impact: 'Posicao continua saudavel.'
    };
  }

  return {
    action: 'Monitorar',
    title: ticker + ' pede acompanhamento.',
    reason: 'Leitura mediana do ativo.',
    impact: 'Observa antes de ajustar a posicao.'
  };
}

/**
 * Ordena as acoes por prioridade tatico-operacional.
 * Usa score, risco e impacto para destacar foco, risco e oportunidade.
 */
function getAssetRanking_(actions, metrics) {
  const rankingItems = (actions || []).map(function (asset) {
    return buildAssetRankingItem_(asset, metrics);
  });

  const orderedItems = rankingItems.slice().sort(compareAssetRankingItems_);
  const opportunityItems = rankingItems.slice().sort(compareAssetOpportunityItems_);

  return {
    items: orderedItems,
    topRisk: orderedItems.length ? orderedItems[0] : null,
    topOpportunity: opportunityItems.length ? opportunityItems[0] : null
  };
}

function buildAssetRankingItem_(asset, metrics) {
  const totalActions = Number(metrics?.totals?.actions || 0);
  const totalPortfolio = Number(metrics?.totalAtual || 0);
  const actionValue = Number(asset?.valorAtualRaw || 0);
  const assetScore = asset?.assetScore || getAssetScore_(asset, metrics);
  const categoryShare = totalActions ? actionValue / totalActions : 0;
  const portfolioShare = totalPortfolio ? actionValue / totalPortfolio : 0;
  const marketContext = buildAssetMarketContext_(asset);
  const marketMomentum = marketContext.monthlyChangePct;
  const riskPriority = getAssetRiskPriority_(asset);
  const opportunityScore = getAssetOpportunityScore_(asset, assetScore, marketMomentum, portfolioShare);

  return {
    ticker: asset?.ticker || '',
    name: asset?.name || '',
    score: Number(assetScore?.score || 0),
    status: assetScore?.status || 'Ok',
    motivos: Array.isArray(assetScore?.motivos) ? assetScore.motivos : [],
    recommendation: asset?.recommendation || 'Manter',
    smartRecommendation: asset?.smartRecommendation || null,
    riskPriority: riskPriority,
    riskLabel: getAssetRiskLabel_(riskPriority),
    marketSignal: marketContext.signal,
    marketContext: marketContext,
    portfolioShare: portfolioShare,
    categoryShare: categoryShare,
    impactWeight: Math.max(portfolioShare, categoryShare),
    opportunityScore: opportunityScore,
    marketMomentum: marketMomentum,
    rent: Number(asset?.rent || 0)
  };
}

function compareAssetRankingItems_(a, b) {
  if ((a?.score || 0) !== (b?.score || 0)) return (a?.score || 0) - (b?.score || 0);
  if ((a?.riskPriority || 0) !== (b?.riskPriority || 0)) return (b?.riskPriority || 0) - (a?.riskPriority || 0);
  if ((a?.impactWeight || 0) !== (b?.impactWeight || 0)) return (b?.impactWeight || 0) - (a?.impactWeight || 0);
  return String(a?.ticker || '').localeCompare(String(b?.ticker || ''));
}

function compareAssetOpportunityItems_(a, b) {
  if ((a?.opportunityScore || 0) !== (b?.opportunityScore || 0)) return (b?.opportunityScore || 0) - (a?.opportunityScore || 0);
  if ((a?.score || 0) !== (b?.score || 0)) return (b?.score || 0) - (a?.score || 0);
  if ((a?.impactWeight || 0) !== (b?.impactWeight || 0)) return (a?.impactWeight || 0) - (b?.impactWeight || 0);
  return String(a?.ticker || '').localeCompare(String(b?.ticker || ''));
}

function getAssetRiskPriority_(asset) {
  const currentPrice = Number(asset?.currentPriceRaw || 0);
  const stopPrice = Number(asset?.stopRaw || 0);
  const rent = Number(asset?.rent || 0);

  if (stopPrice && currentPrice && currentPrice <= stopPrice) return 4;
  if (stopPrice && currentPrice && currentPrice <= stopPrice * 1.05) return 3;
  if (rent <= -0.15) return 3;
  if (rent <= -0.05 || !stopPrice) return 2;
  return 1;
}

function getAssetRiskLabel_(riskPriority) {
  if (riskPriority >= 4) return 'Crítico';
  if (riskPriority >= 3) return 'Alto';
  if (riskPriority >= 2) return 'Médio';
  return 'Controlado';
}

function getAssetOpportunityScore_(asset, assetScore, marketMomentum, portfolioShare) {
  let score = Number(assetScore?.score || 0);

  if (Number(asset?.rent || 0) > 0.03) score += 8;
  if (marketMomentum !== null && marketMomentum >= 0.05) score += 6;
  if (marketMomentum !== null && marketMomentum <= -0.05) score -= 4;
  if (portfolioShare > 0.12) score -= 6;
  if (getAssetRiskPriority_(asset) >= 3) score -= 10;

  return clampNumber_(Math.round(score), 0, 120);
}

function buildAssetMarketContext_(asset) {
  const marketData = asset?.marketData || {};
  const currentPriceRaw = toNullableNumber_(asset?.currentPriceRaw);
  const publicCurrentPrice = toNullableNumber_(marketData.currentPrice);
  const dailyChangePct = toNullableNumber_(marketData.dailyChangePct);
  const monthlyChangePct = toNullableNumber_(marketData.monthlyChangePct);
  const priceGapPct = currentPriceRaw && publicCurrentPrice
    ? (publicCurrentPrice / currentPriceRaw - 1)
    : null;
  const hasExternalData =
    publicCurrentPrice !== null ||
    dailyChangePct !== null ||
    monthlyChangePct !== null;

  return {
    hasExternalData: hasExternalData,
    currentPriceRaw: publicCurrentPrice,
    dailyChangePct: dailyChangePct,
    monthlyChangePct: monthlyChangePct,
    priceGapPct: priceGapPct,
    signal: getAssetMarketSignal_(priceGapPct, monthlyChangePct),
    message: getAssetMarketSignalMessage_(priceGapPct, monthlyChangePct)
  };
}

function getAssetMarketSignal_(priceGapPct, monthlyChangePct) {
  if (priceGapPct !== null && Math.abs(priceGapPct) >= 0.07) return 'price-divergence';
  if (monthlyChangePct !== null && monthlyChangePct <= -0.10) return 'market-pressure';
  if (monthlyChangePct !== null && monthlyChangePct >= 0.05) return 'market-support';
  return 'neutral';
}

function getAssetMarketSignalMessage_(priceGapPct, monthlyChangePct) {
  if (priceGapPct !== null && priceGapPct <= -0.07) return 'cotacao publica abaixo da planilha';
  if (priceGapPct !== null && priceGapPct >= 0.07) return 'cotacao publica acima da planilha';
  if (monthlyChangePct !== null && monthlyChangePct <= -0.10) return 'mercado 30d pressionado';
  if (monthlyChangePct !== null && monthlyChangePct >= 0.05) return 'mercado 30d favoravel';
  return '';
}

/**
 * Gera alertas inteligentes orientados a acao e acompanhamento.
 * Mantem poucos eventos relevantes para evitar spam no dashboard.
 */
function buildIntelligentAlerts_(engine, actionPlan, decisionHistory) {
  const alerts = [];
  const topRisk = engine?.assetRanking?.topRisk || null;
  const topOpportunity = engine?.assetRanking?.topOpportunity || null;
  const latestHistory = Array.isArray(decisionHistory) && decisionHistory.length ? decisionHistory[0] : null;

  if (topRisk?.riskPriority >= 4) {
    alerts.push({
      key: 'stop-hit:' + (topRisk.ticker || ''),
      type: 'Crítico',
      title: 'Stop no radar',
      message: (topRisk.ticker || 'Ativo') + ' perdeu a defesa principal.',
      asset: topRisk.ticker || ''
    });
  } else if ((topRisk?.impactWeight || 0) >= 0.20) {
    alerts.push({
      key: 'high-concentration:' + (topRisk.ticker || ''),
      type: 'Atenção',
      title: 'Concentração alta',
      message: (topRisk.ticker || 'Ativo') + ' está pesado demais na carteira.',
      asset: topRisk.ticker || ''
    });
  }

  if (topOpportunity
    && topOpportunity.ticker
    && topOpportunity.opportunityScore >= 85
    && (topOpportunity.riskPriority || 0) <= 2) {
    alerts.push({
      key: 'opportunity:' + topOpportunity.ticker,
      type: 'Oportunidade',
      title: 'Janela tática',
      message: topOpportunity.ticker + ' aparece como oportunidade relativa.',
      asset: topOpportunity.ticker
    });
  }

  if (latestHistory?.outcome?.label === 'Revisar') {
    alerts.push({
      key: 'history-review:' + (latestHistory.ativo || ''),
      type: 'Atenção',
      title: 'Leitura perdeu força',
      message: (latestHistory.ativo || 'Ativo') + ' pede nova revisão do plano.',
      asset: latestHistory.ativo || ''
    });
  } else if (latestHistory?.outcome?.label === 'Confirmada' && latestHistory?.ativo) {
    alerts.push({
      key: 'history-confirmed:' + latestHistory.ativo,
      type: 'Informativo',
      title: 'Leitura confirmada',
      message: latestHistory.ativo + ' confirmou a direção da decisão anterior.',
      asset: latestHistory.ativo
    });
  }

  if (actionPlan?.prioridade === 'Alta' && actionPlan?.context?.focusCategory) {
    alerts.push({
      key: 'priority-focus:' + String(actionPlan.context.focusCategory || ''),
      type: 'Atenção',
      title: 'Foco prioritário',
      message: 'O bloco de ' + actionPlan.context.focusCategory + ' pede ação primeiro.',
      asset: actionPlan.context.topRiskAsset || ''
    });
  }

  return dedupeIntelligentAlerts_(alerts).sort(compareIntelligentAlerts_).slice(0, 3);
}

function dedupeIntelligentAlerts_(alerts) {
  const seen = {};
  return (alerts || []).reduce(function (items, alert) {
    const key = String(alert?.key || '').trim();
    if (!key || seen[key]) return items;
    seen[key] = true;
    items.push(alert);
    return items;
  }, []);
}

function compareIntelligentAlerts_(a, b) {
  const priorityMap = {
    'Crítico': 0,
    'Atenção': 1,
    'Oportunidade': 2,
    'Informativo': 3
  };

  return (priorityMap[a?.type] ?? 9) - (priorityMap[b?.type] ?? 9);
}

/**
 * Monta o plano de acao operacional com prioridade unica.
 * Entrada: engine consolidado da carteira.
 * Saida: acao principal, justificativa, impacto e alternativas curtas.
 */
function getActionPlan_(engine) {
  const portfolioDecision = engine?.portfolioDecision || {};
  const primaryRecommendation = buildPrimaryRecommendationFromEngine_(portfolioDecision);
  const topRisk = engine?.assetRanking?.topRisk || null;
  const topOpportunity = engine?.assetRanking?.topOpportunity || null;
  const urgency = portfolioDecision?.urgency || 'Baixa';
  const focusCategory = portfolioDecision?.focusCategoryLabel || 'Carteira';
  const alternatives = [];
  const priorityDecision = getActionPriorityDecision_(engine);

  if (topOpportunity && topOpportunity.ticker && (!topRisk || topOpportunity.ticker !== topRisk.ticker)) {
    alternatives.push('Radar: ' + topOpportunity.ticker + ' como melhor oportunidade relativa.');
  }

  if (focusCategory && focusCategory !== 'Carteira') {
    alternatives.push('Foco secundario: revisar o bloco de ' + focusCategory + '.');
  }

  return {
    prioridade: priorityDecision.priority,
    acao_principal: primaryRecommendation.title || 'Manter o plano atual.',
    justificativa: primaryRecommendation.reason || 'Leitura geral sem gatilho critico imediato.',
    impacto: primaryRecommendation.impact || 'Mantem a carteira em observacao controlada.',
    alternativas: alternatives.slice(0, 2),
    context: {
      urgency: urgency,
      focusCategory: focusCategory,
      priorityReason: priorityDecision.reason,
      topRiskAsset: topRisk?.ticker || '',
      topOpportunityAsset: topOpportunity?.ticker || ''
    }
  };
}

/**
 * Define a prioridade pratica do plano com base em risco, impacto e concentracao.
 * Mantem uma unica saida de prioridade para evitar conflito de leitura.
 */
function getActionPriorityDecision_(engine) {
  const portfolioDecision = engine?.portfolioDecision || {};
  const topRisk = engine?.assetRanking?.topRisk || null;
  const urgency = portfolioDecision?.urgency || 'Baixa';
  const impactWeight = Number(topRisk?.impactWeight || 0);
  const riskPriority = Number(topRisk?.riskPriority || 1);

  if (riskPriority >= 4) {
    return {
      priority: 'Alta',
      reason: 'ativo com risco critico no topo da fila'
    };
  }

  if (impactWeight >= 0.12 && riskPriority >= 3) {
    return {
      priority: 'Alta',
      reason: 'risco alto com impacto relevante na carteira'
    };
  }

  if (impactWeight >= 0.20) {
    return {
      priority: 'Alta',
      reason: 'concentracao muito elevada no ativo foco'
    };
  }

  if (urgency === 'Imediata') {
    return {
      priority: 'Alta',
      reason: 'urgencia consolidada do motor principal'
    };
  }

  if (riskPriority >= 3 || impactWeight >= 0.08 || urgency === 'Curta') {
    return {
      priority: 'Media',
      reason: 'risco ou impacto pede revisao prioritaria'
    };
  }

  return {
    priority: 'Baixa',
    reason: 'sem gatilho critico imediato'
  };
}

/**
 * Monta o historico inicial de decisoes como contrato de acompanhamento.
 * Nesta etapa ele nasce como snapshot do estado atual, sem persistencia externa.
 */
function buildDecisionHistory_(spreadsheet, actions, engine, actionPlan) {
  if (!spreadsheet) return [];

  const candidateEntry = buildDecisionHistoryEntry_(actions, engine, actionPlan);
  registerRelevantDecision_(spreadsheet, candidateEntry);
  return loadDecisionHistory_(spreadsheet, actions);
}

function buildDecisionHistoryEntry_(actions, engine, actionPlan) {
  const portfolioDecision = engine?.portfolioDecision || {};
  const topRisk = engine?.assetRanking?.topRisk || null;
  const action = findActionByTicker_(actions, topRisk?.ticker || portfolioDecision?.asset || '');

  return {
    data: new Date().toISOString(),
    acao: actionPlan?.acao_principal || '',
    ativo: topRisk?.ticker || portfolioDecision?.asset || '',
    contexto: [
      'prioridade ' + (actionPlan?.prioridade || 'Baixa'),
      actionPlan?.context?.priorityReason || '',
      portfolioDecision?.criticalPoint || '',
      topRisk?.smartRecommendation?.reason || ''
    ].filter(Boolean).join(' | '),
    status: 'pendente',
    snapshot: buildDecisionSnapshot_(action, actionPlan, topRisk)
  };
}

function registerRelevantDecision_(spreadsheet, entry) {
  if (!isRelevantDecisionHistoryEntry_(entry)) return;

  const sheet = getDecisionHistorySheet_(spreadsheet);
  const fingerprint = buildDecisionHistoryFingerprint_(entry);
  const rows = loadDecisionHistoryRows_(sheet);
  const alreadyExists = rows.some(function (row) {
    return String(row.fingerprint || '') === fingerprint && String(row.status || '').toLowerCase() === 'pendente';
  });

  if (alreadyExists) return;

  sheet.appendRow([
    entry.data,
    entry.acao,
    entry.ativo,
    entry.contexto,
    entry.status,
    fingerprint,
    JSON.stringify(entry.snapshot || {})
  ]);
}

function loadDecisionHistory_(spreadsheet, actions) {
  const sheet = getDecisionHistorySheet_(spreadsheet);
  const rows = loadDecisionHistoryRows_(sheet);

  return rows
    .sort(function (a, b) {
      return String(b.data || '').localeCompare(String(a.data || ''));
    })
    .slice(0, APP_CONFIG_.decisionHistory.maxItems)
    .map(function (row) {
      const currentAction = findActionByTicker_(actions, row.ativo);
      return {
        data: row.data,
        acao: row.acao,
        ativo: row.ativo,
        contexto: row.contexto,
        status: row.status,
        outcome: evaluateDecisionOutcome_(row, currentAction)
      };
    });
}

function loadDecisionHistoryRows_(sheet) {
  if (!sheet) return [];

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  return values
    .filter(function (row) {
      return row[0] || row[1] || row[2] || row[3] || row[4];
    })
    .map(function (row) {
      return {
        data: row[0] ? new Date(row[0]).toISOString() : '',
        acao: String(row[1] || ''),
        ativo: String(row[2] || ''),
        contexto: String(row[3] || ''),
        status: String(row[4] || 'pendente'),
        fingerprint: String(row[5] || ''),
        snapshot: parseDecisionSnapshot_(row[6])
      };
    });
}

function getDecisionHistorySheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(APP_CONFIG_.decisionHistory.sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(APP_CONFIG_.decisionHistory.sheetName);
  }

  sheet.getRange(1, 1, 1, 7).setValues([['Data', 'Acao', 'Ativo', 'Contexto', 'Status', 'Fingerprint', 'Snapshot']]);
  sheet.hideSheet();

  return sheet;
}

function isRelevantDecisionHistoryEntry_(entry) {
  if (!entry?.acao) return false;
  const normalizedAction = String(entry.acao || '').toLowerCase();
  const normalizedContext = String(entry.contexto || '').toLowerCase();

  if (normalizedContext.indexOf('prioridade alta') >= 0) return true;
  if (normalizedAction.indexOf('revisar') >= 0) return true;
  if (normalizedAction.indexOf('reduzir') >= 0) return true;
  if (normalizedContext.indexOf('risco') >= 0) return true;
  if (normalizedContext.indexOf('critico') >= 0 || normalizedContext.indexOf('crítico') >= 0) return true;
  return false;
}

function buildDecisionHistoryFingerprint_(entry) {
  return [
    String(entry?.acao || '').trim().toLowerCase(),
    String(entry?.ativo || '').trim().toLowerCase(),
    String(entry?.contexto || '').trim().toLowerCase()
  ].join('|');
}

function buildDecisionSnapshot_(action, actionPlan, topRisk) {
  if (!action && !topRisk) return {};

  const assetScore = action?.assetScore || {};
  return {
    priority: actionPlan?.prioridade || 'Baixa',
    score: Number(assetScore?.score || topRisk?.score || 0),
    scoreStatus: assetScore?.status || topRisk?.status || '',
    rent: Number(action?.rent || topRisk?.rent || 0),
    currentPriceRaw: toNullableNumber_(action?.currentPriceRaw),
    marketCurrentPriceRaw: toNullableNumber_(action?.marketData?.currentPrice),
    marketMomentum: toNullableNumber_(action?.marketData?.monthlyChangePct),
    recommendation: action?.smartRecommendation?.action || topRisk?.smartRecommendation?.action || ''
  };
}

function parseDecisionSnapshot_(rawValue) {
  if (!rawValue) return {};

  try {
    return JSON.parse(String(rawValue));
  } catch (error) {
    return {};
  }
}

function evaluateDecisionOutcome_(historyEntry, currentAction) {
  const snapshot = historyEntry?.snapshot || {};
  if (!currentAction || !snapshot || snapshot.score === undefined || snapshot.score === null) {
    return {
      label: 'Sem leitura',
      summary: 'Sem base suficiente para comparar agora.'
    };
  }

  const currentScore = Number(currentAction?.assetScore?.score || 0);
  const currentRent = Number(currentAction?.rent || 0);
  const scoreDelta = currentScore - Number(snapshot.score || 0);
  const rentDelta = currentRent - Number(snapshot.rent || 0);
  const currentPrice = toNullableNumber_(currentAction?.currentPriceRaw);
  const basePrice = toNullableNumber_(snapshot.currentPriceRaw);
  const priceDelta = currentPrice !== null && basePrice !== null && basePrice
    ? (currentPrice / basePrice - 1)
    : null;
  const actionText = String(snapshot.recommendation || historyEntry?.acao || '').toLowerCase();
  const isRiskAction = actionText.indexOf('reduzir') >= 0 || actionText.indexOf('revis') >= 0;

  if (isRiskAction) {
    if (scoreDelta <= -5 || rentDelta <= -0.03 || (priceDelta !== null && priceDelta <= -0.03)) {
      return {
        label: 'Confirmada',
        summary: 'A leitura de risco se confirmou depois do registro.'
      };
    }

    if (scoreDelta >= 8 || rentDelta >= 0.03 || (priceDelta !== null && priceDelta >= 0.03)) {
      return {
        label: 'Enfraqueceu',
        summary: 'O ativo reagiu melhor do que a leitura inicial.'
      };
    }

    return {
      label: 'Em observacao',
      summary: 'Ainda sem movimento suficiente para fechar a leitura.'
    };
  }

  if (scoreDelta >= 5 || rentDelta >= 0.02 || (priceDelta !== null && priceDelta >= 0.02)) {
    return {
      label: 'Confirmada',
      summary: 'A orientacao segue apoiada pela evolucao do ativo.'
    };
  }

  if (scoreDelta <= -8 || rentDelta <= -0.03 || (priceDelta !== null && priceDelta <= -0.03)) {
    return {
      label: 'Revisar',
      summary: 'A leitura perdeu forca e pede nova revisao.'
    };
  }

  return {
    label: 'Em observacao',
    summary: 'O ativo ainda nao mudou o suficiente desde o registro.'
  };
}

function findActionByTicker_(actions, ticker) {
  const normalizedTicker = String(ticker || '').trim().toUpperCase();
  if (!normalizedTicker) return null;

  return (actions || []).find(function (action) {
    return String(action?.ticker || '').trim().toUpperCase() === normalizedTicker;
  }) || null;
}

