
// ── renderQSheet helper ─────────────────────────────────────────────────────
function renderQSheet(id, title, bodyHtml, opts) {
  const opt = opts || {}
  const cancelLabel = opt.cancelLabel || 'Cancelar'
  const confirmLabel = opt.confirmLabel || ''
  const isAction = opt.isAction || false
  const grabber = '<div class="q-sheet-grabber-area"><div class="q-sheet-grabber"></div></div>'
  if (isAction) {
    return '<div class="q-sheet" id="' + id + '">' + grabber +
      '<div class="q-sheet-body" style="padding-bottom:max(10px,env(safe-area-inset-bottom))">' +
      bodyHtml +
      '<button class="q-action-cancel" onclick="qCloseSheet(\'' + id + '\')">Cancelar</button>' +
      '</div></div>'
  }
  return '<div class="q-sheet" id="' + id + '">' + grabber +
    '<div class="q-sheet-title-row">' +
    '<button class="q-sheet-btn cancel" onclick="qCloseSheet(\'' + id + '\')">' + cancelLabel + '</button>' +
    '<span class="q-sheet-title">' + title + '</span>' +
    '<button class="q-sheet-btn">' + confirmLabel + '</button>' +
    '</div><div class="q-sheet-body">' + bodyHtml + '</div></div>'
}

// ── State + Navigation ──────────────────────────────────────────────────────
function setState(partial) {
  Object.assign(state, partial)
  render()
}

function navigate(view) {
  const normalized = normalizeView(view)
  state.activeView = normalized
  persistView()
  if (normalized === 'bens' && state.goods === null && !state.goodsLoading) {
    void loadGoods()
  }
  if (normalized === 'historico' && state.history.length === 0) {
    void loadHistory()
  }
  render()
}

function wirePageEvents() {
  // Carteira search
  const searchInput = document.querySelector('#carteira-search')
  if (searchInput) {
    searchInput.value = state.carteiraSearchTerm || ''
    searchInput.addEventListener('input', function (e) {
      state.carteiraSearchTerm = e.target.value
      localStorage.setItem('quanto-pilot-search', state.carteiraSearchTerm)
      render()
    })
  }

  // XLSX file input
  const xlsxInput = document.getElementById('xlsx-input')
  if (xlsxInput) {
    xlsxInput.addEventListener('change', function (e) {
      handleXlsxFile(e)
    })
  }

  // Segment controls (data-segment-key / data-segment-val)
  document.querySelectorAll('[data-segment-key]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const update = {}
      update[btn.dataset.segmentKey] = btn.dataset.segmentVal
      setState(update)
    })
  })

  // Open-sheet buttons
  document.querySelectorAll('[data-open-sheet]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const sheetId = btn.dataset.openSheet
      if (sheetId) qOpenSheet(sheetId)
    })
  })
}

// ── Main render ─────────────────────────────────────────────────────────────
function render() {
  if (!state.token) {
    root.innerHTML = renderAuth(state)
    wireAuthForm()
    qInitSheets()
    return
  }

  const view = state.activeView
  let pageHtml = ''

  if (view === 'hoje') pageHtml = renderHoje(state)
  else if (view === 'carteira') pageHtml = renderCarteira(state)
  else if (view === 'historico') pageHtml = renderHistorico(state)
  else if (view === 'importar') pageHtml = renderImportar(state)
  else if (view === 'bens') pageHtml = renderBens(state)
  else if (view === 'detalhe') pageHtml = renderDetalhe(state)
  else pageHtml = renderHoje(state)

  root.innerHTML =
    '<div class="q-screen">' + pageHtml + '</div>' +
    renderNavLinks(state) +
    renderSheets(state)

  qInitSheets()
  wirePageEvents()
}
