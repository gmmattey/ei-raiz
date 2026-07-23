/**
 * MOBILE API
 * Entrega um contrato JSON estavel para o app Flutter sem quebrar o web app.
 * A resposta do dashboard preserva o payload atual e adiciona um bloco
 * `mobileHome` com leitura pronta para a home premium.
 */

function doPost(e) {
  return buildMobileApiResponse_(e);
}

function isMobileApiRequest_(e) {
  return normalizeMobileApiValue_(e && e.parameter && e.parameter.format) === 'json';
}

function buildMobileApiResponse_(e) {
  const payload = routeMobileApiRequest_(e);
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function routeMobileApiRequest_(e) {
  try {
    const resource = normalizeMobileApiValue_(e && e.parameter && e.parameter.resource);

    if (resource === 'health') {
      return buildMobileApiSuccess_({
        resource: resource,
        data: {
          releaseName: APP_CONFIG_.releaseName,
          versionNumber: APP_CONFIG_.versionNumber,
          updatedAt: new Date().toISOString()
        }
      });
    }

    validateMobileApiToken_(e, resource);

    if (resource === 'dashboard') {
      const dashboardData = getDashboardData();
      dashboardData.mobileHome = buildMobileHomeSnapshot_(dashboardData);

      return buildMobileApiSuccess_({
        resource: resource,
        data: dashboardData
      });
    }

    if (resource === 'ai-analysis') {
      const analysis = getPortfolioAIAnalysis();
      if (/^Erro:/i.test(String(analysis || ''))) {
        throw new Error(String(analysis));
      }

      return buildMobileApiSuccess_({
        resource: resource,
        data: {
          analysis: analysis,
          updatedAt: new Date().toISOString()
        }
      });
    }

    throw new Error('Recurso mobile nao suportado: ' + (resource || 'vazio') + '.');
  } catch (error) {
    return buildMobileApiError_(String(error && error.message ? error.message : error));
  }
}

function validateMobileApiToken_(e, resource) {
  if (!isProtectedMobileResource_(resource)) return;

  const configuredToken = getScriptProperty_(SCRIPT_PROPERTY_KEYS_.mobileAppApiToken);
  if (!configuredToken) return;

  const receivedToken = readMobileApiToken_(e);
  if (receivedToken && receivedToken === configuredToken) return;

  throw new Error('Token mobile invalido ou ausente.');
}

function isProtectedMobileResource_(resource) {
  return ['dashboard', 'ai-analysis'].indexOf(normalizeMobileApiValue_(resource)) >= 0;
}

function readMobileApiToken_(e) {
  const directToken = String(e && e.parameter && e.parameter.token || '').trim();
  if (directToken) return directToken;

  const tokenList = e && e.parameters && e.parameters.token || [];
  if (tokenList.length > 0) {
    return String(tokenList[0] || '').trim();
  }

  return '';
}

function buildMobileApiSuccess_(data) {
  return {
    ok: true,
    releaseName: APP_CONFIG_.releaseName,
    versionNumber: APP_CONFIG_.versionNumber,
    data: data && data.data || {},
    resource: data && data.resource || '',
    updatedAt: new Date().toISOString()
  };
}

function buildMobileApiError_(message) {
  return {
    ok: false,
    releaseName: APP_CONFIG_.releaseName,
    versionNumber: APP_CONFIG_.versionNumber,
    error: message || 'Erro desconhecido na API mobile.',
    updatedAt: new Date().toISOString()
  };
}

function normalizeMobileApiValue_(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function buildMobileHomeSnapshot_(dashboardData) {
  const summary = dashboardData && dashboardData.summary || {};
  const score = dashboardData && dashboardData.score || {};
  const messaging = dashboardData && dashboardData.messaging || {};
  const executiveSummary = messaging.executiveSummary || {};
  const primaryRecommendation = messaging.primaryRecommendation || {};
  const supportNotes = messaging.supportNotes || {};
  const categorySnapshots = Array.isArray(dashboardData && dashboardData.categorySnapshots)
    ? dashboardData.categorySnapshots
    : [];
  const risk = buildMobileRiskSummary_(dashboardData, categorySnapshots);
  const recommendation = buildMobileRecommendationSummary_(dashboardData, risk);
  const scoreSummary = buildMobileScoreSummary_(dashboardData, risk);

  return {
    total: {
      label: summary.total || 'Sem dados',
      raw: toNumber_(summary.totalRaw)
    },
    variation: {
      label: buildMobilePerformanceLabel_(summary.totalPerformanceRaw),
      raw: toNumber_(summary.totalPerformanceRaw),
      isPositive: toNumber_(summary.totalPerformanceRaw) > 0
    },
    status: {
      label: normalizeMobileStatusLabel_(
        dashboardData && dashboardData.portfolioDecision && dashboardData.portfolioDecision.status ||
        score.status ||
        executiveSummary.scoreStatusText
      ),
      summary: executiveSummary.statusText || dashboardData.generalAdvice || 'Leitura operacional indisponivel.',
      detail: primaryRecommendation.reason || supportNotes.scoreNote || ''
    },
    update: {
      label: dashboardData && dashboardData.updatedAt ? 'Atualizado na ultima leitura' : 'Atualizacao pendente',
      updatedAt: dashboardData && dashboardData.updatedAt || '',
      sourceLabel: buildMobileSourceLabel_(dashboardData)
    },
    risk: risk,
    distribution: categorySnapshots.map(function (snapshot) {
      return {
        key: snapshot.key || '',
        label: snapshot.label || 'Carteira',
        valueLabel: snapshot.totalLabel || 'Sem dados',
        shareLabel: snapshot.shareLabel || '0,0%',
        performanceLabel: snapshot.performanceLabel || '0,0%',
        statusLabel: snapshot.status || 'Em leitura',
        color: snapshot.color || '#68D8FF'
      };
    }),
    recommendation: recommendation,
    score: scoreSummary,
    insights: buildMobileInsights_(dashboardData, risk, recommendation, scoreSummary)
  };
}

function buildMobileRiskSummary_(dashboardData, categorySnapshots) {
  const categories = dashboardData && dashboardData.categories || {};
  const topCategory = getTopShareCategorySnapshot_(categorySnapshots);
  const categoryHealth = getCategoryHealthFromSnapshot_(categories, topCategory);
  const rawRiskLabel = categoryHealth && categoryHealth.risk ||
    categoryHealth && categoryHealth.status ||
    topCategory && topCategory.status ||
    dashboardData && dashboardData.portfolioDecision && dashboardData.portfolioDecision.status ||
    '';
  const normalizedRisk = normalizeMobileRiskLabel_(rawRiskLabel);

  return {
    label: normalizedRisk,
    focusLabel: topCategory && topCategory.label || 'Carteira',
    focusKey: topCategory && topCategory.key || '',
    shareLabel: topCategory && topCategory.shareLabel || 'Sem leitura',
    reason: getMobileRiskReason_(dashboardData, topCategory, categoryHealth),
    meterValue: getMobileRiskMeterValue_(normalizedRisk)
  };
}

function buildMobileRecommendationSummary_(dashboardData, risk) {
  const portfolioDecision = dashboardData && dashboardData.portfolioDecision || {};
  const messaging = dashboardData && dashboardData.messaging || {};
  const primaryRecommendation = messaging.primaryRecommendation || {};
  const focusLabel = portfolioDecision.focusCategoryLabel || risk.focusLabel || '';
  const focusKey = getMobileCategoryKeyFromLabel_(focusLabel) || risk.focusKey || '';
  const actionText = String(portfolioDecision.actionText || '').trim();
  const criticalPoint = String(portfolioDecision.criticalPoint || '').trim();

  return {
    title: buildMobileRecommendationTitle_(actionText, focusLabel, dashboardData),
    reason: dashboardData && dashboardData.actionPlan && dashboardData.actionPlan.justificativa ||
      primaryRecommendation.reason ||
      dashboardData.generalAdvice ||
      'Sem recomendacao complementar na rodada atual.',
    primaryActionLabel: focusLabel ? 'Abrir ' + focusLabel : 'Ver categorias',
    secondaryActionLabel: criticalPoint ? 'Monitorar ' + criticalPoint : 'Revisar distribuicao',
    focusCategoryKey: focusKey,
    secondaryCategoryKey: focusKey || risk.focusKey || ''
  };
}

function buildMobileScoreSummary_(dashboardData, risk) {
  const score = dashboardData && dashboardData.score || {};
  const criticalPoint = dashboardData && dashboardData.portfolioDecision && dashboardData.portfolioDecision.criticalPoint || '';

  return {
    valueLabel: String(Number(score.score || 0).toFixed(0)) + '/100',
    valueRaw: toNumber_(score.score),
    statusLabel: score.status || 'Em leitura',
    summary: score.explanation || 'Sem leitura detalhada do score nesta rodada.',
    problem: criticalPoint
      ? 'Principal ponto de atencao: ' + criticalPoint + '.'
      : 'Principal ponto de atencao: ' + risk.reason
  };
}

function buildMobileInsights_(dashboardData, risk, recommendation, scoreSummary) {
  const insights = [];
  const categorySnapshots = Array.isArray(dashboardData && dashboardData.categorySnapshots)
    ? dashboardData.categorySnapshots
    : [];
  const topCategory = getTopShareCategorySnapshot_(categorySnapshots);
  const topOpportunity = dashboardData && dashboardData.assetRanking && dashboardData.assetRanking.topOpportunity || null;

  if (topCategory) {
    insights.push({
      title: 'Maior peso hoje',
      body: topCategory.label + ' representa ' + (topCategory.shareLabel || '0,0%') + ' da carteira e guia boa parte da leitura atual.'
    });
  }

  if (topOpportunity && topOpportunity.ticker) {
    insights.push({
      title: 'Melhor tracao',
      body: topOpportunity.ticker + ' aparece como melhor oportunidade da rodada, com score ' +
        String(Number(topOpportunity.score || 0).toFixed(0)) + ' e leitura ' +
        String(topOpportunity.status || 'positiva').toLowerCase() + '.'
    });
  }

  if (
    (dashboardData && dashboardData.sourceWarning) ||
    (dashboardData && dashboardData.dataSource === 'spreadsheet-fallback')
  ) {
    insights.push({
      title: 'Base da leitura',
      body: 'A atualizacao veio pela base operacional secundaria. A carteira segue legivel, mas algumas camadas avancadas podem chegar com menor profundidade.'
    });
  } else {
    insights.push({
      title: 'Ponto que decide',
      body: scoreSummary.problem || recommendation.reason || risk.reason
    });
  }

  return insights.slice(0, 3);
}

function buildMobilePerformanceLabel_(value) {
  const numericValue = toNumber_(value);
  const pct = (numericValue * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }) + '%';

  if (numericValue > 0) return '+' + pct;
  if (numericValue < 0) return pct;
  return '0,0%';
}

function buildMobileSourceLabel_(dashboardData) {
  if (!dashboardData || !dashboardData.updatedAt) {
    return 'Sincronizacao pendente';
  }

  if (dashboardData.dataSource === 'spreadsheet-fallback' || dashboardData.sourceWarning) {
    return 'Base operacional secundaria';
  }

  if (dashboardData.dataSource === 'bigquery') {
    return 'Atualizacao principal';
  }

  return 'Base operacional';
}

function normalizeMobileStatusLabel_(value) {
  const normalized = normalizeMobileApiValue_(value);
  if (normalized.indexOf('forte') >= 0) return 'Forte';
  if (normalized.indexOf('aten') >= 0) return 'Atencao';
  if (normalized.indexOf('curta') >= 0) return 'Atencao';
  if (normalized.indexOf('media') >= 0 || normalized.indexOf('medio') >= 0) return 'Atencao';
  if (normalized.indexOf('crit') >= 0) return 'Critico';
  if (normalized.indexOf('segur') >= 0 || normalized.indexOf('control') >= 0) return 'Estavel';
  return value || 'Em leitura';
}

function normalizeMobileRiskLabel_(value) {
  const normalized = String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (normalized.indexOf('alto') >= 0 || normalized.indexOf('crit') >= 0) {
    return 'Alto';
  }

  if (
    normalized.indexOf('medio') >= 0 ||
    normalized.indexOf('aten') >= 0 ||
    normalized.indexOf('revis') >= 0
  ) {
    return 'Medio';
  }

  return 'Baixo';
}

function getMobileRiskMeterValue_(riskLabel) {
  if (riskLabel === 'Alto') return 0.9;
  if (riskLabel === 'Medio') return 0.6;
  return 0.3;
}

function getMobileRiskReason_(dashboardData, topCategory, categoryHealth) {
  const primaryIssue = categoryHealth && categoryHealth.primaryIssue || null;
  if (primaryIssue && primaryIssue.message) {
    return primaryIssue.message;
  }

  const criticalPoint = dashboardData && dashboardData.portfolioDecision && dashboardData.portfolioDecision.criticalPoint || '';
  if (criticalPoint) {
    return criticalPoint + ' pede atencao antes do proximo ajuste.';
  }

  if (topCategory) {
    return topCategory.label + ' concentra ' + (topCategory.shareLabel || '0,0%') + ' da carteira.';
  }

  return 'Sem leitura complementar de risco nesta rodada.';
}

function buildMobileRecommendationTitle_(actionText, focusLabel, dashboardData) {
  if (actionText && focusLabel) {
    return actionText + ' em ' + focusLabel;
  }

  if (actionText) return actionText;

  return dashboardData && dashboardData.actionPlan && dashboardData.actionPlan.acao_principal ||
    dashboardData && dashboardData.messaging && dashboardData.messaging.primaryRecommendation && dashboardData.messaging.primaryRecommendation.title ||
    'Manter plano';
}

function getMobileCategoryKeyFromLabel_(label) {
  const normalized = String(label || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (normalized.indexOf('acao') >= 0) return 'acoes';
  if (normalized.indexOf('fundo') >= 0) return 'fundos';
  if (normalized.indexOf('previd') >= 0) return 'previdencia';
  return '';
}

function getTopShareCategorySnapshot_(categorySnapshots) {
  if (!categorySnapshots || !categorySnapshots.length) return null;

  return categorySnapshots.reduce(function (best, item) {
    if (!best) return item;
    if (toNumber_(item.shareRaw) > toNumber_(best.shareRaw)) return item;
    return best;
  }, null);
}

function getCategoryHealthFromSnapshot_(categories, snapshot) {
  if (!snapshot || !categories) return null;

  if (snapshot.key === 'acoes') return categories.actions || null;
  if (snapshot.key === 'fundos') return categories.funds || null;
  if (snapshot.key === 'previdencia') return categories.previdencia || null;
  return null;
}
