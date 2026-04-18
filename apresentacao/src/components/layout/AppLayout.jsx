import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import GlobalHeader from '../navigation/GlobalHeader';
import { motion } from 'framer-motion';
import { assetPath } from '../../utils/assetPath';
import { useTheme } from '../../context/ThemeContext';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.21,1.02,0.73,1] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.15 } }
};

const SIDEBAR_ITEMS = [
  { label: 'Painel Geral',   to: '/home',          icon: 'home',           match: ['/home'] },
  { label: 'Sua Carteira',   to: '/carteira',       icon: 'carteira',       match: ['/carteira', '/ativo/', '/aportes', '/acoes', '/fundos', '/previdencia', '/renda-fixa', '/poupanca', '/bens'] },
  { label: 'Análise & IA',   to: '/insights',       icon: 'radar',          match: ['/insights'] },
  { label: 'Simuladores',    to: '/decisoes',       icon: 'score',          match: ['/decisoes'] },
  { label: 'Importar',       to: '/importar',       icon: 'importar',       match: ['/importar'] },
  { label: 'Histórico',      to: '/historico',      icon: 'historico',      match: ['/historico'] },
  { label: 'Configurações',  to: '/configuracoes',  icon: 'configuracoes',  match: ['/configuracoes', '/perfil', '/perfil-de-risco'] },
];

function SidebarNav() {
  const location = useLocation();
  const { isDarkMode } = useTheme();

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-[220px] z-40 border-r border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col">
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {SIDEBAR_ITEMS.map(item => {
          const isActive = item.match.some(m => location.pathname.startsWith(m));
          const iconVariant = isActive ? 'laranja' : isDarkMode ? 'branco' : 'preto';
          const iconFile   = isActive ? `${item.icon}-premium` : item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={() => `flex items-center gap-3 px-3 py-2.5 mb-0.5 rounded-xl text-[13px] font-semibold transition-all ${
                isActive
                  ? 'bg-[#F56A2A]/10 text-[#F56A2A]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <img
                src={assetPath(`/assets/icons/${iconVariant}/${iconFile}.svg`)}
                alt={item.label}
                className="h-[18px] w-[18px] flex-shrink-0"
              />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}

export function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] transition-colors duration-300">
      <GlobalHeader />
      <SidebarNav />
      <main className="ml-[220px] min-h-[calc(100vh-4rem)] pt-20 pb-12 px-6 lg:px-8">
        <motion.div
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}

export default AppLayout;
