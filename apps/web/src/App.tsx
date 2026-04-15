import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { consumirMotivoSaidaSessao } from './cliente-api';

// Componentes do shell da aplicação — carregados de forma eager por serem usados em toda navegação
import Placeholder from './components/feedback/Placeholder';
import AppLayout from './components/layout/AppLayout';

// Contextos
import { ModoVisualizacaoProvider } from './context/ModoVisualizacaoContext';
import { ThemeProvider } from './context/ThemeContext';

// ─── Lazy imports: cada grupo vira um chunk separado ─────────────────────────

// Rotas públicas
const LandingPage = React.lazy(() => import('./features/home/LandingPage'));

// Home e pré-insight — carregam cedo, mas em chunk próprio
const Home = React.lazy(() => import('./features/home/Home'));
const PreInsight = React.lazy(() => import('./components/feedback/PreInsight'));

// Carteira
const Carteira = React.lazy(() => import('./features/carteira/Carteira'));
const AssetCategoryView = React.lazy(() => import('./features/carteira/AssetCategoryView'));
const DetalheAtivo = React.lazy(() => import('./features/carteira/DetalheAtivo'));

// Funcionalidades principais
const Insights = React.lazy(() => import('./features/insights/Insights'));
const Aportes = React.lazy(() => import('./features/aportes/Aportes'));
const Historico = React.lazy(() => import('./features/historico/Historico'));
const Importar = React.lazy(() => import('./features/importacao/Importar'));

// Simuladores de decisão
const DecisionHub = React.lazy(() => import('./features/decisoes/DecisionHub'));
const PropertySimulator = React.lazy(() => import('./features/decisoes/PropertySimulator'));
const CarSimulator = React.lazy(() => import('./features/decisoes/CarSimulator'));
const ReserveOrFinanceSimulator = React.lazy(() => import('./features/decisoes/ReserveOrFinanceSimulator'));
const SpendOrInvestSimulator = React.lazy(() => import('./features/decisoes/SpendOrInvestSimulator'));
const FreeSimulationSimulator = React.lazy(() => import('./features/decisoes/FreeSimulationSimulator'));
const SimulationHistory = React.lazy(() => import('./features/decisoes/SimulationHistory'));
const SimulationDetail = React.lazy(() => import('./features/decisoes/SimulationDetail'));

// Perfil e configurações
const PerfilRisco = React.lazy(() => import('./features/perfil/PerfilRisco'));
const PerfilUsuario = React.lazy(() => import('./features/perfil/PerfilUsuario'));
const Configuracoes = React.lazy(() => import('./features/perfil/Configuracoes'));

// Admin
const PainelAdmin = React.lazy(() => import('./features/admin/PainelAdmin'));
const Dashboard = React.lazy(() => import('./features/perfil/dashboard'));

// ─── Utilitários de autenticação ─────────────────────────────────────────────

const safeGetStorageItem = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const isAuthenticated = () => safeGetStorageItem('isAuthenticated') === 'true';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  if (!isAuthenticated()) {
    const motivoSaida = consumirMotivoSaidaSessao();
    const destino = motivoSaida === 'expirada' ? '/?sessao=expirada' : '/';
    return <Navigate to={destino} replace />;
  }
  return children;
};

const PublicRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  if (isAuthenticated()) {
    return <Navigate to="/home" replace />;
  }
  return children;
};

// Fallback de loading para Suspense — usa o Placeholder existente
const Loading: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
    <Placeholder title="" description="" />
  </div>
);

// ─── Rotas ───────────────────────────────────────────────────────────────────

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<Loading />}>
        <Routes location={location} key={location.pathname}>
          {/* Públicas */}
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/0" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/onboarding" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/placeholder" element={<AppLayout><Placeholder /></AppLayout>} />

          {/* Home */}
          <Route path="/home" element={<ProtectedRoute><AppLayout><Home /></AppLayout></ProtectedRoute>} />
          <Route path="/pre-insight" element={<ProtectedRoute><AppLayout><PreInsight /></AppLayout></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />

          {/* Carteira */}
          <Route path="/carteira" element={<ProtectedRoute><AppLayout><Carteira /></AppLayout></ProtectedRoute>} />
          <Route path="/carteira/:categoria" element={<ProtectedRoute><AppLayout><AssetCategoryView /></AppLayout></ProtectedRoute>} />
          <Route path="/acoes" element={<ProtectedRoute><AppLayout><AssetCategoryView manualCategoriaId="acoes" /></AppLayout></ProtectedRoute>} />
          <Route path="/fundos" element={<ProtectedRoute><AppLayout><AssetCategoryView manualCategoriaId="fundos" /></AppLayout></ProtectedRoute>} />
          <Route path="/previdencia" element={<ProtectedRoute><AppLayout><AssetCategoryView manualCategoriaId="previdencia" /></AppLayout></ProtectedRoute>} />
          <Route path="/renda-fixa" element={<ProtectedRoute><AppLayout><AssetCategoryView manualCategoriaId="renda-fixa" /></AppLayout></ProtectedRoute>} />
          <Route path="/poupanca" element={<ProtectedRoute><AppLayout><AssetCategoryView manualCategoriaId="poupanca" /></AppLayout></ProtectedRoute>} />
          <Route path="/bens" element={<ProtectedRoute><AppLayout><AssetCategoryView manualCategoriaId="bens" /></AppLayout></ProtectedRoute>} />
          <Route path="/ativo/:ticker" element={<ProtectedRoute><AppLayout><DetalheAtivo /></AppLayout></ProtectedRoute>} />

          {/* Funcionalidades */}
          <Route path="/aportes" element={<ProtectedRoute><AppLayout><Aportes /></AppLayout></ProtectedRoute>} />
          <Route path="/insights" element={<ProtectedRoute><AppLayout><Insights /></AppLayout></ProtectedRoute>} />
          <Route path="/historico" element={<ProtectedRoute><AppLayout><Historico /></AppLayout></ProtectedRoute>} />
          <Route path="/importar" element={<ProtectedRoute><AppLayout><Importar /></AppLayout></ProtectedRoute>} />

          {/* Simuladores de decisão */}
          <Route path="/decisoes" element={<ProtectedRoute><AppLayout><DecisionHub /></AppLayout></ProtectedRoute>} />
          <Route path="/decisoes/imovel" element={<ProtectedRoute><AppLayout><PropertySimulator /></AppLayout></ProtectedRoute>} />
          <Route path="/decisoes/carro" element={<ProtectedRoute><AppLayout><CarSimulator /></AppLayout></ProtectedRoute>} />
          <Route path="/decisoes/reserva-ou-financiar" element={<ProtectedRoute><AppLayout><ReserveOrFinanceSimulator /></AppLayout></ProtectedRoute>} />
          <Route path="/decisoes/gastar-ou-investir" element={<ProtectedRoute><AppLayout><SpendOrInvestSimulator /></AppLayout></ProtectedRoute>} />
          <Route path="/decisoes/livre" element={<ProtectedRoute><AppLayout><FreeSimulationSimulator /></AppLayout></ProtectedRoute>} />
          <Route path="/decisoes/historico" element={<ProtectedRoute><AppLayout><SimulationHistory /></AppLayout></ProtectedRoute>} />
          <Route path="/decisoes/resultado/:id" element={<ProtectedRoute><AppLayout><SimulationDetail /></AppLayout></ProtectedRoute>} />

          {/* Perfil */}
          <Route path="/perfil-de-risco" element={<ProtectedRoute><AppLayout><PerfilRisco /></AppLayout></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><AppLayout><PerfilUsuario /></AppLayout></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute><AppLayout><Configuracoes /></AppLayout></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute><AppLayout><PainelAdmin /></AppLayout></ProtectedRoute>} />

          {/* 404 */}
          <Route
            path="*"
            element={
              <AppLayout>
                <Placeholder
                  title="Rota não encontrada"
                  description="A URL acessada não existe no mapeamento atual. Use o menu para navegar entre as telas válidas."
                />
              </AppLayout>
            }
          />
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
