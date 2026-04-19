import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { assetPath } from '../../utils/assetPath';
import { adminApi, clearSession, getStoredUser } from '../../cliente-api';
import { useInsights } from '../../hooks/useInsights';
import { Eye, EyeOff, Moon, Sun, Bell } from 'lucide-react';
import { useModoVisualizacao } from '../../context/ModoVisualizacaoContext';
import { useTheme } from '../../context/ThemeContext';

const NAV_MENUS = [
  { label: 'Seu Painel', path: '/home' },
  { label: 'Sua Carteira', path: '/carteira' },
  { label: 'Suas Decisões', path: '/decisoes' },
  { label: 'Seus Importes', path: '/importar' },
];

export default function GlobalHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [usuario, setUsuario] = useState(() => getStoredUser());
  const [isAdmin, setIsAdmin] = useState(false);
  const { ocultarValores, toggleOcultarValores } = useModoVisualizacao();
  const { isDarkMode, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [insightMenuOpen, setInsightMenuOpen] = useState(false);
  const { dados: insights } = useInsights();

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
        const acessoAdmin = await adminApi.obterMeAdmin().catch(() => ({ isAdmin: false }));
        if (ativo) setIsAdmin(Boolean(acessoAdmin?.isAdmin));
      } catch {
        if (ativo) setIsAdmin(false);
      }
    };
    void carregar();
    return () => {
      ativo = false;
    };
  }, []);


  const iconVariant = isDarkMode ? 'branco' : 'preto';
  const profileItems = [
    { label: 'Meu Perfil', icon: assetPath(`/assets/icons/${iconVariant}/perfil.svg`), action: () => navigate('/perfil') },
    { label: 'Perfil de Risco', icon: assetPath(`/assets/icons/${iconVariant}/radar.svg`), action: () => navigate('/perfil-de-risco') },
    { label: 'Configurações', icon: assetPath(`/assets/icons/${iconVariant}/configuracoes.svg`), action: () => navigate('/configuracoes') },
    ...(isAdmin ? [{ label: 'Painel Admin', icon: assetPath(`/assets/icons/${iconVariant}/score.svg`), action: () => navigate('/admin') }] : []),
    { 
      label: 'Sair da conta', 
      icon: assetPath(`/assets/icons/${iconVariant}/fechar.svg`),
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
  const temAlertas = Boolean(insights?.riscoPrincipal || insights?.acaoPrioritaria ||
    (insights?.diagnostico?.riscos?.length ?? 0) > 0);
  const notificacaoCor =
    scoreBand === 'critical' ? '#E85C5C' :
    temAlertas ? '#F56A2A' :
    '#6FCF97';
  const notificacaoTitulo =
    scoreBand === 'critical' ? 'Risco detectado' :
    scoreBand === 'fragile' || scoreBand === 'stable' ? 'Atenção necessária' :
    'Tudo em dia';
  const notificacaoProblema = insights?.riscoPrincipal?.titulo || insights?.acaoPrioritaria?.titulo || 'Sem pendências críticas no momento.';
  const notificacaoAcao = insights?.acaoPrioritaria?.descricao || insights?.riscoPrincipal?.descricao || 'Continue acompanhando e mantendo aportes consistentes.';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-[var(--border-color)] backdrop-blur-md bg-[var(--bg-primary)]/90 ${scrolled ? 'shadow-md shadow-black/5' : ''}`}>
      <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
        {/* Logo à esquerda */}
        <div className="cursor-pointer flex-shrink-0" onClick={() => navigate('/home')}>
          <img
            src={assetPath(isDarkMode ? '/assets/logo/esquilowallet-preto.svg' : '/assets/logo/esquilowallet-branco.svg')}
            alt="Esquilo Invest"
            className="h-6 object-contain"
          />
        </div>

        {/* Menus centralizados */}
        <nav className="hidden lg:flex items-center gap-8 flex-1 justify-center">
          {NAV_MENUS.map((menu) => (
            <button
              key={menu.path}
              onClick={() => navigate(menu.path)}
              className={`text-sm font-medium transition-colors ${
                location.pathname === menu.path
                  ? 'text-[#F56A2A]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {menu.label}
            </button>
          ))}
        </nav>

        {/* Controles à direita */}
        <div className="flex items-center gap-5 flex-shrink-0">
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
                {temAlertas && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full text-[8px] font-bold text-white"
                    style={{ background: notificacaoCor }}>
                  </span>
                )}
              </button>
              {insightMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setInsightMenuOpen(false)}></div>
                  <div className="absolute right-0 z-[60] mt-4 w-72 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 text-left shadow-2xl animate-in fade-in slide-in-from-top-2">
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
                className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-1 pr-3 transition-all duration-200 hover:bg-[var(--bg-elevated)] hover:-translate-y-0.5 shadow-sm hover:shadow"
              >
                <div
                  className="relative h-8 w-8 rounded-xl p-[2px]"
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
                  <div className="absolute right-0 z-[60] mt-4 w-52 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-2 text-left shadow-2xl animate-in slide-in-from-top-2">
                    {profileItems.map((item) => (
                      <button
                        key={item.label}
                        onClick={() => { item.action(); setMenuOpen(false); }}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-[var(--bg-card-alt)] ${item.color || 'text-[var(--text-secondary)]'}`}
                      >
                        <img src={item.icon} alt="" className="h-[14px] w-[14px] shrink-0" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
        </div>
      </div>
    </header>
  );
}

