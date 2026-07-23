export interface Env {
  DB: D1Database;
  IMPORTS_BUCKET: R2Bucket;
  APP_ENV: string;
  API_VERSION: string;
  AUTH_TOKEN?: string;
}

export function requireEnv(value: string | undefined, field: string): string {
  if (!value) {
    throw new Error(`Missing required env field: ${field}`);
  }
  return value;
}
