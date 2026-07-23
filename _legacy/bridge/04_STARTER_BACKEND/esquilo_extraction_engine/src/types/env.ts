export interface Env {
  AUDIT_DB: D1Database;
  APP_ENV: string;
  API_VERSION: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
}
