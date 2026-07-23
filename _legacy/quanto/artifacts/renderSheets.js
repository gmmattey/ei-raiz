function renderSheets(state) {
  const activeAsset = (function () {
    const p = state && state.portfolio;
    if (!p || !state.editingAssetId) return null;
    return [...(p.assets || []), ...(p.redeeming || [])].find(function (a) {
      return a.id === state.editingAssetId;
    }) || null;
  })();

  const fmtBRL = function (v) {
    if (v == null || isNaN(v)) return 'R$ 0,00';
    return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // ── BODY: Novo ativo ──────────────────────────────────────────────────────
  const BODY_ADD_ATIVO = `
    <div class="q-sheet-field-group">
      <div class="q-sheet-field">
        <label class="q-sheet-field-label" for="qs-add-ticker">Ticker</label>
        <input class="q-sheet-field-input" id="qs-add-ticker" type="text"
               inputmode="text" autocapitalize="characters" placeholder="ex: PETR4">
      </div>
      <div class="q-sheet-field">
        <label class="q-sheet-field-label" for="qs-add-name">Nome</label>
        <input class="q-sheet-field-input" id="qs-add-name" type="text" placeholder="ex: Petrobras PN">
      </div>
      <div class="q-sheet-field">
        <label class="q-sheet-field-label" for="qs-add-inst">Instituição</label>
        <select class="q-sheet-field-select" id="qs-add-inst">
          <option value="XP">XP</option>
          <option value="ITAU">Itaú / ION</option>
          <option value="ONZE">Onze</option>
          <option value="OUTROS">Outros</option>
        </select>
      </div>
      <div class="q-sheet-field">
        <label class="q-sheet-field-label" for="qs-add-class">Classe</label>
        <select class="q-sheet-field-select" id="qs-add-class">
          <option value="ACAO">Ação</option>
          <option value="FII">FII</option>
          <option value="FUNDO">Fundo</option>
          <option value="PREVIDENCIA">Previdência</option>
          <option value="TESOURO">Tesouro</option>
          <option value="RF">Renda Fixa</option>
          <option value="POUPANCA">Poupança</option>
          <option value="COFRINHO">Cofrinho</option>
        </select>
      </div>
    </div>
    <div class="q-sheet-field-group">
      <div class="q-sheet-field">
        <label class="q-sheet-field-label" for="qs-add-valor">Valor atual</label>
        <div class="q-sheet-input-wrap">
          <span class="q-sheet-prefix">R$</span>
          <input class="q-sheet-field-input" id="qs-add-valor" type="text"
                 inputmode="decimal" placeholder="0,00">
        </div>
      </div>
      <div class="q-sheet-field">
        <label class="q-sheet-field-label" for="qs-add-aplicado">Aplicado</label>
        <div class="q-sheet-input-wrap">
          <span class="q-sheet-prefix">R$</span>
          <input class="q-sheet-field-input" id="qs-add-aplicado" type="text"
                 inputmode="decimal" placeholder="0,00">
        </div>
      </div>
    </div>
    <div class="q-sheet-hint" id="qs-add-err" style="display:none;color:var(--vinho)"></div>
    <button class="btn-primary" onclick="handleCreateAsset()">Adicionar ativo</button>
  `;

  // ── BODY: Atualizar saldo ─────────────────────────────────────────────────
  const currentBalance = activeAsset && activeAsset.balance != null ? activeAsset.balance : 0;
  const currentBalanceFmt = fmtBRL(currentBalance);

  const BODY_SALDO = `
    <div class="q-sheet-balance-hint">Valor atual: ${currentBalanceFmt}</div>
    <div class="q-sheet-amount-display" id="qs-saldo-display">R$ 0,00</div>
    <div class="q-sheet-amount-label">Novo saldo</div>
    <div class="q-sheet-numpad">
      <button class="q-numpad-key" onclick="qNumpad('1')">1</button>
      <button class="q-numpad-key" onclick="qNumpad('2')">2</button>
      <button class="q-numpad-key" onclick="qNumpad('3')">3</button>
      <button class="q-numpad-key" onclick="qNumpad('4')">4</button>
      <button class="q-numpad-key" onclick="qNumpad('5')">5</button>
      <button class="q-numpad-key" onclick="qNumpad('6')">6</button>
      <button class="q-numpad-key" onclick="qNumpad('7')">7</button>
      <button class="q-numpad-key" onclick="qNumpad('8')">8</button>
      <button class="q-numpad-key" onclick="qNumpad('9')">9</button>
      <button class="q-numpad-key q-numpad-action" onclick="qNumpad('backspace')">⌫</button>
      <button class="q-numpad-key" onclick="qNumpad('0')">0</button>
      <button class="q-numpad-key q-numpad-action" onclick="qNumpad(',')">&#44;</button>
    </div>
    <input type="hidden" id="qs-saldo-raw" value="">
    <button class="btn-primary" style="margin-top:12px" onclick="handleUpdateSaldo()">Salvar saldo</button>
  `;

  // ── BODY: Iniciar resgate (action sheet) ─────────────────────────────────
  const resgateAssetName = activeAsset ? (activeAsset.name || '') : '';

  const BODY_RESGATE = `
    <div class="q-action-group">
      <div class="q-action-header">
        <div class="q-action-header-title">Iniciar resgate${resgateAssetName ? ' — ' + resgateAssetName : ''}</div>
        <div class="q-action-header-desc">O ativo ficará em saída até a venda ser concluída.</div>
      </div>
      <button class="q-action-item q-action-destructive q-action-centered"
              onclick="handleStartExit()">Confirmar resgate</button>
    </div>
    <button class="q-action-cancel" onclick="closeQSheet('sheet-iniciar-resgate')">Cancelar</button>
  `;

  // ── BODY: Novo bem ────────────────────────────────────────────────────────
  const BODY_ADD_BEM = `
    <div class="q-sheet-field-group">
      <div class="q-sheet-field">
        <label class="q-sheet-field-label" for="qs-bem-type">Tipo</label>
        <select class="q-sheet-field-select" id="qs-bem-type">
          <option value="FGTS">FGTS</option>
          <option value="IMOVEL">Imóvel</option>
          <option value="VEICULO">Veículo</option>
        </select>
      </div>
      <div class="q-sheet-field">
        <label class="q-sheet-field-label" for="qs-bem-name">Nome</label>
        <input class="q-sheet-field-input" id="qs-bem-name" type="text"
               placeholder="ex: FGTS Empresa ABC">
      </div>
      <div class="q-sheet-field">
        <label class="q-sheet-field-label" for="qs-bem-value">Valor estimado</label>
        <div class="q-sheet-input-wrap">
          <span class="q-sheet-prefix">R$</span>
          <input class="q-sheet-field-input" id="qs-bem-value" type="text"
                 inputmode="decimal" placeholder="0,00">
        </div>
      </div>
    </div>
    <div class="q-sheet-hint" id="qs-bem-err" style="display:none;color:var(--vinho)"></div>
    <button class="btn-primary" onclick="handleCreateGood()">Adicionar bem</button>
  `;

  // ── BODY: Filtros ─────────────────────────────────────────────────────────
  const filter = (state && state.filter) || 'todos';
  const institutions = ['XP', 'ITAU', 'ONZE', 'OUTROS'];
  const instLabels = { XP: 'XP', ITAU: 'Itaú / ION', ONZE: 'Onze', OUTROS: 'Outros' };
  const classes = ['ACAO', 'FII', 'FUNDO', 'PREVIDENCIA', 'TESOURO', 'RF', 'POUPANCA', 'COFRINHO'];
  const classLabels = {
    ACAO: 'Ação', FII: 'FII', FUNDO: 'Fundo', PREVIDENCIA: 'Previdência',
    TESOURO: 'Tesouro', RF: 'Renda Fixa', POUPANCA: 'Poupança', COFRINHO: 'Cofrinho'
  };

  const instRows = institutions.map(function (k) {
    const checked = state && state._filtroInst && state._filtroInst.includes(k);
    return `<div class="q-sheet-picker-row" data-filter-inst="${k}">
      <span class="q-sheet-picker-label">${instLabels[k]}</span>
      ${checked ? `<span class="q-sheet-picker-check"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg></span>` : ''}
    </div>`;
  }).join('');

  const classRows = classes.map(function (k) {
    const checked = state && state._filtroClass && state._filtroClass.includes(k);
    return `<div class="q-sheet-picker-row" data-filter-class="${k}">
      <span class="q-sheet-picker-label">${classLabels[k]}</span>
      ${checked ? `<span class="q-sheet-picker-check"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg></span>` : ''}
    </div>`;
  }).join('');

  const BODY_FILTROS = `
    <div class="q-segment" id="qs-filtros-segment">
      <button class="q-seg-opt q-seg-active" data-seg="inst">Instituição</button>
      <button class="q-seg-opt" data-seg="class">Classe</button>
    </div>
    <div id="qs-filtros-inst-panel">
      <div class="q-sheet-picker-section-label">Instituição</div>
      <div class="q-list-card">${instRows}</div>
    </div>
    <div id="qs-filtros-class-panel" style="display:none">
      <div class="q-sheet-picker-section-label">Classe</div>
      <div class="q-list-card">${classRows}</div>
    </div>
  `;

  return [
    '<div class="q-sheet-backdrop"></div>',
    renderQSheet('sheet-add-ativo', 'Novo ativo', BODY_ADD_ATIVO, { cancelLabel: 'Cancelar', confirmLabel: 'Adicionar' }),
    renderQSheet('sheet-atualizar-saldo', 'Atualizar saldo', BODY_SALDO, { cancelLabel: 'Cancelar', confirmLabel: 'Salvar' }),
    renderQSheet('sheet-iniciar-resgate', '', BODY_RESGATE, { isAction: true }),
    renderQSheet('sheet-add-bem', 'Novo bem', BODY_ADD_BEM, { cancelLabel: 'Cancelar', confirmLabel: 'Salvar' }),
    renderQSheet('sheet-filtros', 'Filtrar', BODY_FILTROS, { cancelLabel: 'Limpar', confirmLabel: 'Aplicar' }),
  ].join('');
}
