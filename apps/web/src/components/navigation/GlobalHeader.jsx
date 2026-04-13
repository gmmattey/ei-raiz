import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { assetPath } from '../../utils/assetPath';
import { adminApi, clearSession, configApi, getStoredUser, insightsApi } from '../../cliente-api';
import { Menu, X, Eye, EyeOff, Moon, Sun, Bell } from 'lucide-react';
import { useModoVisualizacao } from '../../context/ModoVisualizacaoContext';
import { useTheme } from '../../context/ThemeContext';

export default function GlobalHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [usuario, setUsuario] = useState(() => getStoredUser());
  const [isAdmin, setIsAdmin] = useState(false);
  const { ocultarValores, toggleOcultarValores } = useModoVisualizacao();
  const { isDarkMode, toggleTheme } = useTheme();

  const fallbackNavItems = [
    { label: 'Home', path: '/home' },
    { label: 'Aportes', path: '/aportes' },
    { label: 'Decisões', path: '/decisoes' },
    { label: 'Histórico', path: '/historico' },
  ];
  const sanitizeNavItems = (items) => (items || []).filter((item) => {
    if (!item) return false;
    if (String(item.chave || "").startsWith("quick_")) return false;
    if (['/dashboard', '/carteira', '/insights', '/importar'].includes(item?.path)) return false;
    return true;
  });
  const [navItems, setNavItems] = useState(fallbackNavItems);
  const [scrolled, setScrolled] = useState(false);
  const [insightMenuOpen, setInsightMenuOpen] = useState(false);
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let ativo = true;
    const carregar = async () => {
      try {
        setUsuario(getStoredUser());
        const appConfig = await configApi.obterAppConfig();
        const acessoAdmin = await adminApi.obterMeAdmin().catch(() => ({ isAdmin: false }));
        const dadosInsights = await insightsApi.obterResumo().catch(() => null);
        if (!ativo) return;
        const itens = (appConfig.menus ?? [])
          .filter((item) => item.visivel)
          .sort((a, b) => a.ordem - b.ordem)
          .map((item) => ({ chave: item.chave, label: item.label, path: item.path }));
        const itensSanitizados = sanitizeNavItems(itens);
        setNavItems(itensSanitizados.length ? itensSanitizados : sanitizeNavItems(fallbackNavItems));
        setIsAdmin(Boolean(acessoAdmin?.isAdmin));
        if (dadosInsights) setInsights(dadosInsights);
      } catch {
        if (ativo) setNavItems(sanitizeNavItems(fallbackNavItems));
      }
    };
    void carregar();
    return () => {
      ativo = false;
    };
  }, []);

  const profileItems = [
    { label: 'Meu Perfil', icon: assetPath('/assets/icons/preto/perfil.svg'), action: () => navigate('/perfil') },
    { label: 'Perfil de Risco', icon: assetPath('/assets/icons/preto/radar.svg'), action: () => navigate('/perfil-de-risco') },
    { label: 'Configurações', icon: assetPath('/assets/icons/preto/configuracoes.svg'), action: () => navigate('/configuracoes') },
    ...(isAdmin ? [{ label: 'Painel Admin', icon: assetPath('/assets/icons/preto/score.svg'), action: () => navigate('/admin') }] : []),
    { 
      label: 'Sair da conta', 
      icon: assetPath('/assets/icons/preto/fechar.svg'),
      color: 'text-[#E85C5C]', 
      action: () => {
        clearSession();
        localStorage.removeItem('hasSeenPreInsight');
        window.location.href = '/';
      } 
    },
  ];

  const inicialUsuario = usuario?.nome?.charAt(0).toUpperCase() || 'U';
  const scoreBand = insights?.scoreUnificado?.band || insights?.score_unificado?.band;
  const scoreRaw = insights?.scoreUnificado?.score ?? insights?.score_unificado?.score ?? 0;
  const scorePercent = Math.max(0, Math.min(100, (Number(scoreRaw) / 1000) * 100));
  const notificacaoCor =
    scoreBand === 'critical' ? '#E85C5C' :
    scoreBand === 'fragile' || scoreBand === 'stable' ? '#F56A2A' :
    '#6FCF97';
  const notificacaoTitulo =
    scoreBand === 'critical' ? 'Risco detectado' :
    scoreBand === 'fragile' || scoreBand === 'stable' ? 'Atenção necessária' :
    'Tudo em dia';
  const notificacaoProblema = insights?.riscoPrincipal?.titulo || insights?.acaoPrioritaria?.titulo || 'Sem pendências críticas no momento.';
  const notificacaoAcao = insights?.acaoPrioritaria?.descricao || insights?.riscoPrincipal?.descricao || 'Continue acompanhando e mantendo aportes consistentes.';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-[var(--border-color)] backdrop-blur-md bg-[var(--bg-primary)]/90 ${scrolled ? 'shadow-md shadow-black/5' : ''}`}>
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="shrink-0 cursor-pointer" onClick={() => navigate('/home')}>
            <img
              src={assetPath('/assets/logo/esquilo-invest-simbolo.png')}
              alt="Logo Esquilo Invest"
              className="h-8 w-8 object-contain"
            />
          </div>

          <nav className="hidden h-full items-center gap-0 md:flex">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex h-full items-center border-b-2 px-3 lg:px-4 text-[9px] font-bold uppercase tracking-[0.18em] transition-all duration-200 lg:text-[10px] hover:-translate-y-0.5 ${
                  location.pathname === item.path
                    ? 'border-[#F56A2A] bg-[var(--text-primary)]/5 text-[#F56A2A]'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)]/30'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-5">
            <button onClick={toggleOcultarValores} className="h-8 w-8 flex items-center justify-center text-[var(--text-muted)] transition-all duration-200 hover:text-[#F56A2A]">
              {ocultarValores ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <button onClick={toggleTheme} className="h-8 w-8 flex items-center justify-center text-[var(--text-muted)] transition-all duration-200 hover:text-[#F56A2A]">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setInsightMenuOpen(!insightMenuOpen)}
                className="relative h-8 w-8 flex items-center justify-center transition-all duration-200"
                style={{ color: notificacaoCor }}
              >
                <Bell size={18} />
                {scoreBand === 'critical' && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-[#E85C5C] text-[8px] font-bold text-white">
                    1
                  </span>
                )}
              </button>
              {insightMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setInsightMenuOpen(false)}></div>
                  <div className="absolute right-0 z-[60] mt-4 w-72 rounded-sm border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 text-left shadow-2xl animate-in fade-in slide-in-from-top-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: notificacaoCor }}>{notificacaoTitulo}</p>
                    <p className="text-xs text-[var(--text-secondary)] mb-1"><span className="font-bold text-[var(--text-primary)]">Problema:</span> {notificacaoProblema}</p>
                    <p className="text-xs text-[var(--text-secondary)]"><span className="font-bold text-[var(--text-primary)]">Ação:</span> {notificacaoAcao}</p>
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-3 rounded-sm border border-[var(--border-color)] bg-[var(--bg-card)] p-1 pr-3 transition-all duration-200 hover:bg-[var(--bg-elevated)] hover:-translate-y-0.5 shadow-sm hover:shadow"
              >
                <div
                  className="relative h-8 w-8 rounded-md p-[2px]"
                  style={{ background: `conic-gradient(${notificacaoCor} ${scorePercent}%, var(--border-color) ${scorePercent}% 100%)` }}
                >
                  <div className="flex h-full w-full items-center justify-center rounded-[6px] bg-[var(--bg-primary)] text-[10px] font-bold uppercase text-[var(--text-primary)]">
                    {inicialUsuario}
                  </div>
                </div>
                <img
                  src={assetPath(isDarkMode ? '/assets/icons/branco/chevron-baixo.svg' : '/assets/icons/preto/chevron-baixo.svg')}
                  alt=""
                  className={`h-[14px] w-[14px] opacity-60 transition-all ${menuOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)}></div>
                  <div className="absolute right-0 z-[60] mt-4 w-52 rounded-sm border border-[#EFE7DC] bg-white p-2 text-left shadow-2xl animate-in slide-in-from-top-2">
                    {profileItems.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => { item.action(); setMenuOpen(false); }}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-[#F5F0EB] ${item.color || 'text-[#0B1218]/60'}`}
                      >
                        <img src={item.icon} alt="" className="h-[14px] w-[14px] shrink-0" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button className="text-white/50 md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0B1218] border-b border-white/10 p-4 space-y-2 animate-in slide-in-from-top-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
              className={`w-full text-left p-4 text-xs font-bold uppercase tracking-widest ${location.pathname === item.path ? 'text-[#F56A2A]' : 'text-white/40'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
