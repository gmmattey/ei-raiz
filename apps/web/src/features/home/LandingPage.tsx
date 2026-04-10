import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { assetPath } from '../../utils/assetPath';
import { ApiError, authApi, consumirMotivoSaidaSessao } from '../../cliente-api';
import { useConteudoApp } from '../../hooks/useConteudoApp';
import { 
  Menu, X, ChevronRight, ArrowRight, Lock, 
  Eye, BarChart2, Shield, Info, FileText, AlertTriangle, CheckCircle2
} from 'lucide-react';

// --- SISTEMA DE ÍCONES ---
const Icon = ({ name, className = '', size = 24 }) => {
  const icons = {
    menu: <Menu size={size} className={className} strokeWidth={1.5} />,
    close: <X size={size} className={className} strokeWidth={1.5} />,
    chevronRight: <ChevronRight size={size} className={className} strokeWidth={1.5} />,
    arrowRight: <ArrowRight size={size} className={className} strokeWidth={1.5} />,
    lock: <Lock size={size} className={className} strokeWidth={1.5} />,
    eye: <Eye size={size} className={className} strokeWidth={1.5} />,
    chart: <BarChart2 size={size} className={className} strokeWidth={1.5} />,
    shield: <Shield size={size} className={className} strokeWidth={1.5} />,
    info: <Info size={size} className={className} strokeWidth={1.5} />,
    file: <FileText size={size} className={className} strokeWidth={1.5} />,
    alert: <AlertTriangle size={size} className={className} strokeWidth={1.5} />,
    check: <CheckCircle2 size={size} className={className} strokeWidth={1.5} />
  };
  return icons[name] || <Info size={size} className={className} strokeWidth={1.5} />;
};

// --- COMPONENTES BASE ---
const Button = ({ children, variant = 'primary', className = '', disabled = false, ...props }) => {
  const baseStyle = "font-['Inter'] font-semibold rounded-md px-6 py-3 transition-all duration-200 flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-[#F56A2A] text-white hover:bg-[#d95a20] disabled:bg-[#F56A2A]/50 disabled:cursor-not-allowed",
    secondary: "bg-transparent border border-[#0B1218] text-[#0B1218] hover:bg-[#0B1218] hover:text-white disabled:opacity-50",
    ghost: "bg-transparent text-white hover:text-[#F56A2A] disabled:opacity-50",
    dark: "bg-[#0B1218] text-white hover:bg-gray-800 disabled:bg-[#0B1218]/50" 
  };

  return (
    <button disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// --- MODAL DE LOGIN (ESTILO BANCO) ---
const LoginModal = ({ isOpen, onClose, alertaInicial = '' }) => {
  const navigate = useNavigate();
  const [loginStep, setLoginStep] = useState('default');
  const [passwordInput, setPasswordInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [cpfInput, setCpfInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [recoveryInfo, setRecoveryInfo] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const senhaForteRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,128}$/;

  useEffect(() => {
    if (isOpen) {
      setLoginStep('default');
      setPasswordInput('');
      setEmailInput('');
      setCpfInput('');
      setTokenInput('');
      setNewPasswordInput('');
      setRecoveryInfo('');
      setAuthError(alertaInicial);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [alertaInicial, isOpen]);

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
      onClose();
      navigate('/home');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
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
      setRecoveryInfo(`Solicitação enviada para ${resposta.destinoMascara}. Confira seu e-mail e use o token para redefinir a senha nesta mesma tela.`);
    } catch (error) {
      if (error instanceof ApiError) setAuthError(error.message);
      else setAuthError('Não foi possível solicitar recuperação agora. Tente novamente em alguns instantes.');
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
      setRecoveryInfo(`Conta localizada: ${resposta.destinoMascara}. Enviamos o token para recuperação e você já pode redefinir a senha no próximo passo.`);
    } catch (error) {
      if (error instanceof ApiError) setAuthError(error.message);
      else setAuthError('Não foi possível localizar sua conta agora. Tente novamente em alguns instantes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRedefinirSenha = async () => {
    if (!tokenInput.trim()) {
      setAuthError('Informe o token/código de recuperação.');
      return;
    }
    if (!senhaForteRegex.test(newPasswordInput)) {
      setAuthError('Nova senha fora do padrão de segurança.');
      return;
    }
    setIsSubmitting(true);
    setAuthError('');
    try {
      await authApi.redefinirSenha(tokenInput.trim(), newPasswordInput);
      setRecoveryInfo('Senha redefinida com sucesso. Faça login agora com a nova senha.');
      setLoginStep('default');
      setPasswordInput('');
      setTokenInput('');
      setNewPasswordInput('');
    } catch (error) {
      if (error instanceof ApiError) setAuthError(error.message);
      else setAuthError('Falha ao redefinir senha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0B1218]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-between items-center p-6 border-b border-[#EFE7DC]">
          <h3 className="font-['Sora'] font-bold text-xl text-[#0B1218]">
            {loginStep === 'default' && "Acessar Carteira"}
            {loginStep === 'forgotEmail' && "Recuperar Acesso"}
            {loginStep === 'forgotPassword' && "Recuperar Senha"}
          </h3>
          <button onClick={onClose} className="text-[#0B1218]/50 hover:text-[#0B1218] transition-colors">
            <Icon name="close" />
          </button>
        </div>

        <div className="p-6">
          {loginStep === 'default' && (
            <div className="space-y-6">
              <div className="flex justify-center">
                <img src={assetPath('/assets/logo/logo-horizontal-invest-laranja.svg')} alt="Esquilo Invest" className="h-10 object-contain" />
              </div>
              <div>
                <label className="block font-['Inter'] text-sm font-semibold text-[#0B1218] mb-2">E-mail</label>
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
                  className="w-full bg-[#FAFAFA] border border-[#EFE7DC] rounded-md px-4 py-3 text-[#0B1218] focus:outline-none focus:border-[#F56A2A] transition-colors"
                />
                <button 
                  onClick={() => setLoginStep('forgotEmail')}
                  className="text-xs text-[#0B1218]/60 hover:text-[#F56A2A] mt-2 font-medium"
                >
                  Não sei meu e-mail
                </button>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block font-['Inter'] text-sm font-semibold text-[#0B1218]">Senha Eletrônica</label>
                  <button 
                    onClick={() => setLoginStep('forgotPassword')}
                    className="text-xs text-[#F56A2A] hover:text-[#d95a20] font-medium"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                
                <div className="relative mb-3">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    placeholder="Digite sua senha"
                    className="w-full bg-[#FAFAFA] border border-[#EFE7DC] rounded-md px-4 py-3 pr-12 text-[#0B1218] focus:outline-none focus:border-[#F56A2A] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0B1218]/50 hover:text-[#0B1218]"
                  >
                    {showPassword ? <Eye size={18} /> : <Icon name="eye" size={18} />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleLoginSubmit}
                  disabled={passwordInput.length < 5 || isSubmitting}
                  className="w-full mt-2 bg-[#F56A2A] text-white font-['Inter'] font-semibold rounded-md py-4 hover:bg-[#d95a20] transition-colors disabled:opacity-50 flex justify-center"
                >
                  {isSubmitting ? 'Entrando...' : 'Entrar'}
                </button>
                {authError && <p className="mt-2 text-xs text-[#E85C5C]">{authError}</p>}
                {recoveryInfo && <p className="mt-2 text-xs text-[#6FCF97]">{recoveryInfo}</p>}
                <button
                  onClick={() => {
                    onClose();
                    navigate('/onboarding');
                  }}
                  className="mt-3 text-xs text-[#0B1218]/70 hover:text-[#F56A2A] font-medium"
                >
                  Criar conta
                </button>
              </div>
            </div>
          )}

          {loginStep === 'forgotEmail' && (
            <div className="space-y-6">
              <p className="font-['Inter'] text-sm text-[#0B1218]/70">Informe seu CPF para localizar sua conta e enviar recuperação ao e-mail cadastrado.</p>
              <div>
                <label className="block font-['Inter'] text-sm font-semibold text-[#0B1218] mb-2">CPF</label>
                <input 
                  type="text" 
                  placeholder="000.000.000-00"
                  value={cpfInput}
                  onChange={(e) => setCpfInput(e.target.value)}
                  className="w-full bg-[#FAFAFA] border border-[#EFE7DC] rounded-md px-4 py-3 text-[#0B1218] focus:outline-none focus:border-[#F56A2A] transition-colors"
                />
              </div>
              <button
                type="button"
                onClick={handleSolicitarRecuperacaoPorCpf}
                disabled={isSubmitting}
                className="w-full mt-4 bg-[#0B1218] text-white font-['Inter'] font-semibold rounded-md py-4 hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Localizando...' : 'Localizar e enviar recuperação'}
              </button>
              {authError && <p className="text-xs text-[#E85C5C] font-medium">{authError}</p>}
              {recoveryInfo && <p className="text-xs text-[#6FCF97] font-medium">{recoveryInfo}</p>}

              <button onClick={() => setLoginStep('default')} className="w-full text-center text-sm font-semibold text-[#0B1218]/60 hover:text-[#0B1218] mt-4">
                Voltar para Login
              </button>
            </div>
          )}

          {loginStep === 'forgotPassword' && (
            <div className="space-y-6">
               <p className="font-['Inter'] text-sm text-[#0B1218]/70">Informe seu e-mail para envio de recuperação. Depois, redefina com o token recebido.</p>
              <div>
                <label className="block font-['Inter'] text-sm font-semibold text-[#0B1218] mb-2">E-mail</label>
                <input 
                  type="email"
                  placeholder="seu@email.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-[#FAFAFA] border border-[#EFE7DC] rounded-md px-4 py-3 text-[#0B1218] focus:outline-none focus:border-[#F56A2A] transition-colors"
                />
              </div>
              
              <button type="button" onClick={handleSolicitarRecuperacaoPorEmail} className="w-full bg-[#0B1218] text-white font-['Inter'] font-semibold rounded-md py-4 hover:bg-gray-800 transition-colors disabled:opacity-50" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Enviar recuperação'}
              </button>

              <div>
                <label className="block font-['Inter'] text-sm font-semibold text-[#0B1218] mb-2">Token/Código</label>
                <input
                  type="text"
                  placeholder="Cole o token recebido"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full bg-[#FAFAFA] border border-[#EFE7DC] rounded-md px-4 py-3 text-[#0B1218] focus:outline-none focus:border-[#F56A2A] transition-colors"
                />
              </div>
              <div>
                <label className="block font-['Inter'] text-sm font-semibold text-[#0B1218] mb-2">Nova senha</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Nova senha forte"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="w-full bg-[#FAFAFA] border border-[#EFE7DC] rounded-md px-4 py-3 pr-12 text-[#0B1218] focus:outline-none focus:border-[#F56A2A] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#0B1218]/50 hover:text-[#0B1218]"
                  >
                    {showNewPassword ? <Eye size={18} /> : <Icon name="eye" size={18} />}
                  </button>
                </div>
                <p className="mt-2 text-xs text-[#0B1218]/60">8+ caracteres com maiúscula, minúscula, número e especial.</p>
              </div>
              <button type="button" onClick={handleRedefinirSenha} className="w-full bg-[#F56A2A] text-white font-['Inter'] font-semibold rounded-md py-4 hover:bg-[#d95a20] transition-colors disabled:opacity-50" disabled={isSubmitting}>
                {isSubmitting ? 'Redefinindo...' : 'Redefinir senha'}
              </button>
              {authError && <p className="text-xs text-[#E85C5C] font-medium">{authError}</p>}
              {recoveryInfo && <p className="text-xs text-[#6FCF97] font-medium">{recoveryInfo}</p>}

              <button onClick={() => setLoginStep('default')} className="w-full text-center text-sm font-semibold text-[#0B1218]/60 hover:text-[#0B1218] mt-4">
                Lembrei minha senha, voltar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- BLOCOS DE CONTEÚDO ---

const SectionComoFunciona = ({ id, titulo }) => (
  <section id={id} className="min-h-screen flex flex-col justify-center py-24 bg-white text-[#0B1218] animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-30">
    <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 text-center">
      <h2 className="font-['Sora'] text-3xl md:text-5xl font-bold text-[#0B1218] mb-20">{titulo}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
        <div className="hidden md:block absolute top-6 left-[15%] right-[15%] h-px bg-[#EFE7DC]"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 bg-[#F56A2A] text-white font-bold rounded-md flex items-center justify-center mb-6 border-4 border-white shadow-sm">1</div>
          <h3 className="font-['Sora'] font-bold text-xl mb-3">Você traz tudo pro mesmo lugar</h3>
          <p className="font-['Inter'] text-[#0B1218]/70 text-base leading-relaxed max-w-xs text-center">
            Você importa seu CSV no padrão da plataforma e nós consolidamos seus ativos em uma única leitura.
          </p>
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 bg-[#F56A2A] text-white font-bold rounded-md flex items-center justify-center mb-6 border-4 border-white shadow-sm">2</div>
          <h3 className="font-['Sora'] font-bold text-xl mb-3">A gente traduz tudo</h3>
          <p className="font-['Inter'] text-[#0B1218]/70 text-base leading-relaxed max-w-xs text-center">
            Cruza tudo que você tem, calcula onde tá concentrado, o que é mais seguro, o que é mais arriscado.
          </p>
        </div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 bg-[#F56A2A] text-white font-bold rounded-md flex items-center justify-center mb-6 border-4 border-white shadow-sm">3</div>
          <h3 className="font-['Sora'] font-bold text-xl mb-3">Você fica sabendo o que fazer</h3>
          <p className="font-['Inter'] text-[#0B1218]/70 text-base leading-relaxed max-w-xs text-center">
            Você ganha um mapa real da carteira. Sem jargão, sem venda de fundo. Só o que importa mesmo.
          </p>
        </div>
      </div>
    </div>
  </section>
);

const SectionProposta = ({ id, titulo }) => (
  <section id={id} className="min-h-screen flex flex-col justify-center bg-[#F5F0EB] py-24 text-[#0B1218] animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-30">
    <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        <div className="lg:col-span-5">
          <h2 className="font-['Sora'] text-4xl md:text-5xl font-bold mb-6 leading-tight">{titulo}</h2>
          <p className="font-['Inter'] text-lg text-[#0B1218]/70 leading-relaxed mb-10">
            A Esquilo Invest não possui ferramentas técnicas para movimentar dinheiro. Nós não vendemos CDBs, não executamos ordens e não ganhamos comissão sobre seus ativos. Nosso único produto é a sua lucidez financeira.
          </p>
          <div className="space-y-5 font-['Inter']">
            <div className="flex items-center gap-3">
              <img src={assetPath('/assets/icons/laranja/confirmar.svg')} className="w-6 h-6" alt="Check" />
              <span className="text-base font-semibold text-[#0B1218]">Importação de carteira via CSV</span>
            </div>
            <div className="flex items-center gap-3">
              <img src={assetPath('/assets/icons/laranja/confirmar.svg')} className="w-6 h-6" alt="Check" />
              <span className="text-base font-semibold text-[#0B1218]">100% adequado à LGPD</span>
            </div>
            <div className="flex items-center gap-3 opacity-50">
              <img src={assetPath('/assets/icons/preto/fechar.svg')} className="w-6 h-6" alt="X" />
              <span className="text-base font-semibold line-through">Transferências, PIX ou Vendas</span>
            </div>
          </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white border border-[#EFE7DC] rounded-none p-8 shadow-sm hover:shadow-md transition-shadow">
            <img src={assetPath('/assets/icons/laranja/olho.svg')} className="w-8 h-8 mb-5" alt="Visão Neutra" />
            <h4 className="font-['Sora'] font-bold text-[#0B1218] text-lg mb-3">Visão Neutra</h4>
            <p className="font-['Inter'] text-sm text-[#0B1218]/70 leading-relaxed">
              Lemos os dados sem viés comercial para vender o próximo fundo da corretora.
            </p>
          </div>

          <div className="bg-white border border-[#EFE7DC] rounded-none p-8 shadow-sm hover:shadow-md transition-shadow">
            <img src={assetPath('/assets/icons/laranja/grafico.svg')} className="w-8 h-8 mb-5" alt="Tradução de Risco" />
            <h4 className="font-['Sora'] font-bold text-[#0B1218] text-lg mb-3">Tradução de Risco</h4>
            <p className="font-['Inter'] text-sm text-[#0B1218]/70 leading-relaxed">
              Calculamos a sua exposição real cruzando todos os seus bancos em um único relatório.
            </p>
          </div>

          <div className="bg-white border border-[#EFE7DC] rounded-none p-8 shadow-sm hover:shadow-md transition-shadow">
            <img src={assetPath('/assets/icons/laranja/aporte.svg')} className="w-8 h-8 mb-5" alt="Consolidação Real" />
            <h4 className="font-['Sora'] font-bold text-[#0B1218] text-lg mb-3">Consolidação em uma visão única</h4>
            <p className="font-['Inter'] text-sm text-[#0B1218]/70 leading-relaxed">
              Organize ativos de diferentes instituições com um único padrão de importação e leitura.
            </p>
          </div>

          <div className="bg-white border border-[#EFE7DC] rounded-none p-8 shadow-sm hover:shadow-md transition-shadow">
            <img src={assetPath('/assets/icons/laranja/sucesso.svg')} className="w-8 h-8 mb-5" alt="Próximos Passos" />
            <h4 className="font-['Sora'] font-bold text-[#0B1218] text-lg mb-3">Próximos Passos</h4>
            <p className="font-['Inter'] text-sm text-[#0B1218]/70 leading-relaxed">
              Baseado em dados lógicos, apontamos exatamente onde a carteira precisa de ajustes estruturais.
            </p>
          </div>
          </div>
      </div>
    </div>
  </section>
);

const SectionFaq = ({ id, titulo, subtitulo }) => (
  <section id={id} className="min-h-screen flex flex-col justify-center py-24 bg-white text-[#0B1218] animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-30">
    <div className="mx-auto w-full max-w-[896px] px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="font-['Sora'] text-4xl md:text-5xl font-bold text-[#0B1218] mb-4">{titulo}</h2>
        <p className="font-['Inter'] text-[#0B1218]/70 text-xl">{subtitulo}</p>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <div className="border border-[#EFE7DC] rounded-none p-8 hover:border-[#F56A2A]/30 transition-colors">
          <h3 className="font-['Sora'] font-bold text-[#0B1218] text-xl mb-3">Como é calculado o Score da Carteira?</h3>
          <p className="font-['Inter'] text-[#0B1218]/70 text-base leading-relaxed">
            O Score é uma métrica proprietária de 0 a 100 que avalia quatro pilares: liquidez, diversificação de emissores, exposição a risco e eficiência de taxas. Ele não prevê rentabilidade, prevê a robustez estrutural.
          </p>
        </div>
        <div className="border border-[#EFE7DC] rounded-none p-8 hover:border-[#F56A2A]/30 transition-colors">
          <h3 className="font-['Sora'] font-bold text-[#0B1218] text-xl mb-3">O que acontece após importar o primeiro extrato?</h3>
          <p className="font-['Inter'] text-[#0B1218]/70 text-base leading-relaxed">
            A plataforma padroniza nomes e ativos em minutos. Em seguida, o dashboard é liberado revelando seu patrimônio consolidado e apontamentos iniciais de risco.
          </p>
        </div>
        <div className="border border-[#EFE7DC] rounded-none p-8 hover:border-[#F56A2A]/30 transition-colors">
          <h3 className="font-['Sora'] font-bold text-[#0B1218] text-xl mb-3">Como a Esquilo ganha dinheiro?</h3>
          <p className="font-['Inter'] text-[#0B1218]/70 text-base leading-relaxed">
            O produto está em evolução contínua. O foco atual é consolidar carteira, traduzir risco e orientar próximos passos com base em dados reais.
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { texto, booleano } = useConteudoApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [alertaLogin, setAlertaLogin] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [visibleSections, setVisibleSections] = useState<string[]>([]);
  const [currentHeroImage, setCurrentHeroImage] = useState(0);

  const heroImages = [
    "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&q=80&w=2000",
    "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&q=80&w=2000",
    "https://images.unsplash.com/photo-1623869260195-2cc02d09dfb3?auto=format&fit=crop&q=80&w=2000"
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % heroImages.length);
    }, 6000); 
    return () => clearInterval(interval);
  }, [heroImages.length]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sessaoExpiradaPorQuery = params.get('sessao') === 'expirada';
    const sessaoExpiradaPorStorage = consumirMotivoSaidaSessao() === 'expirada';
    if (sessaoExpiradaPorQuery || sessaoExpiradaPorStorage) {
      setAlertaLogin('Sua sessão expirou por segurança. Entre novamente para continuar.');
      setIsLoginModalOpen(true);
      return;
    }
    setAlertaLogin('');
  }, [location.search]);

  const handleNavClick = (e, sectionId) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    if (!visibleSections.includes(sectionId)) {
      setVisibleSections(prev => [...prev, sectionId]);
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } else {
      const element = document.getElementById(sectionId);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleLoginClick = () => {
    setIsMobileMenuOpen(false);
    setIsLoginModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0B1218] font-['Inter'] text-[#F5F0EB] selection:bg-[#F56A2A] selection:text-white">
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} alertaInicial={alertaLogin} />
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#0B1218]/95 backdrop-blur-md border-b border-white/10 shadow-lg py-4' : 'bg-gradient-to-b from-[#0B1218]/80 to-transparent border-transparent py-6'}`}>
        <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
               <img src={assetPath('/assets/logo/logo-horizontal-fundo-escuro-invest-laranja.svg')} alt="Logo Esquilo Invest" className="h-[54px] md:h-[65px] object-contain" />
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#como-funciona" onClick={(e) => handleNavClick(e, 'como-funciona')} className="text-sm font-semibold text-white hover:text-[#F56A2A] transition-colors">Como funciona</a>
              <a href="#proposta" onClick={(e) => handleNavClick(e, 'proposta')} className="text-sm font-semibold text-white hover:text-[#F56A2A] transition-colors">A Proposta</a>
              <a href="#faq" onClick={(e) => handleNavClick(e, 'faq')} className="text-sm font-semibold text-white hover:text-[#F56A2A] transition-colors">Dúvidas</a>
            </nav>
            <div className="hidden md:flex items-center gap-4">
              <button onClick={handleLoginClick} className="font-['Inter'] font-semibold px-4 py-2 text-sm text-white hover:text-[#F56A2A] transition-colors">Entrar</button>
              <Button variant="primary" className="px-5 py-2 text-sm" onClick={() => navigate('/onboarding')}>Criar conta</Button>
            </div>
            <button className="md:hidden p-2 text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Icon name={isMobileMenuOpen ? "close" : "menu"} />
            </button>
          </div>
        </div>
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-[#0B1218] border-t border-white/10 shadow-xl py-4 px-4 flex flex-col gap-4">
            <a href="#como-funciona" onClick={(e) => handleNavClick(e, 'como-funciona')} className="block py-2 font-semibold text-white hover:text-[#F56A2A]">Como funciona</a>
            <a href="#proposta" onClick={(e) => handleNavClick(e, 'proposta')} className="block py-2 font-semibold text-white hover:text-[#F56A2A]">A Proposta</a>
            <a href="#faq" onClick={(e) => handleNavClick(e, 'faq')} className="block py-2 font-semibold text-white hover:text-[#F56A2A]">Dúvidas</a>
            <div className="h-px bg-white/10 my-2"></div>
            <button onClick={handleLoginClick} className="font-['Inter'] font-semibold w-full py-3 text-white hover:bg-white/10 rounded-md transition-colors">Entrar</button>
            <Button variant="primary" className="w-full justify-center" onClick={() => navigate('/onboarding')}>Criar conta</Button>
          </div>
        )}
      </header>

      <section className="relative w-full h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[#0B1218]">
          {heroImages.map((imgSrc, index) => (
            <img key={index} src={imgSrc} alt="Background" className={`absolute inset-0 w-full h-full object-cover object-center filter grayscale-[30%] transition-opacity duration-1000 ease-in-out ${index === currentHeroImage ? 'opacity-100' : 'opacity-0'}`} />
          ))}
          <div className="absolute inset-0 bg-[#0B1218]/40 mix-blend-multiply z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1218] via-[#0B1218]/80 to-transparent z-10"></div>
        </div>
        <div className="relative z-20 mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mt-16 fade-in-up">
            <h1 className="font-['Sora'] text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] mb-4 text-white tracking-tight">
              {texto("landing.hero.titulo", "Sua carteira merece")}<br/>
              <span className="text-[#F56A2A]">{texto("landing.hero.titulo_destaque", "uma visão real.")}</span>
            </h1>
            <h2 className="font-['Sora'] text-xl md:text-2xl font-semibold text-[#F5F0EB]/90 mb-6 fade-in-up" style={{ animationDelay: '0.1s' }}>
              {texto("landing.hero.subtitulo", "Consolidação real, diagnóstico claro e decisão orientada.")}
            </h2>
            <p className="font-['Inter'] text-lg text-[#F5F0EB]/70 mb-10 leading-relaxed max-w-lg fade-in-up" style={{ animationDelay: '0.2s' }}>
              {texto("landing.hero.descricao", "Centralize seus ativos, entenda concentração e risco da carteira e receba uma orientação objetiva do próximo passo.")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Button variant="primary" className="w-full sm:w-auto text-base px-8 py-3.5 shadow-lg shadow-[#F56A2A]/20" onClick={(e) => handleNavClick(e, 'como-funciona')}>
                {texto("landing.hero.cta_primario", "Ver como funciona")} <Icon name="arrowRight" size={18} />
              </Button>
              <button className="font-['Inter'] font-semibold rounded-md px-8 py-3.5 bg-transparent border border-white text-white hover:bg-white hover:text-[#0B1218] transition-all w-full sm:w-auto flex items-center justify-center gap-2" onClick={(e) => handleNavClick(e, 'proposta')}>
                {texto("landing.hero.cta_secundario", "Saber mais sobre a gente")}
              </button>
            </div>
          </div>
        </div>
      </section>

      {visibleSections.length > 0 && (
        <div className="relative z-30 bg-white">
          {visibleSections.map(sectionId => {
            if (sectionId === 'como-funciona') return <SectionComoFunciona key={sectionId} id={sectionId} titulo={texto("landing.como_funciona.titulo", "Entenda como a gente te ajuda")} />;
            if (sectionId === 'proposta') return <SectionProposta key={sectionId} id={sectionId} titulo={texto("landing.proposta.titulo", "Acesso apenas leitura. Zero execução.")} />;
            if (sectionId === 'faq' && booleano("landing.secao.faq.visivel", true)) {
              return (
                <SectionFaq
                  key={sectionId}
                  id={sectionId}
                  titulo={texto("landing.faq.titulo", "Entenda a ferramenta")}
                  subtitulo={texto("landing.faq.subtitulo", "Como o sistema opera e lê os seus dados.")}
                />
              );
            }
            return null;
          })}
        </div>
      )}

      <footer className="bg-[#EFE7DC] pt-32 pb-8 text-[#0B1218] relative z-30">
        <div className="mx-auto mb-32 w-full max-w-[896px] px-4 text-center">
          <h2 className="font-['Sora'] text-4xl md:text-5xl font-bold mb-6">{texto("landing.footer.cta_titulo", "O diagnóstico leva menos de 5 minutos.")}</h2>
          <p className="font-['Inter'] text-[#0B1218]/70 text-xl mb-10">{texto("landing.footer.cta_descricao", "Crie sua conta, importe seu CSV e tenha uma leitura clara da sua carteira em minutos.")}</p>
          <Button variant="primary" className="mx-auto text-lg px-12 py-5 shadow-sm text-white" onClick={() => navigate('/onboarding')}>
            {texto("landing.footer.cta_botao", "Acessar plataforma")}
          </Button>
        </div>
        <div className="mx-auto w-full max-w-[1280px] border-t border-[#0B1218]/10 px-4 pt-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                 <img src={assetPath('/assets/logo/logo-horizontal-invest-laranja.svg')} alt="Logo" className="h-8 md:h-10 object-contain" />
              </div>
              <p className="font-['Inter'] text-[#0B1218]/60 text-sm leading-relaxed max-w-sm">Plataforma de consolidação e diagnóstico de investimentos para investidores brasileiros.</p>
            </div>
            <div>
              <h4 className="font-['Inter'] font-bold mb-4 text-sm uppercase tracking-wide">Produto</h4>
              <ul className="space-y-3">
                <li><a href="/placeholder?title=Planos" className="text-sm text-[#0B1218]/60 hover:text-[#0B1218]">Planos</a></li>
                <li><a href="/placeholder?title=Metodologia" className="text-sm text-[#0B1218]/60 hover:text-[#0B1218]">Metodologia</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-['Inter'] font-bold mb-4 text-sm uppercase tracking-wide">Legal</h4>
              <ul className="space-y-3">
                <li><a href="/placeholder?title=Termos%20de%20Uso" className="text-sm text-[#0B1218]/60 hover:text-[#0B1218]">Termos de Uso</a></li>
                <li><a href="/placeholder?title=Privacidade" className="text-sm text-[#0B1218]/60 hover:text-[#0B1218]">Privacidade</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-[#0B1218]/10 text-center md:text-left">
            <p className="font-['Inter'] text-xs text-[#0B1218]/50">© {new Date().getFullYear()} Esquilo Invest. Todos os direitos reservados. CNPJ: XX.XXX.XXX/0001-XX</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
