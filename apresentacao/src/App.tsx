import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { consumirMotivoSaidaSessao } from './cliente-api';

// Componentes do shell da aplicação — carregados de forma eager por serem usados em toda navegação
import Placeholder from './components/feedback/Placeholder';
import AppLayout from './components/layout/AppLayout';
import MobileAppLayout from './components/layout/MobileAppLayout';
import { useIsMobile } from './hooks/useIsMobile';

// Contextos
import { ModoVisualizacaoProvider } from './context/ModoVisualizacaoContext';
import { ThemeProvider } from './context/ThemeContext';

// ─── Lazy imports: cada grupo vira um chunk separado ─────────────────────────

// Rotas públicas
const LandingPage = React.lazy(() => import('./features/home/LandingPage'));

// Home e pré-insight — carregam cedo, mas em chunk próprio
const Home = React.lazy(() => import('./features/home/Home'));
const HomeMobile = React.lazy(() => import('./features/home/HomeMobile'));
const PreInsight = React.lazy(() => import('./components/feedback/PreInsight'));

// Carteira
const Carteira = React.lazy(() => import('./features/carteira/Carteira'));
const CarteiraMobile = React.lazy(() => import('./features/carteira/CarteiraMobile'));
const AssetCategoryView = React.lazy(() => import('./features/carteira/AssetCategoryView'));
const AssetCategoryMobile = React.lazy(() => import('./features/carteira/AssetCategoryMobile'));
const DetalheAtivo = React.lazy(() => import('./features/carteira/DetalheAtivo'));
const DetalheAtivoMobile = React.lazy(() => import('./features/carteira/DetalheAtivoMobile'));

// Funcionalidades principais
const Insights = React.lazy(() => import('./features/insights/Insights'));
const InsightsMobile = React.lazy(() => import('./features/insights/InsightsMobile'));
const Aportes = React.lazy(() => import('./features/aportes/Aportes'));
const AportesMobile = React.lazy(() => import('./features/aportes/AportesMobile'));
const Historico = React.lazy(() => import('./features/historico/Historico'));
const HistoricoMobile = React.lazy(() => import('./features/historico/HistoricoMobile'));
const Importar = React.lazy(() => import('./features/importacao/Importar'));
const ImportarMobile = React.lazy(() => import('./features/importacao/ImportarMobile'));

// Simuladores de decisão
const DecisionHub = React.lazy(() => import('./features/decisoes/DecisionHub'));
const DecisionHubMobile = React.lazy(() => import('./features/decisoes/DecisionHubMobile'));
const PropertySimulator = React.lazy(() => import('./features/decisoes/PropertySimulator'));
const CarSimulator = React.lazy(() => import('./features/decisoes/CarSimulator'));
const ReserveOrFinanceSimulator = React.lazy(() => import('./features/decisoes/ReserveOrFinanceSimulator'));
const SpendOrInvestSimulator = React.lazy(() => import('./features/decisoes/SpendOrInvestSimulator'));
const FreeSimulationSimulator = React.lazy(() => import('./features/decisoes/FreeSimulationSimulator'));
const SimulationHistory = React.lazy(() => import('./features/decisoes/SimulationHistory'));
const SimulationDetail = React.lazy(() => import('./features/decisoes/SimulationDetail'));
const SimulationResultMobile = React.lazy(() => import('./features/decisoes/SimulationResultMobile'));
const DecisionScenarioMobile = React.lazy(() => import('./features/decisoes/DecisionScenarioMobile'));

// Perfil e configurações
const PerfilRisco = React.lazy(() => import('./features/perfil/PerfilRisco'));
const PerfilUsuario = React.lazy(() => import('./features/perfil/PerfilUsuario'));
const PerfilMobile = React.lazy(() => import('./features/perfil/PerfilMobile'));
const Configuracoes = React.lazy(() => import('./features/perfil/Configuracoes'));
const PerfilRiscoMobile = React.lazy(() => import('./features/perfil/PerfilRiscoMobile'));
const ConfiguracoesMobile = React.lazy(() => import('./features/perfil/ConfiguracoesMobile'));

// Admin
const PainelAdmin = React.lazy(() => import('./features/admin/PainelAdmin'));
const Dashboard = React.lazy(() => import('./features/perfil/dashboard'));

// Preview isolado da nova tela de entrada
const MobileEntryPreview = React.lazy(() => import('./features/autenticacao/MobileEntryPreview'));

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

const ResponsiveLayout: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const isMobile = useIsMobile();
  if (isMobile) return <MobileAppLayout>{children}</MobileAppLayout>;
  return <AppLayout>{children}</AppLayout>;
};

const ResponsiveHome: React.FC = () => {
  const isMobile = useIsMobile();
  return isMobile ? <HomeMobile /> : <Home />;
};

const ResponsiveCarteira: React.FC = () => {
  const isMobile = useIsMobile();
  return isMobile ? <CarteiraMobile /> : <Carteira />;
};

const ResponsiveInsights: React.FC = () => {
  const isMobile = useIsMobile();
  return isMobile ? <InsightsMobile /> : <Insights />;
};

const ResponsiveHistorico: React.FC = () => {
  const isMobile = useIsMobile();
  return isMobile ? <HistoricoMobile /> : <Historico />;
};

const ResponsiveDecisoes: React.FC = () => {
  const isMobile = useIsMobile();
  return isMobile ? <DecisionHubMobile /> : <DecisionHub />;
};

const ResponsivePerfil: React.FC = () => {
  const isMobile = useIsMobile();
  return isMobile ? <PerfilMobile /> : <PerfilUsuario />;
};

const ResponsiveCategoria: React.FC<{ manualCategoriaId?: string }> = ({ manualCategoriaId }) => {
  const isMobile = useIsMobile();
  return isMobile ? <AssetCategoryMobile manualCategoriaId={manualCategoriaId} /> : <AssetCategoryView manualCategoriaId={manualCategoriaId} />;
};

const ResponsiveAtivo: React.FC = () => {
  const isMobile = useIsMobile();
  return isMobile ? <DetalheAtivoMobile /> : <DetalheAtivo />;
};

const ResponsiveResultadoSimulacao: React.FC = () => {
  const isMobile = useIsMobile();
  return isMobile ? <SimulationResultMobile /> : <SimulationDetail />;
};

const ResponsiveAportes: React.FC = () => {
  const isMobile = useIsMobile();
  return isMobile ? <AportesMobile /> : <Aportes />;
};

const ResponsiveImportar: React.FC = () => {
  const isMobile = useIsMobile();
  return isMobile ? <ImportarMobile /> : <Importar />;
};

const ResponsivePerfilRisco: React.FC = () => {
  const isMobile = useIsMobile();
  return isMobile ? <PerfilRiscoMobile /> : <PerfilRisco />;
};

const ResponsiveConfiguracoes: React.FC = () => {
  const isMobile = useIsMobile();
  return isMobile ? <ConfiguracoesMobile /> : <Configuracoes />;
};

const ResponsiveSimulator: React.FC<{ title: string; desktop: React.ReactElement }> = ({ title, desktop }) => {
  const isMobile = useIsMobile();
  return isMobile ? <DecisionScenarioMobile title={title} /> : desktop;
};

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
          <Route path="/mobile-entry-test" element={<MobileEntryPreview />} />
          <Route path="/placeholder" element={<ResponsiveLayout><Placeholder /></ResponsiveLayout>} />

          {/* Home */}
          <Route path="/home" element={<ProtectedRoute><ResponsiveLayout><ResponsiveHome /></ResponsiveLayout></ProtectedRoute>} />
          <Route path="/pre-insight" element={<ProtectedRoute><ResponsiveLayout><PreInsight /></ResponsiveLayout></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><ResponsiveLayout><Dashboard /></ResponsiveLayout></ProtectedRoute>} />

          {/* Carteira */}
          <Route path="/carteira" element={<ProtectedRoute><ResponsiveLayout><ResponsiveCarteira /></ResponsiveLayout></ProtectedRoute>} />
          <Route path="/carteira/:categoria" element={<ProtectedRoute><ResponsiveLayout><ResponsiveCategoria /></ResponsiveLayout></ProtectedRoute>} />
          <Route path="/acoes" element={<ProtectedRoute><ResponsiveLayout><ResponsiveCategoria manualCategoriaId="acoes" /></ResponsiveLayout></ProtectedRoute>} />
          <Route path="/fundos" element={<ProtectedRoute><ResponsiveLayout><ResponsiveCategoria manualCategoriaId="fundos" /></ResponsiveLayout></ProtectedRoute>} />
          <Route path="/previdencia" element={<ProtectedRoute><ResponsiveLayout><ResponsiveCategoria manualCategoriaId="previdencia" /></ResponsiveLayout></ProtectedRoute>} />
          <Route path="/renda-fixa" element={<ProtectedRoute><ResponsiveLayout><ResponsiveCategoria manualCategoriaId="renda-fixa" /></ResponsiveLayout></ProtectedRoute>} />
          <Route path="/poupanca" element={<ProtectedRoute><ResponsiveLayout><ResponsiveCategoria manualCategoriaId="poupanca" /></ResponsiveLayout></ProtectedRoute>} />
          <Route path="/bens" element={<ProtectedRoute><ResponsiveLayout><ResponsiveCategoria manualCategoriaId="bens" /></ResponsiveLayout></ProtectedRoute>} />
          <Route path="/ativo/:ticker" element={<ProtectedRoute><ResponsiveLayout><ResponsiveAtivo /></ResponsiveLayout></ProtectedRoute>} />

          {/* Funcionalidades */}
          <Route path="/aportes" element={<ProtectedRoute><ResponsiveLayout><ResponsiveAportes /></ResponsiveLayout></ProtectedRoute>} />
          <Route path="/insights" element={<ProtectedRoute><ResponsiveLayout><ResponsiveInsights /></ResponsiveLayout></ProtectedRoute>} />
          <Route path="/historico" element={<ProtectedRoute><ResponsiveLayout><ResponsiveHistorico /></ResponsiveLayout></ProtectedRoute>} />
          <Route path="/importar" element={<ProtectedRoute><ResponsiveLayout><ResponsiveImportar /></ResponsiveLayout></ProtectedRoute>} />

          {/* Simuladores de decisão */}
          <Route path="/decisoes" element={<ProtectedRoute><ResponsiveLayout><ResponsiveDecisoes /></ResponsiveLayout></ProtectedRoute>} />
          <Route path="/decisoes/imovel" element={<ProtectedRoute><ResponsiveLayout><ResponsiveSimulator title="Simular imovel" desktop={<PropertySimulator />} /></ResponsiveLayout></ProtectedRoute>} />
          <Route path="/decisoes/carro" element={<ProtectedRoute><ResponsiveLayout><ResponsiveSimulator title="Simular carro" desktop={<CarSimulator />} /></ResponsiveLayout></ProtectedRoute>} />
          <Route path="/decisoes/reserva-ou-financiar" element={<ProtectedRoute><ResponsiveLayout><ResponsiveSimulator title="Reserva ou financiar" desktop={<ReserveOrFinanceSimulator />} /></ResponsiveLayout></ProtectedRoute>} />
          <Route path="/decisoes/gastar-ou-investir" element={<ProtectedRoute><ResponsiveLayout><ResponsiveSimulator title="Gastar ou investir" desktop={<SpendOrInvestSimulator />} /></ResponsiveLayout></ProtectedRoute>} />
          <Route path="/decisoes/livre" element={<ProtectedRoute><ResponsiveLayout><ResponsiveSimulator title="Simulador livre" desktop={<FreeSimulationSimulator />} /></ResponsiveLayout></ProtectedRoute>} />
          <Route path="/decisoes/historico" element={<ProtectedRoute><ResponsiveLayout><SimulationHistory /></ResponsiveLayout></ProtectedRoute>} />
          <Route path="/decisoes/resultado/:id" element={<ProtectedRoute><ResponsiveLayout><ResponsiveResultadoSimulacao /></ResponsiveLayout></ProtectedRoute>} />

          {/* Perfil */}
          <Route path="/perfil-de-risco" element={<ProtectedRoute><ResponsiveLayout><ResponsivePerfilRisco /></ResponsiveLayout></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><ResponsiveLayout><ResponsivePerfil /></ResponsiveLayout></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute><ResponsiveLayout><ResponsiveConfiguracoes /></ResponsiveLayout></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute><ResponsiveLayout><PainelAdmin /></ResponsiveLayout></ProtectedRoute>} />

          {/* 404 */}
          <Route
            path="*"
            element={
              <ResponsiveLayout>
                <Placeholder
                  title="Rota não encontrada"
                  description="A URL acessada não existe no mapeamento atual. Use o menu para navegar entre as telas válidas."
                />
              </ResponsiveLayout>
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
