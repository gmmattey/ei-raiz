function renderImportar(state) {
  const step = state.importStep || 1;
  const items = state.importItems || [];

  const okItems = items.filter(i => i.status === 'ok');
  const warnItems = items.filter(i => i.status === 'warn');
  const errItems = items.filter(i => i.status === 'error');
  const confirmableCount = items.filter(i => i.status !== 'error').length;

  function stepCircle(n) {
    if (n < step) {
      return `<div class="q-step-circle done"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg></div>`;
    }
    return `<div class="q-step-circle${n === step ? ' active' : ''}">${n}</div>`;
  }

  function stepClass(n) {
    if (n < step) return 'q-step-item done';
    if (n === step) return 'q-step-item active';
    return 'q-step-item';
  }

  const stepsHTML = `
    <div class="q-steps-row">
      <div class="${stepClass(1)}">${stepCircle(1)}<div class="q-step-name">Upload</div></div>
      <div class="${stepClass(2)}">${stepCircle(2)}<div class="q-step-name">Revisão</div></div>
      <div class="${stepClass(3)}">${stepCircle(3)}<div class="q-step-name">Confirmar</div></div>
    </div>`;

  let bodyHTML = '';

  if (step === 1) {
    bodyHTML = `
      <div class="q-list-section" style="margin-top:20px">
        <div class="q-upload-zone" onclick="document.getElementById('xlsx-input').click()">
          <div class="q-upload-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div class="q-upload-title">Planilha XLSX ou XLS</div>
          <div class="q-upload-sub">Toque para selecionar o arquivo da sua corretora</div>
          <div class="q-upload-link">Baixar template →</div>
        </div>
      </div>
      <input type="file" id="xlsx-input" accept=".xlsx,.xls" style="display:none">`;
  } else if (step === 2) {
    const fileName = state.importFileName || 'arquivo.xlsx';

    const badgesHTML = [
      okItems.length > 0 ? `<div style="padding:4px 10px;border-radius:7px;background:rgba(52,199,89,.15);color:#248a3d;font-size:12px;font-weight:700">${okItems.length} OK</div>` : '',
      warnItems.length > 0 ? `<div style="padding:4px 10px;border-radius:7px;background:rgba(255,159,10,.15);color:#b25000;font-size:12px;font-weight:700">${warnItems.length} atenção</div>` : '',
      errItems.length > 0 ? `<div style="padding:4px 10px;border-radius:7px;background:rgba(255,59,48,.15);color:#d70015;font-size:12px;font-weight:700">${errItems.length} erro</div>` : ''
    ].filter(Boolean).join('');

    const itemsHTML = items.map(item => {
      let badgeClass = 'q-import-badge';
      let badgeLabel = '';
      if (item.status === 'ok') { badgeClass += ' ok'; badgeLabel = 'OK'; }
      else if (item.status === 'warn') { badgeClass += ' warn'; badgeLabel = '!'; }
      else { badgeClass += ' err'; badgeLabel = '✕'; }

      const label = item.name || item.ticker || '—';
      const classLabel = (typeof CLASS_LABELS !== 'undefined' && item.class && CLASS_LABELS[item.class]) ? CLASS_LABELS[item.class] : (item.class || '');
      const instLabel = (typeof INSTITUTION_LABELS !== 'undefined' && item.institution && INSTITUTION_LABELS[item.institution]) ? INSTITUTION_LABELS[item.institution] : (item.institution || '');
      const subParts = [classLabel, instLabel].filter(Boolean);
      const sub = item.status === 'error' ? (item.error || 'Dados insuficientes') : (subParts.join(' · ') || '');

      let valueStr = '—';
      let valueStyle = '';
      if (item.status === 'error') {
        valueStyle = 'style="color:#8e8e93"';
      } else if (item.current_balance != null) {
        valueStr = (typeof formatCurrency === 'function') ? formatCurrency(item.current_balance) : `R$ ${item.current_balance}`;
      }

      return `
        <div class="q-list-row">
          <div class="${badgeClass}" style="margin-right:12px">${badgeLabel}</div>
          <div class="q-list-row-content">
            <div class="q-list-row-label">${label}</div>
            ${sub ? `<div class="q-list-row-sub">${sub}</div>` : ''}
          </div>
          <div class="q-list-row-value" ${valueStyle}>${valueStr}</div>
        </div>`;
    }).join('');

    const errorNotice = state.importError ? `<div class="q-notice q-notice-err" style="margin:12px 16px;padding:12px;border-radius:10px;background:rgba(255,59,48,.1);color:#d70015;font-size:14px">${state.importError}</div>` : '';

    bodyHTML = `
      <div class="q-list-section">
        <div class="q-list-card" style="padding:14px 16px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <div style="font-size:15px;font-weight:600;color:#000">${fileName}</div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">${badgesHTML}</div>
        </div>
      </div>
      <div class="q-list-section">
        <div class="q-list-header">Itens para importar</div>
        <div class="q-list-card">${itemsHTML}</div>
      </div>
      ${errorNotice}
      <div class="q-btn-grid-2" style="padding:0 16px;display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <button class="q-btn btn-gray" onclick="setState({importStep:1})">Cancelar</button>
        <button class="q-btn btn-primary" onclick="handleImportConfirm()" ${confirmableCount === 0 ? 'disabled' : ''}>Confirmar ${confirmableCount}</button>
      </div>`;
  } else if (step === 3) {
    bodyHTML = `
      <div class="q-list-section" style="margin-top:32px;text-align:center;padding:0 24px">
        <div style="font-size:48px;margin-bottom:16px">✓</div>
        <div style="font-size:20px;font-weight:700;margin-bottom:8px">Importação concluída</div>
        <div style="font-size:15px;color:#8e8e93;margin-bottom:32px">Seus ativos foram adicionados à carteira com sucesso.</div>
        <button class="q-btn btn-primary" style="width:100%" onclick="navigate('carteira')">Ver carteira</button>
      </div>`;
  }

  return `
    <div class="q-page-header">
      <h1>Importar</h1>
    </div>
    ${stepsHTML}
    ${bodyHTML}`;
}
