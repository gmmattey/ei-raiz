import type { Env } from '../types/env';

export class D1Error extends Error {
  readonly kind: 'd1_error';
  readonly causeDetails: Record<string, unknown> | undefined;

  constructor(message: string, causeDetails?: Record<string, unknown>) {
    super(message);
    this.kind = 'd1_error';
    this.causeDetails = causeDetails;
  }
}

function toErrorDetails(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { value: String(error) };
}

type D1Prepared = ReturnType<D1Database['prepare']>;

export function d1(env: Env) {
  const db = env.DB;

  return {
    async first<T>(sql: string, params: unknown[] = []): Promise<T | null> {
      try {
        // D1 supports variadic bind args; spread is safe for simple arrays.
        return await (db.prepare(sql) as unknown as D1Prepared).bind(...params).first<T>();
      } catch (error) {
        throw new D1Error('Falha ao executar query (first).', { sql, params, ...toErrorDetails(error) });
      }
    },

    async all<T>(sql: string, params: unknown[] = []): Promise<T[]> {
      try {
        const result = await (db.prepare(sql) as unknown as D1Prepared).bind(...params).all<T>();
        return result.results || [];
      } catch (error) {
        throw new D1Error('Falha ao executar query (all).', { sql, params, ...toErrorDetails(error) });
      }
    },

    async run(sql: string, params: unknown[] = []): Promise<void> {
      try {
        await (db.prepare(sql) as unknown as D1Prepared).bind(...params).run();
      } catch (error) {
        throw new D1Error('Falha ao executar query (run).', { sql, params, ...toErrorDetails(error) });
      }
    },

    async batch(statements: Array<{ sql: string; params?: unknown[] }>): Promise<void> {
      try {
        const prepared = statements.map((stmt) => db.prepare(stmt.sql).bind(...(stmt.params || [])));
        await db.batch(prepared);
      } catch (error) {
        throw new D1Error('Falha ao executar batch.', { statementsCount: statements.length, ...toErrorDetails(error) });
      }
    }
  };
}
