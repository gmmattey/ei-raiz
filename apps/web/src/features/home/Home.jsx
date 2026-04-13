import React, { useEffect, useState } from 'react';
import { ArrowRight, TrendingUp, AlertCircle, CheckCircle2, UserRound, UploadCloud, CandlestickChart, Landmark, WalletCards, PiggyBank, House, Gem, X } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell, XAxis, YAxis } from 'recharts';
import { useNavigate, useLocation } from 'react-router-dom';
import { ApiError, carteiraApi, insightsApi, perfilApi, configApi, getStoredUser } from '../../cliente-api';
import { useConteudoApp } from '../../hooks/useConteudoApp';
import { useModoVisualizacao } from '../../context/ModoVisualizacaoContext';
import Onboarding from '../onboarding/onboarding';
import Carteira from '../carteira/Carteira';
import PerfilUsuario from '../perfil/PerfilUsuario';
import Importar from '../importacao/Importar';
import Configuracoes from '../perfil/Configuracoes';

const HOME_CACHE_KEY = 'ei_home_cache_v1';
const DONUT_COLORS = {
  investimentos: '#F56A2A',
  bens: '#6FCF97',
  poupanca: '#A7B0BC',
};

const DonutDistribuicaoPatrimonio = ({ total = 0, itens = [] }) => {
  const itensValidos = itens.filter((i) => i.valor > 0);
  if (!itensValidos.length || total <= 0) return null;
  let acumulado = 0;
  const segmentos = itensValidos.map((item) => {
    const inicio = acumulado;
    const fatia = (item.valor / total) * 100;
    acumulado += fatia;
    return `${item.cor} ${inicio.toFixed(2)}% ${acumulado.toFixed(2)}%`;
  });
  const background = `conic-gradient(${segmentos.join(',')})`;

  return (
    <div className="w-full md:w-[220px] shrink-0">
      <div className="mx-auto relative h-[136px] w-[136px]">
        <div className="h-full w-full rounded-full" style={{ background }} />
        <div className="absolute inset-[18px] rounded-full bg-[var(--bg-card)] border border-[var(--border-color)]" />
      </div>
      <div className="mt-3 space-y-1.5">
        {itensValidos.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 text-[10px]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.cor }} />
              <span className="font-semibold text-[var(--text-secondary)] truncate">{item.label}</span>
            </div>
            <span className="text-[var(--text-muted)] font-bold">{item.percentual.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function HomeLobby() {
  const { texto } = useConteudoApp();

  const ScoreSparkline = ({ historico }) => {
    if (!historico || historico.length < 2) return null;
    const isPositivo = historico[historico.length - 1] >= historico[0];
    const corBase = isPositivo ? '#F56A2A' : '#E85C5C';
    const data = historico.map((v, i) => ({ value: v, index: i }));
  
    return (
      <div className={`h-8 w-16 ml-3 opacity-80 mix-blend-plus-lighter`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={corBase} 
              strokeWidth={2} 
              dot={false} 
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const AnimatedCounter = ({ value, isCurrency = false }) => {
    const motionValue = useMotionValue(0);
    const springValue = useSpring(motionValue, {
      damping: 30,
      stiffness: 70
    });
    const displayValue = useTransform(springValue, (v) => 
      isCurrency 
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
        : Math.round(v)
    );
    
    useEffect(() => {
      motionValue.set(value || 0);
    }, [value, motionValue]);

    return <motion.span>{displayValue}</motion.span>;
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resumo, setResumo] = useState(null);
  const [insights, setInsights] = useState(null);
  const [perfilIncompleto, setPerfilIncompleto] = useState(false);
  const [completudePerfil, setCompletudePerfil] = useState(0);
  const [usuario, setUsuario] = useState(() => getStoredUser());
  const [perfilDados, setPerfilDados] = useState(null);
  const [quickActionMenus, setQuickActionMenus] = useState([]);
  const [onboardingPopupOpen, setOnboardingPopupOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(2);
  const [ocultarBannerOnboarding, setOcultarBannerOnboarding] = useState(false);
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [quickModalType, setQuickModalType] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { ocultarValores } = useModoVisualizacao();
  const showSuccessImport = location.state?.showSuccessImport;
  const importedItems = location.state?.importedItems;
  const openQuickModalFromState = location.state?.openQuickModal;

  useEffect(() => {
    if (showSuccessImport) {
      const timer = setTimeout(() => {
        navigate('/home', { replace: true, state: {} });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessImport, navigate]);

  useEffect(() => {
    if (!openQuickModalFromState) return;
    if (openQuickModalFromState === 'quick_importar' || openQuickModalFromState === 'quick_perfil' || openQuickModalFromState === 'quick_configurar') {
      setQuickModalType(openQuickModalFromState);
      setQuickModalOpen(true);
      navigate('/home', { replace: true, state: {} });
    }
  }, [navigate, openQuickModalFromState]);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        setError('');
        setUsuario(getStoredUser());

        if (!showSuccessImport) {
          const cacheRaw = sessionStorage.getItem(HOME_CACHE_KEY);
          if (cacheRaw) {
            try {
              const cache = JSON.parse(cacheRaw);
              if (ativo && cache?.resumo && cache?.insights) {
                setResumo(cache.resumo);
                setInsights(cache.insights);
                setPerfilDados(cache.perfilDados ?? null);
                setQuickActionMenus(cache.quickActionMenus ?? []);
                setPerfilIncompleto(Boolean(cache.perfilIncompleto));
                setCompletudePerfil(Number(cache.completudePerfil ?? 0));
                setLoading(false);
                return;
              }
            } catch {
              sessionStorage.removeItem(HOME_CACHE_KEY);
            }
          }
        }

        setLoading(true);
        
        const [dadosCarteira, dadosInsights, dadosPerfil, appConfig] = await Promise.all([
          carteiraApi.obterResumoCarteira(),
          insightsApi.obterResumo(),
          perfilApi.obterPerfil().catch(() => null),
          configApi.obterAppConfig().catch(() => null),
        ]);

        if (ativo) {
          setResumo(dadosCarteira);
          setInsights(dadosInsights);
          let proxCompletude = 0;
          let proxPerfilIncompleto = true;
          if (dadosPerfil) {
            setPerfilDados(dadosPerfil);
            let preenchidos = 0;
            if (dadosPerfil.objetivo) preenchidos++;
            if (dadosPerfil.horizonte) preenchidos++;
            if (dadosPerfil.perfilRisco) preenchidos++;
            if (Number(dadosPerfil.rendaMensal) > 0) preenchidos++;
            
            const perc = Math.round((preenchidos / 4) * 100);
            proxCompletude = perc;
            proxPerfilIncompleto = perc < 100;
            setCompletudePerfil(perc);
            setPerfilIncompleto(proxPerfilIncompleto);
          } else {
            setPerfilDados(null);
            setCompletudePerfil(0);
            setPerfilIncompleto(true);
          }
          const quickMenus = (appConfig?.menus ?? [])
            .filter((m) => String(m.chave || '').startsWith('quick_'))
            .sort((a, b) => a.ordem - b.ordem);
          setQuickActionMenus(quickMenus);

          sessionStorage.setItem(
            HOME_CACHE_KEY,
            JSON.stringify({
              resumo: dadosCarteira,
              insights: dadosInsights,
              perfilDados: dadosPerfil ?? null,
              quickActionMenus: quickMenus,
              perfilIncompleto: proxPerfilIncompleto,
              completudePerfil: proxCompletude,
            }),
          );
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          navigate('/', { replace: true });
          return;
        }
        if (ativo) setError('Falha ao carregar dados da Home.');
      } finally {
        if (ativo) setLoading(false);
      }
    })();

    return () => {
      ativo = false;
    };
  }, [navigate, showSuccessImport]);

  const recarregarHomeSemPiscada = async () => {
    try {
      setError('');
      const [dadosCarteira, dadosInsights, dadosPerfil, appConfig] = await Promise.all([
        carteiraApi.obterResumoCarteira(),
        insightsApi.obterResumo(),
        perfilApi.obterPerfil().catch(() => null),
        configApi.obterAppConfig().catch(() => null),
      ]);

      setResumo(dadosCarteira);
      setInsights(dadosInsights);

      let proxCompletude = 0;
      let proxPerfilIncompleto = true;
      if (dadosPerfil) {
        setPerfilDados(dadosPerfil);
        let preenchidos = 0;
        if (dadosPerfil.objetivo) preenchidos++;
        if (dadosPerfil.horizonte) preenchidos++;
        if (dadosPerfil.perfilRisco) preenchidos++;
        if (Number(dadosPerfil.rendaMensal) > 0) preenchidos++;
        proxCompletude = Math.round((preenchidos / 4) * 100);
        proxPerfilIncompleto = proxCompletude < 100;
      } else {
        setPerfilDados(null);
      }
      const quickMenus = (appConfig?.menus ?? [])
        .filter((m) => String(m.chave || '').startsWith('quick_'))
        .sort((a, b) => a.ordem - b.ordem);
      setQuickActionMenus(quickMenus);
      setCompletudePerfil(proxCompletude);
      setPerfilIncompleto(proxPerfilIncompleto);

      sessionStorage.setItem(
        HOME_CACHE_KEY,
        JSON.stringify({
          resumo: dadosCarteira,
          insights: dadosInsights,
          perfilDados: dadosPerfil ?? null,
          quickActionMenus: quickMenus,
          perfilIncompleto: proxPerfilIncompleto,
          completudePerfil: proxCompletude,
        }),
      );
    } catch {
      setError('Falha ao atualizar dados da Home.');
    }
  };

  const getSaudacao = () => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Bom dia';
    if (hora < 18) return 'Boa tarde';
    return 'Boa noite';
  };
  const getNomeExibicao = (nomeCompleto) => {
    const partes = String(nomeCompleto || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (partes.length === 0) return 'investidor(a)';
    if (partes.length >= 3) return `${partes[0]} ${partes[1]}`;
    return partes[0];
  };

  const quickIconByKey = {
    quick_perfil: <UserRound size={24} />,
    quick_importar: <UploadCloud size={24} />,
    quick_acoes: <CandlestickChart size={24} />,
    quick_fundos: <Landmark size={24} />,
    quick_previdencia: <WalletCards size={24} />,
    quick_renda_fixa: <Gem size={24} />,
    quick_poupanca: <PiggyBank size={24} />,
    quick_bens: <House size={24} />,
    quick_simuladores: <TrendingUp size={24} />,
    quick_configurar: <ArrowRight size={24} />,
  };
  const fallbackQuickActions = [
    { chave: 'quick_perfil', label: 'Perfil', path: '/perfil', ordem: 101 },
    { chave: 'quick_importar', label: 'Importar', path: '/importar', ordem: 102 },
    { chave: 'quick_acoes', label: 'Ações', path: '/carteira?categoria=acao', ordem: 103 },
    { chave: 'quick_fundos', label: 'Fundos', path: '/carteira?categoria=fundo', ordem: 104 },
    { chave: 'quick_previdencia', label: 'Previdência', path: '/carteira?categoria=previdencia', ordem: 105 },
    { chave: 'quick_renda_fixa', label: 'Renda Fixa', path: '/carteira?categoria=renda_fixa', ordem: 106 },
    { chave: 'quick_poupanca', label: 'Poupança', path: '/placeholder?modulo=poupanca', ordem: 107 },
    { chave: 'quick_bens', label: 'Bens', path: '/placeholder?modulo=bens', ordem: 108 },
    { chave: 'quick_simuladores', label: 'Simuladores', path: '/decisoes', ordem: 109 },
    { chave: 'quick_configurar', label: 'Configurar', path: '/configuracoes', ordem: 110 },
  ];
  const quickActions = (quickActionMenus.length ? quickActionMenus : fallbackQuickActions).map((item) => ({
    title: item.label,
    icon: quickIconByKey[item.chave] ?? <ArrowRight size={24} />,
    action: () => {
      if (item.chave === 'quick_perfil' || item.chave === 'quick_importar' || item.chave === 'quick_configurar') {
        setQuickModalType(item.chave);
        setQuickModalOpen(true);
        return;
      }
      navigate('/carteira');
    },
  }));

  const insightPrioritario = insights?.riscoPrincipal || insights?.acaoPrioritaria;
  const scoreUnificado = insights?.scoreUnificado || insights?.score_unificado;
  // Score sempre no sistema unificado (0-1000). Nunca usar fallbacks de sistemas legados.
  const scoreExibicao = scoreUnificado?.score ?? 0;
  const scoreEscala = 1000;
  const scoreStatus = scoreUnificado?.completenessStatus ?? null;
  const patrimonioDeclaradoTotal = Number(resumo?.patrimonioTotal ?? 0);
  const possuiPatrimonioDeclarado = patrimonioDeclaradoTotal > 0;
  const distribuicaoPatrimonio = (resumo?.distribuicaoPatrimonio ?? []).map((item) => ({
    ...item,
    cor: DONUT_COLORS[item.id] ?? '#F2C94C',
  }));
  const trilhaOnboarding = [
    { num: 1, titulo: 'Seu estilo', step: 2, completo: Boolean(perfilDados?.objetivo && perfilDados?.perfilRisco) },
    { num: 2, titulo: 'Seus dados', step: 3, completo: Boolean(Number(perfilDados?.rendaMensal) > 0) },
    { num: 3, titulo: 'Seus ativos', step: 4, completo: Boolean(Number(perfilDados?.reservaCaixa) > 0 || Number(perfilDados?.aporteMensal) > 0) },
  ];
  const onboardingCompleto = trilhaOnboarding.every((item) => item.completo);
  const mostrarCardOnboarding = !onboardingCompleto && !ocultarBannerOnboarding;

  const classificacaoCor = (c) => {
    if (c === 'critico') return 'bg-[#E85C5C]/10 text-[#E85C5C]';
    if (c === 'baixo') return 'bg-[#F2C94C]/10 text-[#F2C94C]';
    if (c === 'ok') return 'bg-[#0B1218]/5 text-[#0B1218]/60';
    if (c === 'bom') return 'bg-[#6FCF97]/10 text-[#6FCF97]';
    if (c === 'excelente') return 'bg-[#6FCF97]/20 text-[#6FCF97]';
    return 'bg-[#0B1218]/5 text-[#0B1218]/50';
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="mb-12">
          <div className="h-4 w-24 skeleton mb-2 rounded" />
          <div className="h-10 w-48 skeleton mb-8 rounded" />
          <div className="h-64 skeleton rounded-sm" />
        </div>
        <div className="h-32 skeleton mb-12 rounded-sm" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 skeleton rounded-sm" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[var(--bg-primary)] font-['Inter'] text-[var(--text-primary)] selection:bg-[#F56A2A] selection:text-white">
      <AnimatePresence>
        {showSuccessImport && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed top-24 md:top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 pr-6 rounded-sm shadow-2xl backdrop-blur-md"
          >
            <div className="flex items-center justify-center w-10 h-10 bg-[#6FCF97]/10 rounded-full">
              <CheckCircle2 size={24} className="text-[#6FCF97]" />
            </div>
            <div>
              <h3 className="font-['Sora'] text-sm font-bold text-[var(--text-primary)]">Importação Concluída</h3>
              <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                {importedItems} {importedItems === 1 ? 'item importado' : 'itens importados'}. Seu score foi recalculado!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="w-full">
        {onboardingPopupOpen && (
          <div className="fixed inset-0 z-[120] flex items-start md:items-center justify-center overflow-y-auto p-4 bg-[#0B1218]/80 backdrop-blur-sm animate-in fade-in duration-200">
            <Onboarding
              embedded
              mode="profile"
              initialStep={onboardingStep}
              onClose={(concluido) => {
                setOnboardingPopupOpen(false);
                if (concluido) recarregarHomeSemPiscada();
              }}
            />
          </div>
        )}
        {quickModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-start md:items-center justify-center overflow-y-auto p-4 bg-[#0B1218]/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-[1120px] h-[90dvh] overflow-hidden rounded-xl bg-white shadow-2xl">
              <button
                type="button"
                onClick={() => {
                  setQuickModalOpen(false);
                  setQuickModalType(null);
                }}
                className="absolute right-4 top-4 text-[#0B1218]/40 hover:text-[#0B1218]"
              >
                <X size={20} />
              </button>
              <div className="h-full overflow-y-auto px-4 pb-4 pt-12 sm:px-6">
                {quickModalType === 'quick_perfil' && <PerfilUsuario embedded />}
                {quickModalType === 'quick_importar' && <Importar embedded />}
                {quickModalType === 'quick_configurar' && <Configuracoes embedded />}
              </div>
            </div>
          </div>
        )}

        {/* Header / Saudação */}
        <section className="mb-12 fade-in-up">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center min-h-[64px]">
              <h1 className="font-['Sora'] text-3xl font-bold tracking-tight text-[#0B1218] md:text-4xl">
                {getSaudacao()},{' '}
                <span className="text-[#F56A2A]">{getNomeExibicao(usuario?.nome)}</span>.
              </h1>
            </div>

            {(insights?.insightPrincipal?.titulo || insightPrioritario?.titulo) && (
              <div className="lg:max-w-[58%] text-right">
                <p className="font-['Sora'] text-sm md:text-base font-semibold leading-snug text-[#F56A2A]">
                  {possuiPatrimonioDeclarado
                    ? (insights?.insightPrincipal?.titulo || insightPrioritario?.titulo)
                    : 'Importe seus dados para liberar insights personalizados.'}
                </p>
                <p className="mt-1 font-['Inter'] text-sm md:text-[15px] font-medium text-[var(--text-secondary)] leading-snug">
                  {possuiPatrimonioDeclarado
                    ? (insights?.insightPrincipal?.acao || insightPrioritario?.descricao || '')
                    : 'Conecte sua carteira para começarmos com recomendações práticas e objetivas.'}
                </p>
              </div>
            )}
          </div>

          {mostrarCardOnboarding && (
            <div className="mb-6 border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-3 rounded-sm transition-all">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] items-center gap-4 min-w-0 flex-1">
                  <p className="font-['Sora'] text-lg md:text-xl font-bold text-[var(--text-primary)] leading-tight max-w-[280px]">
                    Queremos te conhecer melhor
                  </p>
                  <div className="flex items-center justify-center gap-1.5 overflow-x-auto no-scrollbar">
                    {trilhaOnboarding.map((item, idx) => (
                      <React.Fragment key={item.step}>
                        <button
                          onClick={() => {
                            setOnboardingStep(item.step);
                            setOnboardingPopupOpen(true);
                          }}
                          className="flex flex-col items-center justify-center min-w-[68px] px-1 py-0.5 transition-colors"
                          title={item.titulo}
                        >
                          <span className={`flex items-center justify-center min-w-[34px] h-[34px] rounded-full border text-xs font-bold ${
                            item.completo
                              ? 'bg-[#F56A2A] border-[#F56A2A] text-white'
                              : 'bg-transparent border-[var(--border-color)] text-[var(--text-muted)] hover:border-[#F56A2A] hover:text-[#F56A2A]'
                          }`}>
                            {item.completo ? <CheckCircle2 size={14} /> : item.num}
                          </span>
                          <span className={`mt-1 text-[8px] font-bold uppercase tracking-widest ${item.completo ? 'text-[#F56A2A]' : 'text-[var(--text-muted)]'}`}>
                            {item.titulo}
                          </span>
                        </button>
                        {idx < trilhaOnboarding.length - 1 && (
                          <div className="h-[2px] w-5 bg-[var(--border-color)]" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-start lg:items-end gap-1">
                  <button
                    onClick={() => {
                      setOnboardingStep(2);
                      setOnboardingPopupOpen(true);
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-sm bg-[#F56A2A] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#d95a20] transition-colors"
                  >
                    Responder agora
                  </button>
                  <button
                    onClick={() => setOcultarBannerOnboarding(true)}
                    className="text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    Depois eu respondo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Card Principal de Patrimônio */}
          <div className="rounded border border-[var(--border-color)] bg-[var(--bg-card)] p-8 shadow-md transition-all hover:shadow-lg md:p-10 fade-in-up" style={{ animationDelay: '0.05s' }}>
            <div className="flex flex-col gap-8">
              <div className="flex-1">
                <div className="mb-4 flex items-center gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F56A2A]">{texto("home.cartao_principal.titulo", "Patrimônio Total")}</p>
                </div>

                {possuiPatrimonioDeclarado && (
                  <div className="mt-6 flex flex-col gap-4">
                    {resumo?.retornoDisponivel ? (
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <TrendingUp size={16} className={resumo?.retorno12m >= 0 ? "text-[#6FCF97]" : "text-[#E85C5C]"} />
                          <span className={`text-xs font-bold ${resumo?.retorno12m >= 0 ? "text-[#6FCF97]" : "text-[#E85C5C]"}`}>
                            {ocultarValores ? '••••••••' : `${resumo?.retorno12m >= 0 ? '+' : ''}${resumo?.retorno12m?.toFixed?.(2) ?? '0.00'}%`}
                          </span>
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold pl-6">Rendimento acumulado desde a aquisição</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="text-[#F2C94C]" />
                        <span className="text-xs font-bold text-[#0B1218]/70">
                          {resumo?.motivoRetornoIndisponivel || 'Adicione o preço médio dos ativos para ver o rendimento'}
                        </span>
                      </div>
                    )}
                    {scoreUnificado && (
                      <div className="flex items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">Score</span>
                          <span className="font-['Sora'] text-sm font-bold text-[var(--text-primary)]">
                            {ocultarValores ? (
                              '••••••••'
                            ) : (
                              <>
                                <AnimatedCounter value={scoreExibicao} isCurrency={false} />
                                <span className="text-[var(--text-muted)] font-normal">/{scoreEscala}</span>
                              </>
                            )}
                          </span>
                          {scoreUnificado.band && (
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 ${classificacaoCor(scoreUnificado.band === 'critical' ? 'critico' : scoreUnificado.band === 'fragile' ? 'baixo' : scoreUnificado.band === 'strong' ? 'excelente' : scoreUnificado.band === 'good' ? 'bom' : 'ok')}`}>
                              {scoreUnificado.band === 'critical' ? 'Crítico' : scoreUnificado.band === 'fragile' ? 'Frágil' : scoreUnificado.band === 'stable' ? 'Estável' : scoreUnificado.band === 'good' ? 'Bom' : 'Sólido'}
                            </span>
                          )}
                        </div>
                        <ScoreSparkline historico={insights.scoreHistorico || []} />
                      </div>
                    )}
                    {scoreStatus === 'partial' && (
                      <p className="text-[10px] text-[#F2C94C] uppercase tracking-widest font-bold">
                        Score com dados incompletos — complete seu perfil para leitura precisa
                      </p>
                    )}
                    {(insights?.diagnosticoFinal?.mensagem || insights?.diagnostico?.resumo) && (
                      <p className="text-[11px] font-medium leading-relaxed text-[#0B1218]/60 max-w-md">
                        {insights?.diagnosticoFinal?.mensagem || insights?.diagnostico?.resumo}
                      </p>
                    )}
                    {insights?.impactoDecisoesRecentes?.quantidade > 0 && (
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#0B1218]/45">
                        {ocultarValores
                          ? 'Decisões recentes: ••••••••'
                          : `Decisões recentes: ${insights.impactoDecisoesRecentes.deltaTotal >= 0 ? '+' : ''}${insights.impactoDecisoesRecentes.deltaTotal.toFixed(1)} pts no score (${insights.impactoDecisoesRecentes.quantidade} simulações)`}
                      </p>
                    )}
                  </div>
                )}

                {!possuiPatrimonioDeclarado && !error && (
                  <div className="mt-6">
                    <p className="text-xs text-[#0B1218]/60 leading-relaxed mb-4">
                      Você ainda não informou patrimônio ou bens. Para liberar sua leitura completa, importe dados e complete seu perfil.
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <button
                        onClick={() => {
                          setQuickModalType('quick_importar');
                          setQuickModalOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 rounded-sm bg-[#F56A2A] px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-[#d95a20] transition-colors"
                      >
                        Importar dados <ArrowRight size={14} />
                      </button>
                      <button
                        onClick={() => navigate('/perfil')}
                        className="flex items-center justify-center gap-2 rounded-sm border border-[var(--border-color)] bg-[var(--bg-secondary)] px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-primary)] hover:border-[#F56A2A] transition-colors"
                      >
                        Completar perfil <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                )}

                {error && <p className="mt-4 text-xs text-[#E85C5C] font-medium">Não conseguimos carregar seus dados. Tente novamente.</p>}
              </div>

              <div className="flex gap-4 border-t border-[var(--border-color)] pt-6">
                {!ocultarValores && possuiPatrimonioDeclarado ? (
                  <DonutDistribuicaoPatrimonio total={patrimonioDeclaradoTotal} itens={distribuicaoPatrimonio} />
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {/* Gráficos de Performance */}
        {insights?.scoreHistorico && insights.scoreHistorico.length > 0 && (
          <section className="mb-12 fade-in-up" style={{ animationDelay: '0.12s' }}>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B1218]/40">Performance</p>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Gráfico: Evolução do Score */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">Evolução da Saúde Financeira</p>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={insights.scoreHistorico.map((v, i) => ({ index: i, score: v }))}>
                      <XAxis dataKey="index" hide />
                      <YAxis hide domain={[0, 1000]} />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#F56A2A"
                        strokeWidth={2.2}
                        dot={false}
                        isAnimationActive={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gráfico: Distribuição de Patrimônio */}
              {!ocultarValores && possuiPatrimonioDeclarado && (
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded p-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">Distribuição do Patrimônio</p>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distribuicaoPatrimonio}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={60}
                          fill="#F56A2A"
                          dataKey="valor"
                        >
                          {distribuicaoPatrimonio.map((item, idx) => {
                            const cores = ["#F56A2A", "#6FCF97", "#A7B0BC"];
                            return <Cell key={`cell-${idx}`} fill={cores[idx % cores.length]} />;
                          })}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="mb-12 fade-in-up" style={{ animationDelay: '0.14s' }}>
          <Carteira embedded />
        </section>

        {/* Acesso Rápido */}
        <section className="fade-in-up" style={{ animationDelay: '0.15s' }}>
          <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B1218]/40">{texto("home.quick_actions.titulo", "Acesso Rápido")}</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {quickActions.map((item) => (
              <button
                key={item.title}
                onClick={item.action}
                className="group flex flex-col items-center gap-2 rounded-sm border border-[var(--border-color)] bg-white p-3 text-center shadow-sm transition-all hover:border-[#F56A2A] hover:shadow-md"
              >
                <div className="text-[var(--text-muted)] transition-colors group-hover:text-[#F56A2A]">
                  {item.icon}
                </div>
                <div>
                  <h4 className="font-['Sora'] text-xs font-bold text-[var(--text-primary)]">{item.title}</h4>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
