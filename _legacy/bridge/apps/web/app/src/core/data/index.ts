import { createDataSources, type DataSourceMode } from "./data_source_factory";
import type { AppEnv } from "./types";
import { createViteJsonLoader } from "./vite_json_loader";

let singleton: ReturnType<typeof createDataSources> | null = null;

export function getDataSources() {
  if (singleton) return singleton;

  const appEnv = (String(import.meta.env.VITE_APP_ENV ?? "local") as AppEnv) ?? "local";
  const mode = (String(import.meta.env.VITE_DATA_SOURCE_MODE ?? "auto") as DataSourceMode) ?? "auto";
  const httpBaseUrl = String(import.meta.env.VITE_API_BASE_URL ?? "");
  const mockLoader = createViteJsonLoader();

  singleton = createDataSources({
    appEnv,
    mode,
    httpBaseUrl,
    mockLoader,
  });

  return singleton;
}

