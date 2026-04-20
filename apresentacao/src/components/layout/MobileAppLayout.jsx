import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { assetPath } from '../../utils/assetPath';
import { useTheme } from '../../context/ThemeContext';
import { useModoVisualizacao } from '../../context/ModoVisualizacaoContext';
import { cache } from '../../utils/cache';

const NAV_ITEMS = [
  {
    label: 'Inicio',
    to: '/home',
    activeIcon: assetPath('/assets/icons/laranja/home-premium.svg'),
    inactiveIcon: assetPath('/assets/icons/preto/home-premium.svg'),
    inactiveIconDark: assetPath('/assets/icons/branco/home-premium.svg'),
  },
  {
    label: 'Carteira',
    to: '/carteira',
    activeIcon: assetPath('/assets/icons/laranja/carteira-premium.svg'),
    inactiveIcon: assetPath('/assets/icons/preto/carteira-premium.svg'),
    inactiveIconDark: assetPath('/assets/icons/branco/carteira-premium.svg'),
  },
  {
    label: 'Decisoes',
    to: '/decisoes',
    activeIcon: assetPath('/assets/icons/laranja/score-premium.svg'),
    inactiveIcon: assetPath('/assets/icons/preto/score-premium.svg'),
    inactiveIconDark: assetPath('/assets/icons/branco/score-premium.svg'),
  },
  {
    label: 'Perfil',
    to: '/perfil',
    activeIcon: assetPath('/assets/icons/laranja/perfil-premium.svg'),
    inactiveIcon: assetPath('/assets/icons/preto/perfil-premium.svg'),
    inactiveIconDark: assetPath('/assets/icons/branco/perfil-premium.svg'),
  },
];

const ROTA_TITULOS = {
  '/carteira': 'Carteira',
  '/acoes': 'Carteira',
  '/fundos': 'Carteira',
  '/previdencia': 'Carteira',
  '/renda-fixa': 'Carteira',
  '/poupanca': 'Carteira',
  '/bens': 'Carteira',
  '/ativo/': 'Carteira',
  '/insights': 'Insights',
  '/decisoes': 'Decisões',
  '/perfil': 'Perfil',
  '/historico': 'Histórico',
  '/aportes': 'Aportes',
  '/importar': 'Importar',
  '/configuracoes': 'Configurações',
  '/perfil-de-risco': 'Perfil de Risco',
};

function getRotaTitulo(pathname) {
  if (pathname === '/home' || pathname === '/') return null;
  for (const [rota, titulo] of Object.entries(ROTA_TITULOS)) {
    if (pathname.startsWith(rota)) return titulo;
  }
  return null;
}

export default function MobileAppLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();
  const { ocultarValores, toggleOcultarValores } = useModoVisualizacao();
  const [alertasCount, setAlertasCount] = useState(0);

  useEffect(() => {
    const cached = cache.get('insights_resumo', 60 * 1000);
    const count = cached?.diagnostico?.riscos?.length ?? 0;
    setAlertasCount(count);
  }, [location.pathname]);

  const titulo = getRotaTitulo(location.pathname);

  const isCarteiraTab =
    location.pathname.startsWith('/carteira') ||
    location.pathname.startsWith('/ativo/') ||
    location.pathname.startsWith('/historico') ||
    location.pathname.startsWith('/aportes') ||
    location.pathname.startsWith('/importar') ||
    location.pathname.startsWith('/acoes') ||
    location.pathname.startsWith('/fundos') ||
    location.pathname.startsWith('/previdencia') ||
    location.pathname.startsWith('/renda-fixa') ||
    location.pathname.startsWith('/poupanca') ||
    location.pathname.startsWith('/bens');

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header fixo */}
      <header
        className="fixed inset-x-0 top-0 z-40 bg-[var(--bg-primary)]/95 backdrop-blur border-b border-[var(--border-color)]"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="mx-auto flex h-14 w-full max-w-[640px] items-center justify-between px-4">
          {titulo ? (
            <span className="font-['Sora'] text-[18px] font-bold text-[var(--text-primary)]">
              {titulo}
            </span>
          ) : (
            <svg viewBox="0 0 721 109" className="h-6" aria-label="Esquilo wallet">
              <text
                x="0" y="86" fontSize="112" fontWeight="700"
                fontFamily="Sora, Inter, system-ui, sans-serif"
                fill={isDarkMode ? '#ffffff' : '#0b1218'}
              >
                Esquilo
              </text>
              <text
                x="429" y="88" fontSize="112" fontWeight="300"
                fontFamily="Inter, Sora, system-ui, sans-serif"
                fill="#F56A2A"
              >
                wallet
              </text>
            </svg>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] p-2 text-[var(--text-muted)]"
              aria-label="Alternar tema"
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={toggleOcultarValores}
              className="rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] p-2"
              aria-label="Alternar visibilidade"
            >
              <img
                src={assetPath(ocultarValores
                  ? '/assets/icons/laranja/ocultar-premium.svg'
                  : '/assets/icons/laranja/olho-premium.svg')}
                alt=""
                className="h-4 w-4"
              />
            </button>
            <button
              onClick={() => navigate('/insights')}
              className="relative rounded-full border border-[var(--border-color)] bg-[var(--bg-card)] p-2"
              aria-label="Notificações"
            >
              <img
                src={assetPath('/assets/icons/laranja/alerta-premium.svg')}
                alt=""
                className="h-4 w-4"
              />
              {alertasCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[#E85C5C] flex items-center justify-center text-[8px] font-bold text-white">
                  {alertasCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main
        className="mx-auto w-full max-w-[640px] px-4 pb-24"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 72px)' }}
      >
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border-color)] bg-[var(--bg-card)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex h-20 w-full max-w-[640px] items-center justify-around">
          {NAV_ITEMS.map((item) => {
            const isActive = item.to === '/carteira' ? isCarteiraTab : location.pathname.startsWith(item.to);
            const inactiveIcon = isDarkMode ? item.inactiveIconDark : item.inactiveIcon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={() =>
                  `flex min-w-[64px] flex-col items-center justify-center gap-2 text-[11px] font-semibold ${
                    isActive ? 'text-[#F56A2A]' : 'text-[var(--text-secondary)]'
                  }`
                }
              >
                <img
                  src={isActive ? item.activeIcon : inactiveIcon}
                  alt={item.label}
                  className={`h-[32px] w-[32px] ${isActive ? '' : 'opacity-50'}`}
                />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
