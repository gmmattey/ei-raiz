function renderHistorico(state) {
  const history = state.history || [];
  const loading = state.loading;
  const hideValues = state.hideValues;

  const MONTH_ABBR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  function monthAbbr3(monthStr) {
    if (!monthStr) return '';
    const m = parseInt(monthStr.split('-')[1], 10);
    return MONTH_ABBR[m - 1] || monthStr;
  }

  function deltaPct(current, previous) {
    if (previous == null || previous === 0) return null;
    return ((current - previous) / Math.abs(previous)) * 100;
  }

  function fmtDeltaPct(pct) {
    if (pct == null) return null;
    const sign = pct >= 0 ? '+' : '';
    return sign + pct.toFixed(1).replace('.', ',') + '%';
  }

  // Sorted newest-first for display; oldest-first for chart
  const newestFirst = [...history].sort((a, b) => b.month.localeCompare(a.month));
  const oldestFirst = [...history].sort((a, b) => a.month.localeCompare(b.month));

  // Header
  let html = `<div class="q-page-header"><h1>Histórico</h1></div>`;

  // Empty state
  if (!loading && history.length === 0) {
    html += `<div class="q-empty-state"><p>Nenhum snapshot disponível ainda.</p></div>`;
    return html;
  }

  // --- Metric card ---
  const latest = newestFirst[0] || null;
  const prev = newestFirst[1] || null;

  let deltaStr = '';
  let deltaClass = '';
  if (latest && prev) {
    const diff = latest.balance - prev.balance;
    const sign = diff >= 0 ? '+' : '';
    const diffFmt = hideValues ? 'R$ ••••••' : `${sign}R$ ${Math.abs(diff).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    deltaClass = diff >= 0 ? 'pos' : 'neg';
    const prevLabel = formatMonth(prev.month);
    deltaStr = `${sign.replace('+', diff >= 0 ? '+' : '')}${hideValues ? 'R$ ••••••' : `R$ ${(diff < 0 ? -diff : diff).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}`;
    // rebuild cleanly
    const absDiff = Math.abs(diff);
    const absFmt = hideValues ? '••••••' : absDiff.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    deltaStr = `${diff >= 0 ? '+' : '-'}R$ ${absFmt} vs. ${prevLabel}`;
  }

  // Bar chart: up to 12 most recent months, oldest-to-newest order
  const chartPoints = oldestFirst.slice(-12);
  const maxBalance = chartPoints.length ? Math.max(...chartPoints.map(p => p.balance)) : 1;

  const barsHtml = chartPoints.map((p, i) => {
    const pct = maxBalance > 0 ? (p.balance / maxBalance) * 100 : 0;
    const isActive = i === chartPoints.length - 1;
    return `<div class="bar${isActive ? ' active' : ''}" style="height:${pct.toFixed(1)}%"></div>`;
  }).join('');

  const labelsHtml = chartPoints.map((p, i) => {
    const isActive = i === chartPoints.length - 1;
    return `<div class="bar-label${isActive ? ' active' : ''}">${monthAbbr3(p.month)}</div>`;
  }).join('');

  const latestMonthLabel = latest ? formatMonth(latest.month) : '';
  const latestValueFmt = latest ? formatCurrency(latest.balance, hideValues) : '—';

  html += `
    <div style="padding:0 16px">
      <div class="metric-card">
        <div class="metric-eyebrow">${latestMonthLabel}</div>
        <div class="metric-value">${latestValueFmt}</div>
        ${deltaStr ? `<div class="metric-sub ${deltaClass}">${deltaStr}</div>` : ''}
        <div class="bar-chart" style="margin-top:20px">
          ${barsHtml}
        </div>
        <div class="bar-labels">
          ${labelsHtml}
        </div>
      </div>
    </div>
  `;

  // --- Month-by-month list ---
  const rowsHtml = newestFirst.map((item, i) => {
    const nextItem = newestFirst[i + 1] || null; // previous in time = older
    const pct = nextItem ? deltaPct(item.balance, nextItem.balance) : null;
    const pctFmt = hideValues ? null : fmtDeltaPct(pct);
    const pctClass = pct != null && pct < 0 ? 'neg' : 'pos';
    const isLatest = i === 0;

    return `
      <div class="list-row">
        <div class="list-row-content">
          <div class="list-row-label">${formatMonth(item.month)}</div>
          ${isLatest ? `<div class="list-row-sub">snapshot atual</div>` : ''}
        </div>
        <div class="list-row-right" style="flex-direction:column;align-items:flex-end;gap:2px">
          <div class="list-row-value">${formatCurrency(item.balance, hideValues)}</div>
          ${pctFmt != null ? `<div class="list-row-value ${pctClass}" style="font-size:13px">${pctFmt}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  html += `
    <div class="list-section" style="margin-top:20px">
      <div class="list-header">Mês a mês</div>
      <div class="list-card">
        ${rowsHtml}
      </div>
    </div>
  `;

  return html;
}
