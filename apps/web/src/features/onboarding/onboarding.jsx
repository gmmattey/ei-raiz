import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { assetPath } from '../../utils/assetPath';
import { baixarTemplateXlsx } from '../../utils/importacaoTemplate';
import { ApiError, authApi, perfilApi, telemetriaApi } from '../../cliente-api';
import { ChevronRight, ChevronLeft, Eye, EyeOff, Check, UploadCloud, Download, FileSpreadsheet, X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useModoVisualizacao } from '../../context/ModoVisualizacaoContext';

import MaskedInput from '../../components/forms/MaskedInput';

// --- VALIDADORES ---
const isValidCPF = (cpf) => {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  let t = 0, d = 0, c = 0;
  for (t = 9; t < 11; t++) {
    for (d = 0, c = 0; c < t; c++) d += cpf[c] * ((t + 1) - c);
    d = ((10 * d) % 11) % 10;
    if (cpf[c] != d) return false;
  }
  return true;
};

const isValidDate = (dateString) => {
  if (dateString.length !== 10) return false;
  const parts = dateString.split('/');
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const year = parseInt(parts[2], 10);
  if (year < 1900 || year > new Date().getFullYear()) return false;
  if (month < 1 || month > 12) return false;
  const monthLength = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0)) monthLength[1] = 29;
  const validCalendarDate = day > 0 && day <= monthLength[month - 1];
  if (!validCalendarDate) return false;
  const today = new Date();
  const birthDate = new Date(year, month - 1, day);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  return age >= 16;
};

// --- COMPONENTES BASE ---
const TextButton = ({ children, onClick, disabled, variant = 'next' }) => {
  const baseStyle = "flex items-center justify-center gap-2 text-sm font-bold transition-all duration-300 font-['Inter'] tracking-wider cursor-pointer";
  if (variant === 'prev' || variant === 'skip') {
    return <button disabled={disabled} onClick={onClick} className={`${baseStyle} px-4 py-2 text-[#0B1218]/50 hover:text-[#0B1218] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`}>{children}</button>;
  }
  
  if (disabled) {
    return <button disabled className={`${baseStyle} text-[#0B1218]/20 px-2 py-2 cursor-not-allowed`}>{children}</button>;
  }
  
  return <button onClick={onClick} className={`${baseStyle} text-[#0B1218] px-2 py-2 hover:text-[#F56A2A]`}>{children}</button>;
};

const Input = ({ label, type = 'text', placeholder, maskType, value, onChange, required, checkboxLabel, forceShowError = false, ...props }) => {
  const [touched, setTouched] = useState(false);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const emailProviders = ['@gmail.com', '@outlook.com', '@hotmail.com', '@yahoo.com.br', '@icloud.com'];

  const formatCurrency = (val) => {
    let num = val.replace(/\D/g, '');
    if (!num) return '';
    const floatVal = parseInt(num, 10) / 100;
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(floatVal);
  };

  const handleChange = (e) => {
    let val = e.target.value;
    if (maskType === 'cpf') val = val.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
    else if (maskType === 'date') val = val.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\/\d{4})\d+?$/, '$1');
    else if (maskType === 'phone') val = val.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');
    else if (maskType === 'currency') val = formatCurrency(val);

    if (type === 'email') setShowEmailSuggestions(val.split('@').length > 1 && val.split('@')[1].length < 3);
    if (onChange) { e.target.value = val; onChange(e); }
  };

  const handleBlur = (e) => {
    setTimeout(() => setShowEmailSuggestions(false), 200);
    setTouched(true);
    if (maskType === 'name' && e.target.value) {
      e.target.value = e.target.value.toLowerCase().replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
      if (onChange) onChange(e);
    }
  };

  const validate = (val) => {
    if (!val && !required) return true;
    if (!val && required) return false;
    if (maskType === 'cpf') return isValidCPF(val);
    if (maskType === 'date') return isValidDate(val);
    if (type === 'email') return val.includes('@') && val.includes('.');
    if (maskType === 'phone') return val.replace(/\D/g, '').length === 11;
    if (maskType === 'name') return val.split(' ').length >= 2;
    return val.length > 2;
  };

  const isValid = validate(value);
  const hasError = (touched || forceShowError) && !isValid;

  return (
    <div className="flex w-full flex-col gap-1.5 relative font-['Inter']">
      <label className={`text-xs font-semibold transition-colors ${hasError ? 'text-[#E85C5C]' : 'text-[#0B1218]'}`}>{label}{required ? ' *' : ''}</label>
      <div className="relative flex items-center">
        <input type={type} placeholder={placeholder} value={value} onChange={handleChange} onBlur={handleBlur} className={`w-full border-b border-l-0 border-r-0 border-t-0 bg-transparent px-2 py-3 pr-10 text-base transition-all focus:outline-none focus:ring-0 ${hasError ? 'border-[#E85C5C] text-[#E85C5C] placeholder:text-[#E85C5C]/50 focus:border-[#E85C5C]' : 'border-[#EFE7DC] text-[#0B1218] placeholder:text-[#0B1218]/20 focus:border-[#F56A2A]'}`} {...props} />
        <div className="absolute right-2 transition-all duration-300">
          {isValid && value ? <Check size={18} className="text-[#6FCF97]" /> : hasError ? <X size={18} className="text-[#E85C5C]" /> : <X size={18} className="text-[#0B1218]/20 grayscale" />}
        </div>
      </div>
      {hasError && <span className="text-[10px] text-[#E85C5C] font-medium px-2 mt-0.5">{!value && required ? 'Campo obrigatório' : maskType === 'date' ? 'Data inválida (mínimo 16 anos)' : 'Formato inválido'}</span>}
      {showEmailSuggestions && (
        <div className="absolute top-[55px] left-0 w-full bg-white border border-[#EFE7DC] rounded-md shadow-lg z-20 overflow-hidden">
          {emailProviders.map(p => <div key={p} onClick={() => onChange({ target: { value: value.split('@')[0] + p } })} className="px-4 py-2 text-sm hover:bg-[#FAFAFA] cursor-pointer border-b last:border-0">{value.split('@')[0]}<span className="font-bold">{p}</span></div>)}
        </div>
      )}
      {checkboxLabel && (
        <div className="mt-2 flex items-center gap-2 px-2">
          <input type="checkbox" id={`check-${label}`} className="h-4 w-4 cursor-pointer rounded-sm accent-[#F56A2A]" />
          <label htmlFor={`check-${label}`} className="cursor-pointer select-none text-xs text-[#0B1218]/60 hover:text-[#0B1218]">{checkboxLabel}</label>
        </div>
      )}
    </div>
  );
};

const QuestionCard = ({ question, options, selectedValue, onSelect }) => (
  <div className="mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500 font-['Inter']">
    <h3 className="mb-4 font-['Sora'] text-lg font-bold text-[#0B1218]">{question}</h3>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {options.map((opt, idx) => (
        <button key={idx} onClick={() => onSelect(opt)} className={`border p-4 text-left text-sm transition-all duration-200 rounded-md cursor-pointer ${selectedValue === opt ? 'border-[#F56A2A] bg-[#F56A2A]/5 text-[#F56A2A] font-semibold ring-1 ring-[#F56A2A]/20' : 'border-[#EFE7DC] bg-white text-[#0B1218]/70 hover:border-[#0B1218]/20 hover:bg-[#FAFAFA]'}`}>{opt}</button>
      ))}
    </div>
  </div>
);

const parseCurrencyToNumber = (currency) => {
  const normalized = currency.replace(/[^\d,]/g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapObjetivo = (value) => value || 'Objetivo nao informado';
const mapHorizonte = (value) => value || 'Nao informado';
const mapPerfilRisco = (answer) => {
  if (answer === 'Aproveito e compro mais') return 'arrojado';
  if (answer === 'Continuo no plano') return 'moderado';
  if (answer === 'Fico apavorado') return 'conservador';
  return 'moderado';
};
const mapMaturidade = (answer) => {
  if (answer === 'Tô começando agora') return 1;
  if (answer === 'Sei o básico') return 3;
  if (answer === 'Sou expert mesmo') return 5;
  return 3;
};

export default function Onboarding({ embedded = false, onClose, mode = 'signup', initialStep = 1 }) {
  const navigate = useNavigate();
  const { setThemeMode } = useTheme();
  const { setOcultarValores } = useModoVisualizacao();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingCadastro, setIsCheckingCadastro] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showForgotPasswordLink, setShowForgotPasswordLink] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', cpf: '', date: '', email: '', phone: '', renda: '', gastoMensal: '', aporteMensal: '', patrimonioAtual: '', bancos: [], password: '', confirmPassword: '' });
  const [profileAnswers, setProfileAnswers] = useState({ q1: '', q2: '', q3: '', q4: '', q5: '' });
  const [stepAttempted, setStepAttempted] = useState(false);
  const [dadosPessoais, setDadosPessoais] = useState({
    estadoCivil: '',
    escolaridade: '',
    faixaRenda: '',
    moradia: '',
    rendaComposicao: '',
  });

  useEffect(() => {
    setCurrentStep(initialStep);
  }, [initialStep]);

  const steps = useMemo(() => {
    if (mode === 'signup') return [{ num: 1, title: 'Seus dados' }];
    return [
      { num: 2, title: 'Seu estilo', displayNum: 1 },
      { num: 3, title: 'Seus dados', displayNum: 2 },
      { num: 4, title: 'Seus ativos', displayNum: 3 },
    ];
  }, [mode]);

  const bancosList = [
    { name: "Nubank", icon: "/assets/icons/original/nubank.svg" }, { name: "Itaú", icon: "/assets/icons/original/itau.svg" },
    { name: "Banco do Brasil", icon: "/assets/icons/original/banco-do-brasil.svg" }, { name: "BTG Pactual", icon: "/assets/icons/original/btg-pactual.svg" },
    { name: "Bradesco", icon: "/assets/icons/original/bradesco.svg" }, { name: "Santander", icon: "/assets/icons/original/santander.svg" },
    { name: "Banco Inter", icon: "/assets/icons/original/inter.svg" }, { name: "C6 Bank", icon: "/assets/icons/original/c6-bank.svg" }
  ];

  const toggleBanco = (b) => setFormData(p => ({ ...p, bancos: p.bancos.includes(b) ? p.bancos.filter(x => x !== b) : [...p.bancos, b] }));
  const senhaForteRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,128}$/;
  
  const isStepValid = () => {
    if (mode === 'signup') {
      return formData.name.split(' ').length >= 2
        && isValidCPF(formData.cpf)
        && isValidDate(formData.date)
        && formData.email.includes('.')
        && formData.phone.replace(/\D/g, '').length === 11
        && senhaForteRegex.test(formData.password)
        && formData.password === formData.confirmPassword;
    }
    if (currentStep === 2) return true;
    if (currentStep === 3) return true;
    if (currentStep === 4) return true;
    return false;
  };

  const handleNext = async () => {
    setStepAttempted(true);
    if (!isStepValid() || isCheckingCadastro) return;

    if (mode === 'signup' && currentStep === 1) {
      setIsCheckingCadastro(true);
      setSubmitError('');
      setShowForgotPasswordLink(false);
      try {
        const cpf = formData.cpf.replace(/\D/g, '');
        const email = formData.email.trim().toLowerCase();
        const verificacao = await authApi.verificarCadastro(cpf, email);
        if (!verificacao.cpfDisponivel) {
          setSubmitError('Usuário já cadastrado. Se não lembrar a senha, recupere o acesso.');
          setShowForgotPasswordLink(true);
          return;
        }
        if (verificacao.cadastroInterrompido) {
          setSubmitError(`Cadastro interrompido detectado para ${verificacao.destinoMascara || 'este CPF'}. Continue para concluir.`);
        }
        if (!verificacao.emailDisponivel) {
          setSubmitError('E-mail já cadastrado. Se não lembrar a senha, recupere o acesso.');
          setShowForgotPasswordLink(true);
          return;
        }
      } catch (error) {
        if (error instanceof ApiError && error.code === 'API_INDISPONIVEL') {
          setSubmitError('Não foi possível validar CPF e e-mail agora. Tente novamente em instantes.');
        } else if (error instanceof ApiError) {
          setSubmitError('Não foi possível validar CPF e e-mail agora. Revise os dados e tente novamente.');
        } else {
          setSubmitError('Não foi possível validar CPF e e-mail agora. Tente novamente em instantes.');
        }
        return;
      } finally {
        setIsCheckingCadastro(false);
      }
    }

    setCurrentStep((p) => Math.min(p + 1, 4));
    setStepAttempted(false);
    await telemetriaApi.registrarEventoTelemetria('onboarding_step_completed', { step: currentStep });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handlePrev = () => { setCurrentStep(p => Math.max(p - 1, 1)); setStepAttempted(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const handleFinish = async () => {
    if (!isStepValid() || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError('');

    try {
      if (mode === 'signup') {
        await authApi.registrar(
          formData.name.trim(),
          formData.cpf.replace(/\D/g, ''),
          formData.email.trim().toLowerCase(),
          formData.password,
        );
        await telemetriaApi.registrarEventoTelemetria('profile_completed', { origem: 'onboarding_signup_rapido' });
        setThemeMode('dark');
        setOcultarValores(true);
        navigate('/importar', { replace: true });
        return;
      }

      const faixaParaValor = {
        'ate-3k': 3000,
        '3k-7k': 7000,
        '7k-15k': 15000,
        '15k+': 20000,
      };
      await perfilApi.salvarPerfil({
        rendaMensal: faixaParaValor[dadosPessoais.faixaRenda] || 0,
        gastoMensal: parseCurrencyToNumber(formData.gastoMensal),
        aporteMensal: parseCurrencyToNumber(formData.aporteMensal),
        reservaCaixa: parseCurrencyToNumber(formData.patrimonioAtual),
        horizonte: mapHorizonte(profileAnswers.q5),
        perfilRisco: mapPerfilRisco(profileAnswers.q3),
        objetivo: mapObjetivo(profileAnswers.q1),
        maturidade: mapMaturidade(profileAnswers.q4),
      });
      await telemetriaApi.registrarEventoTelemetria('profile_completed', { origem: 'onboarding_home_popup' });
      if (onClose) onClose(true);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'CADASTRO_INTERROMPIDO_EMAIL_DIVERGENTE') {
          setSubmitError('Cadastro interrompido já existe para este CPF com outro e-mail. Retome com o e-mail original.');
        } else if (error.code === 'CPF_JA_CADASTRADO') {
          setSubmitError('CPF já cadastrado. Se não lembrar a senha, use recuperação de acesso.');
        } else if (error.code === 'EMAIL_JA_CADASTRADO') {
          setSubmitError('E-mail já cadastrado. Se não lembrar a senha, use recuperação de acesso.');
        } else if (error.code === 'VALIDACAO') {
          setSubmitError(`Dados inválidos para cadastro: ${error.message}`);
        } else if (error.code === 'VALIDACAO_ENTRADA_INVALIDA') {
          setSubmitError('Senha inválida para a API. Use 8+ caracteres com maiúscula, minúscula, número e símbolo.');
        } else if (error.code === 'API_INDISPONIVEL') {
          setSubmitError('API indisponível no momento. Tente novamente em instantes.');
        } else {
          setSubmitError(`${error.message || 'Não foi possível concluir o cadastro agora.'} (código: ${error.code || 'ERRO_API'})`);
        }
      } else {
        setSubmitError('Nao foi possivel concluir o cadastro. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isFinished) {
      const timer = setTimeout(() => {
        navigate('/importar');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isFinished, navigate]);

  if (isFinished) {
    return (
      <div className="min-h-screen bg-[#0B1218] flex flex-col items-center justify-center text-white animate-in zoom-in-95 duration-700">
        <img src={assetPath('/assets/logo/logo-horizontal-fundo-escuro-invest-laranja.svg')} alt="Logo" className="h-[54px] md:h-[65px] object-contain mb-10" />
        <h1 className="font-['Sora'] text-2xl font-bold text-center">Bem-vindo ao Esquilo Invest</h1>
        <p className="mt-4 font-['Inter'] text-[#F5F0EB]/60 text-center px-4">Conta criada e perfil salvo. Redirecionando para importacao da carteira...</p>
        <div className="mt-8 flex items-center justify-center w-16 h-16 rounded-full bg-[#6FCF97]/20 text-[#6FCF97]"><Check size={32} /></div>
        <button 
          onClick={() => navigate('/importar')}
          className="mt-10 px-6 py-3 bg-[#F56A2A] text-white font-bold rounded-md hover:bg-[#d95a20] transition-colors"
        >
          Ir para Importacao agora
        </button>
      </div>
    );
  }

  const signupCompact = embedded && mode === 'signup';

  return (
    <div className={`${embedded ? `relative w-full max-w-[896px] max-h-[92dvh] overflow-y-auto bg-white rounded-xl shadow-2xl font-['Inter'] text-[#0B1218] selection:bg-[#F56A2A] selection:text-white ${signupCompact ? 'p-4 sm:p-5 lg:p-6' : 'p-4 sm:p-6 lg:p-8'}` : 'relative min-h-screen bg-white font-[\'Inter\'] text-[#0B1218] selection:bg-[#F56A2A] selection:text-white pb-20 overflow-y-visible'}`}>
      {embedded && (
        <button onClick={onClose} className="absolute right-4 top-4 z-20 text-[#0B1218]/40 hover:text-[#0B1218]">
          <X size={18} />
        </button>
      )}
      <div className={`relative z-10 mx-auto flex w-full max-w-[896px] flex-col fade-in-up ${embedded ? '' : 'px-4 sm:px-6 lg:px-8'}`}>
        {/* TÍTULO PRINCIPAL COMPACTO */}
        <div className={`${signupCompact ? 'mb-4' : 'mb-8'} text-center sm:text-left animate-in fade-in slide-in-from-bottom-4 duration-500 fade-in-up`}>
          <h1 className="mb-2 font-['Sora'] text-3xl font-bold text-[#0B1218] sm:text-4xl tracking-tight">
            {mode === 'signup' ? 'Crie sua conta' : 'Vamo entender seu universo'}
          </h1>
          <p className="max-w-xl text-base text-[#0B1218]/60 mx-auto sm:mx-0 font-['Inter'] leading-relaxed">
            {mode === 'signup'
              ? 'Cadastro rápido para você entrar na plataforma.'
              : 'Complete somente os pontos que quiser, sem obrigatoriedade.'}
          </p>
        </div>

        {/* STEPPER ALINHADO */}
        {mode !== 'signup' && (
        <div className="mb-12 animate-in fade-in duration-700 w-full fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-start justify-between gap-0">
            {steps.map((step, i) => (
              <React.Fragment key={step.num}>
                <div className="flex flex-col items-center flex-1">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full border font-['Sora'] text-sm font-bold transition-all duration-300 bg-transparent relative z-10 ${currentStep === step.num ? 'scale-110 border-[#F56A2A] text-[#F56A2A] bg-white' : currentStep > step.num ? 'border-[#6FCF97] text-[#6FCF97] bg-white' : 'border-[#0B1218]/10 text-[#0B1218]/20 bg-white'}`}>
                    {currentStep > step.num ? <Check size={18} strokeWidth={3} /> : (step.displayNum || step.num)}
                  </div>
                  <span className={`mt-3 text-[9px] font-bold tracking-tight text-center w-full ${currentStep === step.num ? 'text-[#F56A2A]' : 'text-[#0B1218]/30'}`}>{step.title}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className="h-[2px] flex-1 bg-[#0B1218]/5 mt-5 relative -mx-5 min-w-[20px]">
                    <div className={`absolute top-0 left-0 h-full bg-[#F56A2A] transition-all duration-500 ${currentStep > step.num ? 'w-full' : 'w-0'}`} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        )}

        {/* ÁREA DO FORMULÁRIO */}
        <div className="fade-in-up flex-1" style={{ animationDelay: '0.2s' }}>
          {currentStep === 1 && (
            <div className={`${signupCompact ? 'space-y-4' : 'space-y-8'} animate-in slide-in-from-right-8 fade-in duration-500`}>
              <div className={`text-center sm:text-left border-b border-[#0B1218]/5 ${signupCompact ? 'pb-2' : 'pb-4'}`}>
                <p className="text-[10px] font-bold tracking-widest text-[#F56A2A] mb-1">Começa aqui</p>
                <h2 className="font-['Sora'] text-xl font-bold">Dados básicos teus</h2>
              </div>
              <div className={`grid grid-cols-1 ${signupCompact ? 'gap-4' : 'gap-8'} sm:grid-cols-2`}>
                <div className="sm:col-span-2"><Input label="Nome completo" required forceShowError={stepAttempted} name="name" maskType="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Digite seu nome completo" /></div>
                <Input label="CPF" required forceShowError={stepAttempted} name="cpf" maskType="cpf" value={formData.cpf} onChange={(e) => setFormData({...formData, cpf: e.target.value})} placeholder="000.000.000-00" />
                <Input label="Data de nascimento" required forceShowError={stepAttempted} name="date" maskType="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} placeholder="DD/MM/AAAA" />
                <Input label="E-mail" required forceShowError={stepAttempted} type="email" name="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="seu@email.com" checkboxLabel="Aceito receber novidades por e-mail" />
                <Input label="Celular" required forceShowError={stepAttempted} name="phone" maskType="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="(00) 00000-0000" checkboxLabel="Aceito receber comunicações e alertas" />
                <div>
                  <label className={`text-xs font-semibold transition-colors ${stepAttempted && formData.password.length > 0 && !senhaForteRegex.test(formData.password) ? 'text-[#E85C5C]' : 'text-[#0B1218]'}`}>Senha *</label>
                  <div className="relative flex items-center">
                    <input type={showPassword ? 'text' : 'password'} placeholder="crie sua senha" value={formData.password} onChange={(e) => { setFormData((prev) => ({ ...prev, password: e.target.value })); if (submitError) setSubmitError(''); }} className={`w-full border-b border-l-0 border-r-0 border-t-0 bg-transparent px-2 py-3 pr-10 text-base transition-all focus:outline-none focus:ring-0 ${stepAttempted && formData.password.length > 0 && !senhaForteRegex.test(formData.password) ? 'border-[#E85C5C] text-[#E85C5C] placeholder:text-[#E85C5C]/50 focus:border-[#E85C5C]' : 'border-[#EFE7DC] text-[#0B1218] placeholder:text-[#0B1218]/20 focus:border-[#F56A2A]'}`} />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-8 top-1/2 -translate-y-1/2 text-[#0B1218]/50 hover:text-[#0B1218]">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <div className="absolute right-2 transition-all duration-300">
                      {senhaForteRegex.test(formData.password) && formData.password ? <Check size={18} className="text-[#6FCF97]" /> : (stepAttempted && formData.password ? <X size={18} className="text-[#E85C5C]" /> : <X size={18} className="text-[#0B1218]/20 grayscale" />)}
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-[#0B1218]/60">Use 8+ caracteres com maiúscula, minúscula, número e símbolo.</p>
                  {!senhaForteRegex.test(formData.password) && formData.password.length > 0 && (
                    <p className="mt-1 text-xs text-[#E85C5C] font-semibold">Senha fora do padrão de segurança exigido.</p>
                  )}
                </div>
                <div>
                  <label className={`text-xs font-semibold transition-colors ${stepAttempted && formData.confirmPassword.length > 0 && formData.confirmPassword !== formData.password ? 'text-[#E85C5C]' : 'text-[#0B1218]'}`}>Confirmar senha *</label>
                  <div className="relative flex items-center">
                    <input type={showConfirmPassword ? 'text' : 'password'} placeholder="confirme sua senha" value={formData.confirmPassword} onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))} className={`w-full border-b border-l-0 border-r-0 border-t-0 bg-transparent px-2 py-3 pr-10 text-base transition-all focus:outline-none focus:ring-0 ${stepAttempted && formData.confirmPassword.length > 0 && formData.confirmPassword !== formData.password ? 'border-[#E85C5C] text-[#E85C5C] placeholder:text-[#E85C5C]/50 focus:border-[#E85C5C]' : 'border-[#EFE7DC] text-[#0B1218] placeholder:text-[#0B1218]/20 focus:border-[#F56A2A]'}`} />
                    <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-8 top-1/2 -translate-y-1/2 text-[#0B1218]/50 hover:text-[#0B1218]">
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <div className="absolute right-2 transition-all duration-300">
                      {formData.confirmPassword && formData.confirmPassword === formData.password ? <Check size={18} className="text-[#6FCF97]" /> : (stepAttempted && formData.confirmPassword ? <X size={18} className="text-[#E85C5C]" /> : <X size={18} className="text-[#0B1218]/20 grayscale" />)}
                    </div>
                  </div>
                  {formData.confirmPassword.length > 0 && formData.confirmPassword !== formData.password && (
                    <p className="mt-1 text-xs text-[#E85C5C] font-semibold">As senhas não conferem.</p>
                  )}
                </div>
                {submitError && <p className="sm:col-span-2 text-xs text-[#E85C5C] font-semibold">{submitError}</p>}
                {showForgotPasswordLink && (
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/?abrir=login&step=forgotPassword&email=${encodeURIComponent(formData.email.trim().toLowerCase())}`)}
                      className="text-xs text-[#F56A2A] hover:text-[#d95a20] font-semibold"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="animate-in slide-in-from-right-8 fade-in duration-500">
              <div className="mb-8 text-center sm:text-left border-b border-[#0B1218]/5 pb-4">
                <p className="text-[10px] font-bold tracking-widest text-[#0B1218]/30 mb-1">Ajuda a gente entender melhor</p>
                <h2 className="font-['Sora'] text-xl font-bold">Como você pensa sobre dinheiro?</h2>
              </div>
              <div className="space-y-4">
                <QuestionCard question="O que você quer conseguir com seu dinheiro?" options={['Descansar na velhice', 'Comprar um imóvel', 'Ficar independente logo']} selectedValue={profileAnswers.q1} onSelect={(v) => setProfileAnswers({ ...profileAnswers, q1: v })} />
                <QuestionCard question="E no futuro, como você quer viver?" options={['Só com a renda dos investimentos', 'Sempre aumentando o patrimônio', 'Só não perder pro mercado']} selectedValue={profileAnswers.q2} onSelect={(v) => setProfileAnswers({ ...profileAnswers, q2: v })} />
                <QuestionCard question="Bolsa cai 10% amanhã. E aí?" options={['Aproveito e compro mais', 'Continuo no plano', 'Fico apavorado']} selectedValue={profileAnswers.q3} onSelect={(v) => setProfileAnswers({ ...profileAnswers, q3: v })} />
                <QuestionCard question="Quanto você entende de investimentos?" options={['Tô começando agora', 'Sei o básico', 'Sou expert mesmo']} selectedValue={profileAnswers.q4} onSelect={(v) => setProfileAnswers({ ...profileAnswers, q4: v })} />
                <QuestionCard question="Quando você pretende mexer nesse dinheiro?" options={['Menos de 2 anos', '2 a 5 anos', 'Mais de 5 anos']} selectedValue={profileAnswers.q5} onSelect={(v) => setProfileAnswers({ ...profileAnswers, q5: v })} />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
              <div className="text-center sm:text-left border-b border-[#0B1218]/5 pb-4">
                <p className="text-[10px] font-bold tracking-widest text-[#F56A2A] mb-1">Opcional</p>
                <h2 className="font-['Sora'] text-xl font-bold">Seus dados pessoais</h2>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold mb-2">Estado civil</label>
                  <select value={dadosPessoais.estadoCivil} onChange={(e) => setDadosPessoais((p) => ({ ...p, estadoCivil: e.target.value }))} className="w-full bg-[#FAFAFA] border border-[#EFE7DC] rounded-md px-4 py-3 text-[#0B1218]">
                    <option value="">Selecione</option><option value="solteiro">Solteiro(a)</option><option value="casado">Casado(a)</option><option value="uniao">União estável</option><option value="divorciado">Divorciado(a)</option><option value="viuvo">Viúvo(a)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2">Escolaridade</label>
                  <select value={dadosPessoais.escolaridade} onChange={(e) => setDadosPessoais((p) => ({ ...p, escolaridade: e.target.value }))} className="w-full bg-[#FAFAFA] border border-[#EFE7DC] rounded-md px-4 py-3 text-[#0B1218]">
                    <option value="">Selecione</option><option value="medio">Ensino médio</option><option value="superior">Superior</option><option value="pos">Pós-graduação</option><option value="mestrado">Mestrado/Doutorado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2">Faixa de renda</label>
                  <select value={dadosPessoais.faixaRenda} onChange={(e) => setDadosPessoais((p) => ({ ...p, faixaRenda: e.target.value }))} className="w-full bg-[#FAFAFA] border border-[#EFE7DC] rounded-md px-4 py-3 text-[#0B1218]">
                    <option value="">Selecione</option><option value="ate-3k">Até R$ 3 mil</option><option value="3k-7k">R$ 3 mil a R$ 7 mil</option><option value="7k-15k">R$ 7 mil a R$ 15 mil</option><option value="15k+">Acima de R$ 15 mil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2">Moradia</label>
                  <select value={dadosPessoais.moradia} onChange={(e) => setDadosPessoais((p) => ({ ...p, moradia: e.target.value }))} className="w-full bg-[#FAFAFA] border border-[#EFE7DC] rounded-md px-4 py-3 text-[#0B1218]">
                    <option value="">Selecione</option><option value="propria">Casa própria</option><option value="alugada">Alugada</option><option value="financiada">Financiada</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-2">Renda</label>
                  <select value={dadosPessoais.rendaComposicao} onChange={(e) => setDadosPessoais((p) => ({ ...p, rendaComposicao: e.target.value }))} className="w-full bg-[#FAFAFA] border border-[#EFE7DC] rounded-md px-4 py-3 text-[#0B1218]">
                    <option value="">Selecione</option><option value="individual">Renda individual</option><option value="familiar">Renda familiar</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
              <div className="text-center sm:text-left border-b border-[#0B1218]/5 pb-4">
                <p className="text-[10px] font-bold tracking-widest text-[#0B1218]/30 mb-1">Próximo passo após cadastro</p>
                <h2 className="font-['Sora'] text-xl font-bold">Prepare seu arquivo de importação</h2>
                <p className="mt-2 text-xs text-[#0B1218]/60">
                  Aqui você só baixa o modelo. O envio do CSV acontece na tela de importação, depois de concluir o cadastro.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 pt-4">
                <div className="border border-[#EFE7DC] bg-[#FAFAFA] p-8 rounded-xl text-center flex flex-col items-center justify-center">
                  <FileSpreadsheet size={32} className="mb-4 text-[#0B1218]/20" />
                  <h4 className="font-['Sora'] font-bold text-sm mb-2">Template Oficial</h4>
                  <p className="text-xs text-[#0B1218]/50 mb-6">Modelo padrão Esquilo.</p>
                  <button
                    type="button"
                    onClick={baixarTemplateXlsx}
                    className="text-[#F56A2A] font-bold text-xs flex items-center gap-2 hover:underline cursor-pointer"
                  >
                    <Download size={16} /> Baixar template
                  </button>
                </div>
                <div className="border border-[#EFE7DC] p-8 rounded-xl text-center flex flex-col items-center justify-center bg-white">
                  <UploadCloud size={40} className="mb-4 text-[#0B1218]/20" />
                  <p className="text-sm font-bold">Envio na próxima tela</p>
                  <p className="text-[10px] text-[#0B1218]/40 mt-1">Conclua o onboarding e faça upload em /importar</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* NAVEGAÇÃO INTEGRADA (NÃO FIXA) */}
        <div className={`${signupCompact ? 'mt-4 py-4' : 'mt-12 py-8'} flex items-center justify-between border-t border-[#0B1218]/5`}>
           <div className="flex-1">
             {currentStep > 1 && <TextButton variant="prev" onClick={handlePrev}><ChevronLeft size={18} /> Voltar</TextButton>}
           </div>
           <div className="flex items-center gap-8">
             {mode !== 'signup' && currentStep < 4 && <TextButton variant="skip" onClick={handleNext}>Pular etapa</TextButton>}
             <TextButton disabled={isSubmitting || isCheckingCadastro} onClick={mode === 'signup' || currentStep === 4 ? handleFinish : handleNext}>
               {isSubmitting || isCheckingCadastro ? 'Validando...' : 'Feito!'} <Check size={16} className="text-[#F56A2A]" />
             </TextButton>
           </div>
        </div>
      </div>
    </div>
  );
}
