import type { Env } from '../types/env';
import { d1 } from '../lib/d1';

export interface ExternalReferenceCacheRow {
  cache_key: string;
  kind: string;
  source: string;
  value_json: string;
  fetched_at: string;
  expires_at: string;
  status: 'ok' | 'error';
  error_message: string | null;
}

export async function findFreshExternalReferenceCacheByKey(
  env: Env,
  cacheKey: string,
  nowIso: string
): Promise<ExternalReferenceCacheRow | null> {
  return await d1(env).first<ExternalReferenceCacheRow>(
    `SELECT
       cache_key,
       kind,
       source,
       value_json,
       fetched_at,
       expires_at,
       status,
       error_message
     FROM external_reference_cache
     WHERE cache_key = ?
       AND expires_at > ?
     LIMIT 1`,
    [cacheKey, nowIso]
  );
}

export async function upsertExternalReferenceCache(
  env: Env,
  input: {
    cacheKey: string;
    kind: string;
    source: string;
    valueJson: string;
    fetchedAt: string;
    expiresAt: string;
    status: 'ok' | 'error';
    errorMessage?: string | null;
  }
): Promise<void> {
  await d1(env).run(
    `INSERT INTO external_reference_cache (
       cache_key,
       kind,
       source,
       value_json,
       fetched_at,
       expires_at,
       status,
       error_message,
       updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(cache_key) DO UPDATE SET
       kind = excluded.kind,
       source = excluded.source,
       value_json = excluded.value_json,
       fetched_at = excluded.fetched_at,
       expires_at = excluded.expires_at,
       status = excluded.status,
       error_message = excluded.error_message,
       updated_at = CURRENT_TIMESTAMP`,
    [
      input.cacheKey,
      input.kind,
      input.source,
      input.valueJson,
      input.fetchedAt,
      input.expiresAt,
      input.status,
      input.errorMessage ?? null
    ]
  );
}

export async function getExternalReferencesCacheHealth(env: Env): Promise<{ lastOkAt: string | null; lastErrorAt: string | null }> {
  const okRow = await d1(env).first<{ lastOkAt: string | null }>(
    `SELECT MAX(fetched_at) AS lastOkAt
     FROM external_reference_cache
     WHERE status = 'ok'`
  );
  const errRow = await d1(env).first<{ lastErrorAt: string | null }>(
    `SELECT MAX(fetched_at) AS lastErrorAt
     FROM external_reference_cache
     WHERE status = 'error'`
  );
  return { lastOkAt: okRow?.lastOkAt ?? null, lastErrorAt: errRow?.lastErrorAt ?? null };
}

