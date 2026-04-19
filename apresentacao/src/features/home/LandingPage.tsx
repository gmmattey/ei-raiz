import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { assetPath } from '../../utils/assetPath';
import { ApiError, authApi, consumirMotivoSaidaSessao, telemetriaApi } from '../../cliente-api';
import { useTheme } from '../../context/ThemeContext';
import { useModoVisualizacao } from '../../context/ModoVisualizacaoContext';
import { useIsMobile } from '../../hooks/useIsMobile';
import Onboarding from '../onboarding/onboarding';
import { Eye, EyeOff } from 'lucide-react';
import LogoEsquiloWallet from '../../components/brand/LogoEsquiloWallet';

type LoginStep = 'login' | 'forgotEmail' | 'forgotPassword';
type ForgotStage = 'email' | 'reset';

const senhaForteRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,128}$/;

function mapApiAuthError(error: unknown): string {
  if (!(error instanceof ApiError)) return 'Não foi possível concluir a ação agora.';
  if (error.status === 401) return 'Credenciais inválidas. Confira e tente novamente.';
  if (error.code === 'TOKEN_INVALIDO') return 'Código incorreto. Verifique o código copiado do email.';
  if (error.code === 'TOKEN_EXPIRADO') return 'Código expirado. Solicite uma nova recuperação.';
  return 'Não foi possível concluir a ação agora.';
}

const PainelPropostaValor: React.FC = () => (
  <aside
    className="hidden lg:flex lg:w-[52%] xl:w-1/2 text-white flex-col justify-between p-12 xl:p-16 relative overflow-hidden"
    style={{ backgroundColor: '#0B1218' }}
  >
    <div className="flex items-center gap-3">
      <LogoEsquiloWallet variant="dark" className="h-9 w-auto" />
    </div>

    <div className="w-full max-w-xl">
      <h1 className="font-['Sora'] text-4xl xl:text-5xl font-bold leading-[1.15] tracking-tight">
        <span className="text-[#F56A2A]">Analise</span> sua carteira.<br />
        Sem viés, sem empurrar produto.
      </h1>

      <ul className="mt-24 grid grid-cols-3 gap-8 font-['Inter'] max-w-md">
        <li className="flex flex-col items-start">
          <div className="h-14 w-14 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center mb-4">
            <img src={assetPath('/assets/icons/laranja/importar.svg')} alt="" className="h-6 w-6" />
          </div>
          <span className="font-['Sora'] text-lg font-bold text-white">Consolide</span>
        </li>
        <li className="flex flex-col items-start">
          <div className="h-14 w-14 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center mb-4">
            <img src={assetPath('/assets/icons/laranja/radar.svg')} alt="" className="h-6 w-6" />
          </div>
          <span className="font-['Sora'] text-lg font-bold text-white">Entenda</span>
        </li>
        <li className="flex flex-col items-start">
          <div className="h-14 w-14 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center mb-4">
            <img src={assetPath('/assets/icons/laranja/sucesso.svg')} alt="" className="h-6 w-6" />
          </div>
          <span className="font-['Sora'] text-lg font-bold text-white">Faça</span>
        </li>
      </ul>
    </div>

    <div className="font-['Inter'] text-xs text-white/40">
      © {new Date().getFullYear()} IA Group. SA · Kaidu - Beta Test · LGPD
    </div>
  </aside>
);

interface FormularioLoginProps {
  alertaInicial?: string;
  initialStep?: LoginStep;
  initialEmail?: string;
  compact?: boolean;
  onDark?: boolean;
}

const FormularioLogin: React.FC<FormularioLoginProps> = ({
  alertaInicial = '',
  initialStep = 'login',
  initialEmail = '',
  compact = false,
  onDark = false,
}) => {
  const navigate = useNavigate();
  const { setThemeMode } = useTheme();
  const { setOcultarValores } = useModoVisualizacao();

  const [loginStep, setLoginStep] = useState<LoginStep>(initialStep);
  const [emailInput, setEmailInput] = useState(initialEmail);
  const [passwordInput, setPasswordInput] = useState('');
  const [cpfInput, setCpfInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotStage, setForgotStage] = useState<ForgotStage>(initialEmail ? 'reset' : 'email');
  const [authError, setAuthError] = useState(alertaInicial);
  const [recoveryInfo, setRecoveryInfo] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setAuthError(alertaInicial);
  }, [alertaInicial]);

  useEffect(() => {
    setLoginStep(initialStep);
    setEmailInput(initialEmail);
    setForgotStage(initialEmail ? 'reset' : 'email');
  }, [initialStep, initialEmail]);

  const headingColor = onDark ? 'text-white' : 'text-[#0B1218]';
  const labelColor = onDark ? 'text-white/90' : 'text-[#0B1218]';
  const subtextColor = onDark ? 'text-white/60' : 'text-[#0B1218]/60';
  const mutedBtnColor = onDark ? 'text-white/60 hover:text-[#F56A2A]' : 'text-[#0B1218]/60 hover:text-[#F56A2A]';
  const bodyText = onDark ? 'text-white/70' : 'text-[#0B1218]/70';
  const inputClass = onDark
    ? 'w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#F56A2A] transition-colors'
    : 'w-full bg-[#FAFAFA] border border-[#EFE7DC] rounded-xl px-4 py-3 text-[#0B1218] focus:outline-none focus:border-[#F56A2A] transition-colors';
  const inputWithEyeClass = onDark
    ? 'w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder:text-white/30 focus:outline-none focus:border-[#F56A2A] transition-colors'
    : 'w-full bg-[#FAFAFA] border border-[#EFE7DC] rounded-xl px-4 py-3 pr-12 text-[#0B1218] focus:outline-none focus:border-[#F56A2A] transition-colors';
  const pinInputClass = onDark
    ? 'w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-center text-2xl tracking-widest focus:outline-none focus:border-[#F56A2A] transition-colors'
    : 'w-full bg-[#FAFAFA] border border-[#EFE7DC] rounded-xl px-4 py-3 text-[#0B1218] font-mono text-center text-2xl tracking-widest focus:outline-none focus:border-[#F56A2A] transition-colors';
  const eyeBtn = onDark ? 'text-white/50 hover:text-white' : 'text-[#0B1218]/50 hover:text-[#0B1218]';
  const darkSecondaryBtn = onDark
    ? 'w-full bg-white text-[#0B1218] font-[\'Inter\'] font-semibold rounded-xl py-3.5 hover:bg-white/90 transition-colors disabled:opacity-50'
    : 'w-full bg-[#0B1218] text-white font-[\'Inter\'] font-semibold rounded-xl py-3.5 hover:bg-gray-800 transition-colors disabled:opacity-50';
  const pinHintBox = onDark
    ? 'bg-[#F56A2A]/10 border border-[#F56A2A]/30 rounded-lg p-4'
    : 'bg-[#FFF5F0] border border-[#F56A2A]/20 rounded-lg p-4';
  const pinHintText = onDark ? 'font-[\'Inter\'] text-sm text-white/90' : 'font-[\'Inter\'] text-sm text-[#0B1218]';

  const handleLoginSubmit = async () => {
    const email = emailInput.trim().toLowerCase();
    if (!email.includes('@') || !email.includes('.') || passwordInput.length < 5) {
      setAuthError('E-mail ou senha incorretos');
      return;
    }
    setIsSubmitting(true);
    setAuthError('');
    try {
      await authApi.entrar(email, passwordInput);
      await telemetriaApi.registrarEventoTelemetria('login_success', { origem: 'landing_inline' });
      setThemeMode('dark');
      setOcultarValores(true);
      navigate('/home');
    } catch (error) {
      if (error instanceof ApiError && error.code === 'CADASTRO_INCOMPLETO') {
        setAuthError('Cadastro interrompido. Use "Esqueci a senha" para concluir o acesso.');
      } else if (error instanceof ApiError && error.status === 401) {
        setAuthError('E-mail ou senha incorretos');
      } else {
        setAuthError('Falha ao autenticar');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSolicitarRecuperacaoPorEmail = async () => {
    const email = emailInput.trim().toLowerCase();
    if (!email.includes('@') || !email.includes('.')) {
      setAuthError('Informe um e-mail válido.');
      return;
    }
    setIsSubmitting(true);
    setAuthError('');
    try {
      const resposta = await authApi.solicitarRecuperacaoPorEmail(email);
      setRecoveryInfo(`Solicitação enviada para ${resposta.destinoMascara}.`);
      setForgotStage('reset');
    } catch (error) {
      setAuthError(mapApiAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSolicitarRecuperacaoPorCpf = async () => {
    const cpf = cpfInput.replace(/\D/g, '');
    if (cpf.length !== 11) {
      setAuthError('Informe um CPF válido.');
      return;
    }
    setIsSubmitting(true);
    setAuthError('');
    try {
      const resposta = await authApi.solicitarRecuperacaoPorCpf(cpf);
      setRecoveryInfo(`Conta localizada: ${resposta.destinoMascara}. Enviamos o PIN por e-mail.`);
      setForgotStage('reset');
      setLoginStep('forgotPassword');
    } catch (error) {
      setAuthError(mapApiAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRedefinirSenha = async () => {
    const pinLimpo = tokenInput.trim().replace(/\D/g, '');
    if (pinLimpo.length !== 6) {
      setAuthError('PIN deve ter exatamente 6 dígitos.');
      return;
    }
    if (!senhaForteRegex.test(newPasswordInput)) {
      setAuthError('Senha deve ter 8+ caracteres com maiúscula, minúscula, número e símbolo.');
      return;
    }
    setIsSubmitting(true);
    setAuthError('');
    setSuccessMessage('');
    try {
      await authApi.redefinirSenha(pinLimpo, newPasswordInput);
      setSuccessMessage('✓ Senha redefinida com sucesso!');
      setTimeout(() => {
        setLoginStep('login');
        setPasswordInput('');
        setTokenInput('');
        setNewPasswordInput('');
        setAuthError('');
        setSuccessMessage('');
      }, 2000);
    } catch (error) {
      setAuthError(mapApiAuthError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      {loginStep === 'login' && (
        <>
          <h2 className={`font-['Sora'] text-2xl font-bold ${headingColor} text-left ${compact ? 'mb-6' : 'mb-8'}`}>
            Faça seu login
          </h2>

          <div className="space-y-5">
            <div>
              <label className={`block font-['Inter'] text-sm font-semibold ${labelColor} mb-2`}>
                E-mail
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (authError) setAuthError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLoginSubmit();
                  }
                }}
                className={inputClass}
              />
            </div>

            <div>
              <label className={`block font-['Inter'] text-sm font-semibold ${labelColor} mb-2`}>
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (authError) setAuthError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLoginSubmit();
                    }
                  }}
                  placeholder="Digite sua senha"
                  className={inputWithEyeClass}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${eyeBtn}`}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setForgotStage('email');
                    setRecoveryInfo('');
                    setAuthError('');
                    setLoginStep('forgotPassword');
                  }}
                  className="text-xs text-[#F56A2A] hover:text-[#d95a20] font-medium"
                >
                  Esqueci a senha
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLoginSubmit}
              disabled={passwordInput.length < 5 || isSubmitting}
              className="w-full bg-[#F56A2A] text-white font-['Inter'] font-semibold rounded-xl py-3.5 hover:bg-[#d95a20] transition-colors disabled:opacity-50 flex justify-center"
            >
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </button>

            {authError && (
              <p className="text-xs text-[#E85C5C] text-center">{authError}</p>
            )}
            {recoveryInfo && (
              <p className="text-xs text-[#6FCF97] text-center">{recoveryInfo}</p>
            )}

            <button
              type="button"
              onClick={() => setLoginStep('forgotEmail')}
              className={`block w-full text-center text-xs ${mutedBtnColor} font-medium`}
            >
              Não sei meu e-mail
            </button>

            <p className={`text-center text-sm ${bodyText} pt-2`}>
              Não tem conta?{' '}
              <button
                type="button"
                onClick={() => navigate('/onboarding')}
                className="text-[#F56A2A] hover:text-[#d95a20] font-semibold"
              >
                Cadastre-se grátis
              </button>
            </p>
          </div>
        </>
      )}

      {loginStep === 'forgotEmail' && (
        <>
          <h2 className={`font-['Sora'] text-2xl font-bold ${headingColor} text-center`}>
            Recuperar acesso
          </h2>
          <p className={`font-['Inter'] text-sm ${subtextColor} text-center mt-2 mb-8`}>
            Informe seu CPF para localizar sua conta.
          </p>

          <div className="space-y-5">
            <div>
              <label className={`block font-['Inter'] text-sm font-semibold ${labelColor} mb-2`}>
                CPF
              </label>
              <input
                type="text"
                placeholder="000.000.000-00"
                value={cpfInput}
                onChange={(e) => setCpfInput(e.target.value)}
                className={inputClass}
              />
            </div>

            <button
              type="button"
              onClick={handleSolicitarRecuperacaoPorCpf}
              disabled={isSubmitting}
              className={darkSecondaryBtn}
            >
              {isSubmitting ? 'Localizando...' : 'Localizar e enviar recuperação'}
            </button>

            {authError && <p className="text-xs text-[#E85C5C] text-center">{authError}</p>}
            {recoveryInfo && <p className="text-xs text-[#6FCF97] text-center">{recoveryInfo}</p>}

            <button
              type="button"
              onClick={() => setLoginStep('login')}
              className={`w-full text-center text-sm font-semibold ${mutedBtnColor}`}
            >
              Voltar para login
            </button>
          </div>
        </>
      )}

      {loginStep === 'forgotPassword' && (
        <>
          <h2 className={`font-['Sora'] text-2xl font-bold ${headingColor} text-center`}>
            Recuperar senha
          </h2>
          <p className={`font-['Inter'] text-sm ${subtextColor} text-center mt-2 mb-8`}>
            {forgotStage === 'email'
              ? 'Enviaremos um código de recuperação para o seu e-mail.'
              : 'Digite o PIN recebido por e-mail e escolha uma nova senha.'}
          </p>

          {forgotStage === 'email' && (
            <div className="space-y-5">
              <div>
                <label className={`block font-['Inter'] text-sm font-semibold ${labelColor} mb-2`}>
                  E-mail
                </label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    if (authError) setAuthError('');
                  }}
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={handleSolicitarRecuperacaoPorEmail}
                disabled={isSubmitting || !emailInput.includes('@')}
                className="w-full bg-[#F56A2A] text-white font-['Inter'] font-semibold rounded-xl py-3.5 hover:bg-[#d95a20] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar código de recuperação'}
              </button>
            </div>
          )}

          {forgotStage === 'reset' && (
            <div className="space-y-5">
              <div className={pinHintBox}>
                <p className={pinHintText}>
                  <strong>Abra o e-mail</strong> que você recebeu. Você vai encontrar um código de 6 dígitos.
                </p>
              </div>

              <div>
                <label className={`block font-['Inter'] text-sm font-semibold ${labelColor} mb-2`}>
                  PIN do e-mail
                </label>
                <input
                  type="text"
                  placeholder="000000"
                  value={tokenInput}
                  onChange={(e) => {
                    setTokenInput(e.target.value);
                    if (authError) setAuthError('');
                  }}
                  inputMode="numeric"
                  maxLength={6}
                  className={pinInputClass}
                />
              </div>

              <div>
                <label className={`block font-['Inter'] text-sm font-semibold ${labelColor} mb-2`}>
                  Nova senha
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Digite sua nova senha"
                    value={newPasswordInput}
                    onChange={(e) => {
                      setNewPasswordInput(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    className={inputWithEyeClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${eyeBtn}`}
                    aria-label={showNewPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className={`mt-2 text-xs ${subtextColor}`}>
                  8+ caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 símbolo.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRedefinirSenha}
                disabled={isSubmitting || !tokenInput.trim() || !newPasswordInput}
                className="w-full bg-[#F56A2A] text-white font-['Inter'] font-semibold rounded-xl py-3.5 hover:bg-[#d95a20] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Redefinindo senha...' : 'Redefinir senha'}
              </button>
            </div>
          )}

          {authError && (
            <p className="mt-4 text-xs text-[#E85C5C] text-center font-medium bg-[#FFE8E8] rounded-lg p-3">
              {authError}
            </p>
          )}
          {recoveryInfo && (
            <p className="mt-4 text-xs text-[#6FCF97] text-center font-medium bg-[#E8F5F0] rounded-lg p-3">
              {recoveryInfo}
            </p>
          )}
          {successMessage && (
            <p className="mt-4 text-sm text-[#6FCF97] text-center font-semibold bg-[#E8F5F0] rounded-lg p-3">
              {successMessage}
            </p>
          )}

          {!successMessage && (
            <button
              type="button"
              onClick={() => setLoginStep('login')}
              className={`mt-6 w-full text-center text-sm font-semibold ${mutedBtnColor}`}
            >
              Voltar para login
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setThemeMode, isDarkMode } = useTheme();
  const isMobile = useIsMobile();
  const mobileDark = isMobile && isDarkMode;

  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingInitialStep, setOnboardingInitialStep] = useState(1);
  const [loginInitialStep, setLoginInitialStep] = useState<LoginStep>('login');
  const [loginInitialEmail, setLoginInitialEmail] = useState('');
  const [alertaLogin, setAlertaLogin] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const abrirLogin = params.get('abrir') === 'login';
    const stepLogin = params.get('step') || 'login';
    const emailLogin = params.get('email') || '';

    if (location.pathname === '/onboarding') {
      const passo = Number(params.get('passo') || 1);
      setOnboardingInitialStep(Number.isFinite(passo) && passo > 0 ? passo : 1);
      setIsOnboarding(true);
    } else {
      setIsOnboarding(false);
    }

    if (abrirLogin) {
      setLoginInitialStep(stepLogin === 'forgotPassword' ? 'forgotPassword' : 'login');
      setLoginInitialEmail(emailLogin);
      setAlertaLogin('');
      return;
    }

    const sessaoExpiradaPorQuery = params.get('sessao') === 'expirada';
    const sessaoExpiradaPorStorage = consumirMotivoSaidaSessao() === 'expirada';
    if (sessaoExpiradaPorQuery || sessaoExpiradaPorStorage) {
      setLoginInitialStep('login');
      setLoginInitialEmail('');
      setAlertaLogin('Sua sessão expirou por segurança. Entre novamente para continuar.');
      return;
    }

    setAlertaLogin('');
  }, [location.pathname, location.search]);

  const handleCloseOnboarding = () => {
    setIsOnboarding(false);
    navigate('/');
  };

  useEffect(() => {
    if (isMobile) return;
    const html = document.documentElement;
    const hadDark = html.classList.contains('dark');
    if (hadDark) html.classList.remove('dark');
    return () => {
      if (hadDark) html.classList.add('dark');
    };
  }, [isMobile]);

  return (
    <div
      className="min-h-screen font-['Inter'] flex"
      style={{
        backgroundColor: mobileDark ? '#0B1218' : '#FFFFFF',
        color: mobileDark ? '#FFFFFF' : '#0B1218',
      }}
    >
      {!isMobile && <PainelPropostaValor />}

      <main className="flex-1 min-h-screen flex flex-col items-center p-6 sm:p-10">
        {isMobile ? (
          <>
            <div className="w-full flex justify-start pt-2">
              <LogoEsquiloWallet variant={mobileDark ? 'dark' : 'light'} className="h-8 w-auto" />
            </div>
            <div className={`flex-1 w-full flex ${isOnboarding ? 'items-start pt-8' : 'items-center'} justify-center`}>
              {isOnboarding ? (
                <div className="w-full">
                  <Onboarding
                    inline
                    onePerStep
                    onDark={mobileDark}
                    mode="signup"
                    initialStep={onboardingInitialStep}
                    onClose={handleCloseOnboarding}
                  />
                </div>
              ) : (
                <FormularioLogin
                  alertaInicial={alertaLogin}
                  initialStep={loginInitialStep}
                  initialEmail={loginInitialEmail}
                  compact
                  onDark={mobileDark}
                />
              )}
            </div>
            <div className={`w-full text-center font-['Inter'] text-xs ${mobileDark ? 'text-white/40' : 'text-[#0B1218]/40'} pb-4`}>
              © {new Date().getFullYear()} IA Group. SA · Kaidu - Beta Test · LGPD
            </div>
          </>
        ) : (
          <div className={`flex-1 w-full flex ${isOnboarding ? 'items-start pt-8' : 'items-center'} justify-center`}>
            {isOnboarding ? (
              <div className="w-full max-w-[640px]">
                <Onboarding
                  inline
                  mode="signup"
                  initialStep={onboardingInitialStep}
                  onClose={handleCloseOnboarding}
                />
                <div className="px-1 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseOnboarding}
                    className="text-xs text-[#0B1218]/60 hover:text-[#F56A2A] font-semibold"
                  >
                    ← Voltar para login
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-sm">
                <FormularioLogin
                  alertaInicial={alertaLogin}
                  initialStep={loginInitialStep}
                  initialEmail={loginInitialEmail}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
