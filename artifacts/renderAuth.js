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
