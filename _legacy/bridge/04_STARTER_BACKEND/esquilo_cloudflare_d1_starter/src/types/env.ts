export interface Env {
  DB: D1Database;
  // Wrangler assets binding (SPA build output em /public).
  ASSETS?: Fetcher;
  APP_ENV: string;
  API_VERSION: string;
  // Origens permitidas para CORS (separadas por vírgula).
  // Em produção/hml, a SPA é servida pelo mesmo Worker (mesma origem), portanto
  // só é necessário configurar para dev local ou clientes externos.
  CORS_ALLOWED_ORIGINS?: string;
  APPS_SCRIPT_RECOVERY_URL?: string;
  APPS_SCRIPT_RECOVERY_SECRET?: string;
  OPENAI_API_KEY?: string;
  GEMINI_API_KEY?: string;

  // Complementary external references (must never be required for core flows).
  EXTERNAL_REFERENCES_ENABLED?: string;
  EXTERNAL_REFERENCES_BRAPI_BASE_URL?: string;
  EXTERNAL_REFERENCES_BRAPI_TOKEN?: string;
}
