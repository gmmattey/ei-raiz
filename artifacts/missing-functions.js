/**
 * missing-functions.js
 *
 * Functions extracted from apps/web/app.js via the StructuredOutput agent transcript
 * (wf_8ac2de81-956 / agent-a6dd83300e22dd253).
 *
 * The original prompt used the Esquilo naming conventions (wireAuthForm, handleXlsxFile,
 * handleCreateAsset, loadHistory). In apps/web/app.js those concepts map to:
 *
 *   wireAuthForm       -> bindAuth()
 *   handleAuth (login) -> login(), registerUser(), recoverPassword()
 *   handleXlsxFile     -> selectImportFile(), ensureXlsxRuntime(), parseImportWorkbook()
 *   handleCreateAsset  -> saveCreateAsset()
 *   handleUpdateSaldo  -> saveManualBalanceFromDetail()
 *   handleStartExit    -> startExitFromDetail()
 *   handleCreateGood   -> saveCreateGood()
 *   handleImportConfirm -> confirmImportFromPilot()
 *   loadHistory        -> loadToday() (loads /api/history in parallel with /api/portfolio)
 *
 * No separate loadHistory function exists; history is fetched inside loadToday() via
 * Promise.all([api('/api/portfolio'), api('/api/history')]).
 */

// =============================================================================
// AUTH FUNCTIONS
// login, registerUser, recoverPassword, logout, bindAuth (= wireAuthForm)
// =============================================================================

async function login(email, password) {
  const payload = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  state.token = payload.token
  localStorage.setItem(STORAGE_KEYS.token, payload.token)
  writeSession({
    expiresAt: payload.expiresAt || null,
    user: payload.user || null,
  })
  await loadToday(false)
}

async function registerUser({ name, email, cpf, birthDate, password }) {
  const payload = await api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: name || null,
      email,
      cpf,
      birth_date: birthDate,
      password,
    }),
  })
  state.token = payload.token
  localStorage.setItem(STORAGE_KEYS.token, payload.token)
  writeSession({
    expiresAt: payload.expiresAt || null,
    user: payload.user || { name: name || email },
  })
  await loadToday(false)
}

async function recoverPassword({ email, cpf, birthDate, newPassword }) {
  await api('/api/auth/recover', {
    method: 'POST',
    body: JSON.stringify({
      email,
      cpf,
      birth_date: birthDate,
      new_password: newPassword,
    }),
  })
}

function logout() {
  clearSession()
  render()
}

/**
 * bindAuth — equivalent of wireAuthForm in Esquilo.
 * Binds submit handlers for the login, register, and recover forms,
 * CPF input mask for register/recover, theme toggle, and demo-fill button.
 */
function bindAuth() {
  const form = document.getElementById('pilot-login-form')
  const registerForm = document.getElementById('pilot-register-form')
  const recoverForm = document.getElementById('pilot-recover-form')
  const themeToggle = document.querySelector('[data-theme-toggle]')
  const fillDemo = document.querySelector('[data-fill-demo]')
  const modeButtons = document.querySelectorAll('[data-auth-mode]')

  if (themeToggle) {
    themeToggle.addEventListener('click', () => setTheme(state.theme === 'dark' ? 'light' : 'dark'))
  }

  modeButtons.forEach((button) => {
    button.addEventListener('click', () => setAuthMode(button.getAttribute('data-auth-mode') || 'login'))
  })

  if (fillDemo) {
    fillDemo.addEventListener('click', () => {
      document.getElementById('pilot-email').value = 'giammattey.luiz@gmail.com'
      document.getElementById('pilot-password').value = 'QaTest123!'
    })
  }

  ;['pilot-register-cpf', 'pilot-recover-cpf'].forEach((id) => {
    const field = document.getElementById(id)
    if (!field) return
    field.addEventListener('input', () => {
      const digits = field.value.replace(/\D/g, '').slice(0, 11)
      if (digits.length <= 3) { field.value = digits; return }
      if (digits.length <= 6) { field.value = `${digits.slice(0, 3)}.${digits.slice(3)}`; return }
      if (digits.length <= 9) { field.value = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`; return }
      field.value = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
    })
  })

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault()
      const email = document.getElementById('pilot-email').value.trim()
      const password = document.getElementById('pilot-password').value
      if (!email || !password) {
        state.error = 'Preencha email e senha.'
        render()
        return
      }
      state.loading = true
      state.error = ''
      render()
      try {
        await login(email, password)
        state.authNotice = ''
        render()
      } catch (error) {
        state.error = error instanceof Error ? error.message : 'Falha ao entrar.'
        state.loading = false
        render()
      }
    })
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault()
      const name = document.getElementById('pilot-register-name').value.trim()
      const email = document.getElementById('pilot-register-email').value.trim()
      const cpf = document.getElementById('pilot-register-cpf').value.replace(/\D/g, '')
      const birthDate = document.getElementById('pilot-register-birth').value
      const password = document.getElementById('pilot-register-password').value
      if (!email || !password || !cpf || !birthDate) {
        state.error = 'Preencha nome, email, CPF, nascimento e senha.'
        render()
        return
      }
      if (cpf.length !== 11) {
        state.error = 'CPF inválido.'
        render()
        return
      }
      if (password.length < 6) {
        state.error = 'Senha deve ter no minimo 6 caracteres.'
        render()
        return
      }
      state.loading = true
      state.error = ''
      render()
      try {
        await registerUser({ name, email, cpf, birthDate, password })
        state.authNotice = ''
        render()
      } catch (error) {
        state.error = error instanceof Error ? error.message : 'Falha ao criar conta.'
        state.loading = false
        render()
      }
    })
  }

  if (recoverForm) {
    recoverForm.addEventListener('submit', async (event) => {
      event.preventDefault()
      const email = document.getElementById('pilot-recover-email').value.trim()
      const cpf = document.getElementById('pilot-recover-cpf').value.replace(/\D/g, '')
      const birthDate = document.getElementById('pilot-recover-birth').value
      const newPassword = document.getElementById('pilot-recover-password').value
      if (!email || !cpf || !birthDate || !newPassword) {
        state.error = 'Preencha email, CPF, nascimento e nova senha.'
        render()
        return
      }
      if (cpf.length !== 11) {
        state.error = 'CPF inválido.'
        render()
        return
      }
      if (newPassword.length < 6) {
        state.error = 'Senha deve ter no minimo 6 caracteres.'
        render()
        return
      }
      state.loading = true
      state.error = ''
      render()
      try {
        await recoverPassword({ email, cpf, birthDate, newPassword })
        state.loading = false
        setAuthMode('login', 'Senha redefinida. Entre com a nova senha.')
        const emailField = document.getElementById('pilot-email')
        if (emailField) emailField.value = email
      } catch (error) {
        state.error = error instanceof Error ? error.message : 'Falha ao redefinir senha.'
        state.loading = false
        render()
      }
    })
  }
}

// =============================================================================
// API FUNCTIONS — core fetch wrapper + loadToday (includes history loading)
// =============================================================================

/**
 * api — core fetch wrapper with 401 handling.
 * All API calls go through this function.
 */
async function api(path, init = {}) {
  const method = String(init.method || 'GET').toUpperCase()
  if (method !== 'GET' && typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('Sem conexão. Escritas continuam indisponíveis offline nesta fase.')
  }
  const response = await fetch(`${state.apiBase}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  })
  if (response.status === 401) {
    clearSession()
    state.authNotice = 'Sessao expirada. Entre novamente para continuar.'
    render()
    throw new Error('Sessao expirada. Entre novamente.')
  }
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error || 'Falha ao comunicar com a API atual.')
  }
  return payload
}

/**
 * loadToday — loads /api/portfolio AND /api/history in parallel.
 * This is the function that covers "loadHistory" — there is no separate
 * loadHistory function in apps/web/app.js.
 */
async function loadToday(quiet) {
  state.loading = true
  if (!quiet) {
    state.error = ''
    render()
  }
  try {
    const [portfolio, history] = await Promise.all([
      api('/api/portfolio'),
      api('/api/history'),
    ])
    state.portfolio = portfolio
    state.history = Array.isArray(history) ? history : []
    writeCacheEnvelope(CACHE_KEYS.today, {
      portfolio: state.portfolio,
      history: state.history,
    })
    clearRuntimeNotice()
    if (!state.session?.user && portfolio?.userName) {
      writeSession({
        expiresAt: null,
        user: {
          id: 0,
          email: state.session?.user?.email || '',
          name: portfolio.userName,
        },
      })
    }
  } catch (error) {
    const cached = readCacheEnvelope(CACHE_KEYS.today)
    if (cached?.payload?.portfolio) {
      state.portfolio = cached.payload.portfolio
      state.history = Array.isArray(cached.payload.history) ? cached.payload.history : []
      applyCachedFallback(offlineFallbackMessage('Hoje', cached.savedAt), cached.savedAt)
      if (!state.session?.user && state.portfolio?.userName) {
        writeSession({
          expiresAt: null,
          user: {
            id: 0,
            email: state.session?.user?.email || '',
            name: state.portfolio.userName,
          },
        })
      }
    } else {
      state.error = error instanceof Error ? error.message : 'Falha ao carregar o app.'
      throw error
    }
  } finally {
    state.loading = false
  }
}

// =============================================================================
// ACTION FUNCTIONS
// Covers: handleCreateAsset, handleUpdateSaldo, handleStartExit, handleCreateGood,
//         handleImportConfirm, handleXlsxFile (XLSX parsing pipeline)
// =============================================================================

function resetCreateAssetState() {
  state.createAssetOpen = false
  state.createAssetLoading = false
  state.createAssetError = ''
  state.createAssetDraft = getEmptyCreateAssetDraft()
  state.createAssetFundQuery = ''
  state.createAssetFundResults = []
  state.createAssetFundLoading = false
  state.createAssetFundError = ''
  state.createAssetSelectedFund = null
}

function openCreateAsset() {
  state.createAssetOpen = true
  state.createAssetError = ''
  state.createAssetDraft = getEmptyCreateAssetDraft()
  render()
}

function closeCreateAsset() {
  resetCreateAssetState()
  render()
}

function setCreateAssetDraftField(field, value) {
  state.createAssetDraft = { ...state.createAssetDraft, [field]: value }
  if (field === 'class') {
    const isAuto = createAssetUsesAutoQuote(value)
    const isCvm = createAssetUsesFundSearch(value)
    state.createAssetDraft = {
      ...state.createAssetDraft,
      name: isCvm ? '' : state.createAssetDraft.name,
      ticker: isAuto ? state.createAssetDraft.ticker : '',
      qty: isAuto ? state.createAssetDraft.qty : '',
      purchase_date: isAuto ? (state.createAssetDraft.purchase_date || todayInputValue()) : '',
      manual_balance: isAuto ? '' : state.createAssetDraft.manual_balance,
      initial_balance: isCvm ? state.createAssetDraft.initial_balance : '',
    }
    if (!isCvm) {
      state.createAssetFundQuery = ''
      state.createAssetFundResults = []
      state.createAssetFundLoading = false
      state.createAssetFundError = ''
      state.createAssetSelectedFund = null
    }
  }
  if (field === 'institution' && value !== 'OUTROS') {
    state.createAssetDraft = { ...state.createAssetDraft, institution_name: '' }
  }
}

function selectCreateFund(index) {
  const fund = state.createAssetFundResults[index]
  if (!fund) return
  state.createAssetSelectedFund = fund
  state.createAssetDraft = { ...state.createAssetDraft, name: fund.name }
  state.createAssetFundError = ''
  render()
}

function clearCreateFundSelection() {
  state.createAssetSelectedFund = null
  state.createAssetDraft = { ...state.createAssetDraft, name: '', initial_balance: '' }
  render()
}

// -- XLSX helpers (handleXlsxFile equivalent) --

/**
 * selectImportFile — validates and sets the file on state.
 * Equivalent to handleXlsxFile (file picker onChange handler).
 */
function selectImportFile(file) {
  resetImportState({ keepNotice: true })
  if (!file) { render(); return }
  const lowerName = String(file.name || '').toLowerCase()
  if (!(lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls'))) {
    state.importError = 'Formato não suportado. Use .xlsx ou .xls.'
    render()
    return
  }
  state.importFile = file
  state.importFileName = file.name || 'planilha.xlsx'
  state.importFileSize = Number(file.size || 0)
  render()
}

/**
 * ensureXlsxRuntime — lazy loads SheetJS from CDN/node_modules.
 */
async function ensureXlsxRuntime() {
  if (globalThis.XLSX) return globalThis.XLSX
  if (!xlsxRuntimePromise) {
    xlsxRuntimePromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-xlsx-runtime="true"]')
      if (existing) {
        existing.addEventListener('load', () => resolve(globalThis.XLSX), { once: true })
        existing.addEventListener('error', () => reject(new Error('Falha ao carregar parser de planilha.')), { once: true })
        return
      }
      const script = document.createElement('script')
      script.src = '../../node_modules/xlsx/dist/xlsx.full.min.js'
      script.async = true
      script.dataset.xlsxRuntime = 'true'
      script.addEventListener('load', () => resolve(globalThis.XLSX), { once: true })
      script.addEventListener('error', () => reject(new Error('Falha ao carregar parser de planilha.')), { once: true })
      document.head.appendChild(script)
    })
  }
  return xlsxRuntimePromise
}

/**
 * parseImportWorkbook — parses a SheetJS workbook into import item objects.
 * Recognizes sheets: Acoes/FIIs, Fundos, Previdência, Tesouro, Renda Fixa, Poupança, Cofrinhos.
 */
function parseImportWorkbook(workbook) {
  const items = []
  const SHEET_CLASSES = {
    'Acoes/FIIs': null,
    'Acoes-FIIs': null,
    Fundos: 'FUNDO',
    Previdência: 'PREVIDENCIA',
    Tesouro: 'TESOURO',
    'Renda Fixa': 'RF',
    Poupança: 'POUPANCA',
    Cofrinhos: 'COFRINHO',
  }
  for (const sheetName of workbook.SheetNames) {
    if (!(sheetName in SHEET_CLASSES)) continue
    const worksheet = workbook.Sheets[sheetName]
    const rows = globalThis.XLSX.utils.sheet_to_json(worksheet, { defval: null })
    for (const row of rows) {
      const rawName = getImportRowValue(row, ['Nome'])
      const rawTicker = getImportRowValue(row, ['Ticker'])
      if (!rawName && !rawTicker) continue
      const ticker = rawTicker ? String(rawTicker).trim().toUpperCase() : null
      const rawInstitutionName = getImportRowValue(row, ['Instituicao', 'Instituição'])
      const rawInstitution = rawInstitutionName ? String(rawInstitutionName).trim().toUpperCase() : 'OUTROS'
      const institution = ['XP', 'ITAU', 'ONZE'].includes(rawInstitution) ? rawInstitution : 'OUTROS'
      const institutionName = institution === 'OUTROS' ? (rawInstitutionName || null) : null
      const rawStatus = parseImportStatus(getImportRowValue(row, ['Situacao', 'Situação', 'Status']))
      const rawPurchaseDate = normalizeImportDate(
        getImportRowValue(row, ['Data Compra', 'Data da Compra', 'Data Aquisição', 'Data Aquisicao', 'Compra em']),
      )
      const blockingIssues = []
      const warnings = []
      const item = {
        institution,
        institutionName,
        class: parseImportClass(getImportRowValue(row, ['Classe', 'Tipo']), SHEET_CLASSES[sheetName], ticker, rawName),
        status: rawStatus.status,
        name: rawName ? String(rawName).trim() : (ticker || ''),
        ticker,
        qty: normalizeImportNumber(getImportRowValue(row, ['Quantidade'])),
        manual_balance: normalizeImportNumber(getImportRowValue(row, ['Saldo Atual'])),
        invested: normalizeImportNumber(getImportRowValue(row, ['Valor Aplicado'])),
        purchase_date: rawPurchaseDate.value,
        _status: 'ok',
        _issues: [],
        _blockingIssues: blockingIssues,
        _warnings: warnings,
        _aiClass: null,
        _aiConfidence: 0,
      }
      if (!item.name) blockingIssues.push('Nome ausente')
      if (rawStatus.issue) blockingIssues.push(rawStatus.issue)
      if (rawPurchaseDate.issue) blockingIssues.push(rawPurchaseDate.issue)
      if (item.ticker && item.qty == null) blockingIssues.push('Quantidade obrigatoria para ativo com ticker')
      if (!item.ticker && item.manual_balance == null) blockingIssues.push('Saldo atual obrigatorio para ativo sem ticker')
      if (item.invested == null) warnings.push('Valor aplicado ausente; ganho inicial pode ficar parcial.')
      if (item.ticker && !item.purchase_date) warnings.push('Data de compra ausente; aporte inicial entra com data atual.')
      item._issues = [...blockingIssues, ...warnings]
      if (blockingIssues.length > 0) item._status = 'err'
      else if (warnings.length > 0) item._status = 'warn'
      items.push(item)
    }
  }
  return items
}

function resetImportState(options = {}) {
  state.importStep = 1
  state.importFile = null
  state.importFileName = ''
  state.importFileSize = 0
  state.importItems = []
  state.importLoading = false
  state.importError = ''
  state.importSheetOpen = false
  if (!options.keepNotice) {
    state.importNotice = ''
  }
}

function setImportStep(step) {
  state.importStep = Math.max(1, Math.min(3, Number(step) || 1))
  state.importError = ''
  render()
}

function removeImportItem(index) {
  state.importItems.splice(index, 1)
  if (!state.importItems.length) {
    state.importError = 'Todos os itens foram removidos da revisao.'
    state.importStep = 1
    state.importFile = null
    state.importFileName = ''
    state.importFileSize = 0
  }
  render()
}

function continueImportReview() {
  const validItems = state.importItems.filter(isImportItemReady)
  if (!validItems.length) {
    state.importError = 'Nenhum ativo válido para seguir no import.'
    render()
    return
  }
  state.importError = ''
  state.importStep = 3
  render()
}

function clearImportNotice() {
  state.importNotice = ''
  render()
}

function openImportSheet() {
  state.importSheetOpen = true
  state.importError = ''
  render()
}

function closeImportSheet() {
  state.importSheetOpen = false
  render()
}

/**
 * processImportFile — main XLSX processing orchestrator (step 1 -> step 2).
 * Loads XLSX runtime, parses workbook, runs AI enrichment, advances wizard.
 */
async function processImportFile() {
  if (!state.importFile) {
    state.importError = 'Selecione uma planilha antes de processar.'
    render()
    return
  }
  state.importLoading = true
  state.importError = ''
  render()
  try {
    await ensureXlsxRuntime()
    const buffer = await state.importFile.arrayBuffer()
    const workbook = globalThis.XLSX.read(buffer, { type: 'array' })
    const items = parseImportWorkbook(workbook)
    if (items.length === 0) {
      throw new Error('Nenhum ativo encontrado na planilha. Verifique o formato ou baixe o template modelo.')
    }
    await enrichImportItemsWithAi(items)
    state.importItems = items
    state.importStep = 2
    state.importSheetOpen = false
  } catch (error) {
    state.importError = error instanceof Error ? error.message : 'Erro ao processar planilha.'
  } finally {
    state.importLoading = false
    render()
  }
}

/**
 * confirmImportFromPilot — step 3 confirm: sends valid items to /api/import.
 * Equivalent to handleImportConfirm.
 */
async function confirmImportFromPilot() {
  const validItems = state.importItems.filter(isImportItemReady)
  const payload = buildImportPayload(validItems)
  if (!payload.length) {
    state.importError = 'Nenhum ativo válido para importar.'
    render()
    return
  }
  state.importLoading = true
  state.importError = ''
  render()
  try {
    const result = await api('/api/import', {
      method: 'POST',
      body: JSON.stringify({ items: payload }),
    })
    resetImportState({ keepNotice: true })
    state.importNotice = `${result.created || payload.length} ativo${(result.created || payload.length) === 1 ? '' : 's'} importado${(result.created || payload.length) === 1 ? '' : 's'}.`
    await loadToday(true)
    activateView('carteira')
    return
  } catch (error) {
    state.importError = error instanceof Error ? error.message : 'Falha ao importar ativos.'
  } finally {
    state.importLoading = false
    render()
  }
}

async function enrichImportItemsWithAi(items) {
  try {
    const payload = items.slice(0, 50).map((item) => ({
      name: item.name,
      ticker: item.ticker || undefined,
      institution: item.institution || undefined,
      class: item.class || undefined,
    }))
    const data = await api('/api/import/analyze', {
      method: 'POST',
      body: JSON.stringify({ items: payload }),
    })
    const suggestions = Array.isArray(data?.suggestions) ? data.suggestions : []
    for (const suggestion of suggestions) {
      if (suggestion.index >= 0 && suggestion.index < items.length && suggestion.class) {
        items[suggestion.index]._aiClass = suggestion.class
        items[suggestion.index]._aiConfidence = suggestion.confidence || 0.5
        items[suggestion.index].class = suggestion.class
      }
    }
  } catch {
    // Mantém a classificação inferida localmente quando AI não estiver disponível.
  }
}

// -- Goods CRUD --

function resetCreateGoodState() {
  state.createGoodOpen = false
  state.createGoodLoading = false
  state.createGoodError = ''
  state.createGoodEditingId = null
  state.archiveGoodLoadingId = null
  state.createGoodDraft = getEmptyCreateGoodDraft()
}

function openCreateGood() {
  state.createGoodOpen = true
  state.createGoodError = ''
  state.createGoodEditingId = null
  state.createGoodDraft = getEmptyCreateGoodDraft()
  render()
}

function openEditGood(goodId) {
  const good = state.goods?.goods?.find((item) => item.id === Number(goodId))
  if (!good) return
  state.createGoodOpen = true
  state.createGoodLoading = false
  state.createGoodError = ''
  state.createGoodEditingId = good.id
  state.createGoodDraft = {
    type: good.type,
    name: good.name || '',
    estimatedValue: good.estimatedValue != null
      ? Number(good.estimatedValue).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '',
    employer: good.employer || '',
    propertyType: good.propertyType || 'APARTAMENTO',
    areaM2: good.areaM2 != null ? String(good.areaM2).replace('.', ',') : '',
    city: good.city || '',
    state: good.state || '',
    vehicleType: good.vehicleType || 'CARRO',
    year: good.year != null ? String(good.year) : '',
    brand: good.brand || '',
    modelName: good.modelName || '',
    isFinanced: Boolean(good.isFinanced),
    notes: good.notes || '',
  }
  render()
}

function closeCreateGood() {
  resetCreateGoodState()
  render()
}

function setCreateGoodField(field, value) {
  state.createGoodDraft = { ...state.createGoodDraft, [field]: value }
  if (field === 'type') {
    const nextType = value
    state.createGoodDraft = {
      ...state.createGoodDraft,
      employer: nextType === 'FGTS' ? state.createGoodDraft.employer : '',
      propertyType: nextType === 'IMOVEL' ? (state.createGoodDraft.propertyType || 'APARTAMENTO') : 'APARTAMENTO',
      areaM2: nextType === 'IMOVEL' ? state.createGoodDraft.areaM2 : '',
      city: nextType === 'IMOVEL' ? state.createGoodDraft.city : '',
      state: nextType === 'IMOVEL' ? state.createGoodDraft.state : '',
      vehicleType: nextType === 'VEICULO' ? (state.createGoodDraft.vehicleType || 'CARRO') : 'CARRO',
      year: nextType === 'VEICULO' ? state.createGoodDraft.year : '',
      brand: nextType === 'VEICULO' ? state.createGoodDraft.brand : '',
      modelName: nextType === 'VEICULO' ? state.createGoodDraft.modelName : '',
      isFinanced: nextType === 'IMOVEL' || nextType === 'VEICULO' ? state.createGoodDraft.isFinanced : false,
    }
  }
}

async function ensureGoodsLoaded() {
  if (state.goods || state.goodsLoading) return
  await loadGoods(false)
  if (state.activeView === 'bens') render()
}

/**
 * saveCreateGood — equivalent of handleCreateGood / handleEditGood.
 * Creates or updates a good via POST/PUT /api/goods.
 */
async function saveCreateGood() {
  const draft = state.createGoodDraft
  const isEditing = Number.isInteger(state.createGoodEditingId) && state.createGoodEditingId > 0
  const payload = {
    type: draft.type,
    name: String(draft.name || '').trim(),
    estimatedValue: parseMoneyInput(draft.estimatedValue),
    isFinanced: Boolean(draft.isFinanced),
  }
  if (!payload.name) {
    state.createGoodError = 'Informe um nome válido para o bem.'
    render()
    return
  }
  if (!(payload.estimatedValue >= 0)) {
    state.createGoodError = 'Valor estimado deve ser um numero maior ou igual a zero.'
    render()
    return
  }
  if (draft.notes.trim()) payload.notes = draft.notes.trim()
  if (draft.type === 'FGTS') {
    if (draft.employer.trim()) payload.employer = draft.employer.trim()
  }
  if (draft.type === 'IMOVEL') {
    payload.propertyType = draft.propertyType
    if (draft.areaM2.trim()) {
      const area = parseDecimalInput(draft.areaM2)
      if (!(area > 0)) {
        state.createGoodError = 'Area deve ser positiva quando informada.'
        render()
        return
      }
      payload.areaM2 = area
    }
    if (draft.city.trim()) payload.city = draft.city.trim()
    if (draft.state.trim()) {
      const uf = draft.state.trim().toUpperCase()
      if (!/^[A-Z]{2}$/.test(uf)) {
        state.createGoodError = 'UF deve ter 2 letras.'
        render()
        return
      }
      payload.state = uf
    }
  }
  if (draft.type === 'VEICULO') {
    payload.vehicleType = draft.vehicleType
    if (draft.year.trim()) {
      const year = Number(draft.year)
      if (!Number.isInteger(year) || year < 1900 || year > 2100) {
        state.createGoodError = 'Ano do veículo deve ser válido.'
        render()
        return
      }
      payload.year = year
    }
    if (draft.brand.trim()) payload.brand = draft.brand.trim()
    if (draft.modelName.trim()) payload.modelName = draft.modelName.trim()
  }
  state.createGoodLoading = true
  state.createGoodError = ''
  render()
  try {
    const nextPayload = isEditing
      ? {
          name: payload.name,
          estimatedValue: payload.estimatedValue,
          isFinanced: payload.isFinanced,
        }
      : payload
    if (payload.notes != null) nextPayload.notes = payload.notes
    if (payload.employer != null) nextPayload.employer = payload.employer
    if (payload.propertyType != null) nextPayload.propertyType = payload.propertyType
    if (payload.areaM2 != null) nextPayload.areaM2 = payload.areaM2
    if (payload.city != null) nextPayload.city = payload.city
    if (payload.state != null) nextPayload.state = payload.state
    if (payload.vehicleType != null) nextPayload.vehicleType = payload.vehicleType
    if (payload.year != null) nextPayload.year = payload.year
    if (payload.brand != null) nextPayload.brand = payload.brand
    if (payload.modelName != null) nextPayload.modelName = payload.modelName
    const created = await api(isEditing ? `/api/goods/${state.createGoodEditingId}` : '/api/goods', {
      method: isEditing ? 'PUT' : 'POST',
      body: JSON.stringify(nextPayload),
    })
    await Promise.all([loadToday(true), loadGoods(true)])
    resetCreateGoodState()
    state.importNotice = isEditing
      ? `Bem atualizado: ${created.name || payload.name}.`
      : `Bem criado: ${created.name || payload.name}.`
  } catch (error) {
    state.createGoodError = error instanceof Error
      ? error.message
      : isEditing
        ? 'Falha ao atualizar bem.'
        : 'Falha ao criar bem.'
  } finally {
    state.createGoodLoading = false
    render()
  }
}

async function archiveGood(goodId) {
  const id = Number(goodId)
  if (!(id > 0)) return
  const good = state.goods?.goods?.find((item) => item.id === id)
  if (!good) return
  if (!window.confirm(`Arquivar o bem "${good.name}"?`)) return
  state.archiveGoodLoadingId = id
  state.createGoodError = ''
  render()
  try {
    await api(`/api/goods/${id}`, { method: 'DELETE' })
    await Promise.all([loadToday(true), loadGoods(true)])
    if (state.createGoodEditingId === id) {
      resetCreateGoodState()
    }
    state.importNotice = `Bem arquivado: ${good.name}.`
  } catch (error) {
    state.createGoodError = error instanceof Error ? error.message : 'Falha ao arquivar bem.'
  } finally {
    state.archiveGoodLoadingId = null
    render()
  }
}

// -- Detail page mutations --

/**
 * saveManualBalanceFromDetail — equivalent of handleUpdateSaldo.
 */
async function saveManualBalanceFromDetail() {
  const asset = state.detail?.asset
  if (!asset || !assetAllowsManualUpdate(asset)) return
  const input = document.getElementById('detail-manual-balance')
  const raw = input?.value ?? ''
  const manualBalance = parseMoneyInput(raw)
  if (!(manualBalance > 0)) {
    state.detailMutationError = 'Informe um saldo manual válido.'
    render()
    return
  }
  state.detailMutationLoading = true
  state.detailMutationError = ''
  state.detailMutationNotice = ''
  render()
  try {
    await api(`/api/assets/${asset.id}`, {
      method: 'PUT',
      body: JSON.stringify({ manual_balance: manualBalance }),
    })
    await loadToday(true)
    await loadDetail(asset.id, true)
    state.detailAction = null
    state.detailMutationNotice = 'Saldo manual atualizado.'
  } catch (error) {
    state.detailMutationError = error instanceof Error ? error.message : 'Falha ao atualizar saldo manual.'
  } finally {
    state.detailMutationLoading = false
    render()
  }
}

async function saveAssetEditFromDetail() {
  const asset = state.detail?.asset
  if (!asset || !assetCanBeEdited(asset)) return
  const nameInput = document.getElementById('detail-edit-name')
  const investedInput = document.getElementById('detail-edit-invested')
  const nextName = String(nameInput?.value || '').trim()
  const allowsInvestedEdit = (state.detail?.contributions?.length ?? 0) === 0
  const investedRaw = investedInput?.value ?? ''
  const invested = investedRaw.trim() ? parseMoneyInput(investedRaw) : null
  if (!nextName) {
    state.detailMutationError = 'Informe um nome válido para o ativo.'
    render()
    return
  }
  if (allowsInvestedEdit && investedRaw.trim() && !(invested > 0)) {
    state.detailMutationError = 'Valor aplicado deve ser positivo quando informado.'
    render()
    return
  }
  state.detailMutationLoading = true
  state.detailMutationError = ''
  state.detailMutationNotice = ''
  render()
  try {
    const payload = { name: nextName }
    if (allowsInvestedEdit && investedRaw.trim()) payload.invested = invested
    await api(`/api/assets/${asset.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    await loadToday(true)
    await loadDetail(asset.id, true)
    state.detailAction = null
    state.detailMutationNotice = 'Ativo atualizado.'
  } catch (error) {
    state.detailMutationError = error instanceof Error ? error.message : 'Falha ao atualizar ativo.'
  } finally {
    state.detailMutationLoading = false
    render()
  }
}

async function saveContributionFromDetail() {
  const asset = state.detail?.asset
  if (!asset || !assetAllowsContribution(asset)) return
  const amountInput = document.getElementById('detail-contribution-amount')
  const dateInput = document.getElementById('detail-contribution-date')
  const qtyInput = document.getElementById('detail-contribution-qty')
  const noteInput = document.getElementById('detail-contribution-note')
  const amount = parseMoneyInput(amountInput?.value ?? '')
  const contributedDate = String(dateInput?.value || '').trim()
  const note = String(noteInput?.value || '').trim()
  const qty = qtyInput && qtyInput.value.trim() ? Number(String(qtyInput.value).replace(',', '.')) : undefined
  if (!(amount > 0)) {
    state.detailMutationError = 'Informe um valor de aporte válido.'
    render()
    return
  }
  if (!contributedDate) {
    state.detailMutationError = 'Informe a data do aporte.'
    render()
    return
  }
  if (asset.quoteSource && (!(qty > 0))) {
    state.detailMutationError = 'Quantidade e obrigatoria para este ativo.'
    render()
    return
  }
  if (!asset.quoteSource && qtyInput && qtyInput.value.trim() && !(qty > 0)) {
    state.detailMutationError = 'Quantidade deve ser positiva quando informada.'
    render()
    return
  }
  state.detailMutationLoading = true
  state.detailMutationError = ''
  state.detailMutationNotice = ''
  render()
  try {
    await api(`/api/assets/${asset.id}/contributions`, {
      method: 'POST',
      body: JSON.stringify({
        amount,
        contributedAt: runtimeDateAtStartOfDay(contributedDate),
        ...(qty ? { qty } : {}),
        ...(note ? { note } : {}),
      }),
    })
    await loadToday(true)
    await loadDetail(asset.id, true)
    state.detailAction = null
    state.detailMutationNotice = 'Aporte registrado.'
  } catch (error) {
    state.detailMutationError = error instanceof Error ? error.message : 'Falha ao registrar aporte.'
  } finally {
    state.detailMutationLoading = false
    render()
  }
}

async function deleteContributionFromDetail(cid) {
  const asset = state.detail?.asset
  if (!asset || asset.status === 'sold') return
  if (!window.confirm('Remover este aporte?')) return
  state.detailMutationLoading = true
  state.detailMutationError = ''
  state.detailMutationNotice = ''
  render()
  try {
    await api(`/api/assets/${asset.id}/contributions/${cid}`, {
      method: 'DELETE',
    })
    await loadToday(true)
    await loadDetail(asset.id, true)
    state.detailMutationNotice = 'Aporte removido.'
  } catch (error) {
    state.detailMutationError = error instanceof Error ? error.message : 'Falha ao remover aporte.'
  } finally {
    state.detailMutationLoading = false
    render()
  }
}

async function archiveAssetFromDetail() {
  const asset = state.detail?.asset
  if (!asset || !assetCanBeArchived(asset)) return
  if (!window.confirm('Arquivar este ativo? Ele será removido da carteira aberta.')) return
  state.detailMutationLoading = true
  state.detailMutationError = ''
  state.detailMutationNotice = ''
  render()
  try {
    await api(`/api/assets/${asset.id}`, { method: 'DELETE' })
    state.importNotice = 'Ativo arquivado. A carteira aberta foi recarregada.'
    state.detailAssetId = null
    state.detail = null
    state.detailAction = null
    await loadToday(true)
    activateView(state.detailOrigin || 'carteira')
    return
  } catch (error) {
    state.detailMutationError = error instanceof Error ? error.message : 'Falha ao arquivar ativo.'
  } finally {
    state.detailMutationLoading = false
    render()
  }
}

/**
 * startExitFromDetail — equivalent of handleStartExit.
 * Calls POST /api/assets/:id/exit/start.
 */
async function startExitFromDetail() {
  const asset = state.detail?.asset
  if (!asset || !assetCanStartExit(asset)) return
  state.detailMutationLoading = true
  state.detailMutationError = ''
  state.detailMutationNotice = ''
  render()
  try {
    await api(`/api/assets/${asset.id}/exit/start`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
    await loadToday(true)
    await loadDetail(asset.id, true)
    state.detailAction = null
    state.detailMutationNotice = 'Saida iniciada.'
  } catch (error) {
    state.detailMutationError = error instanceof Error ? error.message : 'Falha ao iniciar saida.'
  } finally {
    state.detailMutationLoading = false
    render()
  }
}

async function cancelExitFromDetail() {
  const asset = state.detail?.asset
  if (!asset || !assetCanCancelExit(asset)) return
  state.detailMutationLoading = true
  state.detailMutationError = ''
  state.detailMutationNotice = ''
  render()
  try {
    await api(`/api/assets/${asset.id}/exit/cancel`, {
      method: 'POST',
      body: JSON.stringify({}),
    })
    await loadToday(true)
    await loadDetail(asset.id, true)
    state.detailAction = null
    state.detailMutationNotice = 'Saida cancelada.'
  } catch (error) {
    state.detailMutationError = error instanceof Error ? error.message : 'Falha ao cancelar saida.'
  } finally {
    state.detailMutationLoading = false
    render()
  }
}

async function completeSaleFromDetail() {
  const asset = state.detail?.asset
  if (!asset || !assetCanBeSold(asset)) return
  const grossInput = document.getElementById('detail-sale-gross')
  const dateInput = document.getElementById('detail-sale-date')
  const noteInput = document.getElementById('detail-sale-note')
  const grossAmount = parseMoneyInput(grossInput?.value ?? '')
  const soldDate = String(dateInput?.value || '').trim()
  const note = String(noteInput?.value || '').trim()
  if (!(grossAmount > 0)) {
    state.detailMutationError = 'Informe um valor bruto válido para a venda.'
    render()
    return
  }
  if (!soldDate) {
    state.detailMutationError = 'Informe a data da venda.'
    render()
    return
  }
  state.detailMutationLoading = true
  state.detailMutationError = ''
  state.detailMutationNotice = ''
  render()
  try {
    await api(`/api/assets/${asset.id}/sale`, {
      method: 'POST',
      body: JSON.stringify({
        soldAt: runtimeDateAtStartOfDay(soldDate),
        grossAmount,
        ...(note ? { note } : {}),
      }),
    })
    await loadToday(true)
    await loadDetail(asset.id, true)
    state.detailAction = null
    state.detailMutationNotice = 'Venda concluida.'
  } catch (error) {
    state.detailMutationError = error instanceof Error ? error.message : 'Falha ao concluir venda.'
  } finally {
    state.detailMutationLoading = false
    render()
  }
}

/**
 * saveCreateAsset — equivalent of handleCreateAsset.
 * Validates draft and calls POST /api/assets.
 */
async function saveCreateAsset() {
  const draft = state.createAssetDraft
  const isAuto = createAssetUsesAutoQuote(draft.class)
  const isCvm = createAssetUsesFundSearch(draft.class)
  const payload = {
    institution: draft.institution,
    class: draft.class,
    name: String(draft.name || '').trim(),
  }
  if (isCvm && !state.createAssetSelectedFund) {
    state.createAssetError = 'Selecione um fundo antes de salvar.'
    render()
    return
  }
  if (isCvm) {
    payload.name = state.createAssetSelectedFund.name
    payload.cvm_cnpj = state.createAssetSelectedFund.cnpj
  }
  if (!payload.name) {
    state.createAssetError = 'Informe um nome válido para o ativo.'
    render()
    return
  }
  if (draft.institution === 'OUTROS') {
    const institutionName = String(draft.institution_name || '').trim()
    if (!institutionName) {
      state.createAssetError = 'Informe o nome da instituicao quando usar OUTROS.'
      render()
      return
    }
    payload.institution_name = institutionName
  }
  const investedRaw = String(draft.invested || '').trim()
  if (investedRaw) {
    const invested = parseMoneyInput(investedRaw)
    if (!(invested > 0)) {
      state.createAssetError = 'Valor aplicado deve ser positivo quando informado.'
      render()
      return
    }
    payload.invested = invested
  }
  if (isCvm) {
    const initialBalance = parseMoneyInput(draft.initial_balance)
    if (!(initialBalance > 0)) {
      state.createAssetError = 'Saldo atual deve ser positivo para fundo CVM.'
      render()
      return
    }
    payload.initial_balance = initialBalance
  } else if (isAuto) {
    const ticker = String(draft.ticker || '').trim().toUpperCase()
    const qty = parseDecimalInput(draft.qty)
    if (!ticker) {
      state.createAssetError = 'Ticker e obrigatorio para ativo automatico.'
      render()
      return
    }
    if (!(qty > 0)) {
      state.createAssetError = 'Quantidade deve ser positiva para ativo automatico.'
      render()
      return
    }
    payload.ticker = ticker
    payload.qty = qty
    const purchaseDate = String(draft.purchase_date || '').trim()
    if (purchaseDate) {
      payload.purchase_date = runtimeDateAtStartOfDay(purchaseDate)
    }
  } else {
    const manualBalance = parseMoneyInput(draft.manual_balance)
    if (!(manualBalance > 0)) {
      state.createAssetError = 'Saldo manual deve ser positivo para ativo sem cotação automática.'
      render()
      return
    }
    payload.manual_balance = manualBalance
  }
  state.createAssetLoading = true
  state.createAssetError = ''
  render()
  try {
    const created = await api('/api/assets', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    await loadToday(true)
    resetCreateAssetState()
    state.importNotice = `Ativo criado: ${created.name || payload.name}.`
  } catch (error) {
    state.createAssetError = error instanceof Error ? error.message : 'Falha ao criar ativo.'
  } finally {
    state.createAssetLoading = false
    render()
  }
}

async function searchCreateFunds() {
  const query = String(state.createAssetFundQuery || '').trim()
  if (query.length < 3) {
    state.createAssetFundError = 'Digite pelo menos 3 caracteres para buscar fundos.'
    render()
    return
  }
  state.createAssetFundLoading = true
  state.createAssetFundError = ''
  state.createAssetFundResults = []
  render()
  try {
    const payload = await api(`/api/funds/search?q=${encodeURIComponent(query)}`)
    state.createAssetFundResults = Array.isArray(payload?.results) ? payload.results : []
    if (!state.createAssetFundResults.length) {
      state.createAssetFundError = 'Nenhum fundo encontrado para esta busca.'
    }
  } catch (error) {
    state.createAssetFundError = error instanceof Error ? error.message : 'Falha ao buscar fundos.'
  } finally {
    state.createAssetFundLoading = false
    render()
  }
}
