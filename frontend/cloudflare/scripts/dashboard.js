document.addEventListener('DOMContentLoaded', () => {
  const CONFIG = {
    baseUrl:
      document.querySelector('meta[name="esquilo-api-base-url"]')?.content?.trim() ||
      window.ESQUILO_API_BASE_URL ||
      '',
    token:
      document.querySelector('meta[name="esquilo-api-token"]')?.content?.trim() ||
      window.ESQUILO_API_TOKEN ||
      '',
    timeoutMs: Number(
      document.querySelector('meta[name="esquilo-api-timeout-ms"]')?.content ||
        window.ESQUILO_API_TIMEOUT_MS ||
        20000
    )
  };

  const elements = {
    sidebar: document.getElementById('sidebar'),
    btnToggleSidebar: document.getElementById('btnToggleSidebar'),
    btnSyncData: document.getElementById('btnSyncData'),
    btnIaAction: document.getElementById('btnIaAction'),
    btnToggleVision: document.getElementById('btnToggleVision'),
    patrimonioTotal: document.getElementById('patrimonioTotal'),
    rendimentoMes: document.getElementById('rendimentoMes'),
    iaMensagem: document.getElementById('iaMensagem'),
    tabelaAtivosBody: document.getElementById('tabelaAtivosBody'),
    allocationChart: document.getElementById('allocationChart'),
    userInitials: document.getElementById('userInitials'),
    userName: document.getElementById('userName'),
    userPlan: document.getElementById('userPlan')
  };

  let allocationChartInstance = null;
  let dashboardPayload = null;
  let visionHidden = false;

  bindUi();
  loadDashboard();

  function bindUi() {
    elements.btnToggleSidebar?.addEventListener('click', () => {
      elements.sidebar?.classList.toggle('collapsed');
      document.body.classList.toggle('sidebar-collapsed');
      setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
    });

    elements.btnToggleVision?.addEventListener('click', () => {
      visionHidden = !visionHidden;
      document.body.classList.toggle('hide-vision', visionHidden);
      const icon = elements.btnToggleVision.querySelector('i');
      if (icon) {
        icon.className = visionHidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
      }
    });

    elements.btnSyncData?.addEventListener('click', () => {
      loadDashboard(true);
    });

    elements.btnIaAction?.addEventListener('click', () => {
      const data = getDashboardData();
      const recommendation = data.messaging?.primaryRecommendation;
      const title = recommendation?.title || data.actionPlan?.acao_principal || 'Leitura da carteira';
      const message = recommendation?.reason || data.actionPlan?.justificativa || data.generalAdvice || 'Ainda não chegou uma ação detalhada do backend para esse ponto.';
      window.alert(`${title}\n\n${message}`);
    });
  }

  async function loadDashboard(isManualSync = false) {
    if (!CONFIG.baseUrl) {
      renderError('A URL da API não foi configurada no dashboard.');
      return;
    }

    setSyncButtonLoading(true);

    try {
      const payload = await fetchJson('dashboard');
      dashboardPayload = payload;
      renderDashboard(payload);

      if (isManualSync) {
        setSyncButtonSuccess();
      } else {
        setSyncButtonIdle();
      }
    } catch (error) {
      console.error(error);
      renderError(error.message || 'Não foi possível carregar os dados do dashboard.');
      setSyncButtonIdle();
    }
  }

  async function fetchJson(resource, extraParams = {}) {
    const url = new URL(CONFIG.baseUrl);
    url.searchParams.set('format', 'json');
    url.searchParams.set('resource', resource);
    if (CONFIG.token) {
      url.searchParams.set('token', CONFIG.token);
    }

    Object.entries(extraParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeoutMs);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'A API respondeu com erro.');
      }

      if (payload?.ok === false) {
        throw new Error(payload.error || 'A API respondeu sem sucesso.');
      }

      return payload;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('A chamada do dashboard demorou mais do que o esperado.');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function renderDashboard(payload) {
    const data = payload?.data || {};
    const summary = data.summary || {};
    const profile = data.profile || {};
    const executive = data.messaging?.executiveSummary || {};
    const primaryRecommendation = data.messaging?.primaryRecommendation || {};
    const actions = Array.isArray(data.actions) ? data.actions : [];
    const categorySnapshots = Array.isArray(data.categorySnapshots) ? data.categorySnapshots : [];

    if (elements.patrimonioTotal) {
      elements.patrimonioTotal.textContent = summary.total || formatCurrency(summary.totalRaw);
    }

    if (elements.rendimentoMes) {
      const performanceRaw = getNumber(summary.totalPerformanceRaw);
      const isPositive = performanceRaw >= 0;
      elements.rendimentoMes.className = `balance-badge ${isPositive ? 'badge-up' : 'badge-down'}`;
      elements.rendimentoMes.innerHTML = `<i class="fa-solid ${isPositive ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}"></i> ${formatPercent(performanceRaw)} no consolidado`;
    }

    if (elements.iaMensagem) {
      elements.iaMensagem.textContent =
        primaryRecommendation.reason ||
        executive.statusText ||
        data.generalAdvice ||
        'Sua carteira foi carregada, mas ainda não há uma mensagem principal pronta.';
    }

    if (elements.btnIaAction) {
      const actionText = primaryRecommendation.actionText || data.actionPlan?.acao_principal || 'Ver leitura';
      elements.btnIaAction.innerHTML = `${escapeHtml(actionText)} <i class="fa-solid fa-arrow-right"></i>`;
      elements.btnIaAction.disabled = false;
    }

    if (elements.userName) {
      elements.userName.textContent = profile.squad || 'Esquilo Invest';
    }

    if (elements.userInitials) {
      elements.userInitials.textContent = initialsFromText(profile.squad || 'Esquilo Invest');
    }

    if (elements.userPlan) {
      elements.userPlan.textContent = profile.level ? `Nível ${profile.level}` : 'Carteira conectada';
    }

    renderActionsTable(actions);
    renderAllocationChart(categorySnapshots, summary);
  }

  function renderActionsTable(actions) {
    if (!elements.tabelaAtivosBody) return;

    if (!actions.length) {
      elements.tabelaAtivosBody.innerHTML = `
        <tr>
          <td colspan="4">Nenhum ativo encontrado no payload atual.</td>
        </tr>
      `;
      return;
    }

    elements.tabelaAtivosBody.innerHTML = actions
      .slice(0, 8)
      .map((item) => {
        const categoryLabel = item.name || item.observation || 'Ativo';
        const valueLabel = item.positionValue || formatCurrency(item.valorAtualRaw);
        const shareLabel = item.portfolioShareLabel || item.categoryShareLabel || '—';
        const iconClass = resolveIconClass(categoryLabel);
        const iconName = resolveIconName(categoryLabel);

        return `
          <tr>
            <td>
              <div style="display:flex;align-items:center;">
                <span class="asset-icon ${iconClass}"><i class="fa-solid ${iconName}"></i></span>
                <div>
                  ${escapeHtml(item.ticker || item.name || 'Ativo')}
                  <span style="display:block;font-size:12px;color:var(--text-muted);margin-top:4px;">
                    ${escapeHtml(item.institution || '')}
                  </span>
                </div>
              </div>
            </td>
            <td>${escapeHtml(categoryLabel)}</td>
            <td>${escapeHtml(valueLabel)}</td>
            <td>${escapeHtml(shareLabel)}</td>
          </tr>
        `;
      })
      .join('');
  }

  function renderAllocationChart(categorySnapshots, summary) {
    if (!elements.allocationChart || typeof Chart === 'undefined') return;

    const fallbackData = [
      { label: 'Ações', value: getNumber(summary.acoesRaw), color: '#D97706' },
      { label: 'Fundos', value: getNumber(summary.fundosRaw), color: '#059669' },
      { label: 'Previdência', value: getNumber(summary.previdenciaRaw), color: '#4F46E5' }
    ].filter((item) => item.value > 0);

    const items = categorySnapshots.length
      ? categorySnapshots.map((item) => ({
          label: item.label || 'Categoria',
          value: getNumber(item.totalRaw),
          color: item.color || '#E5E7EB'
        }))
      : fallbackData;

    if (allocationChartInstance) {
      allocationChartInstance.destroy();
    }

    allocationChartInstance = new Chart(elements.allocationChart, {
      type: 'doughnut',
      data: {
        labels: items.map((item) => item.label),
        datasets: [
          {
            data: items.map((item) => item.value),
            backgroundColor: items.map((item) => item.color),
            borderWidth: 0,
            hoverOffset: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: { family: "'Inter', -apple-system, sans-serif", size: 12 }
            }
          },
          tooltip: {
            callbacks: {
              label(context) {
                return `${context.label}: ${formatCurrency(context.raw)}`;
              }
            }
          }
        }
      }
    });
  }

  function renderError(message) {
    if (elements.iaMensagem) {
      elements.iaMensagem.textContent = message;
    }
    if (elements.rendimentoMes) {
      elements.rendimentoMes.className = 'balance-badge badge-loading';
      elements.rendimentoMes.textContent = 'Sem leitura';
    }
    if (elements.tabelaAtivosBody) {
      elements.tabelaAtivosBody.innerHTML = `
        <tr>
          <td colspan="4">${escapeHtml(message)}</td>
        </tr>
      `;
    }
  }

  function setSyncButtonLoading(isLoading) {
    if (!elements.btnSyncData) return;
    if (isLoading) {
      elements.btnSyncData.disabled = true;
      elements.btnSyncData.classList.add('btn-loading');
      elements.btnSyncData.innerHTML = '<i class="fa-solid fa-arrows-rotate fa-spin"></i> Sincronizando...';
      return;
    }
    setSyncButtonIdle();
  }

  function setSyncButtonIdle() {
    if (!elements.btnSyncData) return;
    elements.btnSyncData.disabled = false;
    elements.btnSyncData.classList.remove('btn-loading');
    elements.btnSyncData.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> Sincronizar';
  }

  function setSyncButtonSuccess() {
    if (!elements.btnSyncData) return;
    elements.btnSyncData.disabled = false;
    elements.btnSyncData.classList.remove('btn-loading');
    elements.btnSyncData.innerHTML = '<i class="fa-solid fa-check"></i> Atualizado';
    window.setTimeout(setSyncButtonIdle, 1800);
  }

  function resolveIconClass(categoryLabel) {
    const label = String(categoryLabel || '').toLowerCase();
    if (label.includes('previd')) return 'icon-rf';
    if (label.includes('fundo')) return 'icon-fii';
    if (label.includes('renda fixa')) return 'icon-rf';
    return 'icon-rv';
  }

  function resolveIconName(categoryLabel) {
    const label = String(categoryLabel || '').toLowerCase();
    if (label.includes('previd')) return 'fa-shield-heart';
    if (label.includes('fundo')) return 'fa-building';
    if (label.includes('renda fixa')) return 'fa-piggy-bank';
    return 'fa-chart-line';
  }

  function getNumber(value) {
    return Number.isFinite(Number(value)) ? Number(value) : 0;
  }

  function formatCurrency(value) {
    return getNumber(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatPercent(value) {
    return `${(getNumber(value) * 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    })}%`;
  }

  function initialsFromText(text) {
    return String(text || 'EI')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
});
