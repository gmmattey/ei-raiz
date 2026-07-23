import {
  STORAGE_KEYS,
  applyTheme,
  escapeHtml,
  formatCurrency,
  formatDateTime,
  formatMonth,
  formatPercent,
  initials,
  quoteHealthTone,
  relativeMinutes,
  renderAllocationRows,
  renderHistorySparkline,
} from './runtime-ui/components.js'

const root = document.getElementById('pilot-root')

const INSTITUTION_LABELS = {
  XP: 'XP',
  ITAU: 'Itaú',
  ONZE: 'Onze',
  OUTROS: 'Outros',
}

const CLASS_LABELS = {
  ACAO: 'Ação',
  FII: 'FII',
  FUNDO: 'Fundo',
  RF: 'Renda Fixa',
  TESOURO: 'Tesouro',
  PREVIDENCIA: 'Previdência',
  POUPANCA: 'Poupança',
  COFRINHO: 'Cofrinho',
}

const IMPORT_STATUS_LABELS = {
  active: 'Ativo',
  redeeming: 'Em resgate',
}

const AUTO_ASSET_CLASSES = ['ACAO', 'FII']
const GOOD_TYPE_LABELS = { FGTS: 'FGTS', IMOVEL: 'Imóvel', VEICULO: 'Veículo' }
const PROPERTY_TYPE_LABELS = {
  APARTAMENTO: 'Apartamento',
  CASA: 'Casa',
  TERRENO: 'Terreno',
  SALA_COMERCIAL: 'Sala comercial',
}
const VEHICLE_TYPE_LABELS = {
  CARRO: 'Carro',
  MOTO: 'Moto',
  UTILITARIO: 'Utilitário',
}

const VIEW_ORDER = ['hoje', 'carteira', 'historico', 'importar', 'bens']
const SUPPORTED_VIEWS = [...VIEW_ORDER, 'detalhe']
const CACHE_KEYS = {
  today: 'quanto-pilot-cache-today',
  goods: 'quanto-pilot-cache-goods',
  detailPrefix: 'quanto-pilot-cache-detail:',
}

const VIEW_META = {
  hoje: {
    label: 'Hoje',
    stage: 'visao diaria',
    title: 'Hoje',
    subtitle: 'Resumo patrimonial do dia, com leitura imediata, frescor e contexto de mercado.',
  },
  carteira: {
    label: 'Carteira',
    stage: 'posicoes abertas',
    title: 'Carteira',
    subtitle: 'Lista de ativos abertos com busca, filtros, resgates e acesso ao detalhe.',
  },
  historico: {
    label: 'Histórico',
    stage: 'evolução',
    title: 'Histórico',
    subtitle: 'Série mensal do patrimônio, com snapshots do runtime vivo e leitura temporal consistente.',
  },
  importar: {
    label: 'Importar',
    stage: 'onboarding',
    title: 'Importar',
    subtitle: 'Wizard de importação XLSX com revisão antes de salvar e sem mudar o contrato de API.',
  },
  bens: {
    label: 'Bens',
    stage: 'patrimônio bruto',
    title: 'Bens',
    subtitle: 'FGTS, imóveis e veículos em leitura e escrita dedicadas, compondo o patrimônio bruto.',
  },
  detalhe: {
    label: 'Detalhe',
    stage: 'leitura profunda',
    title: 'Detalhe do ativo',
    subtitle: 'Leitura aprofundada do ativo, com histórico, lifecycle e contexto sobre a carteira.',
  },
}

const state = {
  apiBase: getApiBase(),
  token: localStorage.getItem(STORAGE_KEYS.token) || '',
  session: readSession(),
  authMode: 'login',
  authNotice: '',
  theme: applyTheme(localStorage.getItem(STORAGE_KEYS.theme)),
  hideValues: localStorage.getItem(STORAGE_KEYS.hideValues) === '1',
  offline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
  usingCachedData: false,
  runtimeNotice: '',
  runtimeNoticeAt: '',
  activeView: normalizeView(window.location.hash.slice(1) || localStorage.getItem(STORAGE_KEYS.view) || 'hoje'),
  allocationMode: localStorage.getItem(STORAGE_KEYS.allocationMode) === 'class' ? 'class' : 'institution',
  carteiraGroupMode: localStorage.getItem('quanto-pilot-group-mode') === 'class' ? 'class' : 'institution',
  carteiraFilter: localStorage.getItem('quanto-pilot-filter') || 'todos',
  carteiraSearchTerm: localStorage.getItem('quanto-pilot-search') || '',
  createAssetOpen: false,
  createAssetLoading: false,
  createAssetError: '',
  createAssetDraft: getEmptyCreateAssetDraft(),
  createAssetFundQuery: '',
  createAssetFundResults: [],
  createAssetFundLoading: false,
  createAssetFundError: '',
  createAssetSelectedFund: null,
  detailOrigin: 'carteira',
  loading: false,
  error: '',
  portfolio: null,
  history: [],
  importStep: 1,
  importFile: null,
  importFileName: '',
  importFileSize: 0,
  importItems: [],
  importLoading: false,
  importError: '',
  importNotice: '',
  importSheetOpen: false,
  goods: null,
  goodsLoading: false,
  goodsError: '',
  createGoodOpen: false,
  createGoodLoading: false,
  createGoodError: '',
  createGoodEditingId: null,
  archiveGoodLoadingId: null,
  createGoodDraft: getEmptyCreateGoodDraft(),
  detailAssetId: null,
  detail: null,
  detailLoading: false,
  detailError: '',
  detailHistory: [],
  detailHistoryPeriod: '6mo',
  detailHistoryLoading: false,
  detailHistoryError: '',
  detailAnalysis: null,
  detailAnalysisLoading: false,
  detailAnalysisError: '',
  detailAction: null,
  detailMutationLoading: false,
  detailMutationError: '',
  detailMutationNotice: '',
}

let xlsxRuntimePromise = null

// ─── Bottom-sheet drag engine ─────────────────────────────────────────────────

let _sheetDrag = null

function qOpenSheet(id) {
  const sheet = document.getElementById(id)
  const backdrop = document.querySelector('.q-sheet-backdrop')
  if (!sheet || !backdrop) return
  backdrop.classList.add('open')
  sheet.classList.add('open')
}

function qCloseSheet(id) {
  const backdrop = document.querySelector('.q-sheet-backdrop')
  if (backdrop) backdrop.classList.remove('open')
  const targets = id ? [document.getElementById(id)] : document.querySelectorAll('.q-sheet.open')
  targets.forEach((s) => { if (s) { s.classList.remove('open'); s.style.height = '' } })
}

function qSheetDragStart(e, grabberEl) {
  const sheet = grabberEl.closest('.q-sheet')
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  _sheetDrag = { sheet, startY: clientY, startH: sheet.offsetHeight }
  sheet.style.transition = 'none'
  e.stopPropagation()
}

function qSheetDragMove(e) {
  if (!_sheetDrag) return
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  const dy = clientY - _sheetDrag.startY
  const maxH = window.innerHeight * 0.92
  _sheetDrag.sheet.style.height = Math.max(80, Math.min(_sheetDrag.startH - dy, maxH)) + 'px'
}

function qSheetDragEnd(e) {
  if (!_sheetDrag) return
  const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY
  const dy = clientY - _sheetDrag.startY
  _sheetDrag.sheet.style.transition = ''
  if (dy > 100) {
    const s = _sheetDrag.sheet; _sheetDrag = null; qCloseSheet(); setTimeout(() => { s.style.height = '' }, 400)
  } else if (dy < -80) {
    _sheetDrag.sheet.style.height = (window.innerHeight * 0.92) + 'px'; _sheetDrag = null
  } else {
    _sheetDrag.sheet.style.height = ''; _sheetDrag = null
  }
}

function qInitSheets() {
  document.removeEventListener('mousemove', qSheetDragMove)
  document.removeEventListener('mouseup', qSheetDragEnd)
  document.removeEventListener('touchmove', qSheetDragMove)
  document.removeEventListener('touchend', qSheetDragEnd)
  document.addEventListener('mousemove', qSheetDragMove)
  document.addEventListener('mouseup', qSheetDragEnd)
  document.addEventListener('touchmove', qSheetDragMove, { passive: true })
  document.addEventListener('touchend', qSheetDragEnd)
  const bd = document.querySelector('.q-sheet-backdrop')
  if (bd) bd.onclick = () => qCloseSheet()
  document.querySelectorAll('.q-sheet-grabber-area').forEach((g) => {
    g.onmousedown = (e) => qSheetDragStart(e, g)
    g.ontouchstart = (e) => qSheetDragStart(e, g)
  })
  document.querySelectorAll('[data-open-sheet]').forEach((el) => {
    el.onclick = (e) => { e.stopPropagation(); qOpenSheet(el.dataset.openSheet) }
  })
}

// ─── End sheet drag engine ────────────────────────────────────────────────────

function todayInputValue() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

function runtimeDateAtStartOfDay(value) {
  return `${value}T00:00:00Z`
}

function getEmptyCreateAssetDraft() {
  return {
    institution: 'XP',
    institution_name: '',
    class: 'ACAO',
    name: '',
    ticker: '',
    qty: '',
    invested: '',
    manual_balance: '',
    initial_balance: '',
    purchase_date: todayInputValue(),
  }
}

function getEmptyCreateGoodDraft() {
  return {
    type: 'FGTS',
    name: '',
    estimatedValue: '',
    employer: '',
    propertyType: 'APARTAMENTO',
    areaM2: '',
    city: '',
    state: '',
    vehicleType: 'CARRO',
    year: '',
    brand: '',
    modelName: '',
    isFinanced: false,
    notes: '',
  }
}

window.addEventListener('hashchange', () => {
  state.activeView = normalizeView(window.location.hash.slice(1))
  persistView()
  render()
})

window.addEventListener('online', () => {
  state.offline = false
  if (state.usingCachedData) {
    state.runtimeNotice = 'Conexão restaurada. Atualize para sincronizar o estado vivo.'
  }
  render()
})

window.addEventListener('offline', () => {
  state.offline = true
  if (!state.runtimeNotice) {
    state.runtimeNotice = 'Sem conexão. O app tentará mostrar o último estado salvo.'
  }
  render()
})

init().catch((error) => {
  state.error = error instanceof Error ? error.message : String(error)
  render()
})

async function init() {
  void registerPilotServiceWorker()
  if (state.token) {
    await loadToday(true)
  }
  render()
}

function getApiBase() {
  const url = new URL(window.location.href)
  const param = url.searchParams.get('apiBase')
  return (param || window.location.origin).replace(/\/+$/, '')
}

function normalizeView(view) {
  return SUPPORTED_VIEWS.includes(view) ? view : 'hoje'
}

function readSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.session)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function readCacheEnvelope(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.payload ? parsed : null
  } catch {
    return null
  }
}

function writeCacheEnvelope(key, payload) {
  try {
    localStorage.setItem(key, JSON.stringify({
      savedAt: new Date().toISOString(),
      payload,
    }))
  } catch {
    // Ignore local cache failures in the pilot shell.
  }
}

function getDetailCacheKey(assetId) {
  return `${CACHE_KEYS.detailPrefix}${Number(assetId)}`
}

function patchDetailCache(assetId, patch) {
  const key = getDetailCacheKey(assetId)
  const existing = readCacheEnvelope(key)?.payload || {}
  writeCacheEnvelope(key, {
    ...existing,
    ...patch,
  })
}

function clearRuntimeNotice() {
  state.usingCachedData = false
  state.runtimeNotice = ''
  state.runtimeNoticeAt = ''
}

function applyCachedFallback(message, savedAt = '') {
  state.usingCachedData = true
  state.offline = typeof navigator !== 'undefined' ? !navigator.onLine : state.offline
  state.runtimeNotice = message
  state.runtimeNoticeAt = savedAt || ''
}

function offlineFallbackMessage(area, savedAt = '') {
  const suffix = savedAt ? ` Último estado salvo em ${formatDateTime(savedAt)}.` : ''
  return `Sem conexão. Exibindo o último estado válido de ${area}.${suffix}`
}

async function registerPilotServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  try {
    await navigator.serviceWorker.register('./sw.js', { scope: './' })
  } catch {
    // Service worker is a readiness enhancement; ignore registration failures.
  }
}

function writeSession(payload) {
  state.session = payload
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(payload))
}

function clearSession() {
  state.token = ''
  state.session = null
  state.authMode = 'login'
  state.portfolio = null
  state.history = []
  resetCreateAssetState()
  resetImportState()
  state.goods = null
  state.goodsError = ''
  state.archiveGoodLoadingId = null
  resetCreateGoodState()
  state.detailAssetId = null
  state.detail = null
  state.detailError = ''
  state.detailHistory = []
  state.detailHistoryError = ''
  state.detailAnalysis = null
  state.detailAnalysisLoading = false
  state.detailAnalysisError = ''
  state.detailAction = null
  state.detailMutationError = ''
  state.detailMutationNotice = ''
  localStorage.removeItem(STORAGE_KEYS.token)
  localStorage.removeItem(STORAGE_KEYS.session)
}

function persistView() {
  if (!VIEW_ORDER.includes(state.activeView)) return
  localStorage.setItem(STORAGE_KEYS.view, state.activeView)
  window.location.hash = `#${state.activeView}`
}

function activateView(view) {
  state.activeView = normalizeView(view)
  persistView()
  render()
}

function setAuthMode(mode, notice = '') {
  state.authMode = ['login', 'register', 'recover'].includes(mode) ? mode : 'login'
  state.authNotice = notice
  state.error = ''
  render()
}

function showEphemeralView(view) {
  state.activeView = normalizeView(view)
  render()
}

function setTheme(nextTheme) {
  state.theme = applyTheme(nextTheme)
  render()
}

function toggleHideValues() {
  state.hideValues = !state.hideValues
  localStorage.setItem(STORAGE_KEYS.hideValues, state.hideValues ? '1' : '0')
  render()
}

function setAllocationMode(mode) {
  state.allocationMode = mode === 'class' ? 'class' : 'institution'
  localStorage.setItem(STORAGE_KEYS.allocationMode, state.allocationMode)
  render()
}

function setCarteiraGroupMode(mode) {
  state.carteiraGroupMode = mode === 'class' ? 'class' : 'institution'
  state.carteiraFilter = 'todos'
  localStorage.setItem('quanto-pilot-group-mode', state.carteiraGroupMode)
  localStorage.setItem('quanto-pilot-filter', state.carteiraFilter)
  render()
}

function setCarteiraFilter(value) {
  state.carteiraFilter = value || 'todos'
  localStorage.setItem('quanto-pilot-filter', state.carteiraFilter)
  render()
}

function setCarteiraSearchTerm(value) {
  state.carteiraSearchTerm = value || ''
  localStorage.setItem('quanto-pilot-search', state.carteiraSearchTerm)
}

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

function selectImportFile(file) {
  resetImportState({ keepNotice: true })

  if (!file) {
    render()
    return
  }

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

function getImportRowValue(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
      return row[key]
    }
  }
  return null
}

function normalizeImportNumber(rawValue) {
  if (rawValue == null || rawValue === '') return null
  if (typeof rawValue === 'number') return Number.isFinite(rawValue) ? rawValue : null

  const normalized = String(rawValue)
    .trim()
    .replace(/\s/g, '')

  if (!normalized) return null

  const parsed = Number(
    normalized.includes(',')
      ? normalized.replace(/\./g, '').replace(',', '.')
      : normalized,
  )

  return Number.isFinite(parsed) ? parsed : null
}

function normalizeImportDate(rawValue) {
  if (rawValue == null || rawValue === '') return { value: null, issue: null }

  if (typeof rawValue === 'number' && globalThis.XLSX?.SSF?.parse_date_code) {
    const parts = globalThis.XLSX.SSF.parse_date_code(rawValue)
    if (!parts?.y || !parts?.m || !parts?.d) return { value: null, issue: 'Data de compra inválida' }
    const parsed = new Date(Date.UTC(parts.y, parts.m - 1, parts.d, 12, 0, 0))
    return parsed.getTime() > Date.now()
      ? { value: null, issue: 'Data de compra não pode ficar no futuro' }
      : { value: parsed.toISOString(), issue: null }
  }

  const text = String(rawValue).trim()
  if (!text) return { value: null, issue: null }

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const parsed = new Date(Date.UTC(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]), 12, 0, 0))
    return parsed.getTime() > Date.now()
      ? { value: null, issue: 'Data de compra não pode ficar no futuro' }
      : { value: parsed.toISOString(), issue: null }
  }

  const brMatch = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/)
  if (brMatch) {
    const parsed = new Date(Date.UTC(Number(brMatch[3]), Number(brMatch[2]) - 1, Number(brMatch[1]), 12, 0, 0))
    if (Number.isNaN(parsed.getTime())) return { value: null, issue: 'Data de compra inválida' }
    return parsed.getTime() > Date.now()
      ? { value: null, issue: 'Data de compra não pode ficar no futuro' }
      : { value: parsed.toISOString(), issue: null }
  }

  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) return { value: null, issue: 'Data de compra inválida' }

  const normalized = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate(), 12, 0, 0))
  return normalized.getTime() > Date.now()
    ? { value: null, issue: 'Data de compra nao pode ficar no futuro' }
    : { value: normalized.toISOString(), issue: null }
}

function parseImportStatus(rawValue) {
  if (rawValue == null || rawValue === '') {
    return { status: 'active', issue: null }
  }

  const raw = String(rawValue).trim().toUpperCase()
  if (!raw) return { status: 'active', issue: null }
  if (raw === 'ACTIVE' || raw === 'ATIVO') return { status: 'active', issue: null }
  if (raw === 'REDEEMING' || raw === 'EM RESGATE' || raw === 'RESGATE' || raw === 'RESGATANDO') {
    return { status: 'redeeming', issue: null }
  }
  if (raw === 'ARCHIVED' || raw === 'ARQUIVADO' || raw === 'SOLD' || raw === 'VENDIDO') {
    return { status: 'active', issue: 'Situação não suportada no import' }
  }
  return { status: 'active', issue: 'Situação inválida' }
}

function parseImportClass(rawValue, fallbackSheetClass, ticker, name) {
  const raw = rawValue ? String(rawValue).trim().toUpperCase() : ''
  if (raw === 'FII' || raw === 'FIIS') return 'FII'
  if (raw === 'ACAO' || raw === 'ACAOES' || raw === 'ACOES' || raw === 'AÇÃO' || raw === 'AÇÕES' || raw === 'BDR') {
    return 'ACAO'
  }
  if (fallbackSheetClass) return fallbackSheetClass

  const tickerValue = ticker || ''
  const nameValue = String(name || '').toUpperCase()
  if (nameValue.includes('FII') || nameValue.includes('FUNDO IMOB')) return 'FII'
  if (/^[A-Z]{4}11$/.test(tickerValue)) return 'FII'
  return 'ACAO'
}

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

function isImportItemReady(item) {
  return item?._status === 'ok' || item?._status === 'warn'
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

function buildImportPayload(items) {
  return items.map((item) => {
    const clean = {
      institution: item.institution,
      class: item.class,
      name: item.name,
      status: item.status || 'active',
    }

    if (item.institutionName) clean.institution_name = item.institutionName
    if (item.ticker) {
      clean.ticker = item.ticker
      if (item.qty != null) clean.qty = item.qty
    } else if (item.manual_balance != null) {
      clean.manual_balance = item.manual_balance
    }
    if (item.invested != null) clean.invested = item.invested
    if (item.purchase_date) clean.purchase_date = item.purchase_date
    return clean
  })
}

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

async function loadGoods(quiet = false) {
  state.goodsLoading = true
  if (!quiet) {
    state.goodsError = ''
    render()
  }

  try {
    state.goods = await api('/api/goods')
    writeCacheEnvelope(CACHE_KEYS.goods, state.goods)
    clearRuntimeNotice()
  } catch (error) {
    const cached = readCacheEnvelope(CACHE_KEYS.goods)
    if (cached?.payload?.goods) {
      state.goods = cached.payload
      applyCachedFallback(offlineFallbackMessage('Bens', cached.savedAt), cached.savedAt)
      state.goodsError = ''
    } else {
      state.goodsError = error instanceof Error ? error.message : 'Falha ao carregar bens.'
    }
  } finally {
    state.goodsLoading = false
  }
}

async function ensureGoodsLoaded() {
  if (state.goods || state.goodsLoading) return
  await loadGoods(false)
  if (state.activeView === 'bens') render()
}

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
  state.createGoodDraft = {
    ...state.createGoodDraft,
    [field]: value,
  }

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

async function loadDetail(assetId, quiet = false) {
  state.detailAssetId = Number(assetId)
  state.detailLoading = true
  state.detailError = ''
  state.detail = null
  state.detailHistory = []
  state.detailHistoryError = ''
  state.detailAnalysis = null
  state.detailAnalysisLoading = false
  state.detailAnalysisError = ''
  state.detailAction = null
  state.detailMutationError = ''
  state.detailMutationNotice = ''

  if (!quiet) render()

  try {
    state.detail = await api(`/api/assets/${state.detailAssetId}/detail`)
    await loadDetailHistory(state.detailAssetId, state.detailHistoryPeriod, true)
    patchDetailCache(state.detailAssetId, {
      detail: state.detail,
      history: state.detailHistory,
    })
    clearRuntimeNotice()
    void loadDetailAnalysis(state.detailAssetId, true)
  } catch (error) {
    const cached = readCacheEnvelope(getDetailCacheKey(state.detailAssetId))
    if (cached?.payload?.detail) {
      state.detail = cached.payload.detail
      state.detailHistory = Array.isArray(cached.payload.history) ? cached.payload.history : []
      state.detailAnalysis = cached.payload.analysis || null
      applyCachedFallback(offlineFallbackMessage('Detalhe', cached.savedAt), cached.savedAt)
      state.detailError = ''
      state.detailHistoryError = ''
      state.detailAnalysisError = ''
    } else {
      state.detailError = error instanceof Error ? error.message : 'Falha ao carregar detalhe do ativo.'
    }
  } finally {
    state.detailLoading = false
  }
}

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
  state.createAssetDraft = {
    ...state.createAssetDraft,
    [field]: value,
  }

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
    state.createAssetDraft = {
      ...state.createAssetDraft,
      institution_name: '',
    }
  }
}

function parseDecimalInput(value) {
  const normalized = String(value || '')
    .trim()
    .replace(/\s/g, '')
    .replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function createAssetUsesAutoQuote(assetClass) {
  return AUTO_ASSET_CLASSES.includes(assetClass)
}

function createAssetUsesFundSearch(assetClass) {
  return assetClass === 'FUNDO'
}

function selectCreateFund(index) {
  const fund = state.createAssetFundResults[index]
  if (!fund) return

  state.createAssetSelectedFund = fund
  state.createAssetDraft = {
    ...state.createAssetDraft,
    name: fund.name,
  }
  state.createAssetFundError = ''
  render()
}

function clearCreateFundSelection() {
  state.createAssetSelectedFund = null
  state.createAssetDraft = {
    ...state.createAssetDraft,
    name: '',
    initial_balance: '',
  }
  render()
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

function parseMoneyInput(value) {
  const normalized = String(value || '')
    .trim()
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function assetAllowsManualUpdate(asset) {
  return Boolean(asset && asset.quoteSource == null && asset.status !== 'sold')
}

function assetAllowsContribution(asset) {
  return Boolean(asset && ['ACAO', 'FII', 'FUNDO', 'RF', 'TESOURO'].includes(asset.class) && asset.status !== 'sold')
}

function assetCanBeEdited(asset) {
  return Boolean(asset && asset.status !== 'sold')
}

function assetCanBeArchived(asset) {
  return Boolean(asset)
}

function assetSupportsExitFlow(asset) {
  return Boolean(asset && ['ACAO', 'FII'].includes(asset.class))
}

function assetCanStartExit(asset) {
  return Boolean(assetSupportsExitFlow(asset) && asset.status === 'active')
}

function assetCanCancelExit(asset) {
  return Boolean(assetSupportsExitFlow(asset) && asset.status === 'redeeming')
}

function assetCanBeSold(asset) {
  return Boolean(assetSupportsExitFlow(asset) && ['active', 'redeeming'].includes(asset.status))
}

function openDetailAction(action) {
  state.detailAction = action
  state.detailMutationError = ''
  state.detailMutationNotice = ''
  render()
}

function closeDetailAction() {
  state.detailAction = null
  state.detailMutationError = ''
  render()
}

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

  if (!window.confirm('Arquivar este ativo? Ele será removido da carteira aberta.')) {
    return
  }

  state.detailMutationLoading = true
  state.detailMutationError = ''
  state.detailMutationNotice = ''
  render()

  try {
    await api(`/api/assets/${asset.id}`, {
      method: 'DELETE',
    })
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

async function loadDetailHistory(assetId, period = '6mo', quiet = false) {
  state.detailHistoryPeriod = period
  state.detailHistoryLoading = true
  state.detailHistoryError = ''
  if (!quiet && state.activeView === 'detalhe') render()

  try {
    const payload = await api(`/api/assets/${assetId}/history?period=${period}`)
    state.detailHistory = Array.isArray(payload?.dataPoints) ? payload.dataPoints : []
    patchDetailCache(assetId, { history: state.detailHistory })
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : 'Histórico de cotação indisponível.'
    const cached = readCacheEnvelope(getDetailCacheKey(assetId))
    if (Array.isArray(cached?.payload?.history) && cached.payload.history.length) {
      state.detailHistory = cached.payload.history
      state.detailHistoryError = ''
      applyCachedFallback(offlineFallbackMessage('Historico do detalhe', cached.savedAt), cached.savedAt)
    } else {
      state.detailHistory = []
      state.detailHistoryError =
        rawMessage === 'Failed to fetch history'
          ? 'Histórico de cotação indisponível no provider agora.'
          : rawMessage === 'History not available for this asset type'
            ? 'Histórico de cotação indisponível para este tipo de ativo.'
            : rawMessage
    }
  } finally {
    state.detailHistoryLoading = false
  }
}

async function loadDetailAnalysis(assetId, quiet = false) {
  const requestedAssetId = Number(assetId)
  if (!requestedAssetId) return

  state.detailAnalysisLoading = true
  state.detailAnalysisError = ''
  if (!quiet && state.activeView === 'detalhe') render()

  try {
    const payload = await api('/api/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({
        context: 'asset',
        asset_id: requestedAssetId,
      }),
    })

    if (requestedAssetId !== state.detailAssetId) return

    state.detailAnalysis = {
      observations: Array.isArray(payload?.observations) ? payload.observations : [],
      disclaimer: payload?.disclaimer || '',
      generatedAt: payload?.generated_at || null,
    }
    patchDetailCache(requestedAssetId, {
      analysis: state.detailAnalysis,
    })
  } catch (error) {
    if (requestedAssetId !== state.detailAssetId) return

    const rawMessage = error instanceof Error ? error.message : 'Análise indisponível no momento.'
    const cached = readCacheEnvelope(getDetailCacheKey(requestedAssetId))
    if (cached?.payload?.analysis) {
      state.detailAnalysis = cached.payload.analysis
      state.detailAnalysisError = ''
      applyCachedFallback(offlineFallbackMessage('Análise contextual', cached.savedAt), cached.savedAt)
    } else {
      state.detailAnalysis = null
      state.detailAnalysisError =
        rawMessage === 'AI service not available'
          ? 'Análise contextual indisponível neste ambiente agora.'
          : rawMessage === 'Internal server error'
            ? 'Análise contextual indisponível no momento.'
            : rawMessage
    }
  } finally {
    if (requestedAssetId !== state.detailAssetId) return
    state.detailAnalysisLoading = false
    if (state.activeView === 'detalhe') render()
  }
}

function logout() {
  clearSession()
  render()
}




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


function renderAuth(state) {
  const mode = state.authMode || 'login';
  const notice = state.authNotice || '';
  const loading = state.authLoading || false;

  const brandMark = `<svg viewBox="0 0 28 28" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><path d="M14 3a11 11 0 1 0 8 18.9"/><rect x="18" y="16" width="3" height="5" rx="1" fill="#fff"/><rect x="22" y="13" width="3" height="8" rx="1" fill="#fff"/></svg>`;

  const brand = `
    <div class="q-auth-brand">
      <div class="q-auth-mark">${brandMark}</div>
      <div>
        <div class="q-auth-wordmark">Quanto.</div>
        <div class="q-auth-tagline">Quanto você tem, de fato.</div>
      </div>
    </div>`;

  const errorHtml = notice
    ? `<div class="q-auth-error">${notice}</div>`
    : '';

  let title, subtitle, fields, btnLabel, links;

  if (mode === 'register') {
    title = 'Criar conta';
    subtitle = 'Crie sua carteira consolidada.';
    fields = `
      <div class="q-field-row">
        <div class="q-field-label">Nome</div>
        <input class="q-field-input" type="text" name="name" placeholder="Seu nome" autocomplete="name" required />
      </div>
      <div class="q-field-row">
        <div class="q-field-label">Email</div>
        <input class="q-field-input" type="email" name="email" placeholder="seu@email.com" autocomplete="email" required />
      </div>
      <div class="q-field-row">
        <div class="q-field-label">Senha</div>
        <input class="q-field-input" type="password" name="password" placeholder="••••••••" autocomplete="new-password" required />
      </div>`;
    btnLabel = loading ? 'Criando...' : 'Criar conta';
    links = `
      <div class="q-auth-link" onclick="setState({authMode:'login'})">Já tenho conta</div>`;
  } else if (mode === 'recover') {
    title = 'Recuperar acesso';
    subtitle = 'Enviaremos um link para seu email.';
    fields = `
      <div class="q-field-row">
        <div class="q-field-label">Email</div>
        <input class="q-field-input" type="email" name="email" placeholder="seu@email.com" autocomplete="email" required />
      </div>`;
    btnLabel = loading ? 'Enviando...' : 'Recuperar acesso';
    links = `
      <div class="q-auth-link" onclick="setState({authMode:'login'})">Voltar ao login</div>`;
  } else {
    title = 'Entrar';
    subtitle = 'Acesse sua carteira consolidada.';
    fields = `
      <div class="q-field-row">
        <div class="q-field-label">Email</div>
        <input class="q-field-input" type="email" name="email" placeholder="seu@email.com" autocomplete="email" required />
      </div>
      <div class="q-field-row">
        <div class="q-field-label">Senha</div>
        <input class="q-field-input" type="password" name="password" placeholder="••••••••" autocomplete="current-password" required />
      </div>`;
    btnLabel = loading ? 'Entrando...' : 'Entrar';
    links = `
      <div class="q-auth-link" onclick="setState({authMode:'register'})">Criar conta</div>
      <div class="q-auth-link" style="color:#8e8e93;font-weight:400" onclick="setState({authMode:'recover'})">Esqueci minha senha</div>`;
  }

  return `
    <div class="q-auth-wrap">
      ${brand}
      <div class="q-form-title">${title}</div>
      <div class="q-form-sub">${subtitle}</div>
      ${errorHtml}
      <form id="auth-form" onsubmit="handleAuth(event)">
        <div class="q-field-group">
          ${fields}
        </div>
        <button type="submit" class="q-btn-primary" ${loading ? 'disabled' : ''}>${btnLabel}</button>
      </form>
      <div class="q-auth-links">
        ${links}
      </div>
    </div>`;
}


function renderNavLinks(state) {
  const tabs = [
    {
      view: 'hoje',
      label: 'Hoje',
      svgContent: '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'
    },
    {
      view: 'carteira',
      label: 'Carteira',
      svgContent: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>'
    },
    {
      view: 'historico',
      label: 'Histórico',
      svgContent: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>'
    },
    {
      view: 'importar',
      label: 'Importar',
      svgContent: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'
    },
    {
      view: 'bens',
      label: 'Bens',
      svgContent: '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><line x1="9" y1="22" x2="9" y2="12"/><line x1="15" y1="22" x2="15" y2="16"/>'
    }
  ];

  const buttons = tabs.map(({ view, label, svgContent }) => {
    const active = state.activeView === view;
    const strokeWidth = active ? 2 : 1.6;
    return `<button class="q-nav-item${active ? ' active' : ''}" onclick="navigate('${view}')">` +
      `<svg class="q-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${svgContent}</svg>` +
      `<span class="q-nav-label">${label}</span>` +
      `</button>`;
  });

  return `<nav class="q-tab-bar">${buttons.join('')}</nav>`;
}


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
