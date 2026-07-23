
// ── BRIDGE FUNCTIONS ─────────────────────────────────────────────────────────
// Adaptors between the new render function call signatures and the existing
// business-logic functions in the skeleton.

// wireAuthForm: no-op — new renderAuth uses inline onsubmit="handleAuth(event)"
function wireAuthForm() {}

// handleAuth: dispatches form submission to login / registerUser / recoverPassword
async function handleAuth(event) {
  event.preventDefault()
  const form = event.target
  const email = (form.querySelector('[name="email"]') || {}).value || ''
  const password = (form.querySelector('[name="password"]') || {}).value || ''
  const name = (form.querySelector('[name="name"]') || {}).value || ''
  const mode = state.authMode || 'login'

  state.authLoading = true
  state.authNotice = ''
  render()

  try {
    if (mode === 'register') {
      await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: name || null, email, password }),
      }).then(function (payload) {
        state.token = payload.token
        localStorage.setItem(STORAGE_KEYS.token, payload.token)
        writeSession({ expiresAt: payload.expiresAt || null, user: payload.user || { name: name || email } })
      })
      await loadToday(false)
    } else if (mode === 'recover') {
      await api('/api/auth/recover', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      state.authMode = 'login'
      state.authNotice = 'Email de recuperação enviado. Verifique sua caixa de entrada.'
    } else {
      await login(email, password)
    }
  } catch (err) {
    state.authNotice = err instanceof Error ? err.message : 'Falha na autenticação.'
  } finally {
    state.authLoading = false
    render()
  }
}

// loadHistory: history is already fetched inside loadToday — just refresh
async function loadHistory() {
  try {
    const data = await api('/api/history')
    state.history = Array.isArray(data) ? data : []
    render()
  } catch (err) {
    state.error = err instanceof Error ? err.message : 'Falha ao carregar histórico.'
    render()
  }
}

// handleXlsxFile: triggered by file input change
async function handleXlsxFile(e) {
  const file = e && e.target && e.target.files && e.target.files[0]
  if (!file) return
  selectImportFile(file)
  await processImportFile()
}

// handleImportConfirm: alias
async function handleImportConfirm() {
  await confirmImportFromPilot()
}

// handleCreateAsset: reads from sheet form fields, wires into saveCreateAsset
async function handleCreateAsset() {
  const ticker = (document.getElementById('qs-add-ticker') || {}).value || ''
  const name = (document.getElementById('qs-add-name') || {}).value || ''
  const institution = (document.getElementById('qs-add-inst') || {}).value || 'OUTROS'
  const assetClass = (document.getElementById('qs-add-class') || {}).value || 'RF'
  const valorRaw = (document.getElementById('qs-add-valor') || {}).value || ''
  const aplicadoRaw = (document.getElementById('qs-add-aplicado') || {}).value || ''
  const errEl = document.getElementById('qs-add-err')

  const manualBalance = parseMoneyInput(valorRaw)
  const invested = parseMoneyInput(aplicadoRaw)

  if (!name && !ticker) {
    if (errEl) { errEl.style.display = ''; errEl.textContent = 'Informe nome ou ticker.' }
    return
  }

  state.createAssetDraft = Object.assign(getEmptyCreateAssetDraft(), {
    ticker: ticker.toUpperCase(),
    name,
    institution,
    class: assetClass,
    manual_balance: manualBalance != null ? String(manualBalance) : '',
    initial_balance: invested != null ? String(invested) : '',
  })

  await saveCreateAsset()
  qCloseSheet('sheet-add-ativo')
}

// handleCreateGood: reads from bem sheet form fields
async function handleCreateGood() {
  const type = (document.getElementById('qs-bem-type') || {}).value || 'FGTS'
  const name = (document.getElementById('qs-bem-name') || {}).value || ''
  const valueRaw = (document.getElementById('qs-bem-value') || {}).value || ''
  const errEl = document.getElementById('qs-bem-err')

  const estimatedValue = parseMoneyInput(valueRaw)
  if (!name) {
    if (errEl) { errEl.style.display = ''; errEl.textContent = 'Informe um nome para o bem.' }
    return
  }

  state.createGoodDraft = Object.assign(getEmptyCreateGoodDraft(), {
    type,
    name,
    estimatedValue: estimatedValue != null ? String(estimatedValue) : '0',
  })

  await saveCreateGood()
  qCloseSheet('sheet-add-bem')
}

// handleUpdateSaldo: reads from numpad hidden field
async function handleUpdateSaldo() {
  const asset = state.detail && state.detail.asset
  if (!asset) return

  const rawEl = document.getElementById('qs-saldo-raw')
  const raw = rawEl ? rawEl.value : ''
  const manualBalance = parseMoneyInput(raw)

  if (!(manualBalance >= 0)) {
    state.detailMutationError = 'Informe um saldo válido.'
    render()
    return
  }

  state.detailMutationLoading = true
  state.detailMutationError = ''
  render()

  try {
    await api('/api/assets/' + asset.id, {
      method: 'PUT',
      body: JSON.stringify({ manual_balance: manualBalance }),
    })
    await loadToday(true)
    await loadDetail(asset.id, true)
    state.detailMutationNotice = 'Saldo atualizado.'
    qCloseSheet('sheet-atualizar-saldo')
  } catch (err) {
    state.detailMutationError = err instanceof Error ? err.message : 'Falha ao atualizar saldo.'
  } finally {
    state.detailMutationLoading = false
    render()
  }
}

// handleStartExit: triggers exit flow for asset in detail
async function handleStartExit() {
  await startExitFromDetail()
  qCloseSheet('sheet-iniciar-resgate')
}

// closeQSheet: alias for qCloseSheet (used in renderSheets action sheet)
function closeQSheet(id) {
  qCloseSheet(id)
}

// qNumpad: handles the numpad in saldo sheet
function qNumpad(key) {
  const rawEl = document.getElementById('qs-saldo-raw')
  const displayEl = document.getElementById('qs-saldo-display')
  if (!rawEl || !displayEl) return

  let raw = rawEl.value || ''

  if (key === 'backspace') {
    raw = raw.slice(0, -1)
  } else if (key === ',') {
    if (!raw.includes(',')) raw += ','
  } else {
    if (raw.includes(',') && raw.split(',')[1].length >= 2) return
    raw += key
  }

  rawEl.value = raw

  // Format for display
  const numRaw = raw.replace(',', '.')
  const n = parseFloat(numRaw)
  displayEl.textContent = isNaN(n)
    ? 'R$ 0,00'
    : 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: raw.includes(',') ? Math.min(2, (raw.split(',')[1] || '').length) : 0, maximumFractionDigits: 2 })
}
