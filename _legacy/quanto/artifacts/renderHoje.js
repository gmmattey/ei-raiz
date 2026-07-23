function renderHoje(state) {
  const p = state.portfolio;
  const ALLOC_COLORS = ['#5e5ce6','#ff9f0a','#34c759','#ff453a','#30d158','#0a84ff'];
  const INST_LABELS_MAP = { XP: 'XP', ITAU: 'Itaú / ION', ONZE: 'Onze', OUTROS: 'Outros' };
  const CLASS_LABELS_MAP = {
    ACAO: 'Ação', FII: 'FII', FUNDO: 'Fundo', PREVIDENCIA: 'Previdência',
    TESOURO: 'Tesouro', RF: 'Renda Fixa', POUPANCA: 'Poupança', COFRINHO: 'Cofrinho'
  };

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  if (state.loading && !p) {
    return `<div class="q-page-header">
      <div class="q-page-title">Hoje</div>
    </div>
    <div style="padding:40px 16px;text-align:center;color:var(--ink-light,#6B7C88)">Carregando…</div>`;
  }

  let html = '';

  // 1. Page header
  let subtitle = '';
  const nameSource = (state.session && state.session.name) || (p && p.userName);
  if (nameSource) {
    const h = new Date().getHours();
    const salute = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
    subtitle = `<div class="q-page-subtitle">${salute}, ${esc(nameSource.split(' ')[0])}</div>`;
  }
  html += `<div class="q-page-header">
    <div class="q-page-title">Hoje</div>
    ${subtitle}
  </div>`;

  if (state.error) {
    html += `<div class="q-notice error">${esc(state.error)}</div>`;
  }

  if (!p) return html;

  const total = p.total || 0;
  const invested = p.invested || 0;
  const gain = p.gain;
  const gainPct = p.gainPct;
  const hideVal = state.hideValues;

  // 2. Hero
  const totalDisplay = hideVal
    ? `<span class="q-blur">${formatCurrency(total)}</span>`
    : formatCurrency(total);

  const grossWealth = p.grossWealth;
  const captionHtml = (grossWealth != null && grossWealth !== total)
    ? `<div class="q-hero-caption">Patrimônio bruto com bens: ${
        hideVal
          ? `<span class="q-blur">${formatCurrency(grossWealth)}</span>`
          : formatCurrency(grossWealth)
      }</div>`
    : '';

  let badgeHtml = '';
  if (gain != null && invested > 0) {
    const isPos = gain >= 0;
    const arrow = isPos
      ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="18 15 12 9 6 15"/></svg>`
      : `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>`;
    const gainStr = (isPos ? '+' : '−') + formatCurrency(Math.abs(gain));
    const gainDisplay = hideVal ? `<span class="q-blur">${gainStr}</span>` : gainStr;
    const pctSuffix = gainPct != null ? ` · ${formatPercent(gainPct)} sobre o aplicado` : '';
    badgeHtml = `<div class="q-hero-badge ${isPos ? 'pos' : 'neg'}">${arrow} ${gainDisplay}${pctSuffix}</div>`;
  }

  html += `<div class="q-hero">
    <div class="q-hero-eyebrow">Patrimônio total</div>
    <div class="q-hero-value">${totalDisplay}</div>
    ${captionHtml}
    ${badgeHtml}
  </div>`;

  // 3. Alocação
  const allocMode = state.allocationMode || 'institution';
  const rawAlloc = p.allocation;
  const allocSlices = rawAlloc
    ? (allocMode === 'institution' ? (rawAlloc.by_institution || []) : (rawAlloc.by_class || []))
    : (allocMode === 'institution' ? (p.byInstitution || []) : (p.byClass || []));

  const allocRowsHtml = allocSlices.map((slice, i) => {
    const color = ALLOC_COLORS[i % ALLOC_COLORS.length];
    const labelText = slice.label
      || (slice.institution ? (INST_LABELS_MAP[slice.institution] || slice.institution) : '')
      || (slice.class ? (CLASS_LABELS_MAP[slice.class] || slice.class) : '')
      || String(slice.key || '');
    const pctVal = typeof slice.pct === 'number' ? Math.round(slice.pct) : 0;
    return `<div class="q-alloc-row">
      <div class="q-alloc-dot" style="background:${color}"></div>
      <div class="q-alloc-label">${esc(labelText)}</div>
      <div class="q-alloc-bar-wrap"><div class="q-alloc-bar" style="width:${pctVal}%;background:${color}"></div></div>
      <div class="q-alloc-pct">${pctVal}%</div>
    </div>`;
  }).join('');

  html += `<div class="q-list-section" style="margin-top:20px">
    <div class="q-list-header">Alocação</div>
    <div class="q-list-card" style="padding:12px 16px">
      <div class="q-segment">
        <div class="q-seg-opt${allocMode === 'institution' ? ' active' : ''}"
          data-segment-key="allocationMode" data-segment-val="institution">Instituição</div>
        <div class="q-seg-opt${allocMode === 'class' ? ' active' : ''}"
          data-segment-key="allocationMode" data-segment-val="class">Classe</div>
      </div>
      ${allocRowsHtml || '<div style="padding:8px 0;color:var(--ink-light,#6B7C88);font-size:14px">Sem dados de alocação.</div>'}
    </div>
  </div>`;

  // 4. Frescor — Saldos manuais
  const freshnessRows = (p.freshness && p.freshness.byInstitution) || [];
  if (freshnessRows.length > 0) {
    const fRowsHtml = freshnessRows.map((row) => {
      const label = row.institutionName || INST_LABELS_MAP[row.institution] || row.institution;
      const hasStale = row.staleAssets && row.staleAssets.length > 0;
      let dotHtml;
      if (hasStale) {
        const oldest = row.staleAssets.reduce((a, b) => (b.daysAgo > a.daysAgo ? b : a));
        const mins = oldest.daysAgo * 24 * 60;
        dotHtml = `<span class="q-fresh-dot warn"></span><span class="q-fresh-age-warn">${relativeMinutes(mins)}</span>`;
      } else {
        dotHtml = `<span class="q-fresh-dot ok"></span><span class="q-fresh-age-ok">em dia</span>`;
      }
      return `<div class="q-list-row">
        <div class="q-list-row-content"><div class="q-list-row-label">${esc(label)}</div></div>
        <div class="q-list-row-right">${dotHtml}</div>
      </div>`;
    }).join('');

    html += `<div class="q-list-section">
      <div class="q-list-header">Saldos manuais</div>
      <div class="q-list-card">${fRowsHtml}</div>
    </div>`;
  }

  // 5. Top ativos
  const topAssets = (p.assets || [])
    .filter(a => a.status === 'active' && a.balance != null)
    .sort((a, b) => (b.balance || 0) - (a.balance || 0))
    .slice(0, 3);

  if (topAssets.length > 0) {
    const topRowsHtml = topAssets.map((asset) => {
      const name = asset.displayName || asset.name || asset.ticker || '';
      const classLabel = CLASS_LABELS_MAP[asset.class] || asset.class || '';
      const instLabel = asset.institutionName || INST_LABELS_MAP[asset.institution] || asset.institution || '';
      const subLabel = [classLabel, instLabel].filter(Boolean).join(' · ');
      const balDisplay = hideVal
        ? `<span class="q-blur">${formatCurrency(asset.balance)}</span>`
        : formatCurrency(asset.balance);
      let gainPctHtml = '';
      if (asset.gainPct != null) {
        const isPos = asset.gainPct >= 0;
        gainPctHtml = `<div class="q-list-row-value ${isPos ? 'pos' : 'neg'}" style="font-size:13px">${formatPercent(asset.gainPct)}</div>`;
      }
      return `<div class="q-list-row" onclick="navigate('carteira')" style="cursor:pointer">
        <div class="q-asset-avatar">${esc(initials(name))}</div>
        <div class="q-list-row-content">
          <div class="q-list-row-label">${esc(name)}</div>
          <div class="q-list-row-sub">${esc(subLabel)}</div>
        </div>
        <div class="q-list-row-right" style="flex-direction:column;align-items:flex-end;gap:2px">
          <div class="q-list-row-value">${balDisplay}</div>
          ${gainPctHtml}
        </div>
        <div class="q-chevron" style="margin-left:8px"><svg viewBox="0 0 7 12"><polyline points="1 1 6 6 1 11"/></svg></div>
      </div>`;
    }).join('');

    html += `<div class="q-list-section">
      <div class="q-list-header" style="display:flex;justify-content:space-between;align-items:center">
        <span>Top ativos</span>
        <span style="color:#000;font-weight:600;text-transform:none;letter-spacing:0;font-size:13px;cursor:pointer"
          onclick="navigate('carteira')">Ver carteira</span>
      </div>
      <div class="q-list-card">${topRowsHtml}</div>
    </div>`;
  }

  return html;
}
