const API_CONFIG = Object.freeze({
  baseUrl: readMeta('esquilo-api-base-url'),
  token: readMeta('esquilo-api-token'),
  timeoutMs: Number(readMeta('esquilo-api-timeout-ms') || 20000)
});

const STATE = {
  dashboardPayload: null,
  aiAnalysis: '',
  charts: {
    performance: null,
    allocation: null
  },
  ui: {
    ghostMode: false,
    activeSection: 'actions',
    activePeriod: 'week',
    actionSearch: ''
  }
};

const SELECTORS = Object.freeze({
  toast: '[data-role="toast"]',
  toastTitle: '[data-role="toast-title"]',
  toastMessage: '[data-role="toast-message"]',
  updatedAt: '[data-role="updated-at"]',
  heroSubtitle: '[data-bind="hero-subtitle"]',
  totalValue: '[data-bind="total-value"]',
  investedValue: '[data-bind="invested-value"]',
  totalPerformance: '[data-bind="total-performance"]',
  profileLabel: '[data-bind="profile-label"]',
  scoreLabel: '[data-bind="score-label"]',
  statusChip: '[data-bind="status-chip"]',
  heroMessage: '[data-bind="hero-message"]',
  focusTitle: '[data-bind="focus-title"]',
  focusText: '[data-bind="focus-text"]',
  primaryActionTitle: '[data-bind="primary-action-title"]',
  primaryActionReason: '[data-bind="primary-action-reason"]',
  actionsTotal: '[data-bind="actions-total"]',
  actionsSupport: '[data-bind="actions-support"]',
  fundsTotal: '[data-bind="funds-total"]',
  fundsSupport: '[data-bind="funds-support"]',
  pensionTotal: '[data-bind="pension-total"]',
  pensionSupport: '[data-bind="pension-support"]',
  distributionLegend: '[data-bind="distribution-legend"]',
  insightTitle: '[data-bind="insight-title"]',
  insightText: '[data-bind="insight-text"]',
  insightList: '[data-bind="insight-list"]',
  nextStepTitle: '[data-bind="next-step-title"]',
  nextStepText: '[data-bind="next-step-text"]',
  nextStepTags: '[data-bind="next-step-tags"]',
  actionsTable: '[data-bind="actions-table"]',
  fundsTable: '[data-bind="funds-table"]',
  pensionTable: '[data-bind="pension-table"]'
});

const DOM = {
  body: document.body,
  performanceChart: document.getElementById('performanceChart'),
  allocationChart: document.getElementById('allocationChart')
};

const FRIENDLY_MODAL_ID = 'friendly-fallback-modal';

function readMeta(name) {
  const element = document.querySelector(`meta[name="${name}"]`);
  return element ? String(element.getAttribute('content') || '').trim() : '';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function parseNumeric(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^0-9.-]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatMoney(value) {
  const numeric = parseNumeric(value);
  return numeric.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatPercent(value) {
  const numeric = typeof value === 'number' ? value : parseNumeric(value);
  return `${(numeric * 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  })}%`;
}

function formatDateTime(value) {
  if (!value) return 'Agora há pouco';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Agora há pouco';

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function statusTone(label) {
  const text = String(label || '').toLowerCase();
  if (/forte|ok|saudavel|positivo|manter/.test(text)) return 'success';
  if (/aten|insta|monitor|revis/.test(text)) return 'warning';
  if (/crit|reduz|vender|risco/.test(text)) return 'danger';
  return 'default';
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.textContent = value;
}

function setHtml(selector, value) {
  const element = document.querySelector(selector);
  if (element) element.innerHTML = value;
}

function showToast(title, message) {
  const toast = document.querySelector(SELECTORS.toast);
  const toastTitle = document.querySelector(SELECTORS.toastTitle);
  const toastMessage = document.querySelector(SELECTORS.toastMessage);
  if (!toast || !toastTitle || !toastMessage) return;

  toastTitle.textContent = title;
  toastMessage.textContent = message;
  toast.hidden = false;

  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => {
    toast.hidden = true;
  }, 3600);
}

function ensureFriendlyModal() {
  if (document.getElementById(FRIENDLY_MODAL_ID)) {
    return document.getElementById(FRIENDLY_MODAL_ID);
  }

  const style = document.createElement('style');
  style.textContent = `
    .friendly-modal {
      position: fixed;
      inset: 0;
      z-index: 30;
      display: grid;
      place-items: center;
      padding: 20px;
      background: rgba(17, 18, 23, 0.42);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
    .friendly-modal[hidden] { display: none !important; }
    .friendly-modal__card {
      width: min(100%, 440px);
      padding: 24px;
      border-radius: 26px;
      background: rgba(255,255,255,0.96);
      border: 1px solid rgba(255,255,255,0.98);
      box-shadow: 0 24px 60px rgba(52, 56, 94, 0.22);
    }
    .friendly-modal__eyebrow {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      padding: 0 10px;
      border-radius: 999px;
      background: rgba(240, 163, 71, 0.12);
      color: #db8526;
      font-size: 0.74rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .friendly-modal__title {
      margin: 16px 0 10px;
      font-size: 1.32rem;
      line-height: 1.2;
      letter-spacing: -0.03em;
      color: #17171d;
    }
    .friendly-modal__message {
      margin: 0;
      font-size: 0.95rem;
      line-height: 1.72;
      color: #494d5f;
    }
    .friendly-modal__actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 22px;
      flex-wrap: wrap;
    }
    .friendly-modal__button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      padding: 0 16px;
      border-radius: 16px;
      font-weight: 700;
      cursor: pointer;
      transition: transform 180ms ease, background 180ms ease;
    }
    .friendly-modal__button:hover { transform: translateY(-1px); }
    .friendly-modal__button--primary {
      color: #fff;
      background: linear-gradient(135deg, #3774f4 0%, #245ee2 100%);
    }
    .friendly-modal__button--secondary {
      color: #17171d;
      background: rgba(255,255,255,0.88);
      border: 1px solid rgba(94, 104, 142, 0.12);
    }
  `;
  document.head.appendChild(style);

  const modal = document.createElement('aside');
  modal.id = FRIENDLY_MODAL_ID;
  modal.className = 'friendly-modal';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="friendly-modal__card" role="dialog" aria-modal="true" aria-labelledby="friendly-modal-title">
      <span class="friendly-modal__eyebrow">Esquilo</span>
      <h2 class="friendly-modal__title" id="friendly-modal-title"></h2>
      <p class="friendly-modal__message"></p>
      <div class="friendly-modal__actions">
        <button class="friendly-modal__button friendly-modal__button--secondary" type="button" data-modal-close>Fechar</button>
        <button class="friendly-modal__button friendly-modal__button--primary" type="button" data-modal-primary>Entendi</button>
      </div>
    </div>
  `;

  modal.addEventListener('click', (event) => {
    if (event.target === modal || event.target.closest('[data-modal-close]')) {
      closeFriendlyModal();
    }
  });

  modal.querySelector('[data-modal-primary]')?.addEventListener('click', () => {
    const callback = modal._primaryCallback;
    closeFriendlyModal();
    if (typeof callback === 'function') callback();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) {
      closeFriendlyModal();
    }
  });

  document.body.appendChild(modal);
  return modal;
}

function openFriendlyModal(options = {}) {
  const modal = ensureFriendlyModal();
  const title = options.title || 'Essa parte ainda não entrou do jeito certo';
  const message = options.message || 'A estrutura já está pronta, mas essa ação ainda depende de uma etapa de integração.';
  const primaryLabel = options.primaryLabel || 'Entendi';
  const primaryButton = modal.querySelector('[data-modal-primary]');

  modal.querySelector('.friendly-modal__title').textContent = title;
  modal.querySelector('.friendly-modal__message').textContent = message;
  if (primaryButton) primaryButton.textContent = primaryLabel;
  modal._primaryCallback = options.onPrimary || null;
  modal.hidden = false;
}

function closeFriendlyModal() {
  const modal = document.getElementById(FRIENDLY_MODAL_ID);
  if (modal) {
    modal.hidden = true;
    modal._primaryCallback = null;
  }
}

function openFutureFeatureModal(label) {
  openFriendlyModal({
    title: label || 'Essa parte ainda está em evolução',
    message: 'O desenho dessa ação já está previsto. O que falta agora é ligar a camada final de backend para ela funcionar do começo ao fim.'
  });
}

function openBackendIssueModal(error, actionLabel) {
  openFriendlyModal({
    title: actionLabel || 'Não deu para concluir agora',
    message: error?.message || 'A tela está pronta, mas a resposta do backend não veio como esperado nesta tentativa.'
  });
}

function buildApiUrl(resource, extraParams = {}) {
  if (!API_CONFIG.baseUrl) {
    throw new Error('A URL da API ainda não foi configurada.');
  }

  const url = new URL(API_CONFIG.baseUrl);
  url.searchParams.set('format', 'json');
  url.searchParams.set('resource', resource);

  if (API_CONFIG.token) {
    url.searchParams.set('token', API_CONFIG.token);
  }

  Object.entries(extraParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

async function fetchJson(resource, extraParams = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);

  try {
    const response = await fetch(buildApiUrl(resource, extraParams), {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });

    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload?.error || 'A API respondeu com erro.');
    }

    if (payload && payload.ok === false) {
      throw new Error(payload.error || 'A API respondeu sem sucesso.');
    }

    return payload;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('A chamada demorou mais do que o esperado.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function getDashboardData() {
  return isPlainObject(STATE.dashboardPayload?.data) ? STATE.dashboardPayload.data : {};
}

function getSummary() {
  return isPlainObject(getDashboardData().summary) ? getDashboardData().summary : {};
}

function getActions() {
  return toArray(getDashboardData().actions);
}

function getFunds() {
  return toArray(getDashboardData().investments);
}

function getPension() {
  return toArray(getDashboardData().previdencias);
}

function getSnapshots() {
  return toArray(getDashboardData().categorySnapshots);
}

function getScore() {
  return isPlainObject(getDashboardData().score) ? getDashboardData().score : {};
}

function getMessaging() {
  return isPlainObject(getDashboardData().messaging) ? getDashboardData().messaging : {};
}

function getActionPlan() {
  return isPlainObject(getDashboardData().actionPlan) ? getDashboardData().actionPlan : {};
}

function getProfile() {
  return isPlainObject(getDashboardData().profile) ? getDashboardData().profile : {};
}

function getInsights() {
  const mobileHome = isPlainObject(getDashboardData().mobileHome) ? getDashboardData().mobileHome : {};
  return toArray(mobileHome.insights);
}

function getPrimaryReadingText() {
  const messaging = getMessaging();
  const executive = isPlainObject(messaging.executiveSummary) ? messaging.executiveSummary : {};
  const recommendation = isPlainObject(messaging.primaryRecommendation) ? messaging.primaryRecommendation : {};
  const generalAdvice = String(getDashboardData().generalAdvice || '').trim();

  return executive.statusText || recommendation.reason || generalAdvice.split('\n')[0] || 'Sua carteira está pronta para leitura.';
}

function createBadge(text, tone = 'default') {
  return `<span class="badge-soft ${tone}">${escapeHtml(text)}</span>`;
}

function buildLegendHtml(snapshots) {
  return snapshots.map((item) => `
    <article class="distribution-legend-item">
      <div class="distribution-legend-item__label">
        <i class="distribution-legend-item__dot" style="background:${escapeHtml(item.color || '#3774f4')}"></i>
        <div>
          <strong>${escapeHtml(item.label || 'Categoria')}</strong>
          <span>${escapeHtml(item.status || 'Sem leitura')}</span>
        </div>
      </div>
      <span>${escapeHtml(item.shareLabel || '0,0%')}</span>
    </article>
  `).join('');
}

function buildInsightListHtml(insights) {
  if (!insights.length) {
    return `
      <article class="insight-list-item">
        <strong>Nada fora do normal</strong>
        <span>Sua carteira não trouxe um alerta forte além do que já aparece na leitura principal.</span>
      </article>
    `;
  }

  return insights.slice(0, 3).map((item) => `
    <article class="insight-list-item">
      <strong>${escapeHtml(item.title || 'Leitura')}</strong>
      <span>${escapeHtml(item.body || '')}</span>
    </article>
  `).join('');
}

function buildTagsHtml(actionPlan, messaging) {
  const tags = [];
  if (actionPlan.prioridade) tags.push(createBadge(`Prioridade ${actionPlan.prioridade}`, statusTone(actionPlan.prioridade)));
  if (actionPlan.context?.focusCategory) tags.push(createBadge(actionPlan.context.focusCategory));
  if (messaging?.executiveSummary?.scoreStatusText) {
    tags.push(createBadge(messaging.executiveSummary.scoreStatusText, statusTone(messaging.executiveSummary.scoreStatusText)));
  }
  return tags.join('');
}

function defaultTableIcon() {
  return 'https://raw.githubusercontent.com/serealdemanga/esquilo-invest/refs/heads/main/icons/esquilo.png';
}

function buildActionRows(items) {
  if (!items.length) {
    return '<tr><td colspan="6">Nenhuma ação encontrada com esse filtro.</td></tr>';
  }

  return items.map((item) => {
    const resultClass = String(item.rendimentoPct || '').startsWith('-') ? 'result-negative' : 'result-positive';
    const tone = statusTone(item.recommendation || item.statusLabel);
    return `
      <tr>
        <td>
          <div class="table-item">
            <img class="table-item__icon" src="${escapeHtml(item.institutionIcon || defaultTableIcon())}" alt="" />
            <div class="table-item__copy">
              <strong>${escapeHtml(item.ticker || item.name || 'Ativo')}</strong>
              <span>${escapeHtml(item.name || item.observation || '')}</span>
            </div>
          </div>
        </td>
        <td>${escapeHtml(item.institution || '—')}</td>
        <td>${createBadge(item.recommendation || item.statusLabel || 'Acompanhar', tone)}</td>
        <td class="hide-value">${escapeHtml(item.positionValue || formatMoney(item.valorAtualRaw))}</td>
        <td class="${resultClass}">${escapeHtml(item.rendimentoPct || '0,0%')}</td>
        <td>
          <button class="button button--secondary" type="button" data-action="open-chart" data-open-url="${escapeHtml(item.chartUrl || '')}" data-open-label="Gráfico de ${escapeHtml(item.ticker || item.name || 'ativo')}">
            Ver
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function buildCollectionRows(items) {
  if (!items.length) {
    return '<tr><td colspan="5">Nada por aqui agora.</td></tr>';
  }

  return items.map((item) => {
    const performanceText = item.performanceLabel || item.rentPct || '0,0%';
    const resultClass = String(performanceText).startsWith('-') ? 'result-negative' : 'result-positive';
    const tone = statusTone(item.recommendation || item.statusLabel);
    return `
      <tr>
        <td>
          <div class="table-item">
            <img class="table-item__icon" src="${escapeHtml(item.institutionIcon || defaultTableIcon())}" alt="" />
            <div class="table-item__copy">
              <strong>${escapeHtml(item.name || 'Item')}</strong>
              <span>${escapeHtml(item.observation || item.classification || '')}</span>
            </div>
          </div>
        </td>
        <td>${escapeHtml(item.institution || '—')}</td>
        <td class="hide-value">${escapeHtml(item.valorAtual || formatMoney(item.valorAtualRaw))}</td>
        <td class="${resultClass}">${escapeHtml(performanceText)}</td>
        <td>${createBadge(item.recommendation || item.statusLabel || 'Manter', tone)}</td>
      </tr>
    `;
  }).join('');
}

function renderSummaryBlocks() {
  const summary = getSummary();
  const score = getScore();
  const profile = getProfile();
  const messaging = getMessaging();
  const executive = isPlainObject(messaging.executiveSummary) ? messaging.executiveSummary : {};
  const recommendation = isPlainObject(messaging.primaryRecommendation) ? messaging.primaryRecommendation : {};
  const actionPlan = getActionPlan();
  const snapshots = getSnapshots();
  const updatedAt = getDashboardData().updatedAt || STATE.dashboardPayload?.updatedAt;

  const actionsSnapshot = snapshots.find((item) => item.key === 'acoes') || {};
  const fundsSnapshot = snapshots.find((item) => item.key === 'fundos') || {};
  const pensionSnapshot = snapshots.find((item) => item.key === 'previdencia') || {};

  setText(SELECTORS.updatedAt, formatDateTime(updatedAt));
  setText(SELECTORS.heroSubtitle, 'Veja quanto você tem, como está sua carteira e o que merece atenção agora.');
  setText(SELECTORS.totalValue, formatMoney(summary.totalRaw));
  setText(SELECTORS.investedValue, formatMoney(summary.totalInvestidoRaw));
  setText(SELECTORS.totalPerformance, formatPercent(summary.totalPerformanceRaw));
  setText(SELECTORS.profileLabel, profile.squad || 'Sem leitura');
  setText(SELECTORS.scoreLabel, `${score.score || '—'}/100`);
  setText(SELECTORS.statusChip, executive.scoreStatusText || score.status || 'Carregada');
  setText(SELECTORS.heroMessage, getPrimaryReadingText());
  setText(SELECTORS.focusTitle, recommendation.title || actionPlan.acao_principal || 'Nada urgente no momento');
  setText(SELECTORS.focusText, recommendation.reason || actionPlan.justificativa || 'A carteira foi carregada e está pronta para leitura.');
  setText(SELECTORS.primaryActionTitle, recommendation.actionText || actionPlan.acao_principal || 'Sem movimento urgente');
  setText(SELECTORS.primaryActionReason, recommendation.reason || actionPlan.impacto || 'A principal sugestão aparece aqui quando a leitura encontra um ponto claro.');

  setText(SELECTORS.actionsTotal, actionsSnapshot.totalLabel || formatMoney(summary.acoesRaw));
  setText(SELECTORS.actionsSupport, actionsSnapshot.recommendation ? `${actionsSnapshot.status || 'Em atenção'} · ${actionsSnapshot.recommendation}` : 'Sem leitura complementar');
  setText(SELECTORS.fundsTotal, fundsSnapshot.totalLabel || formatMoney(summary.fundosRaw));
  setText(SELECTORS.fundsSupport, fundsSnapshot.recommendation ? `${fundsSnapshot.status || 'Em atenção'} · ${fundsSnapshot.recommendation}` : 'Sem leitura complementar');
  setText(SELECTORS.pensionTotal, pensionSnapshot.totalLabel || formatMoney(summary.previdenciaRaw));
  setText(SELECTORS.pensionSupport, pensionSnapshot.recommendation ? `${pensionSnapshot.status || 'Em atenção'} · ${pensionSnapshot.recommendation}` : 'Sem leitura complementar');

  setHtml(SELECTORS.distributionLegend, buildLegendHtml(snapshots));
  setText(SELECTORS.insightTitle, recommendation.title || actionPlan.acao_principal || 'Sem alerta central agora');
  setText(SELECTORS.insightText, recommendation.reason || actionPlan.justificativa || 'A leitura principal fica resumida aqui para você bater o olho e entender rápido.');
  setHtml(SELECTORS.insightList, buildInsightListHtml(getInsights()));
  setText(SELECTORS.nextStepTitle, actionPlan.acao_principal || recommendation.title || 'Seguir acompanhando');
  setText(SELECTORS.nextStepText, actionPlan.impacto || recommendation.impact || 'Sem urgência fora do normal. O melhor agora é acompanhar o que mais pesa na carteira.');
  setHtml(SELECTORS.nextStepTags, buildTagsHtml(actionPlan, messaging));
}

function renderTables() {
  const search = STATE.ui.actionSearch.trim().toLowerCase();
  const filteredActions = getActions().filter((item) => {
    if (!search) return true;
    const haystack = [item.ticker, item.name, item.institution, item.observation].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(search);
  });

  setHtml(SELECTORS.actionsTable, buildActionRows(filteredActions));
  setHtml(SELECTORS.fundsTable, buildCollectionRows(getFunds()));
  setHtml(SELECTORS.pensionTable, buildCollectionRows(getPension()));
}

function destroyChart(chart) {
  if (chart) chart.destroy();
}

function buildPerformanceDataset(period) {
  const summary = getSummary();
  const total = parseNumeric(summary.totalRaw);
  const performance = parseNumeric(summary.totalPerformanceRaw);
  const variation = total * Math.max(performance, 0.01);

  const presets = {
    week: { labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'], values: [0.88, 0.93, 0.9, 0.97, 1.01, 1.04, 1], baseline: [0.82, 0.84, 0.86, 0.87, 0.89, 0.9, 0.91] },
    month: { labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'], values: [0.78, 0.82, 0.87, 0.92, 1.04, 1], baseline: [0.72, 0.75, 0.78, 0.81, 0.84, 0.86] },
    year: { labels: ['Jan', 'Mar', 'Mai', 'Jul', 'Set', 'Nov'], values: [0.62, 0.69, 0.77, 0.84, 0.93, 1], baseline: [0.58, 0.61, 0.65, 0.7, 0.75, 0.79] }
  };

  const preset = presets[period] || presets.week;
  return {
    labels: preset.labels,
    primary: preset.values.map((factor) => Math.round((total - variation) + variation * factor)),
    secondary: preset.baseline.map((factor) => Math.round((total - variation * 1.15) + variation * factor))
  };
}

function renderPerformanceChart() {
  if (!DOM.performanceChart || typeof Chart === 'undefined') return;

  const { labels, primary, secondary } = buildPerformanceDataset(STATE.ui.activePeriod);
  destroyChart(STATE.charts.performance);

  STATE.charts.performance = new Chart(DOM.performanceChart, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Carteira',
          data: primary,
          borderColor: '#3774f4',
          backgroundColor: 'rgba(55, 116, 244, 0.12)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 3
        },
        {
          label: 'Base',
          data: secondary,
          borderColor: '#f0a347',
          backgroundColor: 'rgba(240, 163, 71, 0.08)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          displayColors: false,
          callbacks: {
            label(context) { return `${context.dataset.label}: ${formatMoney(context.raw)}`; }
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#80869c', font: { size: 12 } }, border: { display: false } },
        y: {
          grid: { color: 'rgba(94, 104, 142, 0.12)' },
          ticks: { color: '#80869c', font: { size: 12 }, callback(value) { return formatMoney(value); } },
          border: { display: false }
        }
      }
    }
  });
}

function renderAllocationChart() {
  if (!DOM.allocationChart || typeof Chart === 'undefined') return;

  const snapshots = getSnapshots();
  destroyChart(STATE.charts.allocation);

  STATE.charts.allocation = new Chart(DOM.allocationChart, {
    type: 'doughnut',
    data: {
      labels: snapshots.map((item) => item.label),
      datasets: [{
        data: snapshots.map((item) => parseNumeric(item.totalRaw)),
        backgroundColor: snapshots.map((item) => item.color || '#3774f4'),
        borderWidth: 0,
        cutout: '62%'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label(context) { return `${context.label}: ${formatMoney(context.raw)}`; } } }
      }
    }
  });
}

function renderEverything() {
  renderSummaryBlocks();
  renderTables();
  renderPerformanceChart();
  renderAllocationChart();
}

async function loadDashboard() {
  const payload = await fetchJson('dashboard');
  STATE.dashboardPayload = payload;
  renderEverything();
  return payload;
}

async function loadHealth() {
  const payload = await fetchJson('health');
  if (payload?.data?.updatedAt && !STATE.dashboardPayload) {
    setText(SELECTORS.updatedAt, formatDateTime(payload.data.updatedAt));
  }
  return payload;
}

async function loadAiAnalysis() {
  const payload = await fetchJson('ai-analysis', { profile: 'mobile-brief' });
  const analysis = payload?.data?.analysis || '';
  STATE.aiAnalysis = analysis;

  if (analysis) {
    setText(SELECTORS.insightTitle, 'Leitura da IA');
    setText(SELECTORS.insightText, analysis);
  }

  showToast('Leitura atualizada', 'A IA resumiu a carteira para você.');
  return payload;
}

function toggleGhostMode() {
  STATE.ui.ghostMode = !STATE.ui.ghostMode;
  DOM.body.classList.toggle('is-ghost-mode', STATE.ui.ghostMode);
  showToast(STATE.ui.ghostMode ? 'Valores ocultos' : 'Valores visíveis', STATE.ui.ghostMode ? 'A tela ficou mais discreta.' : 'Os valores voltaram a aparecer.');
}

function setActiveSection(sectionId) {
  STATE.ui.activeSection = sectionId;
  document.querySelectorAll('[data-section]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.section === sectionId);
  });
  document.querySelectorAll('.section-panel').forEach((panel) => {
    panel.classList.toggle('is-active', panel.id === sectionId);
  });
}

function setActiveNav(targetId) {
  document.querySelectorAll('[data-nav-target]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.navTarget === targetId);
  });
}

function setActivePeriod(period) {
  STATE.ui.activePeriod = period;
  document.querySelectorAll('[data-period]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.period === period);
  });
  renderPerformanceChart();
}

function scrollToBlock(targetId) {
  const target = document.getElementById(targetId);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function openExternalUrl(url, label) {
  if (!url) {
    openFutureFeatureModal(label || 'Esse detalhe ainda vai entrar');
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

function handleActionClick(action, button) {
  switch (action) {
    case 'toggle-ghost-mode':
      toggleGhostMode();
      return;
    case 'refresh-dashboard':
      loadDashboard()
        .then(() => showToast('Atualizado', 'A carteira foi carregada novamente.'))
        .catch((error) => openBackendIssueModal(error, 'Não deu para atualizar agora'));
      return;
    case 'refresh-actions':
      loadDashboard()
        .then(() => {
          setActiveSection('actions');
          showToast('Ações atualizadas', 'A parte de ações foi recarregada.');
        })
        .catch((error) => openBackendIssueModal(error, 'As ações não puderam ser atualizadas'));
      return;
    case 'request-ai-analysis':
      loadAiAnalysis().catch((error) => openBackendIssueModal(error, 'A leitura da IA ainda não entrou'));
      return;
    case 'scroll-next-step':
      scrollToBlock('next-step');
      return;
    case 'open-chart':
      openExternalUrl(button.dataset.openUrl || '', button.dataset.openLabel || 'Esse gráfico ainda vai entrar');
      return;
    default:
      openFutureFeatureModal('Essa ação ainda está sendo fechada');
  }
}

function bindEvents() {
  document.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;

    if (button.dataset.navTarget) {
      const target = button.dataset.navTarget || 'overview';
      setActiveNav(target);
      if (target === 'actions' || target === 'funds' || target === 'pension') {
        setActiveSection(target);
        scrollToBlock(target);
        return;
      }
      scrollToBlock(target);
      return;
    }

    if (button.dataset.section) {
      setActiveSection(button.dataset.section || 'actions');
      return;
    }

    if (button.dataset.period) {
      setActivePeriod(button.dataset.period || 'week');
      return;
    }

    if (button.dataset.action) {
      handleActionClick(button.dataset.action, button);
      return;
    }

    if (button.dataset.fallbackMessage) {
      openFutureFeatureModal(button.dataset.fallbackMessage);
      return;
    }

    openFutureFeatureModal('Essa parte ainda vai ganhar a ligação final');
  });

  document.addEventListener('input', (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    if (input.matches('[data-filter="table-search"]')) {
      STATE.ui.actionSearch = input.value || '';
      renderTables();
    }
  });
}

async function bootstrap() {
  ensureFriendlyModal();
  bindEvents();

  try {
    await loadHealth();
  } catch (error) {
    console.error(error);
  }

  try {
    await loadDashboard();
  } catch (error) {
    console.error(error);
    openBackendIssueModal(error, 'A carteira não entrou como deveria');
  }
}

bootstrap();
