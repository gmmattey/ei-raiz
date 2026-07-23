import type { AppEnv } from '../core/data';
import { createDataSources, type DataSourceMode } from '../core/data';
import type { AppDataSources } from '../core/data/data_sources';
import type { JsonLoader } from '../core/data/types';
import { createRouter, type RouterLocationLike } from '../core/router';
import { createInitialAppState, createStore, type AppState } from '../core/state';

export interface AppShellConfig {
  env: AppEnv;
  dataSources: {
    mode?: DataSourceMode;
    httpBaseUrl?: string;
    mockLoader?: JsonLoader;
  };
}

export interface AppShell {
  getState(): AppState;
  subscribe(listener: (s: AppState) => void): () => void;
  navigateTo(pathname: string): void;
  getDataSources(): AppDataSources;
}

/**
 * Camada "headless" do app web: resolve rota, estado global e data sources.
 * Não toma decisão de layout nem de framework (React/Vue/etc).
 */
export function createAppShell(config: AppShellConfig, location: RouterLocationLike): AppShell {
  const router = createRouter();
  const initialRoute = router.parse(location);

  // A factory fica pronta para quando o app virar Node real; por enquanto isto só garante wiring consistente.
  const dataSources: AppDataSources = createDataSources({
    appEnv: config.env,
    mode: config.dataSources.mode,
    httpBaseUrl: config.dataSources.httpBaseUrl,
    mockLoader: config.dataSources.mockLoader
  });

  const store = createStore<AppState>(createInitialAppState({ env: config.env, route: initialRoute }));

  return {
    getState: store.getState,
    subscribe: store.subscribe,
    navigateTo(pathname) {
      store.setState((s) => ({ ...s, route: router.parse({ pathname }) }));
    },
    getDataSources() {
      return dataSources;
    }
  };
}
