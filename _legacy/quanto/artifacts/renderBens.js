function renderBens(state) {
  // Trigger load if needed
  if (state.goods === null && !state.goodsLoading) {
    loadGoods();
  }

  // Loading state
  if (state.goodsLoading && !state.goods) {
    return `
      <div class="q-page-header-row">
        <div>
          <h1 class="q-page-title">Bens</h1>
          <div class="q-page-subtitle">Patrimônio bruto</div>
        </div>
      </div>
      <div class="q-loading-state">Carregando bens...</div>
    `;
  }

  // Error state
  if (state.goodsError && !state.goods) {
    return `
      <div class="q-page-header-row">
        <div>
          <h1 class="q-page-title">Bens</h1>
          <div class="q-page-subtitle">Patrimônio bruto</div>
        </div>
      </div>
      <div class="q-error-state">${state.goodsError}</div>
    `;
  }

  const goods = state.goods?.goods ?? [];
  const goodsTotal = state.goods?.total ?? goods.reduce((s, g) => s + Number(g.estimatedValue || 0), 0);
  const portfolioTotal = state.portfolio?.total ?? null;
  const grossWealth = portfolioTotal != null ? goodsTotal + portfolioTotal : null;

  // Per-type totals for distribution
  const TYPE_ORDER = ['IMOVEL', 'FGTS', 'VEICULO'];
  const TYPE_COLORS = { FGTS: '#ff9f0a', IMOVEL: '#34c759', VEICULO: '#5e5ce6' };

  const byType = {};
  TYPE_ORDER.forEach(t => { byType[t] = 0; });
  goods.forEach(g => {
    if (byType[g.type] !== undefined) byType[g.type] += Number(g.estimatedValue || 0);
  });

  const grandTotal = Object.values(byType).reduce((s, v) => s + v, 0) || 1;

  const allocRows = TYPE_ORDER
    .filter(t => byType[t] > 0)
    .map(t => {
      const pct = Math.round(byType[t] / grandTotal * 100);
      const color = TYPE_COLORS[t];
      const label = GOOD_TYPE_LABELS[t];
      return `
        <div class="alloc-row">
          <div class="alloc-dot" style="background:${color}"></div>
          <div class="alloc-label">${label}</div>
          <div class="alloc-bar-wrap"><div class="alloc-bar" style="width:${pct}%;background:${color}"></div></div>
          <div class="alloc-pct">${pct}%</div>
        </div>
      `;
    }).join('');

  // Icon SVGs per type
  function goodIcon(type) {
    if (type === 'IMOVEL') {
      return `<div class="q-row-icon" style="background:#e5f9ee;margin-right:12px">
        <svg viewBox="0 0 24 24" fill="none" stroke="#248a3d" stroke-width="1.8" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </div>`;
    }
    if (type === 'FGTS') {
      return `<div class="q-row-icon" style="background:#fff3e0;margin-right:12px">
        <svg viewBox="0 0 24 24" fill="none" stroke="#b25000" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
      </div>`;
    }
    if (type === 'VEICULO') {
      return `<div class="q-row-icon" style="background:#f0eeff;margin-right:12px">
        <svg viewBox="0 0 24 24" fill="none" stroke="#5e5ce6" stroke-width="1.8" stroke-linecap="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
      </div>`;
    }
    return `<div class="q-row-icon" style="background:#f0f0f0;margin-right:12px"></div>`;
  }

  function goodSubtitle(g) {
    const label = GOOD_TYPE_LABELS[g.type] || g.type;
    if (g.type === 'IMOVEL') {
      return g.city ? `${label} · ${g.city}` : label;
    }
    if (g.type === 'VEICULO') {
      return g.year ? `${label} · ${g.year}` : label;
    }
    if (g.type === 'FGTS') {
      return g.employer ? g.employer : label;
    }
    return label;
  }

  const chevronSvg = `<div class="chevron" style="margin-left:8px"><svg viewBox="0 0 7 12"><polyline points="1 1 6 6 1 11"/></svg></div>`;

  let goodsListHtml;
  if (goods.length === 0) {
    goodsListHtml = `<div class="q-empty-state" style="padding:24px 16px;text-align:center;color:var(--ink-3,#888)">Nenhum bem cadastrado ainda.<br>Toque em + para adicionar.</div>`;
  } else {
    goodsListHtml = `<div class="list-card">${goods.map(g => `
      <div class="list-row" style="cursor:pointer" onclick="qOpenSheet('sheet-edit-bem-${g.id}')">
        ${goodIcon(g.type)}
        <div class="list-row-content">
          <div class="list-row-label">${g.name}</div>
          <div class="list-row-sub">${goodSubtitle(g)}</div>
        </div>
        <div class="list-row-right">
          <div class="list-row-value">${formatCurrency(g.estimatedValue, state.hideValues)}</div>
        </div>
        ${chevronSvg}
      </div>
    `).join('')}</div>`;
  }

  return `
    <div class="q-page-header-row" style="display:flex;justify-content:space-between;align-items:flex-end;padding-right:20px">
      <div>
        <h1 class="q-page-title">Bens</h1>
        <div class="q-page-subtitle">Patrimônio bruto</div>
      </div>
      <div class="q-btn-icon" data-open-sheet="sheet-add-bem" style="width:32px;height:32px;border-radius:50%;background:#000;display:flex;align-items:center;justify-content:center;margin-bottom:6px">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </div>
    </div>

    <div class="q-hero">
      <div class="hero-eyebrow">Total de bens</div>
      <div class="hero-value">${formatCurrency(goodsTotal, state.hideValues)}</div>
      ${grossWealth != null
        ? `<div class="hero-caption">Combinado com investimentos: ${formatCurrency(grossWealth, state.hideValues)}</div>`
        : ''}
    </div>

    ${allocRows ? `
    <div class="list-section" style="margin-top:20px">
      <div class="list-header">Distribuição</div>
      <div class="list-card" style="padding:12px 16px">
        ${allocRows}
      </div>
    </div>
    ` : ''}

    <div class="list-section">
      <div class="list-header">Seus bens</div>
      ${goodsListHtml}
    </div>
  `;
}
