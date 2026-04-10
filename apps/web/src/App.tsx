import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { consumirMotivoSaidaSessao } from './cliente-api';
import LandingPage from './features/home/LandingPage';
import Home from './features/home/Home';
import Dashboard from './features/perfil/dashboard';
import Onboarding from './features/onboarding/onboarding';
import Carteira from './features/carteira/Carteira';
import DetalheAtivo from './features/carteira/DetalheAtivo';
import Insights from './features/insights/Insights';
import Aportes from './features/aportes/Aportes';
import Historico from './features/historico/Historico';
import Importar from './features/importacao/Importar';
import PerfilRisco from './features/perfil/PerfilRisco';
import PerfilUsuario from './features/perfil/PerfilUsuario';
import Configuracoes from './features/perfil/Configuracoes';
import Placeholder from './components/feedback/Placeholder';
import PreInsight from './components/feedback/PreInsight';
import AppLayout from './components/layout/AppLayout';

const isAuthenticated = () => localStorage.getItem('isAuthenticated') === 'true';
const hasSeenPreInsight = () => localStorage.getItem('hasSeenPreInsight') === 'true';

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

const HomeEntry: React.FC = () => (
  hasSeenPreInsight() ? <AppLayout><Home /></AppLayout> : <Navigate to="/pre-insight" replace />
);

const PreInsightEntry: React.FC = () => (
  hasSeenPreInsight() ? <Navigate to="/home" replace /> : <PreInsight />
);

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/0" element={<PublicRoute><LandingPage /></PublicRoute>} />
        <Route path="/onboarding" element={<PublicRoute><AppLayout><Onboarding /></AppLayout></PublicRoute>} />
        <Route path="/placeholder" element={<AppLayout><Placeholder /></AppLayout>} />

        <Route path="/home" element={<ProtectedRoute><HomeEntry /></ProtectedRoute>} />
        <Route path="/pre-insight" element={<ProtectedRoute><PreInsightEntry /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
        <Route path="/carteira" element={<ProtectedRoute><AppLayout><Carteira /></AppLayout></ProtectedRoute>} />
        <Route path="/ativo/:ticker" element={<ProtectedRoute><AppLayout><DetalheAtivo /></AppLayout></ProtectedRoute>} />
        <Route path="/aportes" element={<ProtectedRoute><AppLayout><Aportes /></AppLayout></ProtectedRoute>} />
        <Route path="/insights" element={<ProtectedRoute><AppLayout><Insights /></AppLayout></ProtectedRoute>} />
        <Route path="/historico" element={<ProtectedRoute><AppLayout><Historico /></AppLayout></ProtectedRoute>} />
        <Route path="/importar" element={<ProtectedRoute><AppLayout><Importar /></AppLayout></ProtectedRoute>} />
        <Route path="/perfil-de-risco" element={<ProtectedRoute><AppLayout><PerfilRisco /></AppLayout></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><AppLayout><PerfilUsuario /></AppLayout></ProtectedRoute>} />
        <Route path="/configuracoes" element={<ProtectedRoute><AppLayout><Configuracoes /></AppLayout></ProtectedRoute>} />

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
    </Router>
  );
};

export default App;
