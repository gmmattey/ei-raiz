(function () {
  'use strict';

  const SEG_COLORS = ['#1B4D57', '#16A34A', '#D97706', '#DC2626', '#6366F1', '#94A3B8'];

  const INST_LABELS = { XP: 'XP', ITAU: 'Itaú', ONZE: 'Onze', OUTROS: 'Outros' };
  const INST_COLORS = { XP: '#7C3AED', ITAU: '#F97316', ONZE: '#14B8A6', OUTROS: '#94A3B8' };
  const CLASS_LABELS = {
    ACAO: 'Ação', FII: 'FII', FUNDO: 'Fundo', PREVIDENCIA: 'Previdência',
    TESOURO: 'Tesouro', RF: 'Renda Fixa', POUPANCA: 'Poupança', COFRINHO: 'Cofrinho'
  };
  const IMPORT_STATUS_LABELS = { active: 'Ativo', redeeming: 'Em resgate' };
  const ASSET_STATUS_LABELS = { active: 'Ativo', redeeming: 'Em resgate', sold: 'Vendido', archived: 'Arquivado' };
  const QUOTE_PROVIDER_STATUS_LABELS = { idle: 'aguardando', ok: 'ok', stale: 'defasado', degraded: 'degradado' };

  const state = {
    portfolio: null,
    history: null,
    hide: localStorage.getItem('quanto-hide') === '1',
    groupMode: localStorage.getItem('quanto-group-mode') || 'institution',
    filter: localStorage.getItem('quanto-filter') || 'todos',
    donutMode: localStorage.getItem('quanto-donut-mode') || 'institution',
    activeTab: 'hoje',
    sheetOpen: null,
    editingAssetId: null,
    editingAssetMode: null,
    importParsed: [],
    importFileName: '',
    importFileSize: 0,
    searchTerm: '',
    portfolioLoadedAt: null
  };

  // ----- Auth -----

  function getToken() { return localStorage.getItem('quanto-token'); }
  function setToken(t) { localStorage.setItem('quanto-token', t); }
  function clearToken() { localStorage.removeItem('quanto-token'); }

  function showLogin() {
    document.getElementById('login-screen').style.display = '';
    document.getElementById('app').style.display = 'none';
    document.getElementById('loading-overlay').classList.add('hidden');
  }

  function showApp() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = '';
  }

  function showLoginError(msg) {
    var el = document.getElementById('login-error');
    el.textContent = msg;
    el.style.display = '';
  }

  function hideLoginError() {
    document.getElementById('login-error').style.display = 'none';
  }

  async function doLogin() {
    hideLoginError();
    var email = document.getElementById('login-email').value.trim();
    var password = document.getElementById('login-password').value;
    if (!email || !password) { showLoginError('Preencha email e senha.'); return; }
    var btn = document.getElementById('login-btn');
    btnLoading(btn, (async function() {
      try {
        var res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, password: password })
        });
        var data = await res.json();
        if (!res.ok) { showLoginError(data.error || 'Erro ao entrar.'); return; }
        setToken(data.token);
        showApp();
        loadPortfolio();
      } catch (e) {
        showLoginError('Erro de conexão.');
      }
    })());
  }

  async function doRegister() {
    hideLoginError();
    var name = document.getElementById('reg-name').value.trim();
    var email = document.getElementById('reg-email').value.trim();
    var cpf = document.getElementById('reg-cpf').value.replace(/\D/g, '');
    var birth = document.getElementById('reg-birth').value;
    var password = document.getElementById('reg-password').value;
    if (!email || !password) { showLoginError('Preencha email e senha.'); return; }
    if (password.length < 6) { showLoginError('Senha deve ter no mínimo 6 caracteres.'); return; }
    if (cpf.length !== 11) { showLoginError('Preencha o CPF — necessário para recuperar a senha.'); return; }
    if (!birth) { showLoginError('Preencha a data de nascimento — necessária para recuperar a senha.'); return; }
    var btn = document.getElementById('register-btn');
    btnLoading(btn, (async function() {
      try {
        var res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, password: password, name: name || null, cpf: cpf || null, birth_date: birth || null })
        });
        var data = await res.json();
        if (!res.ok) { showLoginError(data.error || 'Erro ao criar conta.'); return; }
        setToken(data.token);
        showApp();
        loadPortfolio();
      } catch (e) {
        showLoginError('Erro de conexão.');
      }
    })());
  }

  async function doRecover() {
    hideLoginError();
    var email = document.getElementById('rec-email').value.trim();
    var cpf = document.getElementById('rec-cpf').value.replace(/\D/g, '');
    var birth = document.getElementById('rec-birth').value;
    var password = document.getElementById('rec-password').value;
    if (!email || !cpf || !birth || !password) { showLoginError('Preencha todos os campos.'); return; }
    if (password.length < 6) { showLoginError('Senha deve ter no mínimo 6 caracteres.'); return; }
    var btn = document.getElementById('recover-btn');
    btnLoading(btn, (async function() {
      try {
        var res = await fetch('/api/auth/recover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, cpf: cpf, birth_date: birth, new_password: password })
        });
        var data = await res.json();
        if (!res.ok) { showLoginError(data.error || 'Erro ao redefinir senha.'); return; }
        document.getElementById('recover-form').style.display = 'none';
        document.getElementById('login-form').style.display = '';
        document.getElementById('login-email').value = email;
        document.getElementById('login-error').style.color = 'var(--verde, #1F7A4D)';
        showLoginError('Senha redefinida! Faça login com a nova senha.');
      } catch (e) {
        showLoginError('Erro de conexão.');
      }
    })());
  }

  function showRecoverForm() {
    hideLoginError();
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('recover-form').style.display = '';
  }

  function logout() {
    clearToken();
    state.portfolio = null;
    state.history = null;
    showLogin();
  }

  // ----- API -----

  async function api(method, path, body) {
    var opts = { method: method, headers: {} };
    var token = getToken();
    if (token) {
      opts.headers['Authorization'] = 'Bearer ' + token;
    }
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    var res = await fetch(path, opts);
    if (res.status === 401) {
      clearToken();
      showLogin();
      throw new Error('401');
    }
    return res.json();
  }

  // ----- Formatters -----

  const BRL = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const DATE_BR = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const DATETIME_BR = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  function fmt(v) {
    if (v == null) return '—';
    return 'R$ ' + BRL.format(v);
  }

  function fmtCompact(v) {
    if (v == null) return '—';
    return BRL.format(v);
  }

  // ----- Input masks -----

  var LOWER_PT = new Set(['de','da','do','das','dos','e','em','na','no','nas','nos','a','o','as','os','para','por','com','sem','sob']);

  function maskCurrency(el) {
    el.setAttribute('inputmode', 'decimal');
    el.addEventListener('blur', function () {
      var raw = this.value.replace(/\./g, '').replace(',', '.').trim();
      var num = parseFloat(raw);
      if (!isNaN(num) && this.value.trim() !== '') {
        this.value = num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    });
  }

  function maskQty(el) {
    el.setAttribute('inputmode', 'decimal');
    el.addEventListener('input', function () {
      var v = this.value.replace(/[^\d,]/g, '');
      var parts = v.split(',');
      if (parts.length > 2) v = parts[0] + ',' + parts.slice(1).join('');
      this.value = v;
    });
  }

  function maskTicker(el) {
    el.setAttribute('maxlength', '8');
    el.setAttribute('inputmode', 'text');
    el.setAttribute('autocomplete', 'off');
    el.addEventListener('input', function () {
      this.value = this.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    });
  }

  function maskCpf(el) {
    el.setAttribute('maxlength', '14');
    el.addEventListener('input', function () {
      var d = this.value.replace(/\D/g, '').slice(0, 11);
      if (d.length <= 3) { this.value = d; return; }
      if (d.length <= 6) { this.value = d.slice(0,3) + '.' + d.slice(3); return; }
      if (d.length <= 9) { this.value = d.slice(0,3) + '.' + d.slice(3,6) + '.' + d.slice(6); return; }
      this.value = d.slice(0,3) + '.' + d.slice(3,6) + '.' + d.slice(6,9) + '-' + d.slice(9);
    });
  }

  function maskTitleCase(el) {
    el.addEventListener('blur', function () {
      var val = this.value.trim().replace(/\s+/g, ' ');
      if (!val) return;
      this.value = val.split(' ').map(function (w, i) {
        var lo = w.toLowerCase();
        return (i === 0 || !LOWER_PT.has(lo)) ? lo.charAt(0).toUpperCase() + lo.slice(1) : lo;
      }).join(' ');
    });
  }

  function maskNameNormalize(el) {
    el.addEventListener('blur', function () {
      var val = this.value.trim().replace(/\s+/g, ' ');
      if (val) this.value = val.charAt(0).toUpperCase() + val.slice(1);
    });
  }

  function applyMasks() {
    ['sh-saldo-input','sh-edit-invested','sh-add-auto-invested',
     'sh-add-balance','sh-add-manual-invested','sh-add-cvm-balance','sh-add-cvm-invested','sh-sale-gross'
    ].forEach(function (id) { var el = document.getElementById(id); if (el) maskCurrency(el); });

    ['sh-add-qty','sh-edit-qty','sh-aporte-qty'].forEach(function (id) { var el = document.getElementById(id); if (el) maskQty(el); });

    ['sh-add-ticker','sh-edit-ticker'].forEach(function (id) { var el = document.getElementById(id); if (el) maskTicker(el); });

    ['reg-cpf','rec-cpf'].forEach(function (id) { var el = document.getElementById(id); if (el) maskCpf(el); });

    var regName = document.getElementById('reg-name');
    if (regName) maskTitleCase(regName);

    ['sh-add-auto-name','sh-add-manual-name','sh-edit-name',
     'sh-add-inst-name','sh-edit-inst-name'
    ].forEach(function (id) { var el = document.getElementById(id); if (el) maskNameNormalize(el); });
  }

  function fmtPct(v) {
    if (v == null) return '';
    const sign = v >= 0 ? '+' : '';
    return sign + v.toFixed(1).replace('.', ',') + '%';
  }

  function fmtDate(iso) {
    if (!iso) return '';
    const normalized = iso.endsWith('Z') ? iso : iso.replace(' ', 'T') + 'Z';
    return DATE_BR.format(new Date(normalized)).replace('.', '');
  }

  function fmtDateTime(iso) {
    if (!iso) return '';
    const normalized = iso.endsWith('Z') ? iso : iso.replace(' ', 'T') + 'Z';
    return DATETIME_BR.format(new Date(normalized));
  }

  function fmtMonth(ym) {
    const [y, m] = ym.split('-');
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return months[parseInt(m, 10) - 1] + '/' + y.slice(2);
  }

  function greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  function instLabel(asset) {
    if (asset.institution === 'OUTROS' && asset.institutionName) return asset.institutionName;
    return INST_LABELS[asset.institution] || asset.institution;
  }

  function isAutoClass(cls) {
    return cls === 'ACAO' || cls === 'FII';
  }

  function groupLabel(key, mode) {
    if (mode === 'institution') return INST_LABELS[key] || key;
    return CLASS_LABELS[key] || key;
  }

  function minutesAgo(iso) {
    if (!iso) return null;
    const utc = iso.endsWith('Z') ? iso : iso + 'Z';
    return Math.round((Date.now() - new Date(utc).getTime()) / 60000);
  }

  function assignColors(keys) {
    const map = {};
    keys.forEach((k, i) => { map[k] = SEG_COLORS[Math.min(i, SEG_COLORS.length - 1)]; });
    return map;
  }

  // ----- Masking -----

  function applyMask() {
    document.body.classList.toggle('masked', state.hide);
    const open = document.getElementById('eye-icon-open');
    const closed = document.getElementById('eye-icon-closed');
    if (open) open.style.display = state.hide ? 'none' : '';
    if (closed) closed.style.display = state.hide ? '' : 'none';
  }

  function toggleHide() {
    state.hide = !state.hide;
    localStorage.setItem('quanto-hide', state.hide ? '1' : '0');
    applyMask();
    if (state.portfolio) {
      renderDonut();
    }
  }

  // ----- Dark mode -----

  function initDark() {
    const saved = localStorage.getItem('quanto-dark');
    const isDark = saved === '1' || (saved == null && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
    updateDarkIcons(isDark);
    updateThemeColor(isDark);
  }

  function toggleDark() {
    const isDark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('quanto-dark', isDark ? '1' : '0');
    updateDarkIcons(isDark);
    updateThemeColor(isDark);
  }

  function updateDarkIcons(isDark) {
    const moon = document.getElementById('dark-icon-moon');
    const sun = document.getElementById('dark-icon-sun');
    if (moon) moon.style.display = isDark ? 'none' : '';
    if (sun) sun.style.display = isDark ? '' : 'none';
  }

  function updateThemeColor(isDark) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark ? '#0A0F14' : '#1B4D57');
  }

  // ----- Tab navigation -----

  const TABS = ['hoje', 'carteira', 'bens', 'historico', 'importar'];

  function switchTab(tab) {
    state.activeTab = tab;
    TABS.forEach(t => {
      const screen = document.getElementById('tela-' + t);
      const btn = document.getElementById('tab-' + t);
      if (screen) screen.style.display = t === tab ? '' : 'none';
      if (btn) {
        btn.classList.toggle('active', t === tab);
        btn.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      }
    });

    if (tab === 'carteira' && state.portfolio) renderCarteira();
    if (tab === 'bens') loadGoods();
    if (tab === 'historico' && !state.history) loadHistory();
    else if (tab === 'historico' && state.history) renderHistorico();
    if (tab === 'importar') initImport();
  }

  // ----- Touch swipe for tab nav -----

  let touchStartX = 0;
  let touchStartY = 0;

  document.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
      const idx = TABS.indexOf(state.activeTab);
      if (dx < 0 && idx < TABS.length - 1) switchTab(TABS[idx + 1]);
      else if (dx > 0 && idx > 0) switchTab(TABS[idx - 1]);
    }
  }, { passive: true });

  // ----- Sheet management -----

  function openSheet(id) {
    closeAllSheets();
    state.sheetOpen = id;
    document.getElementById('sheet-overlay').classList.add('open');
    var sheet = document.getElementById(id);
    sheet.classList.add('open');
    sheet.style.transform = '';
    initSheetDrag(sheet);
  }

  function closeAllSheets() {
    state.sheetOpen = null;
    document.getElementById('sheet-overlay').classList.remove('open');
    ['sheet-saldo', 'sheet-edit', 'sheet-add', 'sheet-aporte', 'sheet-sale', 'sheet-bem', 'sheet-analyze'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.classList.remove('open'); el.style.transform = ''; }
    });
    const confirmArea = document.getElementById('sh-edit-confirm');
    const removeBtn = document.getElementById('sh-edit-remove');
    if (confirmArea) confirmArea.style.display = 'none';
    if (removeBtn) removeBtn.style.display = '';
  }

  // ----- Sheet drag-to-dismiss -----

  function initSheetDrag(sheet) {
    if (sheet._dragInit) return;
    sheet._dragInit = true;
    var dragY = 0, startY = 0, startTime = 0, dragging = false;
    var overlay = document.getElementById('sheet-overlay');

    function onStart(e) {
      if (sheet.scrollTop > 0) return;
      var touch = e.touches ? e.touches[0] : e;
      startY = touch.clientY;
      startTime = Date.now();
      dragging = true;
      sheet.style.transition = 'none';
    }
    function onMove(e) {
      if (!dragging) return;
      var touch = e.touches ? e.touches[0] : e;
      dragY = Math.max(0, touch.clientY - startY);
      sheet.style.transform = 'translateY(' + dragY + 'px)';
      var opacity = Math.max(0, 1 - dragY / 400);
      overlay.style.opacity = opacity;
    }
    function onEnd(e) {
      if (!dragging) return;
      dragging = false;
      sheet.style.transition = '';
      overlay.style.opacity = '';
      overlay.style.transition = '';
      var touch = e.changedTouches ? e.changedTouches[0] : e;
      var endY = touch.clientY - startY;
      var elapsed = Date.now() - startTime;
      var velocity = endY / Math.max(elapsed, 1);
      if (endY > 100 || velocity > 0.5) {
        sheet.style.transform = 'translateY(100%)';
        setTimeout(function() { closeAllSheets(); }, 200);
      } else {
        sheet.style.transform = 'translateY(0)';
      }
      dragY = 0;
    }

    var handle = sheet.querySelector('.sheet-drag');
    if (!handle) return;
    handle.style.cursor = 'grab';
    handle.addEventListener('touchstart', onStart, { passive: true });
    handle.addEventListener('touchmove', onMove, { passive: true });
    handle.addEventListener('touchend', onEnd, { passive: true });
    handle.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', function(e) { if (dragging) onMove(e); });
    document.addEventListener('mouseup', function(e) { if (dragging) onEnd(e); });
  }

  // ----- Button loading helper -----

  function btnLoading(btn, promise) {
    if (!btn || btn.disabled) return promise;
    var original = btn.textContent;
    var loadingTexts = {
      'sh-saldo-save': 'Salvando...',
      'sh-edit-save': 'Salvando...',
      'sh-add-save': 'Adicionando...',
      'sh-aporte-save': 'Registrando...',
      'sh-sale-save': 'Concluindo...',
      'sh-bem-save': 'Salvando...',
      'imp-confirm-btn': 'Importando...',
      'login-btn': 'Entrando...',
      'register-btn': 'Criando conta...',
      'recover-btn': 'Redefinindo...'
    };
    btn.disabled = true;
    btn.classList.add('loading');
    btn.textContent = loadingTexts[btn.id] || 'Aguarde...';
    return promise.finally(function() {
      btn.disabled = false;
      btn.classList.remove('loading');
      btn.textContent = original;
    });
  }

  // ----- Toast -----

  let toastTimer = null;

  function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  // ----- Loading overlay -----

  function hideLoading() {
    const el = document.getElementById('loading-overlay');
    if (el) el.classList.add('hidden');
  }

  // ----- Data loading -----

  async function loadPortfolio() {
    try {
      state.portfolio = await api('GET', '/api/portfolio');
      state.portfolioLoadedAt = Date.now();
      renderHoje();
      if (state.portfolio && state.portfolio.benchmarks) renderBenchmarks(state.portfolio.benchmarks);
      if (goodsData !== null) updateGrossWealth();
      if (state.activeTab === 'carteira') renderCarteira();
    } catch (e) {
      if (e.message !== '401') showToast('Erro ao carregar dados');
    } finally {
      hideLoading();
    }
  }

  async function loadHistory() {
    try {
      state.history = await api('GET', '/api/history');
      renderHistorico();
    } catch (e) {
      if (e.message !== '401') showToast('Erro ao carregar histórico');
    }
  }

  // ----- Render: Hoje -----

  function renderHoje() {
    const p = state.portfolio;
    if (!p) return;

    var skel = document.getElementById('hero-skeleton');
    if (skel) skel.classList.add('hidden');

    updateOfflineState();

    const assets = p.assets || [];

    document.getElementById('hoje-greeting').textContent = greeting() + (p.userName ? ', ' + p.userName.split(' ')[0] : '') + '!';
    document.getElementById('greeting-name').textContent = p.userName ? p.userName.split(' ')[0] : '';

    var isEmpty = assets.length === 0 && (!p.redeeming || p.redeeming.length === 0);
    document.getElementById('hoje-empty').style.display = isEmpty ? '' : 'none';
    ['hoje-hero', 'fresh-card', 'hoje-alloc-header', 'donut-wrap', 'donut-legend', 'quote-info', 'btn-analyze-portfolio'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) el.style.display = isEmpty ? 'none' : '';
    });

    const total = p.total || 0;
    const totalStr = BRL.format(total);
    const dotIdx = totalStr.lastIndexOf(',');
    const intPart = 'R$ ' + totalStr.slice(0, dotIdx);
    const centPart = ',' + totalStr.slice(dotIdx + 1);
    document.getElementById('kpi-inteiro').textContent = intPart;
    document.getElementById('kpi-centavos').textContent = centPart;

    const deltaEl = document.getElementById('kpi-delta');
    if (p.gain != null && p.invested > 0) {
      const sign = p.gain >= 0 ? '+ ' : '- ';
      deltaEl.textContent = sign + fmt(Math.abs(p.gain)) + ' (' + fmtPct(p.gainPct) + ') sobre o aplicado';
      deltaEl.classList.toggle('neg', p.gain < 0);
    } else {
      const autoWithoutQuote = assets.some(function (a) { return a.mode === 'auto' && a.balance == null; });
      const autoWithoutInvested = assets.some(function (a) { return a.mode === 'auto' && (a.invested == null || a.invested <= 0); });
      deltaEl.classList.remove('neg');
      if (autoWithoutQuote) {
        deltaEl.textContent = 'Algumas ações ainda estão sem cotação atual.';
      } else if (autoWithoutInvested) {
        deltaEl.textContent = 'Registre o valor aplicado para calcular lucro ou perda.';
      } else {
        deltaEl.textContent = '';
      }
    }

    const redeemNote = document.getElementById('redeem-note');
    const redeeming = p.redeeming || [];
    if (redeeming.length > 0) {
      const rTotal = redeeming.reduce((s, a) => s + (a.balance || 0), 0);
      redeemNote.textContent = '+ ' + fmt(rTotal) + ' em resgate (' + redeeming.length + ' ' + (redeeming.length === 1 ? 'ativo' : 'ativos') + ', não contabilizado)';
      redeemNote.style.display = '';
    } else {
      redeemNote.style.display = 'none';
    }

    renderFreshness(p.freshness);
    renderDonut();

    const quoteEl = document.getElementById('quote-info');
    if (p.quotesFetchedAt || (p.quoteProvider && p.quoteProvider.trackedTickers > 0)) {
      if (p.quotesFetchedAt) {
        const mins = minutesAgo(p.quotesFetchedAt);
        var providerSuffix = '';
        if (p.quoteProvider && p.quoteProvider.latestFetchedAt) {
          providerSuffix = ' · BRAPI ' + (QUOTE_PROVIDER_STATUS_LABELS[p.quoteProvider.status] || p.quoteProvider.status) + ' às ' + fmtDateTime(p.quoteProvider.latestFetchedAt);
        }
        quoteEl.textContent = 'cotações há ' + mins + (mins === 1 ? ' min' : ' min') + providerSuffix;
      } else {
        var pending = p.quoteProvider && p.quoteProvider.missingTickers
          ? ' · ' + p.quoteProvider.missingTickers + ' ativo' + (p.quoteProvider.missingTickers === 1 ? '' : 's') + ' sem cotação materializada'
          : '';
        quoteEl.textContent = 'BRAPI ' + ((p.quoteProvider && QUOTE_PROVIDER_STATUS_LABELS[p.quoteProvider.status]) || 'aguardando') + pending;
      }
      quoteEl.style.display = '';
    } else {
      quoteEl.style.display = 'none';
    }

    var updEl = document.getElementById('kpi-updated');
    if (updEl && state.portfolioLoadedAt) {
      var ago = Math.round((Date.now() - state.portfolioLoadedAt) / 60000);
      updEl.textContent = ago < 1 ? 'atualizado agora' : 'atualizado há ' + ago + ' min';
    }
  }

  function renderFreshness(freshness) {
    if (!freshness) return;
    document.getElementById('fresh-count').textContent = freshness.ok + ' de ' + freshness.total + ' em dia';
    const pct = freshness.total > 0 ? (freshness.ok / freshness.total) * 100 : 100;
    document.getElementById('fresh-bar-fill').style.width = pct + '%';

    const warnEl = document.getElementById('fresh-warn');
    const staleInsts = (freshness.byInstitution || []).filter(i => i.staleAssets && i.staleAssets.length > 0);
    if (staleInsts.length > 0) {
      const parts = staleInsts.map(i => {
        const name = INST_LABELS[i.institution] || i.institutionName || i.institution;
        const oldest = i.staleAssets.reduce((a, b) => b.daysAgo > a.daysAgo ? b : a);
        return name + ' · ' + oldest.name + ' sem atualização há ' + oldest.daysAgo + ' dias';
      });
      warnEl.textContent = parts.join(' | ');
      warnEl.style.display = '';
    } else {
      warnEl.style.display = 'none';
    }
  }

  function renderDonut() {
    const p = state.portfolio;
    if (!p) return;

    const mode = state.donutMode;
    const groups = mode === 'institution' ? (p.byInstitution || []) : (p.byClass || []);

    if (groups.length === 0) {
      document.getElementById('donut-svg').innerHTML = '';
      document.getElementById('donut-legend').innerHTML = '';
      return;
    }

    const sorted = [...groups].sort((a, b) => b.total - a.total);
    let segments = sorted;
    let others = null;

    if (sorted.length > 5) {
      const main = sorted.slice(0, 4);
      const rest = sorted.slice(4);
      const othersTotal = rest.reduce((s, g) => s + g.total, 0);
      const othersKey = mode === 'institution' ? 'OUTROS_GROUP' : 'OUTROS_GROUP';
      others = { label: 'Outros', total: othersTotal, pct: rest.reduce((s, g) => s + (g.pct || 0), 0) };
      segments = main;
    }

    const keys = segments.map(g => g.institution || g.class || '');
    const colorMap = assignColors(keys);
    if (others) colorMap['OUTROS_GROUP'] = SEG_COLORS[SEG_COLORS.length - 1];

    const allSeg = others ? [...segments, { ...others, _key: 'OUTROS_GROUP' }] : segments;
    const total = p.total || 1;

    const svg = document.getElementById('donut-svg');
    svg.innerHTML = '';
    const cx = 80, cy = 80, r = 72, inner = 46;
    let cum = -Math.PI / 2;

    allSeg.forEach((seg, idx) => {
      const key = seg.institution || seg.class || seg._key || '';
      const color = colorMap[key] || SEG_COLORS[idx % SEG_COLORS.length];
      const val = seg.total;
      const angle = (val / total) * 2 * Math.PI;
      const gap = 0.03;
      const sa = cum + gap / 2;
      const ea = cum + angle - gap / 2;
      const la = angle > Math.PI ? 1 : 0;
      const x1o = cx + r * Math.cos(sa), y1o = cy + r * Math.sin(sa);
      const x2o = cx + r * Math.cos(ea), y2o = cy + r * Math.sin(ea);
      const x1i = cx + inner * Math.cos(ea), y1i = cy + inner * Math.sin(ea);
      const x2i = cx + inner * Math.cos(sa), y2i = cy + inner * Math.sin(sa);
      const d = `M${x1o},${y1o} A${r},${r} 0 ${la} 1 ${x2o},${y2o} L${x1i},${y1i} A${inner},${inner} 0 ${la} 0 ${x2i},${y2i} Z`;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', color);
      path.style.cursor = 'pointer';
      path.style.transition = 'opacity 0.15s';

      const segLabel = seg.label || (seg.institution ? (INST_LABELS[seg.institution] || seg.institutionName || seg.institution) : (CLASS_LABELS[seg.class] || seg.class));
      const segPct = ((val / total) * 100).toFixed(1).replace('.', ',');

      path.addEventListener('click', () => {
        const center = document.getElementById('donut-center');
        center.innerHTML = `<div class="dc-label">${segLabel}</div><div class="dc-val v">${fmt(val)}</div><div class="dc-pct">${segPct}%</div>`;
        if (state.hide) applyMask();
      });

      svg.appendChild(path);
      cum += angle;
    });

    const legend = document.getElementById('donut-legend');
    legend.innerHTML = allSeg.map((seg, idx) => {
      const key = seg.institution || seg.class || seg._key || '';
      const color = colorMap[key] || SEG_COLORS[idx % SEG_COLORS.length];
      const label = seg.label || (seg.institution ? (INST_LABELS[seg.institution] || seg.institutionName || seg.institution) : (CLASS_LABELS[seg.class] || seg.class));
      const segPct = ((seg.total / total) * 100).toFixed(1).replace('.', ',');

      let dotHtml = '';
      if (mode === 'institution') {
        const instCode = seg.institution || '';
        const dotColor = INST_COLORS[instCode] || INST_COLORS.OUTROS;
        const dotLetter = label.charAt(0).toUpperCase();
        dotHtml = `<span class="inst-dot" style="background:${dotColor}">${dotLetter}</span>`;
      } else {
        const dotColor = colorMap[key] || SEG_COLORS[idx % SEG_COLORS.length];
        const dotLetter = label.charAt(0).toUpperCase();
        dotHtml = `<span class="inst-dot" style="background:${dotColor}">${dotLetter}</span>`;
      }

      return `<div class="legend-row">
        <div class="legend-left">${dotHtml}<span class="legend-name">${label}</span></div>
        <div class="legend-right"><span class="legend-val v">${fmt(seg.total)}</span><span class="legend-pct v">${segPct}%</span></div>
      </div>`;
    }).join('');

    const dcVal = document.getElementById('dc-val');
    if (dcVal) dcVal.textContent = fmt(total);

    if (state.hide) applyMask();
  }

  // ----- Render: Carteira -----

  function renderCarteira() {
    const p = state.portfolio;
    if (!p) return;

    const assets = p.assets || [];
    const redeeming = p.redeeming || [];
    const mode = state.groupMode;
    const filter = state.filter;

    const gKey = mode === 'institution' ? 'institution' : 'class';
    const sKey = mode === 'institution' ? 'class' : 'institution';

    const allGroups = [...new Set(assets.map(a => a[gKey]))];
    const colorMap = assignColors(allGroups);

    const chips = document.getElementById('cart-chips');
    const chipItems = ['todos', ...allGroups];
    chips.innerHTML = chipItems.map(k => {
      const label = k === 'todos' ? 'Todos' : groupLabel(k, mode);
      return `<button class="fchip${filter === k ? ' sel' : ''}" data-filter="${k}">${label}</button>`;
    }).join('');

    chips.querySelectorAll('.fchip').forEach(btn => {
      btn.addEventListener('click', () => {
        state.filter = btn.dataset.filter;
        localStorage.setItem('quanto-filter', state.filter);
        renderCarteira();
      });
    });

    var chipFiltered = filter === 'todos' ? assets : assets.filter(a => a[gKey] === filter);
    var searchTerm = (state.searchTerm || '').toLowerCase();
    var filtered = searchTerm ? chipFiltered.filter(function(a) {
      return (a.name || '').toLowerCase().includes(searchTerm)
        || (a.display_name || '').toLowerCase().includes(searchTerm)
        || (a.ticker || '').toLowerCase().includes(searchTerm)
        || (a.institutionName || '').toLowerCase().includes(searchTerm);
    }) : chipFiltered;

    document.getElementById('cart-count').textContent = filtered.length + (filtered.length === 1 ? ' ativo' : ' ativos');
    const filtTotal = filtered.reduce((s, a) => s + (a.balance || 0), 0);
    document.getElementById('cart-total').textContent = fmt(filtTotal);

    renderStackedBar(filtered, allGroups, colorMap, gKey);

    const listEl = document.getElementById('cart-list');
    const emptyEl = document.getElementById('cart-empty');
    const filterEmptyEl = document.getElementById('cart-filter-empty');

    if (assets.length === 0 && redeeming.length === 0) {
      listEl.innerHTML = '';
      emptyEl.style.display = '';
      filterEmptyEl.style.display = 'none';
      return;
    }

    emptyEl.style.display = 'none';

    if (filtered.length === 0 && filter !== 'todos') {
      listEl.innerHTML = '';
      filterEmptyEl.style.display = '';
      return;
    }

    filterEmptyEl.style.display = 'none';

    const groups = {};
    filtered.forEach(a => {
      const g = a[gKey];
      if (!groups[g]) groups[g] = {};
      const s = a[sKey];
      if (!groups[g][s]) groups[g][s] = [];
      groups[g][s].push(a);
    });

    let html = '';
    Object.keys(groups).forEach(gName => {
      const subs = groups[gName];
      const gTotal = Object.values(subs).flat().reduce((s, a) => s + (a.balance || 0), 0);
      const color = colorMap[gName] || '#6B7280';
      html += `<div class="grp-header">
        <div class="grp-label"><span class="grp-dot" style="background:${color}"></span><span>${groupLabel(gName, mode)}</span></div>
        <span class="grp-total v">${fmt(gTotal)}</span>
      </div>`;

      Object.keys(subs).forEach(sName => {
        html += `<div class="sub-grp-header">${groupLabel(sName, mode === 'institution' ? 'class' : 'institution')}</div>`;
        subs[sName].forEach(a => {
          html += renderAssetRow(a, true);
        });
      });
    });

    if (redeeming.length > 0) {
      const rTotal = redeeming.reduce((s, a) => s + (a.balance || 0), 0);
      html += `<div class="redeem-sep"></div>`;
      html += `<div class="grp-header">
        <div class="grp-label"><span class="grp-dot" style="background:#C2335B"></span><span>Em resgate</span></div>
        <span class="grp-total v">${fmt(rTotal)}</span>
      </div>`;
      redeeming.forEach(a => { html += renderAssetRow(a, false); });
    }

    listEl.innerHTML = html;

    listEl.querySelectorAll('[data-asset-id]').forEach(row => {
      const id = parseInt(row.dataset.assetId, 10);

      row.addEventListener('click', () => {
        openDetail(id);
      });
    });

    listEl.querySelectorAll('[data-more-id]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        openSheetEdit(parseInt(btn.dataset.moreId, 10));
      });
    });

    if (state.hide) applyMask();
  }

  function renderAssetRow(a, indent) {
    const isAuto = a.mode === 'auto';
    const isRedeeming = a.status === 'redeeming';
    const qtyLabel = a.class === 'ACAO' ? 'ações' : 'cotas';
    const displayName = a.displayName || a.display_name || a.name;
    const autoQuoteLabel = a.price != null
      ? (a.qty || 0) + ' ' + qtyLabel + ' · cotação ' + fmt(a.price)
      : (a.qty || 0) + ' ' + qtyLabel + ' · cotação indisponível';
    let badge = '';
    if (isRedeeming) {
      badge = '<span class="badge badge-resgate">Resgate</span>';
    } else if (isAuto) {
      badge = '<span class="badge badge-auto">Auto</span>';
    } else {
      const stale = a.staleDays != null && a.staleDays > 30;
      badge = `<span class="badge ${stale ? 'badge-manual' : 'badge-manual-ok'}">Manual</span>`;
    }

    let meta = '';
    let subMeta = '';
    if (isRedeeming) {
      meta = isAuto ? autoQuoteLabel : (INST_LABELS[a.institution] || a.institutionName || a.institution);
    } else if (isAuto) {
      meta = autoQuoteLabel;
    }

    if (isAuto || isRedeeming) {
      var extras = [];
      extras.push(INST_LABELS[a.institution] || a.institutionName || a.institution);
      if (a.invested != null) extras.push('Aplicado ' + fmt(a.invested));
      if (a.refDate) extras.push('Ref. compra ' + fmtDate(a.refDate));
      if (a.quoteFetchedAt && a.price != null) extras.push('BRAPI ' + fmtDateTime(a.quoteFetchedAt));
      if (a.contributionCount > 0) extras.push(a.contributionCount + ' ' + (a.contributionCount === 1 ? 'compra' : 'compras'));
      if (extras.length > 0) {
        subMeta = '<div class="asset-meta asset-meta--secondary">' + extras.map(function (part) {
          return '<span>' + part + '</span>';
        }).join('<span>·</span>') + '</div>';
      }
    } else {
      if (a.staleDays != null) {
        const stale = a.staleDays > 30;
        const dayStr = a.staleDays === 1 ? 'há 1 dia' : 'há ' + a.staleDays + ' dias';
        meta = stale ? `<span class="stale-text">${dayStr} — atualize</span>` : dayStr;
      }
    }

    const gain = a.gainPct != null ? `<div class="asset-gain${a.gainPct < 0 ? ' neg' : ''} v">${fmtPct(a.gainPct)}</div>` : '';
    const gainValue = a.gain != null ? `<div class="asset-gain-value${a.gain < 0 ? ' neg' : ''} v">${a.gain >= 0 ? '+' : ''}${fmt(a.gain)}</div>` : '';
    var gainHint = '';
    if (isAuto && a.gain == null) {
      if (a.balance == null) gainHint = '<div class="asset-gain-hint">aguarda cotação</div>';
      else if (a.invested == null || a.invested <= 0) gainHint = '<div class="asset-gain-hint">sem valor aplicado</div>';
    }
    const indentClass = indent ? '' : ' no-indent';

    const instCode = a.institution || 'OUTROS';
    const instDotColor = INST_COLORS[instCode] || INST_COLORS.OUTROS;
    const instDotLetter = (instLabel(a)).charAt(0).toUpperCase();
    const balanceLabel = a.balance != null ? fmt(a.balance) : (isAuto ? 'Cotação pend.' : '—');

    return `<div class="asset-row${indentClass}" data-asset-id="${a.id}" data-asset-mode="${a.mode}" data-asset-status="${a.status}">
      <span class="inst-dot inst-dot--sm" style="background:${instDotColor}">${instDotLetter}</span>
      <div class="asset-info">
        <div class="asset-name">${displayName}</div>
        <div class="asset-meta">${badge}<span>${meta}</span></div>
        ${subMeta}
      </div>
      <div class="asset-right">
        <div class="asset-bal v">${balanceLabel}</div>
        ${gain}
        ${gainValue}
        ${gainHint}
      </div>
      <button class="asset-more" data-more-id="${a.id}" aria-label="Opções">···</button>
    </div>`;
  }

  function renderStackedBar(assets, allGroups, colorMap, gKey) {
    const barEl = document.getElementById('cart-bar');
    if (!barEl) return;
    const total = assets.reduce((s, a) => s + (a.balance || 0), 0);
    if (total === 0) { barEl.innerHTML = ''; return; }

    const groupTotals = {};
    assets.forEach(a => { groupTotals[a[gKey]] = (groupTotals[a[gKey]] || 0) + (a.balance || 0); });

    let segs = Object.entries(groupTotals).sort((a, b) => b[1] - a[1]);
    if (segs.length > 5) {
      const main = segs.slice(0, 4);
      const othersTotal = segs.slice(4).reduce((s, e) => s + e[1], 0);
      segs = [...main, ['_outros', othersTotal]];
    }

    barEl.innerHTML = segs.map(([k, v]) => {
      const pct = (v / total * 100).toFixed(2);
      const color = k === '_outros' ? SEG_COLORS[SEG_COLORS.length - 1] : (colorMap[k] || '#6B7280');
      return `<div class="stacked-seg" style="width:${pct}%;background:${color}" title="${pct}%"></div>`;
    }).join('');
  }

  // ----- Render: Historico -----

  function renderHistorico() {
    const snaps = state.history;
    if (!snaps) return;

    const emptyEl = document.getElementById('hist-empty');
    const chartCard = document.getElementById('chart-card');
    const listEl = document.getElementById('hist-list');

    if (snaps.length === 0) {
      emptyEl.style.display = '';
      chartCard.style.display = 'none';
      listEl.innerHTML = '';
      return;
    }

    emptyEl.style.display = 'none';
    chartCard.style.display = '';

    const selicCapEl = document.getElementById('hist-selic-cap');
    if (selicCapEl) {
      const bm = state.portfolio && state.portfolio.benchmarks;
      if (bm && bm.selic) {
        const selicFmt = bm.selic.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        selicCapEl.textContent = 'Selic atual: ' + selicFmt + '% a.a.';
        selicCapEl.hidden = false;
      } else {
        selicCapEl.hidden = true;
      }
    }

    const ordered = [...snaps].reverse();
    renderHistChart(ordered);

    listEl.innerHTML = snaps.map((s, i) => {
      const gainStr = s.gainPct != null && i < snaps.length - 1
        ? `<span class="hist-gain${s.gainPct < 0 ? ' neg' : ''} v">${fmtPct(s.gainPct)} · ${fmt(s.gain)}</span>`
        : `<span class="hist-gain none">—</span>`;
      return `<div class="hist-row">
        <span class="hist-month">${fmtMonth(s.month)}</span>
        <span class="hist-total v">${fmt(s.total)}</span>
        ${gainStr}
      </div>`;
    }).join('');

    if (state.hide) applyMask();
  }

  function renderHistChart(snaps) {
    const svg = document.getElementById('hist-svg');
    if (!snaps.length) return;

    const W = 320, H = 95, PAD = 10, BOT = 15;
    const chartH = H - BOT;
    const vals = snaps.map(s => s.total);
    const minV = Math.min(...vals);
    const maxV = Math.max(...vals);
    const range = maxV - minV || 1;

    const xOf = i => PAD + (i / Math.max(snaps.length - 1, 1)) * (W - PAD * 2);
    const yOf = v => chartH - ((v - minV) / range) * (chartH - PAD) + PAD / 2;

    const pts = snaps.map((s, i) => `${xOf(i)},${yOf(s.total)}`).join(' ');
    const lastX = xOf(snaps.length - 1);
    const firstX = xOf(0);

    let inner = `<defs>
      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#7FE3B0" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#7FE3B0" stop-opacity="0"/>
      </linearGradient>
    </defs>`;

    if (snaps.length > 1) {
      inner += `<polygon points="${pts} ${lastX},${H} ${firstX},${H}" fill="url(#areaGrad)"/>`;
      var totalLen = 0;
      for (var pi = 1; pi < snaps.length; pi++) {
        var dx = xOf(pi) - xOf(pi - 1), dy = yOf(snaps[pi].total) - yOf(snaps[pi - 1].total);
        totalLen += Math.sqrt(dx * dx + dy * dy);
      }
      var dl = Math.ceil(totalLen);
      inner += `<polyline points="${pts}" fill="none" stroke="#7FE3B0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${dl}" stroke-dashoffset="${dl}" style="animation:qDraw 1.2s ease both .2s"/>`;
    }

    snaps.forEach((s, i) => {
      const x = xOf(i), y = yOf(s.total);
      const r = i === snaps.length - 1 ? 5 : 3.5;
      inner += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#7FE3B0" stroke-width="2"/>`;
      inner += `<circle cx="${x}" cy="${y}" r="14" fill="transparent" style="cursor:pointer" data-idx="${i}"/>`;
    });

    const labelMonths = snaps.length <= 3 ? snaps.map((s, i) => i) : [0, Math.floor(snaps.length / 2), snaps.length - 1];
    labelMonths.forEach(i => {
      inner += `<text x="${xOf(i)}" y="${H + 8}" font-size="9" fill="#9AA5B1" font-family="Inter,sans-serif" text-anchor="middle">${fmtMonth(snaps[i].month)}</text>`;
    });

    svg.innerHTML = inner;

    svg.querySelectorAll('circle[data-idx]').forEach(el => {
      el.addEventListener('click', e => {
        const idx = parseInt(e.target.dataset.idx, 10);
        const s = snaps[idx];
        const tip = document.getElementById('chart-tip');
        tip.textContent = fmtMonth(s.month) + ': ' + fmt(s.total);
        const rect = svg.getBoundingClientRect();
        const scaleX = rect.width / W;
        const scaleY = rect.height / (H + BOT);
        tip.style.left = Math.max(10, Math.min(xOf(idx) * scaleX - 40, rect.width - 150)) + 'px';
        tip.style.top = (yOf(s.total) * scaleY - 32) + 'px';
        tip.classList.add('show');
        setTimeout(() => tip.classList.remove('show'), 2500);
      });
    });
  }

  // ----- Sheet A: Saldo Rapido -----

  function openSheetSaldo(id) {
    const p = state.portfolio;
    if (!p) return;
    const asset = [...(p.assets || []), ...(p.redeeming || [])].find(a => a.id === id);
    if (!asset) return;

    state.editingAssetId = id;
    document.getElementById('sh-saldo-title').textContent = asset.name;

    let subText = '';
    if (asset.balanceUpdatedAt) {
      subText = 'atualizado em ' + fmtDate(asset.balanceUpdatedAt);
      if (asset.staleDays != null && asset.staleDays > 0) subText += ' (' + asset.staleDays + ' dias)';
    }
    document.getElementById('sh-saldo-sub').textContent = subText;
    document.getElementById('sh-saldo-input').value = asset.balance != null ? fmtCompact(asset.balance) : '';
    document.getElementById('sh-saldo-hint').textContent = asset.balance != null ? 'Ultimo: ' + fmt(asset.balance) + (asset.balanceUpdatedAt ? ' · em ' + fmtDate(asset.balanceUpdatedAt) : '') : '';

    openSheet('sheet-saldo');
    setTimeout(() => document.getElementById('sh-saldo-input').focus(), 350);
  }

  async function saveSaldo() {
    const id = state.editingAssetId;
    if (!id) return;
    const raw = document.getElementById('sh-saldo-input').value.replace(/\./g, '').replace(',', '.');
    const val = parseFloat(raw);
    if (isNaN(val) || val < 0) { showToast('Valor inválido'); return; }

    var btn = document.getElementById('sh-saldo-save');
    btnLoading(btn, (async function() {
      try {
        await api('PUT', '/api/assets/' + id, { manual_balance: val });
        if (navigator.vibrate) navigator.vibrate(8);
        closeAllSheets();
        showToast('Saldo salvo — frescor renovado');
        await loadPortfolio();
      } catch (e) {
        if (e.message !== '401') showToast('Erro ao salvar saldo');
      }
    })());
  }

  // ----- Sheet B: Edicao Completa -----

  function openSheetEdit(id) {
    const p = state.portfolio;
    if (!p) return;
    const asset = [...(p.assets || []), ...(p.redeeming || [])].find(a => a.id === id);
    if (!asset) return;

    state.editingAssetId = id;
    state.editingAssetMode = asset.mode;

    document.getElementById('sh-edit-title').textContent = asset.name;

    const subParts = [];
    if (asset.class) subParts.push(CLASS_LABELS[asset.class] || asset.class);
    if (asset.institution) subParts.push(INST_LABELS[asset.institution] || asset.institutionName || asset.institution);
    subParts.push(asset.mode === 'auto' ? 'cotação automática' : 'saldo manual');
    document.getElementById('sh-edit-sub').textContent = subParts.join(' · ');

    const normalEl = document.getElementById('sh-edit-normal');
    const redeemEl = document.getElementById('sh-edit-redeeming');

    if (asset.status === 'redeeming') {
      normalEl.style.display = 'none';
      redeemEl.style.display = '';
    } else if (asset.status === 'sold') {
      showToast('Posição vendida fica somente para consulta histórica.');
      return;
    } else {
      normalEl.style.display = '';
      redeemEl.style.display = 'none';

      var balanceRow = document.getElementById('sh-edit-balance-row');
      if (asset.mode === 'manual') {
        balanceRow.style.display = '';
        document.getElementById('sh-edit-balance-val').textContent = fmt(asset.balance || 0);
      } else {
        balanceRow.style.display = 'none';
      }

      document.getElementById('sh-edit-name').value = asset.name;
      document.getElementById('sh-edit-invested').value = asset.invested != null ? fmtCompact(asset.invested) : '';
      document.getElementById('sh-edit-ticker').value = asset.ticker || '';
      document.getElementById('sh-edit-qty').value = asset.qty != null ? String(asset.qty) : '';

      const tickerRow = document.getElementById('sh-edit-ticker-row');
      const qtyRow = document.getElementById('sh-edit-qty-row');
      tickerRow.style.display = asset.mode === 'auto' ? '' : 'none';
      qtyRow.style.display = asset.mode === 'auto' ? '' : 'none';

      setChipActive(document.getElementById('sh-edit-inst-chips'), asset.institution);
      setChipActive(document.getElementById('sh-edit-class-chips'), asset.class);

      const instNameRow = document.getElementById('sh-edit-inst-name-row');
      instNameRow.classList.toggle('visible', asset.institution === 'OUTROS');
      document.getElementById('sh-edit-inst-name').value = asset.institutionName || '';

      document.getElementById('sh-edit-confirm').style.display = 'none';
      document.getElementById('sh-edit-remove').style.display = '';
    }

    openSheet('sheet-edit');
  }

  async function saveEdit() {
    const id = state.editingAssetId;
    if (!id) return;

    const name = document.getElementById('sh-edit-name').value.trim();
    if (!name) { showToast('Nome obrigatório'); return; }

    const instChip = document.querySelector('#sh-edit-inst-chips .chip.sel');
    const classChip = document.querySelector('#sh-edit-class-chips .chip.sel');
    const institution = instChip ? instChip.dataset.val : null;
    const cls = classChip ? classChip.dataset.val : null;
    const investedRaw = document.getElementById('sh-edit-invested').value.replace(/\./g, '').replace(',', '.');
    const invested = investedRaw ? parseFloat(investedRaw) : null;

    const body = { name, institution, class: cls };
    if (invested != null && !isNaN(invested)) body.invested = invested;
    if (institution === 'OUTROS') body.institution_name = document.getElementById('sh-edit-inst-name').value.trim() || null;

    if (state.editingAssetMode === 'auto') {
      body.ticker = document.getElementById('sh-edit-ticker').value.trim().toUpperCase() || null;
      const qtyRaw = document.getElementById('sh-edit-qty').value.replace(',', '.');
      if (qtyRaw) body.qty = parseFloat(qtyRaw);
    }

    var btn = document.getElementById('sh-edit-save');
    btnLoading(btn, (async function() {
      try {
        await api('PUT', '/api/assets/' + id, body);
        if (navigator.vibrate) navigator.vibrate(8);
        closeAllSheets();
        showToast('Alterações salvas');
        await loadPortfolio();
        if (state.activeTab === 'carteira') renderCarteira();
      } catch (e) {
        if (e.message !== '401') showToast('Erro ao salvar alterações');
      }
    })());
  }

  function askRemove() {
    document.getElementById('sh-edit-confirm').style.display = '';
    document.getElementById('sh-edit-remove').style.display = 'none';
  }

  function cancelRemove() {
    document.getElementById('sh-edit-confirm').style.display = 'none';
    document.getElementById('sh-edit-remove').style.display = '';
  }

  async function confirmRemove() {
    const id = state.editingAssetId;
    if (!id) return;
    try {
      await api('DELETE', '/api/assets/' + id);
      if (navigator.vibrate) navigator.vibrate(8);
      closeAllSheets();
      showToast('Ativo removido');
      await loadPortfolio();
      if (state.activeTab === 'carteira') renderCarteira();
    } catch (e) {
      if (e.message !== '401') showToast('Erro ao remover ativo');
    }
  }

  async function redeemMarkActive() {
    const id = state.editingAssetId;
    if (!id) return;
    try {
      await api('POST', '/api/assets/' + id + '/exit/cancel', {});
      closeAllSheets();
      showToast('Saída cancelada');
      await loadPortfolio();
      if (detailAssetId === id) await loadDetail(id);
    } catch (e) {
      if (e.message !== '401') showToast('Erro ao alterar status');
    }
  }

  // ----- Sheet C: Novo Ativo -----

  function setAddFieldsByClass(cls) {
    var isAuto = isAutoClass(cls);
    var isCvm  = cls === 'FUNDO';
    document.getElementById('sh-add-fields-auto').style.display   = isAuto            ? '' : 'none';
    document.getElementById('sh-add-fields-cvm').style.display    = isCvm             ? '' : 'none';
    document.getElementById('sh-add-fields-manual').style.display = (!isAuto && !isCvm) ? '' : 'none';
    if (!isCvm) {
      state._selectedFund = null;
      document.getElementById('sh-add-fund-search').value = '';
      document.getElementById('sh-add-fund-results').style.display = 'none';
      document.getElementById('sh-add-fund-selected').style.display = 'none';
      var searchField = document.getElementById('sh-add-fund-search').parentElement;
      if (searchField) searchField.style.display = '';
    }
  }

  function openSheetAdd() {
    setChipActive(document.getElementById('sh-add-inst-chips'), 'XP');
    setChipActive(document.getElementById('sh-add-class-chips'), 'ACAO');
    document.getElementById('sh-add-inst-name-row').classList.remove('visible');
    document.getElementById('sh-add-inst-name').value = '';
    document.getElementById('sh-add-auto-name').value = '';
    document.getElementById('sh-add-ticker').value = '';
    document.getElementById('sh-add-qty').value = '';
    document.getElementById('sh-add-auto-invested').value = '';
    var purchaseDateEl = document.getElementById('sh-add-purchase-date');
    if (purchaseDateEl) {
      var today = new Date().toISOString().slice(0, 10);
      purchaseDateEl.value = today;
      purchaseDateEl.setAttribute('max', today);
    }
    document.getElementById('sh-add-manual-name').value = '';
    document.getElementById('sh-add-balance').value = '';
    document.getElementById('sh-add-manual-invested').value = '';
    document.getElementById('sh-add-cvm-balance').value = '';
    document.getElementById('sh-add-cvm-invested').value = '';
    document.getElementById('sh-add-dup-warn').style.display = 'none';
    setAddFieldsByClass('ACAO');
    openSheet('sheet-add');
  }

  // ----- CVM Fund search -----

  let _fundSearchTimer = null;

  function onFundSearchInput() {
    var q = document.getElementById('sh-add-fund-search').value.trim();
    var resultsEl = document.getElementById('sh-add-fund-results');

    clearTimeout(_fundSearchTimer);

    if (q.length < 3) {
      resultsEl.style.display = 'none';
      resultsEl.innerHTML = '';
      return;
    }

    _fundSearchTimer = setTimeout(async function () {
      try {
        var data = await api('GET', '/api/funds/search?q=' + encodeURIComponent(q));
        var funds = data.results || [];
        var html = '';

        if (funds.length === 0) {
          html = '<div class="fund-result-item" style="cursor:default;color:var(--slate);font-size:12px">Nenhum fundo encontrado</div>';
        } else {
          funds.forEach(function (f) {
            var displayName = f.name && f.name.length > 60 ? f.name.substring(0, 60) + '...' : (f.name || '');
            html += '<div class="fund-result-item" data-cnpj="' + (f.cnpj || '') + '" data-name="' + (f.name || '').replace(/"/g, '&quot;') + '" data-manager="' + (f.manager || '').replace(/"/g, '&quot;') + '">'
              + '<div class="fund-result-name">' + displayName + '</div>'
              + (f.manager ? '<div class="fund-result-manager">' + f.manager + '</div>' : '')
              + '<div class="fund-result-cnpj">' + (f.cnpj || '') + '</div>'
              + '</div>';
          });
        }

        resultsEl.innerHTML = html;
        resultsEl.style.display = '';

        resultsEl.querySelectorAll('.fund-result-item').forEach(function (item) {
          if (!item.dataset.cnpj) return;
          item.addEventListener('click', function () {
            selectFund({
              cnpj: item.dataset.cnpj,
              name: item.dataset.name,
              manager: item.dataset.manager
            });
          });
        });

      } catch (e) {
        if (e.message !== '401') showToast('Erro ao buscar fundos');
      }
    }, 300);
  }

  function selectFund(fund) {
    state._selectedFund = fund;
    document.getElementById('sh-add-fund-search').parentElement.style.display = 'none';
    document.getElementById('sh-add-fund-results').style.display = 'none';
    document.getElementById('sh-add-fund-name').textContent = fund.name;
    document.getElementById('sh-add-fund-cnpj').textContent = fund.cnpj;
    document.getElementById('sh-add-fund-selected').style.display = '';
    document.getElementById('sh-add-cvm-balance').focus();
  }

  function clearFundSelection() {
    state._selectedFund = null;
    document.getElementById('sh-add-fund-selected').style.display = 'none';
    var searchField = document.getElementById('sh-add-fund-search').parentElement;
    searchField.style.display = '';
    document.getElementById('sh-add-fund-search').value = '';
    document.getElementById('sh-add-fund-results').style.display = 'none';
    document.getElementById('sh-add-fund-search').focus();
  }

  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => Array.from({ length: n + 1 }, (_, j) => j === 0 ? i : 0));
    for (let j = 1; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
    return dp[m][n];
  }

  function checkDuplicate(name, institution) {
    const p = state.portfolio;
    if (!p) return false;
    return (p.assets || []).some(a => a.institution === institution && levenshtein(a.name.toLowerCase(), name.toLowerCase()) <= 3);
  }

  async function saveAdd() {
    const instChip = document.querySelector('#sh-add-inst-chips .chip.sel');
    const classChip = document.querySelector('#sh-add-class-chips .chip.sel');
    const institution = instChip ? instChip.dataset.val : 'XP';
    const cls = classChip ? classChip.dataset.val : 'ACAO';

    const isCvm  = cls === 'FUNDO' && !!state._selectedFund;
    const isAuto = isAutoClass(cls);

    let name;
    if (isCvm) {
      name = state._selectedFund.name;
    } else if (isAuto) {
      name = document.getElementById('sh-add-auto-name').value.trim();
    } else {
      name = document.getElementById('sh-add-manual-name').value.trim();
    }

    if (!name) { showToast('Nome obrigatório'); return; }

    if (checkDuplicate(name, institution)) {
      const warn = document.getElementById('sh-add-dup-warn');
      warn.textContent = 'Nome parecido com ativo existente na mesma instituição. Verifique antes de adicionar.';
      warn.style.display = '';
    }

    const body = { institution, class: cls, name };
    if (institution === 'OUTROS') body.institution_name = document.getElementById('sh-add-inst-name').value.trim() || null;

    if (isCvm) {
      body.cvm_cnpj = state._selectedFund.cnpj;
      const balRaw = document.getElementById('sh-add-cvm-balance').value.replace(/\./g, '').replace(',', '.');
      const bal = parseFloat(balRaw);
      if (isNaN(bal) || bal <= 0) { showToast('Saldo atual obrigatório'); return; }
      body.initial_balance = bal;
      const invRaw = document.getElementById('sh-add-cvm-invested').value.replace(/\./g, '').replace(',', '.');
      if (invRaw) body.invested = parseFloat(invRaw);
    } else if (isAuto) {
      body.ticker = document.getElementById('sh-add-ticker').value.trim().toUpperCase();
      const qtyRaw = document.getElementById('sh-add-qty').value.replace(',', '.');
      body.qty = parseFloat(qtyRaw) || 0;
      const invRaw = document.getElementById('sh-add-auto-invested').value.replace(/\./g, '').replace(',', '.');
      if (invRaw) body.invested = parseFloat(invRaw);
      const purchaseDate = document.getElementById('sh-add-purchase-date').value;
      if (purchaseDate) body.purchase_date = purchaseDate + 'T12:00:00Z';
    } else {
      const balRaw = document.getElementById('sh-add-balance').value.replace(/\./g, '').replace(',', '.');
      body.manual_balance = parseFloat(balRaw) || 0;
      const invRaw = document.getElementById('sh-add-manual-invested').value.replace(/\./g, '').replace(',', '.');
      if (invRaw) body.invested = parseFloat(invRaw);
    }

    var btn = document.getElementById('sh-add-save');
    btnLoading(btn, (async function() {
      try {
        await api('POST', '/api/assets', body);
        if (navigator.vibrate) navigator.vibrate(8);
        closeAllSheets();
        showToast('Ativo adicionado');
        await loadPortfolio();
        if (state.activeTab === 'carteira') renderCarteira();
      } catch (e) {
        if (e.message !== '401') showToast('Erro ao adicionar ativo');
      }
    })());
  }

  // ----- Chip helpers -----

  function setChipActive(container, val) {
    if (!container) return;
    container.querySelectorAll('.chip').forEach(c => c.classList.toggle('sel', c.dataset.val === val));
  }

  function bindChipGroup(containerId, onSelect) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.querySelectorAll('.chip').forEach(c => {
      c.addEventListener('click', () => {
        el.querySelectorAll('.chip').forEach(x => x.classList.remove('sel'));
        c.classList.add('sel');
        if (onSelect) onSelect(c.dataset.val);
      });
    });
  }

  // ----- Import -----

  let sheetjsLoaded = false;

  function initImport() {
    if (sheetjsLoaded) return;
  }

  function loadSheetJS(cb) {
    if (typeof XLSX !== 'undefined') { cb(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
    script.onload = cb;
    script.onerror = () => showToast('Erro ao carregar parser de planilha');
    document.head.appendChild(script);
  }

  function goImportStep(n) {
    [1, 2, 3].forEach(i => {
      const step = document.getElementById('imp-step' + i);
      const ws = document.getElementById('ws-' + i);
      if (step) step.style.display = i === n ? '' : 'none';
      if (ws) {
        ws.classList.remove('active', 'done');
        if (i < n) ws.classList.add('done');
        if (i === n) ws.classList.add('active');
      }
    });
  }

  function handleFile(file) {
    if (!file) return;
    state.importFileName = file.name;
    state.importFileSize = file.size;
    document.getElementById('file-name').textContent = file.name;
    document.getElementById('file-size').textContent = (file.size / 1024).toFixed(1) + ' KB';
    document.getElementById('file-info').style.display = '';
    document.getElementById('dropzone').style.display = 'none';
    document.getElementById('btn-process').style.display = '';

    document.getElementById('process-btn').onclick = () => {
      document.getElementById('btn-process').style.display = 'none';
      document.getElementById('imp-processing').style.display = '';
      loadSheetJS(() => parseFile(file));
    };
  }

  function parseFile(file) {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const items = [];
        const SHEET_CLASSES = {
          'Acoes/FIIs': null, 'Acoes-FIIs': null, 'Fundos': 'FUNDO', 'Previdencia': 'PREVIDENCIA',
          'Tesouro': 'TESOURO', 'Renda Fixa': 'RF', 'Poupanca': 'POUPANCA', 'Cofrinhos': 'COFRINHO'
        };

        function parseImportClass(rawValue, fallbackSheetClass, ticker, name) {
          var raw = rawValue ? String(rawValue).trim().toUpperCase() : '';
          if (raw === 'FII' || raw === 'FIIS') return 'FII';
          if (raw === 'ACAO' || raw === 'AÇÃO' || raw === 'ACOES' || raw === 'AÇÕES' || raw === 'BDR') return 'ACAO';
          if (fallbackSheetClass) return fallbackSheetClass;
          var tickerValue = ticker || '';
          var nameValue = (name || '').toUpperCase();
          if (nameValue.includes('FII') || nameValue.includes('FUNDO IMOB')) return 'FII';
          if (/^[A-Z]{4}11$/.test(tickerValue)) return 'FII';
          return 'ACAO';
        }

        function getRowValue(row, keys) {
          for (var i = 0; i < keys.length; i++) {
            if (row[keys[i]] !== undefined && row[keys[i]] !== null && row[keys[i]] !== '') return row[keys[i]];
          }
          return null;
        }

        function normalizeImportNumber(rawValue) {
          if (rawValue === null || rawValue === undefined || rawValue === '') return null;
          if (typeof rawValue === 'number') return Number.isFinite(rawValue) ? rawValue : null;
          var text = String(rawValue).trim();
          if (!text) return null;
          if (text.indexOf(',') >= 0) {
            text = text.replace(/\./g, '').replace(',', '.');
          }
          var parsed = parseFloat(text);
          return Number.isFinite(parsed) ? parsed : null;
        }

        function normalizeImportDate(rawValue) {
          if (rawValue === null || rawValue === undefined || rawValue === '') return { value: null, issue: null };
          if (typeof rawValue === 'number' && typeof XLSX !== 'undefined' && XLSX.SSF && XLSX.SSF.parse_date_code) {
            var parts = XLSX.SSF.parse_date_code(rawValue);
            if (!parts || !parts.y || !parts.m || !parts.d) return { value: null, issue: 'Data de compra inválida' };
            var excelDate = new Date(Date.UTC(parts.y, parts.m - 1, parts.d, 12, 0, 0));
            return excelDate.getTime() > Date.now()
              ? { value: null, issue: 'Data de compra não pode ficar no futuro' }
              : { value: excelDate.toISOString(), issue: null };
          }
          var text = String(rawValue).trim();
          if (!text) return { value: null, issue: null };
          var isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (isoMatch) {
            var isoDate = new Date(Date.UTC(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]), 12, 0, 0));
            return isoDate.getTime() > Date.now()
              ? { value: null, issue: 'Data de compra não pode ficar no futuro' }
              : { value: isoDate.toISOString(), issue: null };
          }
          var brMatch = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
          if (brMatch) {
            var brDate = new Date(Date.UTC(Number(brMatch[3]), Number(brMatch[2]) - 1, Number(brMatch[1]), 12, 0, 0));
            if (Number.isNaN(brDate.getTime())) return { value: null, issue: 'Data de compra inválida' };
            return brDate.getTime() > Date.now()
              ? { value: null, issue: 'Data de compra não pode ficar no futuro' }
              : { value: brDate.toISOString(), issue: null };
          }
          var parsed = new Date(text);
          if (Number.isNaN(parsed.getTime())) return { value: null, issue: 'Data de compra inválida' };
          var normalized = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate(), 12, 0, 0));
          return normalized.getTime() > Date.now()
            ? { value: null, issue: 'Data de compra não pode ficar no futuro' }
            : { value: normalized.toISOString(), issue: null };
        }

        function parseImportStatus(rawValue) {
          if (rawValue === null || rawValue === undefined || rawValue === '') {
            return { status: 'active', issue: null };
          }
          var raw = String(rawValue).trim().toUpperCase();
          if (!raw) return { status: 'active', issue: null };
          if (raw === 'ACTIVE' || raw === 'ATIVO') return { status: 'active', issue: null };
          if (raw === 'REDEEMING' || raw === 'EM RESGATE' || raw === 'RESGATE' || raw === 'RESGATANDO') {
            return { status: 'redeeming', issue: null };
          }
          if (raw === 'ARCHIVED' || raw === 'ARQUIVADO' || raw === 'SOLD' || raw === 'VENDIDO') {
            return { status: 'active', issue: 'Situação não suportada no import' };
          }
          return { status: 'active', issue: 'Situação inválida' };
        }

        wb.SheetNames.forEach(sheetName => {
          const cls = SHEET_CLASSES[sheetName];
          const ws = wb.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(ws, { defval: null });
          rows.forEach(row => {
            const rawName = getRowValue(row, ['Nome']);
            const rawTicker = getRowValue(row, ['Ticker']);
            if (!rawName && !rawTicker) return;
            const ticker = rawTicker ? String(rawTicker).trim().toUpperCase() : null;
            const rawInstName = getRowValue(row, ['Instituicao', 'Instituição']);
            const rawInst = rawInstName ? String(rawInstName).trim().toUpperCase() : 'OUTROS';
            const knownInst = ['XP', 'ITAU', 'ONZE'];
            const institution = knownInst.includes(rawInst) ? rawInst : 'OUTROS';
            const institutionName = institution === 'OUTROS' ? (rawInstName || null) : null;
            const rawStatus = parseImportStatus(getRowValue(row, ['Situacao', 'Situação', 'Status']));
            const rawPurchaseDate = normalizeImportDate(getRowValue(row, ['Data Compra', 'Data da Compra', 'Data Aquisição', 'Data Aquisicao', 'Compra em']));
            const issues = [];

            const item = {
              institution,
              institutionName,
              class: parseImportClass(getRowValue(row, ['Classe', 'Tipo']), cls, ticker, rawName),
              status: rawStatus.status,
              name: rawName ? String(rawName).trim() : (ticker || ''),
              ticker,
              qty: normalizeImportNumber(getRowValue(row, ['Quantidade'])),
              manual_balance: normalizeImportNumber(getRowValue(row, ['Saldo Atual'])),
              invested: normalizeImportNumber(getRowValue(row, ['Valor Aplicado'])),
              purchase_date: rawPurchaseDate.value,
              _status: 'ok',
              _issues: issues
            };

            if (!item.name) issues.push('Nome ausente');
            if (rawStatus.issue) issues.push(rawStatus.issue);
            if (rawPurchaseDate.issue) issues.push(rawPurchaseDate.issue);
            if (item.ticker && item.qty == null) issues.push('Quantidade obrigatória para ativo com ticker');
            if (!item.ticker && item.manual_balance == null) issues.push('Saldo atual obrigatório para ativo sem ticker');
            if (issues.length > 0) item._status = 'err';

            items.push(item);
          });
        });

        state.importParsed = items;
        smartClassifyImport(items).then(function() {
          document.getElementById('imp-processing').style.display = 'none';
          renderImportReview(items, file.name);
          goImportStep(2);
        });
      } catch (err) {
        document.getElementById('imp-processing').style.display = 'none';
        document.getElementById('btn-process').style.display = '';
        showToast('Erro ao processar planilha');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function smartClassifyImport(items) {
    try {
      var payload = items.slice(0, 50).map(function(it) {
        return { name: it.name, ticker: it.ticker || undefined, institution: it.institution || undefined };
      });
      var data = await api('POST', '/api/import/analyze', { items: payload });
      var suggestions = data.suggestions || [];
      suggestions.forEach(function(s) {
        if (s.index >= 0 && s.index < items.length && s.class) {
          items[s.index]._aiClass = s.class;
          items[s.index]._aiConfidence = s.confidence || 0.5;
          if (!items[s.index]._userClass) {
            items[s.index].class = s.class;
          }
        }
      });
    } catch (e) {
      // Fallback: keep existing classes
    }
  }

  function renderImportReview(items, fileName) {
    document.getElementById('imp-file-info').textContent = fileName + ' · ' + items.length + ' ativos encontrados';
    const ok = items.filter(i => i._status === 'ok').length;
    const err = items.filter(i => i._status === 'err').length;

    const html = `<table class="review-table">
      <thead><tr><th>Nome</th><th>Classe</th><th>Situação</th><th>Compra</th><th>Saldo</th><th>Diagnóstico</th><th></th></tr></thead>
      <tbody>${items.map((item, idx) => {
        const badge = item._status === 'ok' ? '<span class="badge-ok">OK</span>' :
                      item._status === 'warn' ? '<span class="badge-warn">ALERTA</span>' :
                      '<span class="badge-err">ERRO</span>';
        const aiBadge = item._aiClass ? (item._aiConfidence >= 0.8 ? '<span class="badge-ai">✦ IA</span>' : '<span class="badge-ai low">✦ IA?</span>') : '';
        const issues = item._issues && item._issues.length ? item._issues.join(' · ') : 'Pronto para importar';
        const purchaseDate = item.purchase_date ? fmtDate(item.purchase_date) : '—';
        const bal = item.ticker
          ? (item.qty ? item.qty + (item.class === 'ACAO' ? ' ações' : ' cotas') : '—')
          : (item.manual_balance != null ? fmt(item.manual_balance) : '—');
        return `<tr>
          <td>${item.name || '—'}</td>
          <td>${CLASS_LABELS[item.class] || item.class || '—'} ${aiBadge}</td>
          <td>${IMPORT_STATUS_LABELS[item.status] || item.status || '—'}</td>
          <td>${purchaseDate}</td>
          <td class="v">${bal}</td>
          <td>${issues}</td>
          <td>${badge} <button class="remove-row-btn" data-idx="${idx}" aria-label="Remover">×</button></td>
        </tr>`;
      }).join('')}</tbody>
    </table>`;

    document.getElementById('imp-review-list').innerHTML = html;
    document.getElementById('imp-review-list').querySelectorAll('[data-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx, 10);
        state.importParsed.splice(idx, 1);
        renderImportReview(state.importParsed, state.importFileName);
      });
    });

    document.getElementById('imp-counts').innerHTML =
      `<span style="color:var(--verde)">${ok} prontos</span>` +
      (err > 0 ? ` · <span style="color:var(--red)">${err} com erro</span>` : '');

    const validItems = state.importParsed.filter(i => i._status === 'ok');
    document.getElementById('imp-continue-btn').textContent = 'Continuar com ' + validItems.length + ' ' + (validItems.length === 1 ? 'ativo' : 'ativos');
  }

  function renderImportConfirm() {
    const items = state.importParsed.filter(i => i._status === 'ok');
    const ignored = state.importParsed.filter(i => i._status !== 'ok').length;

    const instCounts = {};
    const classCounts = {};
    items.forEach(it => {
      const inst = it.institutionName || INST_LABELS[it.institution] || it.institution;
      instCounts[inst] = (instCounts[inst] || 0) + 1;
      const cls = CLASS_LABELS[it.class] || it.class;
      classCounts[cls] = (classCounts[cls] || 0) + 1;
    });
    const statusCounts = {};
    items.forEach(it => {
      const label = IMPORT_STATUS_LABELS[it.status] || it.status || '—';
      statusCounts[label] = (statusCounts[label] || 0) + 1;
    });

    document.getElementById('imp-summary').innerHTML = `<div class="cs-row">
      <div class="cs-item"><div class="cs-num" style="color:var(--verde)">${items.length}</div><div class="cs-label">serão criados</div></div>
      ${ignored > 0 ? `<div class="cs-item"><div class="cs-num" style="color:var(--red)">${ignored}</div><div class="cs-label">ignorados</div></div>` : ''}
    </div>`;

    const instStr = Object.entries(instCounts).map(([k, v]) => `${k}: ${v}`).join(' · ');
    const clsStr = Object.entries(classCounts).map(([k, v]) => `${k}: ${v}`).join(' · ');
    const statusStr = Object.entries(statusCounts).map(([k, v]) => `${k}: ${v}`).join(' · ');
    document.getElementById('imp-breakdown').innerHTML =
      `<strong>Por instituição:</strong> ${instStr}<br><strong>Por classe:</strong> ${clsStr}<br><strong>Por situação:</strong> ${statusStr}`;
  }

  async function confirmImport() {
    const items = state.importParsed.filter(i => i._status === 'ok').map(it => {
      const clean = { institution: it.institution, class: it.class, name: it.name, status: it.status || 'active' };
      if (it.institutionName) clean.institution_name = it.institutionName;
      if (it.ticker) { clean.ticker = it.ticker; if (it.qty) clean.qty = it.qty; }
      else if (it.manual_balance != null) clean.manual_balance = it.manual_balance;
      if (it.invested != null) clean.invested = it.invested;
      if (it.purchase_date) clean.purchase_date = it.purchase_date;
      return clean;
    });

    if (items.length === 0) { showToast('Nenhum ativo válido para importar'); return; }

    var btn = document.getElementById('imp-confirm-btn');
    btnLoading(btn, (async function() {
      try {
        const res = await api('POST', '/api/import', { items });
        if (navigator.vibrate) navigator.vibrate(8);
        goImportStep(1);
        resetImportStep1();
        showToast((res.created || items.length) + ' ativos importados com sucesso');
        await loadPortfolio();
        switchTab('carteira');
      } catch (e) {
        if (e.message !== '401') showToast('Erro ao importar ativos');
      }
    })());
  }

  function resetImportStep1() {
    document.getElementById('dropzone').style.display = '';
    document.getElementById('file-info').style.display = 'none';
    document.getElementById('btn-process').style.display = 'none';
    document.getElementById('imp-processing').style.display = 'none';
    document.getElementById('file-input').value = '';
    state.importParsed = [];
    state.importFileName = '';
  }

  // ----- AI Analysis -----

  function escHtml(str) {
    var d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  async function openAnalyze(context, assetId) {
    var titleEl = document.getElementById('sh-analyze-title');
    titleEl.textContent = context === 'asset' ? 'Análise do Ativo' : 'Análise da Carteira';
    document.getElementById('sh-analyze-loading').style.display = '';
    document.getElementById('sh-analyze-result').style.display = 'none';
    document.getElementById('sh-analyze-disclaimer').style.display = 'none';
    openSheet('sheet-analyze');

    try {
      var body = context === 'asset' ? { context: 'asset', asset_id: assetId } : { context: 'portfolio' };
      var data = await api('POST', '/api/ai/analyze', body);
      var resultEl = document.getElementById('sh-analyze-result');
      var html = '';
      var obs = data.observations || [];
      obs.forEach(function(o) {
        html += '<div class="analyze-obs"><span class="analyze-tone ' + (o.tone || 'neutral') + '"></span><span class="analyze-obs-text">' + escHtml(o.text) + '</span></div>';
      });
      if (obs.length === 0) {
        html = '<div style="text-align:center;color:var(--slate);padding:16px">Não foi possível gerar observações.</div>';
      }
      resultEl.innerHTML = html;
      document.getElementById('sh-analyze-loading').style.display = 'none';
      resultEl.style.display = '';
      var disclaimerEl = document.getElementById('sh-analyze-disclaimer');
      disclaimerEl.textContent = data.disclaimer || '';
      disclaimerEl.style.display = '';
    } catch (e) {
      document.getElementById('sh-analyze-loading').style.display = 'none';
      var resultEl2 = document.getElementById('sh-analyze-result');
      resultEl2.innerHTML = '<div style="text-align:center;color:var(--vinho);padding:16px">Erro ao analisar. Tente novamente.</div>';
      resultEl2.style.display = '';
    }
  }

  // ----- Event wiring -----

  function wire() {
    applyMasks();

    document.getElementById('eye-btn').addEventListener('click', toggleHide);
    document.getElementById('dark-btn').addEventListener('click', toggleDark);
    document.getElementById('logout-btn').addEventListener('click', logout);

    document.getElementById('login-btn').addEventListener('click', doLogin);
    document.getElementById('register-btn').addEventListener('click', doRegister);
    document.getElementById('show-register').addEventListener('click', function (e) {
      e.preventDefault(); hideLoginError();
      document.getElementById('login-form').style.display = 'none';
      document.getElementById('register-form').style.display = '';
    });
    document.getElementById('show-login').addEventListener('click', function (e) {
      e.preventDefault(); hideLoginError();
      document.getElementById('register-form').style.display = 'none';
      document.getElementById('login-form').style.display = '';
    });
    document.getElementById('show-recover').addEventListener('click', function(e) { e.preventDefault(); showRecoverForm(); });
    document.getElementById('show-recover-from-reg').addEventListener('click', function(e) { e.preventDefault(); showRecoverForm(); });
    document.getElementById('show-login-from-recover').addEventListener('click', function(e) {
      e.preventDefault(); hideLoginError();
      document.getElementById('recover-form').style.display = 'none';
      document.getElementById('login-form').style.display = '';
    });
    document.getElementById('recover-btn').addEventListener('click', doRecover);
    document.getElementById('rec-password').addEventListener('keydown', function(e) { if (e.key === 'Enter') doRecover(); });

    document.getElementById('login-password').addEventListener('keydown', function (e) { if (e.key === 'Enter') doLogin(); });
    document.getElementById('reg-password').addEventListener('keydown', function (e) { if (e.key === 'Enter') doRegister(); });

    document.getElementById('sheet-overlay').addEventListener('click', closeAllSheets);

    TABS.forEach(tab => {
      document.getElementById('tab-' + tab).addEventListener('click', () => switchTab(tab));
    });

    document.getElementById('fresh-card').addEventListener('click', () => switchTab('carteira'));

    document.getElementById('dt-inst').addEventListener('click', () => {
      state.donutMode = 'institution';
      localStorage.setItem('quanto-donut-mode', 'institution');
      document.getElementById('dt-inst').classList.add('sel');
      document.getElementById('dt-class').classList.remove('sel');
      renderDonut();
    });

    document.getElementById('dt-class').addEventListener('click', () => {
      state.donutMode = 'class';
      localStorage.setItem('quanto-donut-mode', 'class');
      document.getElementById('dt-class').classList.add('sel');
      document.getElementById('dt-inst').classList.remove('sel');
      renderDonut();
    });

    document.getElementById('ct-inst').addEventListener('click', () => {
      state.groupMode = 'institution';
      state.filter = 'todos';
      localStorage.setItem('quanto-group-mode', 'institution');
      localStorage.setItem('quanto-filter', 'todos');
      document.getElementById('ct-inst').classList.add('sel');
      document.getElementById('ct-class').classList.remove('sel');
      renderCarteira();
    });

    document.getElementById('ct-class').addEventListener('click', () => {
      state.groupMode = 'class';
      state.filter = 'todos';
      localStorage.setItem('quanto-group-mode', 'class');
      localStorage.setItem('quanto-filter', 'todos');
      document.getElementById('ct-class').classList.add('sel');
      document.getElementById('ct-inst').classList.remove('sel');
      renderCarteira();
    });

    var cartSearchEl = document.getElementById('cart-search');
    var searchTimer = null;
    cartSearchEl.addEventListener('input', function() {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function() {
        state.searchTerm = cartSearchEl.value;
        renderCarteira();
      }, 150);
    });

    document.getElementById('fab-add').addEventListener('click', openSheetAdd);
    document.getElementById('cart-add-first') && document.getElementById('cart-add-first').addEventListener('click', openSheetAdd);
    document.getElementById('hoje-add-btn') && document.getElementById('hoje-add-btn').addEventListener('click', function() { switchTab('carteira'); openSheetAdd(); });
    document.getElementById('hoje-import-btn') && document.getElementById('hoje-import-btn').addEventListener('click', function() { switchTab('importar'); });
    document.getElementById('cart-import-btn') && document.getElementById('cart-import-btn').addEventListener('click', function() { switchTab('importar'); });
    document.getElementById('cart-clear-filter') && document.getElementById('cart-clear-filter').addEventListener('click', () => {
      state.filter = 'todos';
      localStorage.setItem('quanto-filter', 'todos');
      renderCarteira();
    });

    document.getElementById('sh-saldo-save').addEventListener('click', saveSaldo);
    document.getElementById('sh-saldo-cancel').addEventListener('click', closeAllSheets);

    document.getElementById('sh-edit-save').addEventListener('click', saveEdit);
    document.getElementById('sh-edit-update-saldo').addEventListener('click', function() {
      var id = state.editingAssetId;
      closeAllSheets();
      if (id) openSheetSaldo(id);
    });
    document.getElementById('sh-edit-remove').addEventListener('click', askRemove);
    document.getElementById('sh-edit-confirm-cancel').addEventListener('click', cancelRemove);
    document.getElementById('sh-edit-confirm-ok').addEventListener('click', confirmRemove);
    document.getElementById('sh-redeem-remove').addEventListener('click', openSaleSheetFromEdit);
    document.getElementById('sh-redeem-back').addEventListener('click', redeemMarkActive);
    document.getElementById('sh-redeem-keep').addEventListener('click', closeAllSheets);

    document.getElementById('sh-add-save').addEventListener('click', saveAdd);
    document.getElementById('sh-add-cancel').addEventListener('click', closeAllSheets);
    document.getElementById('sh-sale-save').addEventListener('click', confirmSale);
    document.getElementById('sh-sale-cancel').addEventListener('click', closeAllSheets);

    bindChipGroup('sh-edit-inst-chips', val => {
      document.getElementById('sh-edit-inst-name-row').classList.toggle('visible', val === 'OUTROS');
    });
    bindChipGroup('sh-edit-class-chips', null);

    bindChipGroup('sh-add-inst-chips', val => {
      document.getElementById('sh-add-inst-name-row').classList.toggle('visible', val === 'OUTROS');
    });
    bindChipGroup('sh-add-class-chips', function (val) {
      setAddFieldsByClass(val);
    });

    document.getElementById('sh-add-fund-search').addEventListener('input', onFundSearchInput);
    document.getElementById('sh-add-fund-clear').addEventListener('click', clearFundSelection);

    const donutToggle = state.donutMode === 'institution' ? 'dt-inst' : 'dt-class';
    document.getElementById(donutToggle).classList.add('sel');
    document.getElementById(donutToggle === 'dt-inst' ? 'dt-class' : 'dt-inst').classList.remove('sel');

    const groupToggle = state.groupMode === 'institution' ? 'ct-inst' : 'ct-class';
    document.getElementById(groupToggle).classList.add('sel');
    document.getElementById(groupToggle === 'ct-inst' ? 'ct-class' : 'ct-inst').classList.remove('sel');

    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');

    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
    dropzone.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    });

    fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) handleFile(file);
    });

    document.getElementById('imp-back-btn').addEventListener('click', () => {
      goImportStep(1);
      resetImportStep1();
    });

    document.getElementById('imp-continue-btn').addEventListener('click', () => {
      renderImportConfirm();
      goImportStep(3);
    });

    document.getElementById('imp-review-back-btn').addEventListener('click', () => goImportStep(2));
    document.getElementById('imp-confirm-btn').addEventListener('click', confirmImport);

    // Detail screen
    var detailBackBtn = document.getElementById('detail-back-btn');
    if (detailBackBtn) detailBackBtn.addEventListener('click', function () { closeDetail(); });
    var detailEditBtn = document.getElementById('detail-edit-btn');
    if (detailEditBtn) detailEditBtn.addEventListener('click', function () { openSheetEditFromDetail(); });

    // Sheet Aporte (Sheet E)
    var shAporteSave = document.getElementById('sh-aporte-save');
    if (shAporteSave) shAporteSave.addEventListener('click', saveAporte);
    var shAporteCancel = document.getElementById('sh-aporte-cancel');
    if (shAporteCancel) shAporteCancel.addEventListener('click', closeSheetAporte);
    var shAporteAmount = document.getElementById('sh-aporte-amount');
    if (shAporteAmount) maskCurrency(shAporteAmount);

    // Sheet Bem (Sheet F)
    var shBemSave = document.getElementById('sh-bem-save');
    if (shBemSave) shBemSave.addEventListener('click', saveBem);
    var shBemCancel = document.getElementById('sh-bem-cancel');
    if (shBemCancel) shBemCancel.addEventListener('click', closeSheetBem);
    var shBemValue = document.getElementById('sh-bem-value');
    if (shBemValue) maskCurrency(shBemValue);
    // Bind bem type chips
    document.querySelectorAll('#sh-bem-type-chips .bem-type-chip').forEach(function (chip) {
      chip.addEventListener('click', function () { selectBemType(chip.dataset.type); });
    });
    // Bind property type chips
    document.querySelectorAll('#sh-bem-property-chips .chip').forEach(function (chip) {
      chip.addEventListener('click', function () { selectPropertyType(chip.dataset.val); });
    });
    // Bind vehicle type chips
    document.querySelectorAll('#sh-bem-vehicle-chips .chip').forEach(function (chip) {
      chip.addEventListener('click', function () { selectVehicleType(chip.dataset.val); });
    });
    // FAB for bens tab
    var fabBemAdd = document.getElementById('fab-bem-add');
    if (fabBemAdd) fabBemAdd.addEventListener('click', openSheetBem);
    var bensAddFirst = document.getElementById('bens-add-first');
    if (bensAddFirst) bensAddFirst.addEventListener('click', openSheetBem);

    // AI Analysis
    var btnAnalyzePortfolio = document.getElementById('btn-analyze-portfolio');
    if (btnAnalyzePortfolio) btnAnalyzePortfolio.addEventListener('click', function() { openAnalyze('portfolio'); });
    var shAnalyzeClose = document.getElementById('sh-analyze-close');
    if (shAnalyzeClose) shAnalyzeClose.addEventListener('click', closeAllSheets);

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (localStorage.getItem('quanto-dark') == null) {
        document.documentElement.classList.toggle('dark', e.matches);
        updateDarkIcons(e.matches);
        updateThemeColor(e.matches);
      }
    });
  }

  // ----- Pull to refresh (RN-UI-25) -----

  var ptrStartY = 0;
  var ptrActive = false;
  var ptrRefreshing = false;

  (function initPTR() {
    var screens = document.querySelector('.screens');
    var indicator = document.getElementById('ptr-indicator');
    if (!screens || !indicator) return;

    screens.addEventListener('touchstart', function(e) {
      if (ptrRefreshing) return;
      if (screens.scrollTop <= 0 && state.activeTab === 'hoje') {
        ptrStartY = e.touches[0].clientY;
        ptrActive = true;
        indicator.classList.add('pulling');
      }
    }, { passive: true });

    screens.addEventListener('touchmove', function(e) {
      if (!ptrActive) return;
      var dy = Math.max(0, e.touches[0].clientY - ptrStartY);
      var h = Math.min(dy * 0.4, 60);
      indicator.style.height = h + 'px';
    }, { passive: true });

    screens.addEventListener('touchend', function(e) {
      if (!ptrActive) return;
      ptrActive = false;
      indicator.classList.remove('pulling');
      var dy = e.changedTouches[0].clientY - ptrStartY;
      if (dy > 60) {
        ptrRefreshing = true;
        indicator.classList.add('refreshing');
        indicator.style.height = '';
        loadPortfolio().then(function() {
          if (state.activeTab === 'historico') return loadHistory();
        }).finally(function() {
          ptrRefreshing = false;
          indicator.classList.remove('refreshing');
        });
      } else {
        indicator.style.height = '0';
      }
    }, { passive: true });
  })();

  // ----- Offline state (RN-UI-19) -----

  function updateOfflineState() {
    var banner = document.getElementById('offline-banner');
    if (!banner) return;
    if (!navigator.onLine) {
      banner.style.display = '';
    } else {
      banner.style.display = 'none';
    }
  }

  window.addEventListener('online', function() {
    updateOfflineState();
    loadPortfolio();
  });
  window.addEventListener('offline', updateOfflineState);

  var offlineRetry = document.getElementById('offline-retry');
  if (offlineRetry) {
    offlineRetry.addEventListener('click', function() {
      if (navigator.onLine) {
        loadPortfolio();
        updateOfflineState();
      } else {
        showToast('Sem conexão');
      }
    });
  }

  // ----- Init -----

  async function init() {
    initDark();
    applyMask();
    wire();

    document.getElementById('hoje-greeting').textContent = greeting() + '!';

    document.getElementById('tela-hoje').style.display = '';
    ['carteira', 'bens', 'historico', 'importar'].forEach(t => {
      const el = document.getElementById('tela-' + t);
      if (el) el.style.display = 'none';
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    if (!getToken()) {
      showLogin();
      return;
    }

    showApp();
    await loadPortfolio();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ----- Benchmarks -----

  function renderBenchmarks(benchmarks) {
    var bar = document.getElementById('benchmarks-bar');
    if (!bar) return;
    if (!benchmarks || !benchmarks.cdi) { bar.hidden = true; return; }

    var fmtBm = function (v) {
      return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    var cdiEl = document.getElementById('bm-cdi');
    var selicEl = document.getElementById('bm-selic');
    var ipcaEl = document.getElementById('bm-ipca');
    var dateEl = document.getElementById('bm-date');

    if (cdiEl) cdiEl.textContent = fmtBm(benchmarks.cdi.value) + '% a.a.';
    if (selicEl && benchmarks.selic) selicEl.textContent = fmtBm(benchmarks.selic.value) + '% a.a.';
    if (ipcaEl && benchmarks.ipca12m) ipcaEl.textContent = fmtBm(benchmarks.ipca12m.value) + '%';

    if (dateEl && benchmarks.fetchedAt) {
      var d = new Date(benchmarks.fetchedAt);
      dateEl.textContent = 'Ref. ' + d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } else if (dateEl) {
      dateEl.textContent = '';
    }

    bar.hidden = false;
  }

  // ----- Asset Detail Screen -----

  var detailAssetId = null;

  function openDetail(assetId) {
    detailAssetId = assetId;
    // Hide all main screens
    TABS.forEach(function (t) {
      var el = document.getElementById('tela-' + t);
      if (el) el.style.display = 'none';
    });
    var detailEl = document.getElementById('screen-detail');
    if (detailEl) detailEl.style.display = '';
    loadDetail(assetId);
  }

  function closeDetail() {
    var detailEl = document.getElementById('screen-detail');
    if (detailEl) detailEl.style.display = 'none';
    // Return to carteira
    var carteiraEl = document.getElementById('tela-carteira');
    if (carteiraEl) carteiraEl.style.display = '';
    state.activeTab = 'carteira';
    TABS.forEach(function (t) {
      var btn = document.getElementById('tab-' + t);
      if (btn) {
        btn.classList.toggle('active', t === 'carteira');
        btn.setAttribute('aria-selected', t === 'carteira' ? 'true' : 'false');
      }
    });
  }

  async function loadDetail(id) {
    var bodyEl = document.getElementById('detail-body');
    if (bodyEl) bodyEl.innerHTML = '<div class="detail-loading">Carregando...</div>';
    try {
      var data = await api('GET', '/api/assets/' + id + '/detail');
      renderDetail(data);
    } catch (e) {
      if (e.message !== '401') {
        if (bodyEl) bodyEl.innerHTML = '<div class="detail-error">Erro ao carregar ativo.</div>';
      }
    }
  }

  function renderDetail(data) {
    var bodyEl = document.getElementById('detail-body');
    if (!bodyEl) return;

    var asset = data.asset;
    var fund = data.fund;
    var context = data.context;
    var lifecycle = data.lifecycle || {};
    var contributions = data.contributions || [];

    var isBrapi = asset.quoteSource === 'BRAPI';
    var isCvm = asset.quoteSource === 'CVM';
    var isAuto = isBrapi || isCvm;
    var isManual = !isAuto;

    var instName = (asset.institution === 'OUTROS' && asset.institutionName)
      ? asset.institutionName
      : (INST_LABELS[asset.institution] || asset.institution);

    var classLabel = CLASS_LABELS[asset.class] || asset.class;
    var statusLabel = ASSET_STATUS_LABELS[asset.status] || asset.status;
    var statusClass = 'detail-status-chip';
    if (asset.status === 'redeeming') statusClass += ' redeeming';
    if (asset.status === 'sold') statusClass += ' sold';

    // Derive reference date: oldest contribution date > asset creation date
    var refDate = null;
    var refLabel = 'Cadastrado em';
    if (contributions.length > 0) {
      var sorted = contributions.slice().sort(function (a, b) { return a.contributedAt < b.contributedAt ? -1 : 1; });
      refDate = sorted[0].contributedAt;
      refLabel = contributions.length > 1 ? 'Primeira compra' : 'Compra registrada';
    } else if (asset.createdAt) {
      refDate = asset.createdAt;
      refLabel = 'Cadastro da posição';
    }

    // ── HERO ──────────────────────────────────────────────────────────────────
    var balanceStr = asset.balance != null
      ? fmt(asset.balance)
      : (isAuto ? '<span class="detail-no-quote">cotação indisponível</span>' : '—');

    var staleDaysWarn = '';
    if (isManual && asset.staleDays != null && asset.staleDays > 30) {
      staleDaysWarn = '<div class="detail-stale-warn">Atualizado há ' + asset.staleDays + ' dias  ⚠</div>';
    } else if (isManual && asset.balanceUpdatedAt) {
      staleDaysWarn = '<div class="detail-stale-ok">Atualizado ' + (asset.staleDays != null ? 'há ' + asset.staleDays + ' dia' + (asset.staleDays === 1 ? '' : 's') : 'em ' + fmtDate(asset.balanceUpdatedAt)) + '</div>';
    }

    var html = '<div class="detail-hero">';
    html += '<div class="detail-name">' + (asset.displayName || asset.name) + '</div>';
    html += '<div class="detail-sub">' + instName + ' · ' + classLabel + (asset.ticker ? ' · ' + asset.ticker : '') + '</div>';
    html += '<div class="' + statusClass + '">' + statusLabel + '</div>';
    html += '<div class="detail-balance v">' + balanceStr + '</div>';
    if (asset.status === 'redeeming') {
      html += '<div class="detail-hero-note">Saída iniciada. O ativo aparece separado e fica fora do patrimônio aberto até a venda ser concluída.</div>';
    } else if (asset.status === 'sold') {
      html += '<div class="detail-hero-note">Posição vendida. Ela saiu do patrimônio aberto, mas o histórico foi preservado.</div>';
    } else if (isAuto && asset.balance == null) {
      html += '<div class="detail-hero-note">A posição foi mantida, mas a cotação ainda não foi materializada pela BRAPI.</div>';
    }
    html += staleDaysWarn;
    html += '</div>';

    // ── CHART (BRAPI only) ────────────────────────────────────────────────────
    if (isBrapi) {
      html += '<div class="detail-section">';
      html += '<div class="period-selector" role="group" aria-label="Período do gráfico">';
      html += '<button class="period-btn" data-period="1mo">1M</button>';
      html += '<button class="period-btn" data-period="3mo">3M</button>';
      html += '<button class="period-btn active" data-period="6mo">6M</button>';
      html += '<button class="period-btn" data-period="1y">1A</button>';
      html += '</div>';
      html += '<div id="detail-chart-area" class="detail-chart-area"><div class="chart-skeleton">Carregando gráfico...</div></div>';
      html += '</div>';
    }

    // ── FUND DATA (CVM) ───────────────────────────────────────────────────────
    if (isCvm && fund) {
      html += '<div class="detail-section">';
      html += '<div class="detail-section-title">Dados do fundo</div>';
      if (fund.gestor) html += '<div class="detail-row"><span class="detail-row-label">Gestor</span><span class="detail-row-val">' + fund.gestor + '</span></div>';
      if (fund.classeAnbima || fund.classe) html += '<div class="detail-row"><span class="detail-row-label">Classe ANBIMA</span><span class="detail-row-val">' + (fund.classeAnbima || fund.classe) + '</span></div>';
      if (fund.cnpj) html += '<div class="detail-row"><span class="detail-row-label">CNPJ</span><span class="detail-row-val">' + fund.cnpj + '</span></div>';
      html += '</div>';
    }

    // ── POSITION ──────────────────────────────────────────────────────────────
    html += '<div class="detail-section">';
    html += '<div class="detail-section-title">Sua posição</div>';

    if (asset.qty != null) {
      var qtyLabel = asset.class === 'ACAO' ? ' ações' : ' cotas';
      html += '<div class="detail-row"><span class="detail-row-label">Quantidade</span><span class="detail-row-val">' + asset.qty.toLocaleString('pt-BR') + qtyLabel + '</span></div>';
    }

    // Cotação atual — shown for auto assets regardless of balance
    if (isAuto) {
      if (asset.price != null) {
        var priceLabel = isBrapi ? (asset.class === 'ACAO' ? 'Cotação (ação)' : 'Cotação (cota)') : 'Cota atual';
        html += '<div class="detail-row"><span class="detail-row-label">' + priceLabel + '</span><span class="detail-row-val v">' + fmt(asset.price) + '</span></div>';
      } else {
        html += '<div class="detail-row"><span class="detail-row-label">Cotação</span><span class="detail-row-val detail-no-quote-sm">indisponível — atualiza automaticamente</span></div>';
      }
    }

    // Valor atual
    if (asset.balance != null) {
      html += '<div class="detail-row"><span class="detail-row-label">' + (asset.status === 'sold' ? 'Valor da saída' : 'Valor atual') + '</span><span class="detail-row-val v">' + fmt(asset.balance) + '</span></div>';
    } else if (isAuto) {
      html += '<div class="detail-row"><span class="detail-row-label">Valor atual</span><span class="detail-row-val detail-no-quote-sm">aguardando cotação</span></div>';
    }

    // Valor investido — always shown if present, regardless of gain availability
    if (asset.invested != null) {
      html += '<div class="detail-row"><span class="detail-row-label">Valor aplicado</span><span class="detail-row-val v">' + fmt(asset.invested) + '</span></div>';
    }

    if (contributions.length > 0) {
      html += '<div class="detail-row"><span class="detail-row-label">Compras registradas</span><span class="detail-row-val">' + contributions.length + '</span></div>';
    }

    // Preço médio
    if (asset.avgCost != null) {
      html += '<div class="detail-row"><span class="detail-row-label">Preço médio</span><span class="detail-row-val v">' + fmt(asset.avgCost) + '</span></div>';
    }

    // Date of reference
    if (refDate) {
      html += '<div class="detail-row"><span class="detail-row-label">' + refLabel + '</span><span class="detail-row-val">' + fmtDate(refDate) + '</span></div>';
    }
    if (lifecycle.latestSale && lifecycle.latestSale.soldAt) {
      html += '<div class="detail-row"><span class="detail-row-label">Venda concluída</span><span class="detail-row-val">' + fmtDate(lifecycle.latestSale.soldAt) + '</span></div>';
      if (lifecycle.latestSale.grossAmount != null) {
        html += '<div class="detail-row"><span class="detail-row-label">Valor bruto da venda</span><span class="detail-row-val v">' + fmt(lifecycle.latestSale.grossAmount) + '</span></div>';
      }
    }

    // Quote source tag
    if (isAuto) {
      var srcLabel = isBrapi ? 'BRAPI / B3' : 'CVM / Informe Diário';
      html += '<div class="detail-row"><span class="detail-row-label">Fonte cotação</span><span class="detail-row-val">' + srcLabel + '</span></div>';
      if (asset.quoteFetchedAt) {
        html += '<div class="detail-row"><span class="detail-row-label">Referência da cotação</span><span class="detail-row-val">' + fmtDateTime(asset.quoteFetchedAt) + '</span></div>';
      } else if (isBrapi) {
        html += '<div class="detail-row"><span class="detail-row-label">Referência da cotação</span><span class="detail-row-val detail-no-quote-sm">aguardando primeira atualização</span></div>';
      }
    }

    html += '</div>';

    // ── RENDIMENTO ────────────────────────────────────────────────────────────
    html += '<div class="detail-section">';
    html += '<div class="detail-section-title">Rendimento</div>';
    if (asset.gain != null && asset.gainPct != null) {
      var gainClass = asset.gain >= 0 ? 'detail-gain-pos' : 'detail-gain-neg';
      html += '<div class="detail-gain ' + gainClass + ' v">' + (asset.gain >= 0 ? '+' : '') + fmt(asset.gain) + '  (' + (asset.gainPct >= 0 ? '+' : '') + asset.gainPct.toFixed(1).replace('.', ',') + '%)</div>';
    } else if (asset.balance != null && asset.invested == null) {
      html += '<div class="detail-gain-hint">Registre o valor aplicado ou aportes para calcular o rendimento.</div>';
    } else if (asset.balance == null) {
      html += '<div class="detail-gain-hint">Cotação indisponível. O rendimento será calculado assim que a cotação for atualizada.</div>';
    } else {
      html += '<div class="detail-gain-hint">—</div>';
    }
    html += '</div>';

    // ── CONTEXT ───────────────────────────────────────────────────────────────
    if (context.portfolioTotal > 0) {
      html += '<div class="detail-section">';
      html += '<div class="detail-section-title">Na carteira</div>';
      html += '<div class="detail-row"><span class="detail-row-label">% do patrimônio</span><span class="detail-row-val">' + context.assetPct.toFixed(1).replace('.', ',') + '%</span></div>';
      if (context.classPct != null) {
        html += '<div class="detail-row"><span class="detail-row-label">' + classLabel + '</span><span class="detail-row-val">' + context.classPct.toFixed(1).replace('.', ',') + '% do total</span></div>';
      }
      html += '</div>';
    }

    // ── MANUAL: update button ─────────────────────────────────────────────────
    if (isManual) {
      html += '<div class="detail-section">';
      html += '<div class="detail-section-title">Atualização</div>';
      if (asset.balanceUpdatedAt) {
        html += '<div class="detail-row"><span class="detail-row-label">Última</span><span class="detail-row-val">' + fmtDate(asset.balanceUpdatedAt) + '</span></div>';
      }
      html += '<button class="detail-btn-secondary" id="detail-update-saldo-btn">Atualizar Saldo</button>';
      html += '</div>';
    }

    // ── CONTRIBUTIONS ─────────────────────────────────────────────────────────
    var acceptsContribs = ['ACAO', 'FII', 'FUNDO', 'RF', 'TESOURO'].includes(asset.class);
    html += '<div class="detail-section" id="detail-contributions-section">';
    html += '<div class="detail-section-title">Aportes</div>';
    if (contributions.length === 0) {
      html += '<div class="detail-empty-contribs">Nenhum aporte registrado.' + (acceptsContribs ? ' Registre para calcular o rendimento com precisão.' : '') + '</div>';
    } else {
      html += '<div class="detail-contribs-summary">' + contributions.length + ' aporte' + (contributions.length === 1 ? '' : 's') + ' · Total: <span class="v">' + fmt(contributions.reduce(function (s, c) { return s + c.amount; }, 0)) + '</span></div>';
      contributions.forEach(function (c) {
        var lotMeta = '';
        if (c.qty != null) {
          var lotQtyLabel = asset.class === 'ACAO' ? ' ações' : ' cotas';
          lotMeta = ' · ' + c.qty.toLocaleString('pt-BR') + lotQtyLabel;
          if (c.unitPrice != null) lotMeta += ' · ' + fmt(c.unitPrice) + ' por ' + (asset.class === 'ACAO' ? 'ação' : 'cota');
        }
        html += '<div class="detail-contrib-row">';
        html += '<div class="detail-contrib-left"><span class="detail-contrib-amount v">' + fmt(c.amount) + '</span><span class="detail-contrib-date"> · ' + fmtDate(c.contributedAt) + lotMeta + '</span>';
        if (c.note) html += '<div class="detail-contrib-note">' + c.note + '</div>';
        html += '</div>';
        html += '<button class="detail-contrib-del" data-cid="' + c.id + '" aria-label="Remover aporte">✕</button>';
        html += '</div>';
      });
    }
    if (acceptsContribs && asset.status !== 'sold') {
      html += '<button class="detail-btn-secondary detail-aporte-btn" id="detail-aporte-btn">+ Registrar Aporte</button>';
    }
    html += '</div>';

    // ── ACTIONS ───────────────────────────────────────────────────────────────
    html += '<div class="detail-actions">';
    if ((asset.class === 'ACAO' || asset.class === 'FII') && asset.status === 'active') {
      html += '<button class="detail-btn-secondary" id="detail-exit-start-btn">Iniciar saída</button>';
    }
    if ((asset.class === 'ACAO' || asset.class === 'FII') && asset.status === 'redeeming') {
      html += '<button class="detail-btn-secondary" id="detail-exit-cancel-btn">Cancelar saída</button>';
      html += '<button class="detail-btn-primary" id="detail-sale-btn">Concluir venda</button>';
    }
    html += '<button class="detail-btn-primary" id="detail-analyze-btn">✦ Analisar ativo</button>';
    html += '</div>';

    bodyEl.innerHTML = html;

    // Wire period selector
    if (isBrapi) {
      bodyEl.querySelectorAll('.period-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          bodyEl.querySelectorAll('.period-btn').forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');
          loadChart(asset.id, btn.dataset.period, btn);
        });
      });
      // Auto-load default period
      loadChart(asset.id, '6mo', null);
    }

    // Wire update saldo button
    var updateBtn = document.getElementById('detail-update-saldo-btn');
    if (updateBtn) {
      updateBtn.addEventListener('click', function () {
        openSheetSaldo(asset.id);
      });
    }

    // Wire aporte button
    var aporteBtn = document.getElementById('detail-aporte-btn');
    if (aporteBtn) {
      aporteBtn.addEventListener('click', function () {
        openSheetAporte(asset.id);
      });
    }

    var exitStartBtn = document.getElementById('detail-exit-start-btn');
    if (exitStartBtn) {
      exitStartBtn.addEventListener('click', function () {
        startExitFlow(asset.id);
      });
    }

    var exitCancelBtn = document.getElementById('detail-exit-cancel-btn');
    if (exitCancelBtn) {
      exitCancelBtn.addEventListener('click', function () {
        cancelExitFlow(asset.id);
      });
    }

    var saleBtn = document.getElementById('detail-sale-btn');
    if (saleBtn) {
      saleBtn.addEventListener('click', function () {
        openSaleSheet(asset.id);
      });
    }

    // Wire contrib delete buttons
    bodyEl.querySelectorAll('.detail-contrib-del').forEach(function (btn) {
      btn.addEventListener('click', function () {
        deleteContribution(asset.id, parseInt(btn.dataset.cid, 10));
      });
    });

    var analyzeBtn = document.getElementById('detail-analyze-btn');
    if (analyzeBtn) {
      analyzeBtn.addEventListener('click', function () {
        openAnalyze('asset', asset.id);
      });
    }

    // Wire edit button in header
    var editHeaderBtn = document.getElementById('detail-edit-btn');
    if (editHeaderBtn) {
      editHeaderBtn.style.display = asset.status === 'sold' ? 'none' : '';
      editHeaderBtn.onclick = asset.status === 'sold' ? null : function () { openSheetEditFromDetail(); };
    }

    if (state.hide) applyMask();
  }

  async function loadChart(assetId, period, btn) {
    var chartArea = document.getElementById('detail-chart-area');
    if (!chartArea) return;
    chartArea.innerHTML = '<div class="chart-skeleton">Carregando gráfico...</div>';
    try {
      var data = await api('GET', '/api/assets/' + assetId + '/history?period=' + period);
      if (data.error) {
        chartArea.innerHTML = '<div class="chart-unavailable">Histórico indisponível<br><span class="chart-unavailable-hint">Dados BRAPI podem estar temporariamente indisponíveis</span></div>';
        return;
      }
      var pts = data.dataPoints || [];
      if (!pts.length) {
        chartArea.innerHTML = '<div class="chart-unavailable">Sem dados para este período</div>';
        return;
      }
      renderPriceChart(pts, chartArea);
    } catch (e) {
      chartArea.innerHTML = '<div class="chart-unavailable">Erro ao carregar gráfico</div>';
    }
  }

  function renderPriceChart(dataPoints, containerEl) {
    if (!dataPoints || !dataPoints.length) return;

    var W = 340, H = 120, PAD = 8;
    var prices = dataPoints.map(function (d) { return d.close; });
    var minP = Math.min.apply(null, prices);
    var maxP = Math.max.apply(null, prices);
    var range = maxP - minP || 1;

    var pts = dataPoints.map(function (d, i) {
      var x = PAD + (i / Math.max(dataPoints.length - 1, 1)) * (W - PAD * 2);
      var y = PAD + (1 - (d.close - minP) / range) * (H - PAD * 2);
      return x.toFixed(1) + ',' + y.toFixed(1);
    });

    var firstClose = prices[0];
    var lastClose = prices[prices.length - 1];
    var color = lastClose >= firstClose ? 'var(--verde)' : 'var(--vinho)';

    containerEl.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto">'
      + '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + color + '" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>'
      + '</svg>';
  }

  function openSheetEditFromDetail() {
    if (detailAssetId) openSheetEdit(detailAssetId);
  }

  // ----- Contributions / Aportes -----

  var aporteAssetId = null;

  function openSheetAporte(assetId) {
    aporteAssetId = assetId;
    // Populate subtitle with asset name
    var p = state.portfolio;
    var asset = p ? [...(p.assets || []), ...(p.redeeming || [])].find(function (a) { return a.id === assetId; }) : null;
    var subEl = document.getElementById('sh-aporte-sub');
    if (subEl && asset) subEl.textContent = asset.name;
    // Set date to today
    var dateEl = document.getElementById('sh-aporte-date');
    if (dateEl) {
      var today = new Date().toISOString().slice(0, 10);
      dateEl.value = today;
      dateEl.setAttribute('max', today);
    }
    var amountEl = document.getElementById('sh-aporte-amount');
    if (amountEl) { amountEl.value = ''; }
    var qtyRowEl = document.getElementById('sh-aporte-qty-row');
    var qtyEl = document.getElementById('sh-aporte-qty');
    var qtyLabelEl = document.getElementById('sh-aporte-qty-label');
    if (asset && asset.mode === 'auto') {
      if (qtyRowEl) qtyRowEl.style.display = '';
      if (qtyLabelEl) qtyLabelEl.textContent = asset.class === 'ACAO' ? 'Quantidade comprada (ações)' : 'Quantidade comprada (cotas)';
      if (qtyEl) qtyEl.value = '';
    } else {
      if (qtyRowEl) qtyRowEl.style.display = 'none';
      if (qtyEl) qtyEl.value = '';
    }
    var noteEl = document.getElementById('sh-aporte-note');
    if (noteEl) { noteEl.value = ''; }
    var errEl = document.getElementById('sh-aporte-err');
    if (errEl) errEl.style.display = 'none';
    openSheet('sheet-aporte');
    if (amountEl) setTimeout(function () { amountEl.focus(); }, 350);
  }

  function closeSheetAporte() {
    var el = document.getElementById('sheet-aporte');
    if (el) el.classList.remove('open');
    document.getElementById('sheet-overlay').classList.remove('open');
    state.sheetOpen = null;
  }

  async function saveAporte() {
    var id = aporteAssetId;
    if (!id) return;
    var p = state.portfolio;
    var asset = p ? [...(p.assets || []), ...(p.redeeming || [])].find(function (a) { return a.id === id; }) : null;

    var amountRaw = (document.getElementById('sh-aporte-amount') || {}).value || '';
    amountRaw = amountRaw.replace(/\./g, '').replace(',', '.');
    var amount = parseFloat(amountRaw);

    var dateEl = document.getElementById('sh-aporte-date');
    var dateVal = dateEl ? dateEl.value : '';

    var errEl = document.getElementById('sh-aporte-err');

    if (isNaN(amount) || amount <= 0) {
      if (errEl) { errEl.textContent = 'Valor inválido.'; errEl.style.display = ''; }
      return;
    }
    if (!dateVal) {
      if (errEl) { errEl.textContent = 'Data obrigatória.'; errEl.style.display = ''; }
      return;
    }
    var qty = null;
    if (asset && asset.mode === 'auto') {
      var qtyRaw = ((document.getElementById('sh-aporte-qty') || {}).value || '').replace(',', '.');
      qty = parseFloat(qtyRaw);
      if (isNaN(qty) || qty <= 0) {
        if (errEl) { errEl.textContent = 'Quantidade obrigatória para nova compra.'; errEl.style.display = ''; }
        return;
      }
    }
    if (errEl) errEl.style.display = 'none';

    var noteEl = document.getElementById('sh-aporte-note');
    var note = noteEl ? noteEl.value.trim() : '';

    var contributedAt = dateVal + 'T12:00:00Z';

    var btn = document.getElementById('sh-aporte-save');
    btnLoading(btn, (async function() {
      try {
        await api('POST', '/api/assets/' + id + '/contributions', {
          amount: amount,
          contributedAt: contributedAt,
          qty: qty || undefined,
          note: note || undefined
        });
        if (navigator.vibrate) navigator.vibrate(8);
        closeSheetAporte();
        showToast('Aporte registrado');
        await loadPortfolio();
        if (detailAssetId === id) await loadDetail(id);
      } catch (e) {
        if (e.message !== '401') showToast('Erro ao registrar aporte');
      }
    })());
  }

  async function deleteContribution(assetId, cid) {
    if (!confirm('Remover este aporte?')) return;
    try {
      await api('DELETE', '/api/assets/' + assetId + '/contributions/' + cid);
      if (navigator.vibrate) navigator.vibrate(8);
      showToast('Aporte removido');
      await loadPortfolio();
      if (detailAssetId === assetId) await loadDetail(assetId);
    } catch (e) {
      if (e.message !== '401') showToast('Erro ao remover aporte');
    }
  }

  // ----- Sale / Exit flow -----

  var saleAssetId = null;

  async function startExitFlow(assetId) {
    if (!assetId) return;
    if (!confirm('Iniciar saída desta posição? Ela ficará separada da carteira ativa até a venda ser concluída.')) return;
    try {
      await api('POST', '/api/assets/' + assetId + '/exit/start', {});
      if (navigator.vibrate) navigator.vibrate(8);
      showToast('Saída iniciada');
      await loadPortfolio();
      await loadDetail(assetId);
    } catch (e) {
      if (e.message !== '401') showToast('Erro ao iniciar saída');
    }
  }

  async function cancelExitFlow(assetId) {
    if (!assetId) return;
    try {
      await api('POST', '/api/assets/' + assetId + '/exit/cancel', {});
      if (navigator.vibrate) navigator.vibrate(8);
      showToast('Saída cancelada');
      await loadPortfolio();
      await loadDetail(assetId);
    } catch (e) {
      if (e.message !== '401') showToast('Erro ao cancelar saída');
    }
  }

  function openSaleSheetFromEdit() {
    var id = state.editingAssetId;
    if (!id) return;
    closeAllSheets();
    openSaleSheet(id);
  }

  function openSaleSheet(assetId) {
    saleAssetId = assetId;
    var p = state.portfolio;
    var asset = p ? [...(p.assets || []), ...(p.redeeming || [])].find(function (a) { return a.id === assetId; }) : null;
    var subEl = document.getElementById('sh-sale-sub');
    if (subEl && asset) subEl.textContent = asset.name;
    var dateEl = document.getElementById('sh-sale-date');
    if (dateEl) {
      var today = new Date().toISOString().slice(0, 10);
      dateEl.value = today;
      dateEl.setAttribute('max', today);
    }
    var grossEl = document.getElementById('sh-sale-gross');
    if (grossEl) grossEl.value = asset && asset.balance != null ? fmtCompact(asset.balance) : '';
    var noteEl = document.getElementById('sh-sale-note');
    if (noteEl) noteEl.value = '';
    var errEl = document.getElementById('sh-sale-err');
    if (errEl) errEl.style.display = 'none';
    openSheet('sheet-sale');
  }

  async function confirmSale() {
    var id = saleAssetId;
    if (!id) return;
    var grossRaw = ((document.getElementById('sh-sale-gross') || {}).value || '').replace(/\./g, '').replace(',', '.');
    var grossAmount = parseFloat(grossRaw);
    var dateEl = document.getElementById('sh-sale-date');
    var soldDate = dateEl ? dateEl.value : '';
    var noteEl = document.getElementById('sh-sale-note');
    var note = noteEl ? noteEl.value.trim() : '';
    var errEl = document.getElementById('sh-sale-err');

    if (!soldDate) {
      if (errEl) { errEl.textContent = 'Data da venda obrigatória.'; errEl.style.display = ''; }
      return;
    }
    if (isNaN(grossAmount) || grossAmount <= 0) {
      if (errEl) { errEl.textContent = 'Valor bruto inválido.'; errEl.style.display = ''; }
      return;
    }

    var btn = document.getElementById('sh-sale-save');
    btnLoading(btn, (async function() {
      try {
        await api('POST', '/api/assets/' + id + '/sale', {
          soldAt: soldDate + 'T12:00:00Z',
          grossAmount: grossAmount,
          note: note || undefined
        });
        if (navigator.vibrate) navigator.vibrate(8);
        closeAllSheets();
        showToast('Venda concluída');
        await loadPortfolio();
        await loadDetail(id);
      } catch (e) {
        if (e.message !== '401') showToast('Erro ao concluir venda');
      }
    })());
  }

  // ----- Bens e Garantias -----

  var goodsData = null;
  var editingGoodId = null;
  var selectedBemType = null;
  var selectedPropertyType = null;
  var selectedVehicleType = null;

  async function loadGoods() {
    try {
      goodsData = await api('GET', '/api/goods');
      renderGoods();
      updateGrossWealth();
    } catch (e) {
      if (e.message !== '401') showToast('Erro ao carregar bens');
    }
  }

  function renderGoods() {
    var bodyEl = document.getElementById('bens-body');
    if (!bodyEl) return;
    var data = goodsData;
    if (!data) return;

    var goods = data.goods || [];
    var emptyEl = document.getElementById('bens-empty');

    if (goods.length === 0) {
      if (emptyEl) emptyEl.style.display = '';
      bodyEl.innerHTML = '';
      return;
    }
    if (emptyEl) emptyEl.style.display = 'none';

    var fgts = goods.filter(function (g) { return g.type === 'FGTS'; });
    var imoveis = goods.filter(function (g) { return g.type === 'IMOVEL'; });
    var veiculos = goods.filter(function (g) { return g.type === 'VEICULO'; });

    var html = '';

    // Total card
    html += '<div class="bens-total-card">';
    html += '<div class="bens-total-label">Total de bens</div>';
    html += '<div class="bens-total-val v">' + fmt(data.total) + '</div>';
    html += '</div>';

    function renderGoodItem(g) {
      var staleThreshold = g.type === 'FGTS' ? 35 : (g.type === 'IMOVEL' ? 180 : 90);
      var isStale = g.staleDays != null && g.staleDays > staleThreshold;
      var meta = '';
      if (g.type === 'IMOVEL') {
        var parts = [];
        if (g.areaM2) parts.push(g.areaM2 + ' m²');
        if (g.city) parts.push(g.city);
        if (parts.length) meta = ' · ' + parts.join(', ');
        if (g.isFinanced) meta += ' · financiado';
      } else if (g.type === 'VEICULO') {
        var vparts = [];
        if (g.brand) vparts.push(g.brand);
        if (g.year) vparts.push(String(g.year));
        if (vparts.length) meta = ' · ' + vparts.join(' ');
        if (g.isFinanced) meta += ' · financiado';
      } else if (g.type === 'FGTS') {
        if (g.employer) meta = ' · ' + g.employer;
      }
      var freshText = '';
      if (g.staleDays != null) {
        freshText = ' · atualizado há ' + g.staleDays + (g.staleDays === 1 ? ' dia' : ' dias');
      }
      return '<div class="bens-item" data-good-id="' + g.id + '">'
        + '<div class="bens-item-top">'
        + '<div class="bens-item-name">' + g.name + (isStale ? ' <span class="stale-icon">⚠</span>' : '') + '</div>'
        + '<div class="bens-item-val v">' + fmt(g.estimatedValue) + '</div>'
        + '</div>'
        + '<div class="bens-item-meta">' + meta.replace(/^ · /, '') + freshText + '</div>'
        + '<button class="bens-edit-btn" data-good-edit="' + g.id + '">Editar</button>'
        + '</div>';
    }

    if (fgts.length > 0) {
      html += '<div class="bens-group-header"><span class="bens-group-title">FGTS</span><span class="bens-group-total v">' + fmt(data.byType.FGTS) + '</span></div>';
      fgts.forEach(function (g) { html += renderGoodItem(g); });
    }
    if (imoveis.length > 0) {
      html += '<div class="bens-group-header"><span class="bens-group-title">Imóveis</span><span class="bens-group-total v">' + fmt(data.byType.IMOVEL) + '</span></div>';
      imoveis.forEach(function (g) { html += renderGoodItem(g); });
    }
    if (veiculos.length > 0) {
      html += '<div class="bens-group-header"><span class="bens-group-title">Veículos</span><span class="bens-group-total v">' + fmt(data.byType.VEICULO) + '</span></div>';
      veiculos.forEach(function (g) { html += renderGoodItem(g); });
    }

    bodyEl.innerHTML = html;

    bodyEl.querySelectorAll('[data-good-edit]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        openSheetBemEdit(parseInt(btn.dataset.goodEdit, 10));
      });
    });

    if (state.hide) applyMask();
  }

  function updateGrossWealth() {
    var wrapEl = document.getElementById('gross-wealth-wrap');
    var valEl = document.getElementById('gross-wealth');
    if (!valEl) return;

    var investTotal = (state.portfolio && state.portfolio.total) || 0;
    var goodsTotal = (goodsData && goodsData.total) || 0;

    if (!goodsData || goodsData.total === 0) {
      if (wrapEl) {
        wrapEl.hidden = true;
        wrapEl.style.display = 'none';
      }
      return;
    }

    var gross = investTotal + goodsTotal;
    valEl.textContent = fmt(gross);
    if (wrapEl) {
      wrapEl.hidden = false;
      wrapEl.style.display = '';
    }
  }

  function openSheetBem() {
    editingGoodId = null;
    resetBemForm();
    openSheet('sheet-bem');
  }

  function openSheetBemEdit(id) {
    editingGoodId = id;
    resetBemForm();
    if (!goodsData) { openSheet('sheet-bem'); return; }
    var good = (goodsData.goods || []).find(function (g) { return g.id === id; });
    if (!good) { openSheet('sheet-bem'); return; }

    selectBemType(good.type);

    var nameEl = document.getElementById('sh-bem-name');
    if (nameEl) nameEl.value = good.name || '';
    var valueEl = document.getElementById('sh-bem-value');
    if (valueEl) valueEl.value = good.estimatedValue != null ? good.estimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
    var notesEl = document.getElementById('sh-bem-notes');
    if (notesEl) notesEl.value = good.notes || '';
    var finEl = document.getElementById('sh-bem-financed');
    if (finEl) finEl.checked = !!good.isFinanced;

    if (good.type === 'IMOVEL') {
      if (good.propertyType) selectPropertyType(good.propertyType);
      var areaEl = document.getElementById('sh-bem-area');
      if (areaEl) areaEl.value = good.areaM2 != null ? String(good.areaM2) : '';
      var cityEl = document.getElementById('sh-bem-city');
      if (cityEl) cityEl.value = good.city || '';
      var stateEl = document.getElementById('sh-bem-state');
      if (stateEl) stateEl.value = good.state || '';
    } else if (good.type === 'VEICULO') {
      if (good.vehicleType) selectVehicleType(good.vehicleType);
      var brandEl = document.getElementById('sh-bem-brand');
      if (brandEl) brandEl.value = good.brand || '';
      var modelEl = document.getElementById('sh-bem-model');
      if (modelEl) modelEl.value = good.modelName || '';
      var yearEl = document.getElementById('sh-bem-year');
      if (yearEl) yearEl.value = good.year != null ? String(good.year) : '';
    } else if (good.type === 'FGTS') {
      var employerEl = document.getElementById('sh-bem-employer');
      if (employerEl) employerEl.value = good.employer || '';
    }

    openSheet('sheet-bem');
  }

  function resetBemForm() {
    selectedBemType = null;
    selectedPropertyType = null;
    selectedVehicleType = null;
    var ids = ['sh-bem-name','sh-bem-value','sh-bem-notes','sh-bem-employer',
               'sh-bem-area','sh-bem-city','sh-bem-state',
               'sh-bem-brand','sh-bem-model','sh-bem-year'];
    ids.forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
    var finEl = document.getElementById('sh-bem-financed');
    if (finEl) finEl.checked = false;
    hideBemTypeFields();
    // Reset type chips
    var typeChips = document.querySelectorAll('#sh-bem-type-chips .bem-type-chip');
    typeChips.forEach(function (c) { c.classList.remove('sel'); });
    var propChips = document.querySelectorAll('#sh-bem-property-chips .chip');
    propChips.forEach(function (c) { c.classList.remove('sel'); });
    var vehChips = document.querySelectorAll('#sh-bem-vehicle-chips .chip');
    vehChips.forEach(function (c) { c.classList.remove('sel'); });
    var errEl = document.getElementById('sh-bem-err');
    if (errEl) errEl.style.display = 'none';
  }

  function hideBemTypeFields() {
    ['sh-bem-fields-fgts','sh-bem-fields-imovel','sh-bem-fields-veiculo'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }

  function selectBemType(type) {
    selectedBemType = type;
    hideBemTypeFields();
    var fieldId = type === 'FGTS' ? 'sh-bem-fields-fgts'
                : type === 'IMOVEL' ? 'sh-bem-fields-imovel'
                : type === 'VEICULO' ? 'sh-bem-fields-veiculo' : null;
    if (fieldId) {
      var el = document.getElementById(fieldId);
      if (el) el.style.display = '';
    }
    var typeChips = document.querySelectorAll('#sh-bem-type-chips .bem-type-chip');
    typeChips.forEach(function (c) { c.classList.toggle('sel', c.dataset.type === type); });
  }

  function selectPropertyType(type) {
    selectedPropertyType = type;
    var propChips = document.querySelectorAll('#sh-bem-property-chips .chip');
    propChips.forEach(function (c) { c.classList.toggle('sel', c.dataset.val === type); });
  }

  function selectVehicleType(type) {
    selectedVehicleType = type;
    var vehChips = document.querySelectorAll('#sh-bem-vehicle-chips .chip');
    vehChips.forEach(function (c) { c.classList.toggle('sel', c.dataset.val === type); });
  }

  function closeSheetBem() {
    var el = document.getElementById('sheet-bem');
    if (el) el.classList.remove('open');
    document.getElementById('sheet-overlay').classList.remove('open');
    state.sheetOpen = null;
  }

  async function saveBem() {
    var errEl = document.getElementById('sh-bem-err');
    if (errEl) errEl.style.display = 'none';

    var name = (document.getElementById('sh-bem-name') || {}).value;
    name = name ? name.trim() : '';
    var valueRaw = (document.getElementById('sh-bem-value') || {}).value || '';
    valueRaw = valueRaw.replace(/\./g, '').replace(',', '.');
    var estimatedValue = parseFloat(valueRaw);

    if (!selectedBemType) {
      if (errEl) { errEl.textContent = 'Selecione o tipo de bem.'; errEl.style.display = ''; }
      return;
    }
    if (!name) {
      if (errEl) { errEl.textContent = 'Nome obrigatório.'; errEl.style.display = ''; }
      return;
    }
    if (isNaN(estimatedValue) || estimatedValue < 0) {
      if (errEl) { errEl.textContent = 'Valor estimado inválido.'; errEl.style.display = ''; }
      return;
    }
    if (selectedBemType === 'IMOVEL' && !selectedPropertyType) {
      if (errEl) { errEl.textContent = 'Selecione o tipo de imóvel.'; errEl.style.display = ''; }
      return;
    }
    if (selectedBemType === 'VEICULO' && !selectedVehicleType) {
      if (errEl) { errEl.textContent = 'Selecione o tipo de veículo.'; errEl.style.display = ''; }
      return;
    }

    var body = { type: selectedBemType, name: name, estimatedValue: estimatedValue };

    var notesVal = (document.getElementById('sh-bem-notes') || {}).value;
    if (notesVal && notesVal.trim()) body.notes = notesVal.trim();
    var finEl = document.getElementById('sh-bem-financed');
    if (finEl) body.isFinanced = finEl.checked;

    if (selectedBemType === 'IMOVEL') {
      body.propertyType = selectedPropertyType;
      var areaVal = (document.getElementById('sh-bem-area') || {}).value;
      if (areaVal && parseFloat(areaVal) > 0) body.areaM2 = parseFloat(areaVal);
      var cityVal = (document.getElementById('sh-bem-city') || {}).value;
      if (cityVal && cityVal.trim()) body.city = cityVal.trim();
      var stateVal = (document.getElementById('sh-bem-state') || {}).value;
      if (stateVal && stateVal.trim()) body.state = stateVal.trim().toUpperCase().slice(0, 2);
    } else if (selectedBemType === 'VEICULO') {
      body.vehicleType = selectedVehicleType;
      var brandVal = (document.getElementById('sh-bem-brand') || {}).value;
      if (brandVal && brandVal.trim()) body.brand = brandVal.trim();
      var modelVal = (document.getElementById('sh-bem-model') || {}).value;
      if (modelVal && modelVal.trim()) body.modelName = modelVal.trim();
      var yearVal = (document.getElementById('sh-bem-year') || {}).value;
      if (yearVal && parseInt(yearVal, 10) > 0) body.year = parseInt(yearVal, 10);
    } else if (selectedBemType === 'FGTS') {
      var employerVal = (document.getElementById('sh-bem-employer') || {}).value;
      if (employerVal && employerVal.trim()) body.employer = employerVal.trim();
    }

    var btn = document.getElementById('sh-bem-save');
    btnLoading(btn, (async function() {
      try {
        if (editingGoodId) {
          await api('PUT', '/api/goods/' + editingGoodId, body);
          showToast('Bem atualizado');
        } else {
          await api('POST', '/api/goods', body);
          showToast('Bem cadastrado');
        }
        if (navigator.vibrate) navigator.vibrate(8);
        closeSheetBem();
        await loadGoods();
      } catch (e) {
        if (e.message !== '401') showToast('Erro ao salvar bem');
      }
    })());
  }

})();
