import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { assetPath } from '../../utils/assetPath';
import { useTheme } from '../../context/ThemeContext';

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
    label: 'Insights',
    to: '/insights',
    activeIcon: assetPath('/assets/icons/laranja/radar-premium.svg'),
    inactiveIcon: assetPath('/assets/icons/preto/radar-premium.svg'),
    inactiveIconDark: assetPath('/assets/icons/branco/radar-premium.svg'),
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

export default function MobileAppLayout({ children }) {
  const location = useLocation();
  const { isDarkMode } = useTheme();
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
      <main className="mx-auto w-full max-w-[640px] px-4 pt-4 pb-24">
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border-color)] bg-[var(--bg-card)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[640px] items-center justify-around">
          {NAV_ITEMS.map((item) => {
            const isActive = item.to === '/carteira' ? isCarteiraTab : location.pathname.startsWith(item.to);
            const inactiveIcon = isDarkMode ? item.inactiveIconDark : item.inactiveIcon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={() =>
                  `flex min-w-[56px] flex-col items-center justify-center gap-1 text-[10px] font-semibold ${
                    isActive ? 'text-[#F56A2A]' : 'text-[var(--text-secondary)]'
                  }`
                }
              >
                <img
                  src={isActive ? item.activeIcon : inactiveIcon}
                  alt={item.label}
                  className={`h-[22px] w-[22px] ${isActive ? '' : 'opacity-50'}`}
                />
                <span>{item.label}</span>
                {isActive && <span className="mt-[2px] h-1 w-1 rounded-full bg-[#F56A2A]" />}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
