import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Contextos
import { ModoVisualizacaoProvider } from './context/ModoVisualizacaoContext';
import { ThemeProvider } from './context/ThemeContext';

// ─── Lazy imports: landing institucional + páginas legais ────────────────────
// Rotas patrimoniais/autenticadas (login, onboarding, dashboard, carteira, aportes, insights,
// histórico, importação, decisões, perfil, configurações, admin) foram removidas do router
// público nesta issue (#122 — Savro migrando para app mobile KMP local-first). Os arquivos de
// `src/features/*` correspondentes NÃO foram apagados — remoção física é escopo da issue #184.
const Landing = React.lazy(() => import('./features/landing/Landing'));
const Privacidade = React.lazy(() => import('./features/legal/Privacidade'));
const Termos = React.lazy(() => import('./features/legal/Termos'));
const Suporte = React.lazy(() => import('./features/legal/Suporte'));
const FaqPage = React.lazy(() => import('./features/legal/FaqPage'));
const Changelog = React.lazy(() => import('./features/legal/Changelog'));
const NotFound = React.lazy(() => import('./features/legal/NotFound'));

// Fallback de loading para Suspense — dark, coerente com o tema Savro das rotas públicas atuais.
const Loading: React.FC = () => (
  <div className="flex min-h-[100vh] w-full items-center justify-center bg-[#07111F] p-6">
    <div className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-white/10 bg-[#13213A] p-10 shadow-xl">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-[#4772F5]" />
      <div className="mt-5 font-semibold text-[#F7F9FC]">Carregando...</div>
      <div className="mt-2 text-sm text-[#A3AEC3]">Aguarde um instante.</div>
    </div>
  </div>
);

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<Loading />}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Landing />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/termos" element={<Termos />} />
          <Route path="/suporte" element={<Suporte />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/changelog" element={<Changelog />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  return (
    <ModoVisualizacaoProvider>
      <ThemeProvider>
        <Router>
          <AnimatedRoutes />
        </Router>
      </ThemeProvider>
    </ModoVisualizacaoProvider>
  );
};

export default App;
