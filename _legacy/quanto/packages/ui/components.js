export const STORAGE_KEYS = {
  theme: 'quanto-pilot-theme',
  hideValues: 'quanto-hide',
  token: 'quanto-token',
  session: 'quanto-pilot-session',
  view: 'quanto-pilot-view',
  allocationMode: 'quanto-pilot-allocation-mode',
}

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const percent = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

const dateTime = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const monthLabel = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  month: 'short',
  year: '2-digit',
})

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function formatCurrency(value, hidden = false) {
  if (hidden) return 'R$ ••••••'
  if (value == null || Number.isNaN(Number(value))) return '—'
  return currency.format(Number(value))
}

export function formatPercent(value, hidden = false) {
  if (hidden) return '•••%'
  if (value == null || Number.isNaN(Number(value))) return '—'
  const numeric = Number(value)
  const prefix = numeric > 0 ? '+' : ''
  return `${prefix}${percent.format(numeric)}%`
}

export function formatDateTime(value) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return dateTime.format(parsed)
}

export function formatMonth(value) {
  if (!value) return '—'
  if (/^\d{4}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}-01T12:00:00Z`)
    return monthLabel.format(parsed)
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return monthLabel.format(parsed)
}

export function relativeMinutes(value) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return Math.max(0, Math.round((Date.now() - parsed.getTime()) / 60000))
}

export function initials(label) {
  const parts = String(label ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return 'Q'
  return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

export function applyTheme(theme) {
  const finalTheme =
    theme === 'dark' || theme === 'light'
      ? theme
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

  document.documentElement.dataset.theme = finalTheme
  localStorage.setItem(STORAGE_KEYS.theme, finalTheme)
  return finalTheme
}

export function quoteHealthTone(status) {
  if (status === 'ok') return 'good'
  if (status === 'idle') return 'muted'
  return 'warn'
}

export function renderAllocationRows(container, slices, options = {}) {
  const total = options.total ?? 0
  const hidden = options.hidden ?? false

  if (!container) return

  if (!Array.isArray(slices) || slices.length === 0) {
    container.innerHTML = '<div class="q-empty-inline">Sem alocacao materializada ainda.</div>'
    return
  }

  container.innerHTML = slices
    .map((slice, index) => {
      const pct = slice.pct ?? (total > 0 ? (slice.total / total) * 100 : 0)
      return `
        <article class="q-allocation-row">
          <div class="q-allocation-label">
            <span class="q-dot q-dot-${(index % 6) + 1}"></span>
            <span>${escapeHtml(slice.label)}</span>
          </div>
          <div class="q-allocation-metrics">
            <strong>${formatCurrency(slice.total, hidden)}</strong>
            <span>${hidden ? '•••%' : `${percent.format(pct)}%`}</span>
          </div>
          <div class="q-allocation-bar">
            <span style="width:${Math.max(0, Math.min(100, pct))}%"></span>
          </div>
        </article>
      `
    })
    .join('')
}

export function renderHistorySparkline(container, points, hidden = false) {
  if (!container) return

  if (!Array.isArray(points) || points.length < 2) {
    container.innerHTML = '<div class="q-empty-inline">Historico basico ainda insuficiente.</div>'
    return
  }

  const ordered = [...points].slice(-6)
  const values = ordered.map((point) => Number(point.total ?? 0))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const width = 320
  const height = 88
  const pad = 10

  const coords = ordered.map((point, index) => {
    const x = pad + (index / (ordered.length - 1)) * (width - pad * 2)
    const y = height - pad - ((Number(point.total ?? 0) - min) / range) * (height - pad * 2)
    return { x, y, point }
  })

  const polyline = coords.map((coord) => `${coord.x},${coord.y}`).join(' ')
  const area = `${polyline} ${coords[coords.length - 1].x},${height - pad} ${coords[0].x},${height - pad}`

  container.innerHTML = `
    <svg class="q-sparkline" viewBox="0 0 ${width} ${height}" role="img" aria-label="Historico basico do patrimonio">
      <defs>
        <linearGradient id="qSparkGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(31, 90, 102, 0.32)"></stop>
          <stop offset="100%" stop-color="rgba(31, 90, 102, 0)"></stop>
        </linearGradient>
      </defs>
      <polygon points="${area}" fill="url(#qSparkGradient)"></polygon>
      <polyline points="${polyline}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
      ${coords
        .map(
          (coord) => `
            <circle cx="${coord.x}" cy="${coord.y}" r="4.5" fill="var(--q-surface)"></circle>
            <circle cx="${coord.x}" cy="${coord.y}" r="2.5" fill="currentColor"></circle>
          `,
        )
        .join('')}
    </svg>
    <div class="q-history-footer">
      ${ordered
        .map(
          (point) => `
            <div class="q-history-month">
              <span>${escapeHtml(formatMonth(point.month))}</span>
              <strong>${formatCurrency(point.total, hidden)}</strong>
            </div>
          `,
        )
        .join('')}
    </div>
  `
}
