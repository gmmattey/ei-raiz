// Wrapper fino sobre D1 para uso pelos repositórios.

export type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  ADMIN_TOKEN?: string;
  ADMIN_EMAILS?: string;
  BRAPI_TOKEN?: string;
  BRAPI_BASE_URL?: string;
  CVM_BASE_URL?: string;
  FIPE_BASE_URL?: string;
  PASSWORD_RESET_WEBHOOK_URL?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  WEB_BASE_URL?: string;
  AI?: { run(model: string, entrada: unknown): Promise<unknown> };
};

export interface Bd {
  consultar<T = Record<string, unknown>>(sql: string, ...valores: unknown[]): Promise<T[]>;
  primeiro<T = Record<string, unknown>>(sql: string, ...valores: unknown[]): Promise<T | null>;
  executar(sql: string, ...valores: unknown[]): Promise<{ sucesso: boolean; linhasAfetadas: number }>;
  emLote(operacoes: { sql: string; valores: unknown[] }[]): Promise<void>;
}

export const criarBd = (env: Env): Bd => ({
  async consultar<T>(sql: string, ...valores: unknown[]) {
    const stmt = env.DB.prepare(sql).bind(...valores);
    const { results } = await stmt.all<T>();
    return (results ?? []) as T[];
  },
  async primeiro<T>(sql: string, ...valores: unknown[]) {
    const stmt = env.DB.prepare(sql).bind(...valores);
    return (await stmt.first<T>()) ?? null;
  },
  async executar(sql: string, ...valores: unknown[]) {
    const stmt = env.DB.prepare(sql).bind(...valores);
    const resp = await stmt.run();
    return {
      sucesso: resp.success,
      linhasAfetadas: resp.meta?.changes ?? 0,
    };
  },
  async emLote(operacoes) {
    if (operacoes.length === 0) return;
    const stmts = operacoes.map(({ sql, valores }) => env.DB.prepare(sql).bind(...valores));
    await env.DB.batch(stmts);
  },
});

export const agora = (): string => new Date().toISOString();

export const gerarId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};
