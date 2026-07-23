import React, { useEffect, useMemo, useSyncExternalStore } from 'react';
import type { AppEnv } from '../core/data';
import { createAppShell } from './app_shell';
import { createViteJsonLoader } from './vite_json_loader';
import type { DataSourceMode } from '../core/data/data_source_factory';
import { SplashScreen } from '../features/splash/SplashScreen';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { HomeScreen } from '../features/home/HomeScreen';
import { PortfolioScreen } from '../features/portfolio/PortfolioScreen';
import { HoldingDetailScreen } from '../features/holding_detail/HoldingDetailScreen';
import { RadarScreen } from '../features/radar/RadarScreen';
import { HistoryScreen } from '../features/history/HistoryScreen';
import { ImportsCenterScreen } from '../features/imports/ImportsCenterScreen';
import { ImportsEntryScreen } from '../features/imports/ImportsEntryScreen';
import { ImportsPreviewScreen } from '../features/imports/ImportsPreviewScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';

function getEnv(): AppEnv {
  const raw = String(import.meta.env.VITE_APP_ENV ?? 'local');
  return raw === 'prd' || raw === 'hml' || raw === 'local' ? raw : 'local';
}

function getDataSourceMode(): DataSourceMode | undefined {
  const raw = import.meta.env.VITE_DATA_MODE;
  if (!raw) return undefined;
  return raw === 'auto' || raw === 'mock_local' || raw === 'mock_hml' || raw === 'http' ? raw : undefined;
}

export function App(): JSX.Element {
  const env = getEnv();

  const shell = useMemo(() => {
    const mockLoader = createViteJsonLoader();
    return createAppShell(
      {
        env,
        dataSources: {
          mode: getDataSourceMode(),
          httpBaseUrl: import.meta.env.VITE_API_BASE_URL,
          mockLoader
        }
      },
      { pathname: window.location.pathname }
    );
  }, [env]);

  const state = useSyncExternalStore(shell.subscribe, shell.getState, shell.getState);
  const dataSources = shell.getDataSources();

  useEffect(() => {
    const onPop = () => shell.navigateTo(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [shell]);

  function navigate(pathname: string) {
    if (window.location.pathname !== pathname) {
      window.history.pushState({}, '', pathname);
    }
    shell.navigateTo(pathname);
  }

  if (state.route.id === 'splash') {
    return (
      <SplashScreen
        onStart={() => navigate('/onboarding')}
        onSeeHowItWorks={() => navigate('/onboarding')}
      />
    );
  }

  if (state.route.id === 'onboarding') {
    return (
      <OnboardingScreen
        dataSources={dataSources}
        onDone={() => navigate('/home')}
        onSkip={() => navigate('/home')}
      />
    );
  }

  if (state.route.id === 'home') {
    return (
      <HomeScreen
        dataSources={dataSources}
        onGoToTarget={(path) => navigate(path)}
      />
    );
  }

  if (state.route.id === 'portfolio') {
    return (
      <PortfolioScreen
        dataSources={dataSources}
        onBack={() => navigate('/home')}
        onOpenHolding={({ portfolioId, holdingId }) => navigate(`/portfolio/${encodeURIComponent(portfolioId)}/holdings/${encodeURIComponent(holdingId)}`)}
        onGoToHome={() => navigate('/home')}
        onGoToRadar={() => navigate('/radar')}
      />
    );
  }

  if (state.route.id === 'holding_detail') {
    return (
      <HoldingDetailScreen
        dataSources={dataSources}
        input={{ portfolioId: state.route.params.portfolioId, holdingId: state.route.params.holdingId }}
        onBack={() => navigate('/portfolio')}
        onOpenExternal={(url) => window.open(url, '_blank', 'noopener,noreferrer')}
      />
    );
  }

  if (state.route.id === 'radar') {
    return (
      <RadarScreen
        dataSources={dataSources}
        onGoToTarget={(path) => navigate(path)}
      />
    );
  }

  if (state.route.id === 'history') {
    return <HistoryScreen dataSources={dataSources} onGoToTarget={(path) => navigate(path)} />;
  }

  if (state.route.id === 'imports') {
    return <ImportsCenterScreen dataSources={dataSources} onGoToTarget={(path) => navigate(path)} />;
  }

  if (state.route.id === 'imports_entry') {
    return <ImportsEntryScreen dataSources={dataSources} onGoToTarget={(path) => navigate(path)} />;
  }

  if (state.route.id === 'imports_preview') {
    return <ImportsPreviewScreen dataSources={dataSources} importId={state.route.params.importId} onGoToTarget={(path) => navigate(path)} />;
  }

  if (state.route.id === 'profile') {
    return <ProfileScreen dataSources={dataSources} onGoToTarget={(path) => navigate(path)} />;
  }

  // placeholder headless: as telas vão entrando uma a uma, sempre com contratos/mocks.
  return (
    <div className="app">
      <div className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Tela em construção</div>
          <div style={{ color: 'var(--c-slate)' }}>
            Rota atual: <code>{state.route.id}</code>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btnGhost" onClick={() => navigate('/')}>
              Voltar
            </button>
            <button className="btn btnPrimary" onClick={() => navigate('/onboarding')}>
              Ir para onboarding
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
