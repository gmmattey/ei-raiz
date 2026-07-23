function renderDetalhe(state) {
  var detail = state.detail;
  var blurCls = state.hideValues ? ' q-blur' : '';

  // 1. Loading spinner when no detail yet
  if (state.detailLoading && !detail) {
    return (
      '<div class="q-detail-header" style="display:flex;align-items:center;justify-content:center;min-height:180px">' +
        '<div class="q-spinner"></div>' +
      '</div>'
    );
  }

  // 2. Error state
  if (state.detailError && !detail) {
    return (
      '<div class="q-detail-header" style="display:flex;align-items:center;justify-content:center;min-height:180px">' +
        '<div class="q-detail-error">Erro ao carregar ativo.</div>' +
      '</div>'
    );
  }

  if (!detail) return '';

  var asset = detail.asset || {};
  var contributions = detail.contributions || [];
  var history = state.detailHistory || [];
  var period = state.detailHistoryPeriod || '6M';
  var analysis = state.detailAnalysis;
  var analysisLoading = state.detailAnalysisLoading;

  // --- helpers ---
  function formatCurrency(v) {
    if (v == null) return '—';
    return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatPercent(v, decimals) {
    if (v == null) return '';
    var d = decimals != null ? decimals : 1;
    var sign = v >= 0 ? '+' : '';
    return sign + Number(v).toFixed(d).replace('.', ',') + '%';
  }

  function formatDateTime(iso) {
    if (!iso) return '—';
    var normalized = iso.endsWith('Z') ? iso : iso.replace(' ', 'T') + 'Z';
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(normalized));
  }

  function initials(name) {
    if (!name) return '?';
    var parts = name.trim().toUpperCase().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2);
    return parts[0][0] + parts[1][0];
  }

  function fmtDate(iso) {
    if (!iso) return '';
    var normalized = iso.endsWith('Z') ? iso : iso.replace(' ', 'T') + 'Z';
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(normalized));
  }

  // --- avatar initials ---
  var avatarText = asset.ticker ? initials(asset.ticker) : initials(asset.name || '');

  // --- class / institution labels ---
  var classLabel = (typeof CLASS_LABELS !== 'undefined' && CLASS_LABELS[asset.class]) || asset.class || '';
  var instLabel = (typeof INSTITUTION_LABELS !== 'undefined' && INSTITUTION_LABELS[asset.institution])
    || (typeof INST_LABELS !== 'undefined' && INST_LABELS[asset.institution])
    || asset.institution_name
    || asset.institution
    || '';

  var subParts = [];
  if (classLabel) subParts.push(classLabel);
  if (instLabel) subParts.push(instLabel);
  if (asset.qty != null) subParts.push(Number(asset.qty).toLocaleString('pt-BR') + ' cotas');

  // --- gain display ---
  var gain = asset.gain;
  var gainPct = asset.gain_pct;
  var gainIsPos = gain != null && gain >= 0;
  var gainSign = gainIsPos ? '+' : '';
  var gainStr = '';
  if (gain != null && gainPct != null) {
    gainStr = gainSign + formatCurrency(gain) + ' · ' + gainSign + formatPercent(gainPct, 1) + ' sobre o aplicado';
  }

  // 2. Dark-gradient header
  var html = '';
  html += '<div class="q-detail-header">';

  // Back button
  html += '<button class="q-detail-back" onclick="navigate(\'' + (state.detailOrigin || 'carteira') + '\')">';
  html += '<svg viewBox="0 0 9 16" width="9" height="16" aria-hidden="true"><polyline points="8 1 1 8 8 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  html += ' Carteira';
  html += '</button>';

  // Avatar row
  html += '<div class="q-detail-avatar-row">';
  html += '<div class="q-detail-avatar">' + avatarText + '</div>';
  html += '<div>';
  html += '<div class="q-detail-name">' + (asset.name || asset.ticker || '—') + '</div>';
  html += '<div class="q-detail-sub">' + subParts.join(' · ') + '</div>';
  html += '</div>';
  html += '</div>';

  // Value
  html += '<div class="q-detail-value' + blurCls + '">' + formatCurrency(asset.current_balance) + '</div>';

  // Delta
  if (gainStr) {
    html += '<div class="q-detail-delta' + (gainIsPos ? ' pos' : ' neg') + '">' + gainStr + '</div>';
  }

  html += '</div>'; // end q-detail-header

  // 3. Chart section
  var PERIODS = ['1M', '3M', '6M', '1A', 'Tudo'];

  html += '<div class="q-list-section" style="margin-top:16px">';
  html += '<div class="q-period-row">';
  PERIODS.forEach(function (p) {
    var isActive = p === period;
    html += '<button class="q-period-btn' + (isActive ? ' active' : '') + '"'
      + ' onclick="loadDetailHistory(' + JSON.stringify(asset.id) + ',\'' + p + '\')">'\
      + p + '</button>';
  });
  html += '</div>';

  // SVG line chart
  html += '<div class="q-list-card" style="padding:14px 16px">';
  html += '<div class="q-chart-area">';

  if (history.length >= 2) {
    var prices = history.map(function (d) { return d.price != null ? d.price : 0; });
    var minP = Math.min.apply(null, prices);
    var maxP = Math.max.apply(null, prices);
    var rangeP = maxP - minP || 1;
    var W = 280, H = 72, PAD = 4;
    var pts = prices.map(function (p, i) {
      var x = PAD + (i / Math.max(prices.length - 1, 1)) * (W - PAD * 2);
      var y = PAD + (1 - (p - minP) / rangeP) * (H - PAD * 2 - 2);
      return x.toFixed(1) + ',' + y.toFixed(1);
    });
    var firstP = prices[0];
    var lastP = prices[prices.length - 1];
    var lineColor = lastP >= firstP ? 'var(--verde,#1F7A4D)' : 'var(--vinho,#C2335B)';
    var lastPt = pts[pts.length - 1];
    var lastX = lastPt.split(',')[0];
    var lastY = lastPt.split(',')[1];
    var areaPath = 'M' + pts[0] + ' ' + pts.slice(1).map(function (p) { return 'L' + p; }).join(' ')
      + ' L' + (W - PAD).toFixed(1) + ',' + (H - PAD).toFixed(1)
      + ' L' + PAD.toFixed(1) + ',' + (H - PAD).toFixed(1) + ' Z';
    var linePath = 'M' + pts[0] + ' ' + pts.slice(1).map(function (p) { return 'L' + p; }).join(' ');

    html += '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" style="width:100%;height:72px">';
    html += '<defs><linearGradient id="q-det-g" x1="0" y1="0" x2="0" y2="1">';
    html += '<stop offset="0%" stop-color="' + lineColor + '" stop-opacity=".18"/>';
    html += '<stop offset="100%" stop-color="' + lineColor + '" stop-opacity="0"/>';
    html += '</linearGradient></defs>';
    html += '<path d="' + areaPath + '" fill="url(#q-det-g)"/>';
    html += '<path d="' + linePath + '" fill="none" stroke="' + lineColor + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    html += '<circle cx="' + lastX + '" cy="' + lastY + '" r="4" fill="' + lineColor + '"/>';
    html += '</svg>';
  } else {
    // Placeholder chart matching wireframe
    html += '<svg viewBox="0 0 280 72" preserveAspectRatio="none" style="width:100%;height:72px">';
    html += '<defs><linearGradient id="q-det-g" x1="0" y1="0" x2="0" y2="1">';
    html += '<stop offset="0%" stop-color="var(--ink,#16242F)" stop-opacity=".15"/>';
    html += '<stop offset="100%" stop-color="var(--ink,#16242F)" stop-opacity="0"/>';
    html += '</linearGradient></defs>';
    html += '<path d="M0,55 C30,50 50,58 70,42 C90,28 110,35 140,22 C170,10 200,18 230,8 C250,3 265,5 280,2 L280,72 L0,72 Z" fill="url(#q-det-g)"/>';
    html += '<path d="M0,55 C30,50 50,58 70,42 C90,28 110,35 140,22 C170,10 200,18 230,8 C250,3 265,5 280,2" fill="none" stroke="var(--ink,#16242F)" stroke-width="2" stroke-linecap="round"/>';
    html += '<circle cx="280" cy="2" r="4" fill="var(--ink,#16242F)"/>';
    html += '</svg>';
  }

  html += '</div>'; // end q-chart-area

  // X-axis month labels derived from history or default
  var monthLabels;
  if (history.length >= 2) {
    var monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    var step = Math.max(1, Math.floor((history.length - 1) / 5));
    var indices = [0, step, step * 2, step * 3, step * 4, history.length - 1];
    monthLabels = indices.map(function (idx, i) {
      var entry = history[Math.min(idx, history.length - 1)];
      var d = entry && entry.date ? new Date(entry.date) : null;
      var label = d ? monthNames[d.getUTCMonth()] : '';
      var isLast = i === indices.length - 1;
      return '<span style="font-size:10px;color:' + (isLast ? 'var(--ink,#000);font-weight:700' : 'var(--muted,#8e8e93)') + '">' + label + '</span>';
    });
  } else {
    var defaultMonths = ['Jan','Fev','Mar','Abr','Mai','Jun'];
    monthLabels = defaultMonths.map(function (m, i) {
      var isLast = i === defaultMonths.length - 1;
      return '<span style="font-size:10px;color:' + (isLast ? 'var(--ink,#000);font-weight:700' : 'var(--muted,#8e8e93)') + '">' + m + '</span>';
    });
  }

  html += '<div style="display:flex;justify-content:space-between;margin-top:4px">' + monthLabels.join('') + '</div>';
  html += '</div>'; // end q-list-card
  html += '</div>'; // end q-list-section

  // 4. KPI grid 2x2
  var priceStr = asset.current_price != null ? formatCurrency(asset.current_price) : '—';
  var updatedStr = formatDateTime(asset.last_update);

  html += '<div class="q-list-section">';
  html += '<div class="q-kpi-grid">';
  html += '<div class="q-kpi-cell"><div class="q-kpi-label">Aplicado</div>'
    + '<div class="q-kpi-val' + blurCls + '">' + formatCurrency(asset.invested) + '</div></div>';

  var gainCls = gain != null && gain >= 0 ? ' pos' : ' neg';
  var gainValStr = gain != null ? (gainIsPos ? '+' : '') + formatCurrency(gain) : '—';
  html += '<div class="q-kpi-cell"><div class="q-kpi-label">Lucro</div>'
    + '<div class="q-kpi-val' + gainCls + blurCls + '">' + gainValStr + '</div></div>';

  html += '<div class="q-kpi-cell"><div class="q-kpi-label">Cotação</div>'
    + '<div class="q-kpi-val' + blurCls + '">' + priceStr + '</div></div>';

  html += '<div class="q-kpi-cell"><div class="q-kpi-label">Atualizado</div>'
    + '<div class="q-kpi-val" style="font-size:13px">' + updatedStr + '</div></div>';

  html += '</div>'; // end q-kpi-grid
  html += '</div>'; // end q-list-section

  // 5. Aportes
  if (contributions.length > 0) {
    html += '<div class="q-list-section">';
    html += '<div class="q-list-header">Aportes</div>';
    html += '<div class="q-list-card">';
    contributions.forEach(function (c) {
      var dateStr = c.date ? fmtDate(c.date) : (c.contributedAt ? fmtDate(c.contributedAt) : '');
      var noteStr = c.note || c.label || '';
      html += '<div class="q-list-row">';
      html += '<div class="q-list-row-content">';
      html += '<div class="q-list-row-label">' + (noteStr || 'Aporte') + '</div>';
      if (dateStr) html += '<div class="q-list-row-sub">' + dateStr + '</div>';
      html += '</div>';
      html += '<div class="q-list-row-value' + blurCls + '">' + formatCurrency(c.amount) + '</div>';
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';
  }

  // 6. Analysis
  html += '<div class="q-list-section">';
  if (!analysis && !analysisLoading) {
    html += '<div style="padding:0 16px 8px">';
    html += '<button class="q-btn q-btn-gray" style="width:100%;height:44px;font-size:15px;border-radius:12px"'
      + ' onclick="loadDetailAnalysis(' + JSON.stringify(asset.id) + ')">✦ Análise</button>';
    html += '</div>';
  } else if (analysisLoading) {
    html += '<div style="padding:0 16px 8px;color:var(--muted,#8e8e93);font-size:14px;text-align:center">Analisando...</div>';
  } else if (analysis) {
    html += '<div class="q-list-header">Análise</div>';
    html += '<div class="q-list-card" style="padding:14px 16px">';
    html += '<div style="font-size:14px;line-height:1.55;color:var(--ink,#16242F)">' + analysis + '</div>';
    html += '</div>';
  }
  html += '</div>';

  // 7. Action buttons
  html += '<div class="q-btn-grid-2" style="padding:0 16px;display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:32px">';
  html += '<button class="q-btn q-btn-gray" data-open-sheet="sheet-atualizar-saldo"'
    + ' style="height:44px;font-size:15px;border-radius:12px">Atualizar saldo</button>';

  if (asset.status === 'active') {
    html += '<button class="q-btn q-btn-destructive" data-open-sheet="sheet-iniciar-resgate"'
      + ' style="height:44px;font-size:15px;border-radius:12px">Iniciar resgate</button>';
  } else if (asset.status === 'redeeming') {
    html += '<button class="q-btn q-btn-destructive" onclick="handleCompleteExit()"'
      + ' style="height:44px;font-size:15px;border-radius:12px">Concluir venda</button>';
  }

  html += '</div>';

  return html;
}
