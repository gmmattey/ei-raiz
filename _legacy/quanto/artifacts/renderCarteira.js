function renderCarteira(state) {
  const assets = (state.portfolio && state.portfolio.assets) || [];
  const filter = state.carteiraFilter || 'todos';
  const searchTerm = (state.carteiraSearchTerm || '').toLowerCase().trim();
  const hideValues = !!state.hideValues;

  const chevronSVG = '<svg viewBox="0 0 7 12" width="7" height="12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 1 6 6 1 11"/></svg>';

  // Collect unique institutions from non-archived assets
  const activeAssets = assets.filter(a => a.status !== 'archived');
  const institutions = [...new Set(activeAssets.map(a => a.institution).filter(Boolean))];

  // Build chips HTML
  const allChipActive = filter === 'todos';
  let chipsHTML = `<div class="q-chip${allChipActive ? ' q-chip--active' : ''}" onclick="setState({carteiraFilter:'todos'})">Todos</div>`;
  institutions.forEach(inst => {
    const active = filter === inst;
    const label = (typeof INSTITUTION_LABELS !== 'undefined' && INSTITUTION_LABELS[inst]) || inst;
    chipsHTML += `<div class="q-chip${active ? ' q-chip--active' : ''}" onclick="setState({carteiraFilter:'${escapeHtml(inst)}'})">${escapeHtml(label)}</div>`;
  });

  // Filter assets
  let filtered = activeAssets;
  if (filter !== 'todos') {
    filtered = filtered.filter(a => a.institution === filter);
  }
  if (searchTerm) {
    filtered = filtered.filter(a =>
      (a.name || '').toLowerCase().includes(searchTerm) ||
      (a.ticker || '').toLowerCase().includes(searchTerm) ||
      (a.institution || '').toLowerCase().includes(searchTerm) ||
      ((typeof INSTITUTION_LABELS !== 'undefined' && INSTITUTION_LABELS[a.institution]) || '').toLowerCase().includes(searchTerm)
    );
  }

  // Count and total for subtitle
  const count = filtered.length;
  const total = filtered.reduce((s, a) => s + (a.balance || 0), 0);
  const subtitleValue = hideValues ? '••••••' : formatCurrency(total);
  const subtitle = `${count} ${count === 1 ? 'ativo' : 'ativos'} · ${subtitleValue}`;

  // Group by institution
  const groups = {};
  const groupOrder = [];
  filtered.forEach(a => {
    const inst = a.institution || 'OUTROS';
    if (!groups[inst]) {
      groups[inst] = [];
      groupOrder.push(inst);
    }
    groups[inst].push(a);
  });

  // Build group sections HTML
  let sectionsHTML = '';
  if (filtered.length === 0) {
    sectionsHTML = `<div class="q-empty-state">Nenhum ativo encontrado.</div>`;
  } else {
    groupOrder.forEach(inst => {
      const groupAssets = groups[inst];
      const instLabel = (typeof INSTITUTION_LABELS !== 'undefined' && INSTITUTION_LABELS[inst]) || inst;

      let rowsHTML = '';
      groupAssets.forEach(a => {
        const ticker = a.ticker || a.name || '';
        const displayName = a.display_name || a.displayName || a.name || ticker;
        const classLabel = (typeof CLASS_LABELS !== 'undefined' && CLASS_LABELS[a.class]) || a.class || '';
        const isAuto = a.mode === 'auto';
        const qty = a.qty != null ? a.qty : null;
        const price = a.price != null ? a.price : null;

        let subParts = [];
        if (classLabel) subParts.push(escapeHtml(classLabel));
        if (isAuto && qty != null && price != null) {
          subParts.push(`${qty} cotas · ${formatCurrency(price)}`);
        } else if (isAuto && qty != null) {
          subParts.push(`${qty} cotas`);
        } else if (!isAuto) {
          subParts.push('saldo manual');
        }
        const subText = subParts.join(' · ');

        const balanceDisplay = hideValues
          ? '••••••'
          : (a.balance != null ? formatCurrency(a.balance) : (isAuto ? 'Aguardando' : '—'));

        let gainHTML = '';
        if (a.gainPct != null) {
          const isPos = a.gainPct >= 0;
          const isNeg = a.gainPct < 0;
          const gainClass = isPos ? 'q-row-gain pos' : 'q-row-gain neg';
          const gainDisplay = hideValues ? '••••' : formatPercent(a.gainPct);
          gainHTML = `<div class="${gainClass}" style="font-size:13px">${escapeHtml(gainDisplay)}</div>`;
        } else {
          gainHTML = `<div style="font-size:13px;color:#8e8e93">—</div>`;
        }

        // Avatar initials
        const avatarText = initials(ticker || displayName);
        const avatarHTML = `<div class="q-asset-avatar">${escapeHtml(avatarText)}</div>`;

        rowsHTML += `<div class="q-list-row" onclick="loadDetail(${a.id})">
          ${avatarHTML}
          <div class="q-row-content">
            <div class="q-row-label">${escapeHtml(ticker || displayName)}</div>
            <div class="q-row-sub">${subText}</div>
          </div>
          <div class="q-row-right" style="flex-direction:column;align-items:flex-end;gap:2px">
            <div class="q-row-value">${balanceDisplay}</div>
            ${gainHTML}
          </div>
          <div class="q-chevron" style="margin-left:8px">${chevronSVG}</div>
        </div>`;
      });

      sectionsHTML += `<div class="q-list-section">
        <div class="q-list-header">${escapeHtml(instLabel)}</div>
        <div class="q-list-card">
          ${rowsHTML}
        </div>
      </div>`;
    });
  }

  return `<div class="q-page-header-row">
    <div>
      <div class="q-page-title">Carteira</div>
      <div class="q-page-subtitle">${subtitle}</div>
    </div>
    <button class="q-btn-icon" data-open-sheet="sheet-add-ativo" aria-label="Adicionar ativo">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </button>
  </div>

  <div class="q-search-bar">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
    <input
      class="q-search-input"
      id="carteira-search"
      type="search"
      placeholder="Nome, ticker ou instituição"
      value="${escapeHtml(state.carteiraSearchTerm || '')}"
    />
  </div>

  <div class="q-chips">
    ${chipsHTML}
  </div>

  ${sectionsHTML}`;
}
