/**
 * AI SERVICE
 * Builders de contexto, prompts, validacao e providers da Esquilo.ai.
 */

function getInventoryLoot() {
  try {
    let lootData = 'DADOS COMPLETOS DA BASE DE DADOS (TODAS AS ABAS):\n\n';
    const inventory = getBigQueryOperationalInventory_();

    Object.keys(inventory).forEach(function (sheetName) {
      lootData += '\n--- ABA: ' + sheetName + ' ---\n';
      const rows = inventory[sheetName] || [];
      if (!rows.length) {
        lootData += 'Sem registros.\n';
        return;
      }

      rows.forEach(function (row) {
        const line = Object.keys(row || {}).map(function (fieldName) {
          return fieldName + ': ' + row[fieldName];
        }).join(' | ');
        if (line.trim()) lootData += line + '\n';
      });
    });

    return lootData;
  } catch (error) {
    try {
      const spreadsheet = openOperationalSpreadsheet_();
      const sheets = spreadsheet.getSheets();
      let fallbackLoot = 'DADOS COMPLETOS DA BASE DE DADOS (FALLBACK PLANILHA):\n\n';

      sheets.forEach(function (sheet) {
        fallbackLoot += '\n--- ABA: ' + sheet.getName() + ' ---\n';
        const data = sheet.getDataRange().getDisplayValues();
        data.forEach(function (row) {
          if (row.join('').trim() !== '') fallbackLoot += row.join(' | ') + '\n';
        });
      });

      return fallbackLoot;
    } catch (fallbackError) {
      return 'Erro ao extrair os dados da base: ' + fallbackError.toString();
    }
  }
}

function buildAIPortfolioSummary_() {
  const dashboardContext = buildDashboardContext_();
  return dashboardContext.insights.generalAdvice;
}

/**
 * Monta o contexto consolidado da Esquilo IA geral da carteira.
 * Usa o mesmo engine do dashboard para separar leitura, calculo, decisao e mensagem.
 */
function buildStrategyContext_() {
  const dashboardContext = buildDashboardContext_();
  const insights = dashboardContext.insights || {};
  const decisionEngine = insights.decisionEngine || {};

  return {
    summary: dashboardContext.domainData.summary,
    dataSource: dashboardContext.dataSource || 'bigquery',
    marketIntel: buildStrategyMarketIntel_(dashboardContext.domainData.actions),
    assetIntel: buildStrategyAssetIntel_(insights.assetRanking),
    metrics: insights.metrics,
    score: insights.score,
    profile: insights.profile,
    alerts: insights.alerts || [],
    messaging: insights.messaging || {},
    categories: decisionEngine.categories || {},
    portfolioDecision: decisionEngine.portfolioDecision || {}
  };
}

/**
 * Resume os sinais de mercado adicionais das acoes sem transformar isso
 * em dependencia dura do prompt da IA.
 */
function buildStrategyMarketIntel_(actions) {
  const validActions = (actions || []).filter(function (action) {
    return !!extractActionMarketSignal_(action);
  });

  if (!validActions.length) {
    return {
      coverageText: 'Sem leitura externa de mercado.',
      actionLines: []
    };
  }

  const rankedActions = validActions
    .map(function (action) {
      const signal = extractActionMarketSignal_(action);
      return {
        action: action,
        rankScore: Math.abs(signal.monthlyChangePct ?? signal.dailyChangePct ?? 0)
      };
    })
    .sort(function (a, b) {
      return b.rankScore - a.rankScore;
    })
    .slice(0, 3)
    .map(function (entry) {
      return buildStrategyMarketActionLine_(entry.action);
    })
    .filter(Boolean);

  return {
    coverageText: validActions.length + '/' + (actions || []).length + ' acoes com leitura externa.',
    actionLines: rankedActions
  };
}

function extractActionMarketSignal_(action) {
  const marketData = action?.marketData;
  if (!marketData) return null;

  const hasUsefulSignal =
    marketData.currentPrice !== null && marketData.currentPrice !== undefined ||
    marketData.dailyChangePct !== null && marketData.dailyChangePct !== undefined ||
    marketData.monthlyChangePct !== null && marketData.monthlyChangePct !== undefined ||
    !!marketData.sector;

  if (!hasUsefulSignal) return null;
  return marketData;
}

function buildStrategyMarketActionLine_(action) {
  if (!action) return '';

  const signal = extractActionMarketSignal_(action);
  if (!signal) return '';

  const parts = [action.ticker || 'Ativo'];

  if (signal.dailyChangePct !== null && signal.dailyChangePct !== undefined) {
    parts.push('dia ' + formatPct_(signal.dailyChangePct));
  }

  if (signal.monthlyChangePct !== null && signal.monthlyChangePct !== undefined) {
    parts.push('30d ' + formatPct_(signal.monthlyChangePct));
  }

  if (signal.sector) {
    parts.push('setor ' + signal.sector);
  }

  return parts.join(' | ');
}

function buildStrategyAssetIntel_(assetRanking) {
  const ranking = assetRanking || {};
  const topRisk = ranking.topRisk || null;
  const topOpportunity = ranking.topOpportunity || null;
  const focusItems = Array.isArray(ranking.items) ? ranking.items.slice(0, 3) : [];

  return {
    topRiskLine: buildStrategyAssetRankingLine_(topRisk, 'Risco'),
    topOpportunityLine: buildStrategyAssetRankingLine_(topOpportunity, 'Oportunidade'),
    focusLines: focusItems.map(function (item) {
      return buildStrategyAssetRankingLine_(item, 'Foco');
    }).filter(Boolean)
  };
}

function buildStrategyAssetRankingLine_(item, label) {
  if (!item) return '';

  const parts = [
    label + ' ' + (item.ticker || 'Ativo'),
    'score ' + (item.score ?? '0'),
    item.riskLabel ? ('risco ' + item.riskLabel) : '',
    item.smartRecommendation?.action ? ('acao ' + item.smartRecommendation.action) : '',
    item.smartRecommendation?.reason ? ('motivo ' + item.smartRecommendation.reason) : ''
  ].filter(Boolean);

  return parts.join(' | ');
}

/**
 * Converte as categorias avaliadas em linhas curtas para o prompt da Esquilo IA.
 * Entrada: avaliacoes das categorias principais.
 * Saida: lista de frases curtas com status, peso e ponto critico de cada categoria.
 */
function buildStrategyCategoryContextLines_(categories) {
  const orderedCategories = [categories?.actions, categories?.funds, categories?.previdencia].filter(Boolean);
  return orderedCategories.map(function (category) {
    return buildStrategyCategoryContextLine_(category);
  }).filter(Boolean);
}

/**
 * Resume uma categoria da carteira em uma frase objetiva para o prompt.
 * Entrada: avaliacao de uma categoria.
 * Saida: linha curta com status, share e principal ponto de atencao.
 */
function buildStrategyCategoryContextLine_(category) {
  if (!category) return '';

  const parts = [
    (category.label || 'Categoria') + ': ' + (category.status || 'Sem status'),
    'peso ' + formatPct_(category.portfolioShare || 0),
    'recomendacao ' + (category.recommendation || 'Manter')
  ];

  if (category.primaryIssue && category.primaryIssue.message) {
    parts.push('ponto ' + category.primaryIssue.message);
  }

  return parts.join(' | ');
}

/**
 * Resume os alertas do engine em uma linha curta para o prompt consolidado.
 * Entrada: lista de alertas prontos do backend.
 * Saida: linha curta com ate tres alertas prioritarios.
 */
function buildStrategyAlertContextText_(alerts) {
  const sortedAlerts = sortAlertsByPriority_(alerts || []);
  if (!sortedAlerts.length) return 'Sem alertas relevantes.';

  return sortedAlerts.slice(0, 3).map(function (alert) {
    return (alert.type || 'Info') + ': ' + (alert.message || '');
  }).join(' | ');
}

/**
 * Monta o prompt consumido pelo ChatGPT para a Esquilo IA geral da carteira.
 * Entrada: contexto consolidado do dashboard.
 * Saida: texto estruturado com dados suficientes para uma resposta curta e util.
 */
function buildStrategyPrompt_(context) {
  const summary = context.summary || {};
  const marketIntel = context.marketIntel || {};
  const assetIntel = context.assetIntel || {};
  const metrics = context.metrics || {};
  const alerts = context.alerts || [];
  const score = context.score || {};
  const profile = context.profile || {};
  const messaging = context.messaging || {};
  const categories = context.categories || {};
  const portfolioDecision = context.portfolioDecision || {};
  const executiveSummary = messaging.executiveSummary || {};
  const primaryRecommendation = messaging.primaryRecommendation || {};
  const categoryLines = buildStrategyCategoryContextLines_(categories);
  const alertText = buildStrategyAlertContextText_(alerts);
  const levelText = [
    profile.level ? ('Nivel ' + profile.level) : '',
    profile.squad || ''
  ].filter(Boolean).join(' | ');
  const decisionText = [
    portfolioDecision.actionText || 'Manter plano',
    portfolioDecision.focusCategoryLabel ? ('Foco ' + portfolioDecision.focusCategoryLabel) : '',
    portfolioDecision.criticalPoint ? ('Ponto critico ' + portfolioDecision.criticalPoint) : '',
    portfolioDecision.urgency ? ('Urgencia ' + portfolioDecision.urgency) : ''
  ].filter(Boolean).join(' | ');
  const recommendationText = [
    primaryRecommendation.title || '',
    primaryRecommendation.reason || '',
    primaryRecommendation.impact || ''
  ].filter(Boolean).join(' | ');
  const marketText = [
    marketIntel.coverageText || '',
    (marketIntel.actionLines || []).length ? ('Radar: ' + marketIntel.actionLines.join(' || ')) : ''
  ].filter(Boolean).join(' ');
  const assetText = [
    assetIntel.topRiskLine || '',
    assetIntel.topOpportunityLine || '',
    (assetIntel.focusLines || []).length ? ('Ranking: ' + assetIntel.focusLines.join(' || ')) : ''
  ].filter(Boolean).join(' ');

  return [
    'Carteira geral para analise da Esquilo IA.',
    'Patrimonio total: ' + (summary.total || 'Sem dados') + '.',
    'Performance consolidada: ' + (executiveSummary.performanceText || formatPct_(metrics.performance)) + '.',
    'Distribuicao da carteira: Acoes ' + formatPct_(metrics.equityShare) + ', Fundos ' + formatPct_(metrics.fundsShare) + ', Previdencia ' + formatPct_(metrics.previdenciaShare) + '.',
    'Contexto de mercado: ' + (marketText || 'Sem leitura externa de mercado.') + '.',
    'Decision Engine: ' + (assetText || 'Sem ranking de ativos.') + '.',
    'Resumo executivo: ' + (executiveSummary.statusText || 'Sem resumo executivo') + '.',
    'Score e status: ' + (score.score ?? 'Sem dados') + ' (' + (score.status || 'Sem dados') + ').',
    'Nivel e squad: ' + (levelText || 'Sem dados') + '.',
    'Decisao consolidada: ' + (decisionText || 'Sem decisao consolidada') + '.',
    'Recomendacao principal: ' + (recommendationText || 'Sem recomendacao principal') + '.',
    'Categorias: ' + (categoryLines.length ? categoryLines.join(' || ') : 'Sem categorias ativas.') + '.',
    'Alertas prioritarios: ' + alertText,
    'Tarefa: gerar uma leitura geral da carteira para leigo, direta, curta e util.',
    'Use score, ranking, risco e oportunidade para priorizar a leitura.',
    'Quando houver contexto de mercado, use-o como camada complementar. Se nao houver, siga normalmente sem inventar comparacoes externas.'
  ].join('\n');
}

// -----------------------------------------------------------------------------
// Entradas de IA e providers
// -----------------------------------------------------------------------------

/**
 * Centraliza o system prompt da Esquilo IA geral da carteira.
 * Mantem o formato de resposta estavel entre Gemini e fallback secundario.
 */
function buildStrategySystemPrompt_() {
  return [
    'Voce e a Esquilo IA geral da carteira do Esquilo Invest.',
    'Responda em portugues do Brasil.',
    'Fale para leigo, sem links, sem markdown, sem tabelas e sem jargao tecnico pesado.',
    'Analise a carteira como um todo usando apenas o contexto recebido.',
    'Nao repita literalmente o resumo executivo nem apenas descreva os numeros.',
    'Formato obrigatório:',
    'Diagnóstico geral: ...',
    'Ações prioritárias:',
    '1) ...',
    '2) ...',
    '3) ...',
    'Risco principal: ...',
    'Oportunidade: ...',
    'Regras:',
    '- Cada acao deve comecar exatamente com: Reduzir, Aumentar, Sair, Manter, Revisar ou Redistribuir.',
    '- Entregue exatamente 3 acoes prioritarias numeradas.',
    '- Use numeros do contexto quando ajudarem, mas sem poluir o texto.',
    '- Cada secao deve ser curta e objetiva.',
    '- Se a carteira estiver estavel, mantenha o tom pratico e sem inventar urgencia.'
  ].join('\n');
}

/**
 * Classifica respostas textuais de provider para o fluxo de fallback e debug.
 * Entrada: texto cru retornado por Gemini ou OpenAI.
 * Saida: true quando o retorno ja representa erro textual controlado.
 */
function isAIProviderErrorText_(value) {
  const text = String(value || '').trim();
  if (!text) return true;
  return text.indexOf('Erro') === 0 || text.indexOf('Ocorreu um erro') === 0;
}

/**
 * Escolhe o erro mais util entre duas tentativas de provider.
 * Entrada: erro principal e erro secundario do fluxo de fallback.
 * Saida: mensagem mais diagnostica para o frontend tratar.
 */
function pickBestAIErrorText_(primaryError, secondaryError) {
  const candidates = [primaryError, secondaryError]
    .map(function (item) { return String(item || '').trim(); })
    .filter(Boolean);
  if (!candidates.length) return 'Erro: falha ao obter analise da IA.';

  function score(text) {
    const normalized = text.toLowerCase();
    if (normalized.indexOf('nao configurada') >= 0) return 5;
    if (normalized.indexOf('http') >= 0) return 4;
    if (normalized.indexOf('bloqueada') >= 0) return 4;
    if (normalized.indexOf('formato esperado') >= 0) return 4;
    if (normalized.indexOf('resposta invalida') >= 0 || normalized.indexOf('resposta vazia') >= 0 || normalized.indexOf('sem candidates') >= 0) return 3;
    if (normalized.indexOf('ocorreu um erro') >= 0) return 1;
    return 2;
  }

  return candidates.sort(function (left, right) { return score(right) - score(left); })[0];
}

/**
 * Limita textos longos para observabilidade sem poluir os logs do Apps Script.
 * Entrada: valor textual e limite maximo de caracteres.
 * Saida: texto truncado e seguro para Logger.log.
 */
function truncateAIDebugText_(value, maxLength) {
  const text = String(value || '');
  const limit = Number(maxLength) || 600;
  if (!text || text.length <= limit) return text;
  return text.slice(0, limit) + '...[truncated]';
}

/**
 * Mascara segredos sem expor a credencial completa nos logs.
 * Entrada: chave ou token bruto.
 * Saida: texto curto indicando presenca, tamanho e sufixo.
 */
function maskSecretForLog_(value) {
  const text = String(value || '').trim();
  if (!text) return 'missing';
  const suffixLength = Math.min(4, text.length);
  return 'present(len=' + text.length + ', suffix=' + text.slice(-suffixLength) + ')';
}

/**
 * Centraliza logs temporarios da Esquilo IA para debug da integracao Gemini.
 * Entrada: etapa do fluxo e dados simples serializaveis.
 * Saida: nenhum retorno; escreve no Logger do Apps Script.
 */
function logAIDebug_(stage, details) {
  const payload = details || {};

  try {
    Logger.log('[EsquiloIA][' + stage + '] ' + JSON.stringify(payload));
  } catch (error) {
    Logger.log('[EsquiloIA][' + stage + '] ' + String(details || ''));
  }
}

/**
 * Explica por que uma resposta da IA passou ou falhou na validacao estrutural.
 * Entrada: texto sanitizado retornado pelo provider.
 * Saida: diagnostico com validade, labels ausentes e problemas de acoes.
 */
function normalizeStrategyActionLine_(line) {
  return String(line || '')
    .replace(/^\d+\s*[\)\.\-:]\s*/, '')
    .replace(/^[\s>*\-.:]+/, '')
    .replace(/[*_`]+/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Explica por que uma resposta da IA passou ou falhou na validacao estrutural.
 * Entrada: texto sanitizado retornado pelo provider.
 * Saida: diagnostico com validade, labels ausentes e problemas de acoes.
 */
function getStrategyValidationDiagnostics_(text) {
  if (!text) {
    return {
      valid: false,
      reason: 'empty-response',
      missingLabels: ['diagnostico geral', 'acoes prioritarias', 'risco principal', 'oportunidade'],
      actionLineCount: 0,
      invalidActionLines: []
    };
  }

  const required = ['diagnostico geral', 'acoes prioritarias', 'risco principal', 'oportunidade'];
  const normalizedText = String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const missingLabels = required.filter(function (label) {
    return normalizedText.indexOf(label) === -1;
  });
  const lines = String(text)
    .split(/\r?\n/)
    .map(function (line) { return line.trim(); })
    .filter(Boolean);
  const actionLines = lines.filter(function (line) { return /^\d+\s*[\)\.\-:]/.test(line); });
  const verbs = ['reduzir', 'aumentar', 'sair', 'manter', 'revisar', 'redistribuir'];
  const invalidActionLines = actionLines.slice(0, 3).filter(function (line) {
    const normalizedLine = normalizeStrategyActionLine_(line);
    return !verbs.some(function (verb) { return normalizedLine.indexOf(verb) === 0; });
  });
  const valid = !missingLabels.length && actionLines.length >= 3 && !invalidActionLines.length;
  let reason = 'ok';

  if (missingLabels.length) {
    reason = 'missing-labels';
  } else if (actionLines.length < 3) {
    reason = 'missing-action-lines';
  } else if (invalidActionLines.length) {
    reason = 'invalid-action-verbs';
  }

  return {
    valid: valid,
    reason: reason,
    missingLabels: missingLabels,
    actionLineCount: actionLines.length,
    invalidActionLines: invalidActionLines
  };
}

/**
 * Extrai o alvo principal de uma linha sintetizada do ranking de ativos.
 * Entrada: texto como "Risco PETR4 | score 42 | risco Alto".
 * Saida: identificador curto do ativo ou foco correspondente.
 */
function extractStrategyLineTarget_(line) {
  const firstChunk = String(line || '')
    .split('|')[0]
    .replace(/^(Risco|Oportunidade|Foco)\s+/i, '')
    .trim();

  return firstChunk || '';
}

/**
 * Mapeia a decisao consolidada da carteira para um verbo aceito pelo validador.
 * Entrada: texto livre do engine como "Revisar posição" ou "Redistribuir carteira".
 * Saida: verbo curto permitido no formato da Esquilo IA.
 */
function mapStrategyDecisionVerb_(actionText) {
  const normalized = String(actionText || '').toLowerCase();

  if (normalized.indexOf('reduzir') >= 0) return 'Reduzir';
  if (normalized.indexOf('redistribuir') >= 0) return 'Redistribuir';
  if (normalized.indexOf('revisar') >= 0) return 'Revisar';
  if (normalized.indexOf('aumentar') >= 0) return 'Aumentar';
  if (normalized.indexOf('sair') >= 0) return 'Sair';
  return 'Manter';
}

/**
 * Remove excesso de pontuacao para encaixar trechos curtos no fallback da IA.
 * Entrada: texto livre vindo do contexto consolidado.
 * Saida: frase curta e segura para compor a resposta final.
 */
function compactStrategySentence_(value, fallbackText) {
  const text = String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/\s*[|]+\s*/g, ', ')
    .replace(/\.+$/g, '')
    .trim();

  return text || String(fallbackText || '').trim();
}

/**
 * Monta uma leitura final deterministicamente quando o provider responde
 * fora do formato exigido pela interface.
 * Entrada: contexto consolidado da carteira e diagnostico de validacao.
 * Saida: texto curto no formato exato esperado pelo frontend.
 */
function buildFallbackStrategyResponse_(context, validation) {
  const score = context?.score || {};
  const metrics = context?.metrics || {};
  const alerts = context?.alerts || [];
  const messaging = context?.messaging || {};
  const executiveSummary = messaging.executiveSummary || {};
  const primaryRecommendation = messaging.primaryRecommendation || {};
  const portfolioDecision = context?.portfolioDecision || {};
  const assetIntel = context?.assetIntel || {};
  const marketIntel = context?.marketIntel || {};

  const statusText = compactStrategySentence_(
    executiveSummary.statusText,
    'Carteira em leitura ' + (score.status || 'Ok') + ' com score ' + (score.score ?? 'sem leitura')
  );
  const performanceText = compactStrategySentence_(
    executiveSummary.performanceText,
    'performance consolidada em ' + formatPct_(metrics.performance)
  );
  const diagnosis = 'Diagnóstico geral: ' + statusText + ' com ' + performanceText + '.';

  const primaryVerb = mapStrategyDecisionVerb_(portfolioDecision.actionText || primaryRecommendation.actionText);
  const primaryTarget = primaryRecommendation.asset || portfolioDecision.criticalPoint || portfolioDecision.focusCategoryLabel || 'carteira';
  const primaryReason = compactStrategySentence_(
    primaryRecommendation.reason,
    'o foco imediato continua em ' + primaryTarget
  );

  const riskTarget = extractStrategyLineTarget_(assetIntel.topRiskLine) || portfolioDecision.criticalPoint || 'o ponto mais pressionado da carteira';
  const riskReason = compactStrategySentence_(
    alerts[0]?.message,
    'confirmar stop, concentracao e tamanho da posicao'
  );

  const opportunityTarget = extractStrategyLineTarget_(assetIntel.topOpportunityLine) || 'os ativos mais resilientes';
  const opportunityReason = compactStrategySentence_(
    marketIntel.coverageText,
    'usar a proxima leitura para separar forca real de ruido de curto prazo'
  );

  const actionLines = [
    '1) ' + primaryVerb + ' ' + primaryTarget + ' porque ' + primaryReason + '.',
    '2) Revisar ' + riskTarget + ' para ' + riskReason + '.',
    '3) Manter foco em ' + opportunityTarget + ' para ' + opportunityReason + '.'
  ];

  const riskLine = 'Risco principal: ' + compactStrategySentence_(
    alerts[0]?.message,
    assetIntel.topRiskLine || 'A carteira ainda pede monitoramento tatico do ponto mais sensivel.'
  ) + '.';

  const opportunityLine = 'Oportunidade: ' + compactStrategySentence_(
    assetIntel.topOpportunityLine,
    marketIntel.actionLines?.[0] || 'Ha espaco para agir com calma nos ativos que sustentarem score e disciplina.'
  ) + '.';

  logAIDebug_('portfolio-analysis-fallback-response', {
    reason: validation?.reason || 'unknown',
    fallbackPreview: truncateAIDebugText_([diagnosis, 'Ações prioritárias:'].concat(actionLines).concat([riskLine, opportunityLine]).join('\n'), 500)
  });

  return [
    diagnosis,
    'Ações prioritárias:',
    actionLines[0],
    actionLines[1],
    actionLines[2],
    riskLine,
    opportunityLine
  ].join('\n');
}

/**
 * Gera a Esquilo IA geral da carteira usando Gemini como motor principal.
 * Mantem fallback seguro para OpenAI sem quebrar o contrato atual do frontend.
 */
function getPortfolioAIAnalysis() {
  const context = buildStrategyContext_();
  const prompt = buildStrategyPrompt_(context);
  const invalidResponseError = 'Erro: resposta da IA fora do formato esperado.';
  const genericErrorMessage = 'Erro: falha ao obter analise geral da carteira.';
  const systemPrompt = buildStrategySystemPrompt_();

  try {
    let geminiError = '';
    let openAiError = '';
    let response = callGemini_(systemPrompt, prompt);
    logAIDebug_('portfolio-analysis-gemini-response', {
      model: APP_CONFIG_.geminiModel,
      responsePreview: truncateAIDebugText_(response, 500),
      isProviderError: isAIProviderErrorText_(response)
    });

    if (isAIProviderErrorText_(response)) {
      geminiError = response;
      logAIDebug_('portfolio-analysis-fallback-openai', {
        reason: 'gemini-provider-error',
        responsePreview: truncateAIDebugText_(response, 300)
      });
      response = callChatGPT_(systemPrompt, prompt);
      logAIDebug_('portfolio-analysis-openai-response', {
        responsePreview: truncateAIDebugText_(response, 500),
        isProviderError: isAIProviderErrorText_(response)
      });
      if (isAIProviderErrorText_(response)) {
        openAiError = response;
        return pickBestAIErrorText_(geminiError, openAiError);
      }
    }

    let safeResponse = sanitizeAIResponse_(response);
    let validation = getStrategyValidationDiagnostics_(safeResponse);
    if (!validation.valid) {
      logAIDebug_('portfolio-analysis-validation-failed', {
        pass: 'primary',
        reason: validation.reason,
        missingLabels: validation.missingLabels,
        actionLineCount: validation.actionLineCount,
        invalidActionLines: validation.invalidActionLines,
        responsePreview: truncateAIDebugText_(safeResponse, 500)
      });
      response = callGemini_(systemPrompt + '\nResponda estritamente no formato obrigatório.', prompt);
      logAIDebug_('portfolio-analysis-gemini-retry-response', {
        responsePreview: truncateAIDebugText_(response, 500),
        isProviderError: isAIProviderErrorText_(response)
      });
      if (isAIProviderErrorText_(response)) {
        geminiError = response;
        logAIDebug_('portfolio-analysis-fallback-openai', {
          reason: 'gemini-retry-provider-error',
          responsePreview: truncateAIDebugText_(response, 300)
        });
        response = callChatGPT_(systemPrompt + '\nResponda estritamente no formato obrigatório.', prompt);
        logAIDebug_('portfolio-analysis-openai-retry-response', {
          responsePreview: truncateAIDebugText_(response, 500),
          isProviderError: isAIProviderErrorText_(response)
        });
      }
      if (isAIProviderErrorText_(response)) {
        openAiError = response;
        return pickBestAIErrorText_(geminiError, openAiError);
      }
      safeResponse = sanitizeAIResponse_(response);
      validation = getStrategyValidationDiagnostics_(safeResponse);
    }

    if (!validation.valid) {
      logAIDebug_('portfolio-analysis-validation-failed', {
        pass: 'final',
        reason: validation.reason,
        missingLabels: validation.missingLabels,
        actionLineCount: validation.actionLineCount,
        invalidActionLines: validation.invalidActionLines,
        responsePreview: truncateAIDebugText_(safeResponse, 500)
      });

      const fallbackResponse = buildFallbackStrategyResponse_(context, validation);
      if (validateStrategyResponse_(fallbackResponse)) {
        return fallbackResponse;
      }

      return invalidResponseError;
    }

    logAIDebug_('portfolio-analysis-success', {
      responsePreview: truncateAIDebugText_(safeResponse, 500)
    });
    return safeResponse;
  } catch (error) {
    logAIDebug_('portfolio-analysis-exception', {
      message: error && error.message ? error.message : String(error),
      stackPreview: truncateAIDebugText_(error && error.stack ? error.stack : '', 500)
    });
    return genericErrorMessage;
  }
}

/**
 * Mantem compatibilidade com a interface publica antiga.
 * O nome historico permanece, mas o provider principal agora e Gemini.
 */
function getChatGPTAnalysis() {
  return getPortfolioAIAnalysis();
}

function callChatGPT_(systemPrompt, userPrompt) {
  const apiKey = getOpenAIKey_();
  if (!apiKey) return 'Erro: OPENAI_API_KEY não configurada.';

  const url = 'https://api.openai.com/v1/chat/completions';
  const payload = {
    model: getOpenAIModel_(),
    temperature: 0.4,
    max_tokens: 600,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ]
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + apiKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  let response;
  let retries = 0;
  const maxRetries = 3;

  while (retries < maxRetries) {
    try {
      response = UrlFetchApp.fetch(url, options);
      if (response.getResponseCode() === 200) {
        const json = JSON.parse(response.getContentText());
        return json.choices?.[0]?.message?.content || 'Erro: resposta vazia da IA.';
      }
      Utilities.sleep(Math.pow(2, retries) * 1000);
      retries++;
    } catch (error) {
      Utilities.sleep(Math.pow(2, retries) * 1000);
      retries++;
    }
  }

  return 'Ocorreu um erro ao contactar o serviço de análise. Tente novamente mais tarde.';
}

function sanitizeAIResponse_(text) {
  if (!text) return '';
  return String(text)
    .replace(/```/g, '')
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')
    .replace(/[*_`]+/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\u200B/g, '')
    .trim();
}

function validateStrategyResponse_(text) {
  return getStrategyValidationDiagnostics_(text).valid;
}

/**
 * Junta todos os trechos de texto retornados pelo Gemini em um unico corpo.
 * Entrada: JSON bruto do provider.
 * Saida: texto consolidado ou string vazia quando nao houver conteudo textual.
 */
function extractGeminiText_(json) {
  const parts = (((json || {}).candidates || [])[0] || {}).content?.parts || [];
  return parts
    .map(function (part) { return part && part.text ? String(part.text).trim() : ''; })
    .filter(Boolean)
    .join('\n')
    .trim();
}

/**
 * Construi um erro legivel a partir do retorno HTTP/JSON do Gemini.
 * Entrada: status HTTP, body bruto e JSON parseado quando disponivel.
 * Saida: mensagem textual curta para o chamador do backend.
 */
function buildGeminiErrorText_(responseCode, responseText, json) {
  const providerMessage = json?.error?.message || json?.promptFeedback?.blockReasonMessage || '';
  const finishReason = json?.candidates?.[0]?.finishReason || '';
  const promptBlock = json?.promptFeedback?.blockReason || '';
  const details = [providerMessage, finishReason, promptBlock].filter(Boolean).join(' | ');

  if (responseCode && responseCode !== 200) {
    return 'Erro: Gemini HTTP ' + responseCode + (details ? ' - ' + details : '.');
  }

  if (promptBlock) {
    return 'Erro: resposta bloqueada pelo Gemini' + (details ? ' - ' + details : '.');
  }

  if (!(((json || {}).candidates || []).length)) {
    return 'Erro: resposta sem candidates do Gemini.';
  }

  if (!extractGeminiText_(json)) {
    return 'Erro: resposta vazia do Gemini' + (details ? ' - ' + details : '.');
  }

  return 'Erro: resposta invalida do Gemini.';
}

/**
 * Define se vale repetir a chamada ao Gemini com base no status HTTP.
 * Entrada: codigo HTTP retornado pelo provider.
 * Saida: true para erros transientes; false para erros de configuracao ou request.
 */
function shouldRetryGeminiStatus_(responseCode) {
  return responseCode === 429 || responseCode >= 500;
}

/**
 * Executa uma chamada bruta ao Gemini a partir de um payload ja montado.
 * Entrada: objeto REST compativel com generateContent.
 * Saida: texto puro vindo do provider ou mensagem de erro controlada.
 */
function callGeminiRequest_(payload) {
  const apiKey = getGeminiKey_();
  logAIDebug_('gemini-key-check', {
    key: maskSecretForLog_(apiKey),
    model: APP_CONFIG_.geminiModel
  });
  if (!apiKey) return 'Erro: GEMINI_API_KEY não configurada.';

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + APP_CONFIG_.geminiModel + ':generateContent';
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-goog-api-key': apiKey
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  let response;
  let retries = 0;
  const maxRetries = 5;

  while (retries < maxRetries) {
    try {
      response = UrlFetchApp.fetch(url, options);
      const responseCode = response.getResponseCode();
      const responseText = response.getContentText();
      logAIDebug_('gemini-http-response', {
        attempt: retries + 1,
        responseCode: responseCode,
        bodyPreview: truncateAIDebugText_(responseText, 1200)
      });

      let json;

      try {
        json = JSON.parse(responseText);
      } catch (parseError) {
        logAIDebug_('gemini-parse-error', {
          attempt: retries + 1,
          responseCode: responseCode,
          message: parseError && parseError.message ? parseError.message : String(parseError),
          bodyPreview: truncateAIDebugText_(responseText, 1200)
        });
        return 'Erro: resposta invalida do Gemini.';
      }

      if (responseCode === 200) {
        const text = extractGeminiText_(json);
        if (!json.candidates || !json.candidates.length) {
          logAIDebug_('gemini-empty-candidates', {
            attempt: retries + 1,
            bodyPreview: truncateAIDebugText_(responseText, 1200)
          });
          return buildGeminiErrorText_(responseCode, responseText, json);
        }

        if (!text) {
          logAIDebug_('gemini-empty-text', {
            attempt: retries + 1,
            bodyPreview: truncateAIDebugText_(responseText, 1200)
          });
          return buildGeminiErrorText_(responseCode, responseText, json);
        }

        return text;
      }

      const errorText = buildGeminiErrorText_(responseCode, responseText, json);
      logAIDebug_('gemini-http-error', {
        attempt: retries + 1,
        responseCode: responseCode,
        errorText: errorText
      });
      if (!shouldRetryGeminiStatus_(responseCode)) {
        return errorText;
      }

      Utilities.sleep(Math.pow(2, retries) * 1000);
      retries++;
    } catch (error) {
      logAIDebug_('gemini-fetch-exception', {
        attempt: retries + 1,
        message: error && error.message ? error.message : String(error),
        stackPreview: truncateAIDebugText_(error && error.stack ? error.stack : '', 500)
      });
      Utilities.sleep(Math.pow(2, retries) * 1000);
      retries++;
    }
  }

  return 'Ocorreu um erro ao contactar o serviço de análise. Tente novamente mais tarde.';
}

/**
 * Chamada principal ao Gemini mantendo assinatura alinhada ao fluxo atual da Esquilo IA.
 * Entrada: system prompt e user prompt consolidados.
 * Saida: texto puro vindo do provider ou mensagem de erro controlada.
 */
function callGemini_(systemPrompt, userPrompt) {
  const payload = {
    contents: [{ parts: [{ text: userPrompt }] }],
    system_instruction: { parts: [{ text: systemPrompt }] }
  };

  return callGeminiRequest_(payload);
}

/**
 * Mantem compatibilidade com chamadas antigas e com testes manuais via payload cru.
 * Entrada: payload REST completo ou prompt legacy com system prompt opcional.
 * Saida: texto puro vindo do Gemini ou mensagem de erro controlada.
 */
function callGemini(payloadOrPrompt, systemPrompt) {
  if (payloadOrPrompt && typeof payloadOrPrompt === 'object' && !Array.isArray(payloadOrPrompt)) {
    return callGeminiRequest_(payloadOrPrompt);
  }

  return callGemini_(systemPrompt, payloadOrPrompt);
}

/**
 * Fluxo legado de analise tatica solicitado pelo frontend.
 * Entrada: ticker ou simbolo em monitoramento.
 * Saida: texto livre gerado pelo Gemini com base no inventario completo.
 */
function getAIAnalysis(stopLossAtivo) {
  const systemPrompt = 'Você é o analista estratégico do Esquilo Invest. Seu tom é direto, claro e focado em decisões práticas. Analise o inventário de ativos do usuário, comente sobre os stops atingidos e sugira movimentações táticas rápidas de curto prazo.';
  const dadosCompletos = getInventoryLoot();
  const summary = buildAIPortfolioSummary_();
  const userPrompt = 'Resumo estratégico:\n' + summary + '\n\nInventário completo:\n' + dadosCompletos + '\n\nStop Loss recente: ' + stopLossAtivo + '. Qual é o próximo movimento?';
  return callGemini_(systemPrompt, userPrompt);
}
