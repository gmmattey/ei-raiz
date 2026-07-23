import type { AppEnv, JsonLoader } from './types';
import type { AppDataSources } from './data_sources';
import { createHttpDataSources } from './providers/http_provider';
import { createLocalMockDataSources } from './providers/mock_provider';

export type DataSourceMode = 'auto' | 'mock_local' | 'mock_hml' | 'http';

export interface DataSourceFactoryInput {
  appEnv: AppEnv;
  /**
   * `auto` resolve pelo ambiente:
   * - local/hml -> mock
   * - prd -> http
   */
  mode?: DataSourceMode;
  httpBaseUrl?: string;
  mockLoader?: JsonLoader;
}

export function createDataSources(input: DataSourceFactoryInput): AppDataSources {
  const mode = resolveMode(input.appEnv, input.mode);

  if (mode === 'mock_local' || mode === 'mock_hml') {
    if (!input.mockLoader) {
      throw new Error(`mockLoader is required when mode=${mode}`);
    }
    const basePath = mode === 'mock_hml' ? 'apps/web/src/core/data/mock/hml' : 'apps/web/src/core/data/mock/local';
    return createLocalMockDataSources({
      loader: input.mockLoader,
      basePath
    });
  }

  if (!input.httpBaseUrl) {
    throw new Error('httpBaseUrl is required when mode=http');
  }

  return createHttpDataSources({ baseUrl: input.httpBaseUrl });
}

function resolveMode(appEnv: AppEnv, mode: DataSourceMode | undefined): Exclude<DataSourceMode, 'auto'> {
  if (!mode || mode === 'auto') {
    return appEnv === 'prd' ? 'http' : 'mock_local';
  }

  return mode;
}

