const DASHBOARD_URL = './dashboard.html';
const authModal = document.getElementById('authModal');
const friendlyModal = document.getElementById('friendlyModal');
const authModeLabel = document.getElementById('authModeLabel');
const authModalTitle = document.getElementById('authModalTitle');
const authModalText = document.getElementById('authModalText');
const authSubmitButton = document.getElementById('authSubmitButton');
const authUserInput = document.getElementById('authUser');
const suggestionsBox = document.getElementById('emailSuggestions');
const keyboard = document.getElementById('virtualKeyboard');
const passwordDots = Array.from(document.querySelectorAll('.password-dot'));
const authForm = document.getElementById('authForm');
const authTabs = Array.from(document.querySelectorAll('.auth-tab'));
const friendlyMessage = document.getElementById('friendlyModalMessage');

const domains = ['@gmail.com', '@hotmail.com', '@outlook.com', '@yahoo.com.br'];
let authMode = 'login';
let passwordLength = 0;

function openAuthModal(mode = 'login') {
  authMode = mode;
  renderAuthMode();
  authModal.classList.add('is-open');
  authModal.setAttribute('aria-hidden', 'false');
  authUserInput.focus();
  clearPassword();
  shuffleKeyboard();
}

function closeAuthModal() {
  authModal.classList.remove('is-open');
  authModal.setAttribute('aria-hidden', 'true');
  suggestionsBox.style.display = 'none';
}

function renderAuthMode() {
  const isSignup = authMode === 'signup';
  authModeLabel.textContent = isSignup ? 'Criar conta' : 'Acesso';
  authModalTitle.textContent = isSignup ? 'Criar conta no Esquilo' : 'Entrar no Esquilo';
  authModalText.textContent = isSignup
    ? 'Por enquanto não vamos validar nada. Preencha do jeito que quiser e entre para ver a experiência.'
    : 'Por enquanto não vamos validar nada. Preencha do jeito que quiser e siga para o dashboard.';
  authSubmitButton.innerHTML = isSignup
    ? 'Criar e entrar <i class="fa-solid fa-arrow-right"></i>'
    : 'Entrar no Esquilo <i class="fa-solid fa-lock-open"></i>';

  authTabs.forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.authMode === authMode);
  });
}

function openFriendlyModal(message) {
  friendlyMessage.textContent = message;
  friendlyModal.hidden = false;
}

function closeFriendlyModal() {
  friendlyModal.hidden = true;
}

function shuffleKeyboard() {
  keyboard.innerHTML = '';
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);

  for (let index = 0; index < 10; index += 2) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'key-button';
    button.textContent = `${digits[index]} ou ${digits[index + 1]}`;
    button.addEventListener('click', typePassword);
    keyboard.appendChild(button);
  }

  const clearButton = document.createElement('button');
  clearButton.type = 'button';
  clearButton.className = 'key-button key-button--clear';
  clearButton.innerHTML = '<i class="fa-solid fa-delete-left"></i> Limpar';
  clearButton.addEventListener('click', clearPassword);
  keyboard.appendChild(clearButton);
}

function typePassword() {
  if (passwordLength >= 6) return;
  passwordDots[passwordLength].classList.add('is-filled');
  passwordLength += 1;
  shuffleKeyboard();
}

function clearPassword() {
  passwordLength = 0;
  passwordDots.forEach((dot) => dot.classList.remove('is-filled'));
}

function applyCpfMask(value) {
  let masked = value.replace(/\D/g, '').slice(0, 11);
  if (masked.length > 9) return masked.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (masked.length > 6) return masked.replace(/(\d{3})(\d{3})(\d{3})/, '$1.$2.$3');
  if (masked.length > 3) return masked.replace(/(\d{3})(\d{3})/, '$1.$2');
  return masked;
}

function renderEmailSuggestions(currentValue) {
  if (!currentValue.includes('@')) {
    suggestionsBox.style.display = 'none';
    suggestionsBox.innerHTML = '';
    return;
  }

  const [localPart, typedDomain] = currentValue.split('@');
  const matches = domains.filter((domain) => domain.startsWith('@' + typedDomain) && domain !== '@' + typedDomain);
  if (!matches.length) {
    suggestionsBox.style.display = 'none';
    suggestionsBox.innerHTML = '';
    return;
  }

  suggestionsBox.innerHTML = '';
  matches.forEach((domain) => {
    const option = document.createElement('button');
    option.type = 'button';
    option.textContent = `${localPart}${domain}`;
    option.addEventListener('click', () => {
      authUserInput.value = `${localPart}${domain}`;
      suggestionsBox.style.display = 'none';
      authUserInput.focus();
    });
    suggestionsBox.appendChild(option);
  });
  suggestionsBox.style.display = 'block';
}

authUserInput.addEventListener('input', () => {
  const value = authUserInput.value;
  if (/[a-zA-Z@]/.test(value)) {
    renderEmailSuggestions(value);
    return;
  }

  suggestionsBox.style.display = 'none';
  suggestionsBox.innerHTML = '';
  authUserInput.value = applyCpfMask(value);
});

document.addEventListener('click', (event) => {
  const openAuth = event.target.closest('[data-open-auth]');
  if (openAuth) {
    openAuthModal(openAuth.dataset.openAuth || 'login');
    return;
  }

  if (event.target.closest('[data-auth-close]') || event.target === authModal) {
    closeAuthModal();
  }

  if (event.target.closest('[data-friendly-close]') || event.target === friendlyModal) {
    closeFriendlyModal();
  }

  if (event.target.closest('[data-friendly-open-auth]')) {
    closeFriendlyModal();
    openAuthModal('login');
  }

  const modeTrigger = event.target.closest('[data-auth-mode]');
  if (modeTrigger) {
    authMode = modeTrigger.dataset.authMode || 'login';
    renderAuthMode();
  }

  const helpTrigger = event.target.closest('[data-auth-help]');
  if (helpTrigger) {
    openFriendlyModal('A recuperação de senha ainda vai ser ligada ao backend. Por enquanto, você pode seguir para o dashboard usando qualquer dado no acesso.');
  }

  if (!event.target.closest('.field')) {
    suggestionsBox.style.display = 'none';
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (friendlyModal.hidden === false) closeFriendlyModal();
    closeAuthModal();
  }
});

authForm.addEventListener('submit', (event) => {
  event.preventDefault();
  window.location.href = DASHBOARD_URL;
});

shuffleKeyboard();
renderAuthMode();
