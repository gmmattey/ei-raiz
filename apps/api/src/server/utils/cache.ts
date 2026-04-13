type CacheSource = "brapi" | "cvm" | "fipe" | "internal";

type CacheEntry<T> = {
  payload: T;
  expiraEm: string;
};

const readMemory = new Map<string, CacheEntry<unknown>>();

const nowIso = (): string => new Date().toISOString();

const plusMsIso = (ms: number): string => new Date(Date.now() + ms).toISOString();

const buildKey = (source: CacheSource, key: string): string => `${source}:${key}`;

export const readCache = async <T>(db: D1Database | null, source: CacheSource, key: string): Promise<T | null> => {
  const composite = buildKey(source, key);
  const fromMem = readMemory.get(composite);
  if (fromMem && fromMem.expiraEm > nowIso()) return fromMem.payload as T;

  if (!db) return null;
  const row = await db
    .prepare("SELECT payload_json, expira_em FROM cotacoes_ativos_cache WHERE fonte = ? AND chave_ativo = ? LIMIT 1")
    .bind(source, key)
    .first<{ payload_json: string | null; expira_em: string }>();

  if (!row || !row.payload_json || row.expira_em <= nowIso()) return null;
  const payload = JSON.parse(row.payload_json) as T;
  readMemory.set(composite, { payload, expiraEm: row.expira_em });
  return payload;
};

export const writeCache = async <T>(db: D1Database | null, source: CacheSource, key: string, payload: T, ttlMs: number): Promise<void> => {
  const expiraEm = plusMsIso(ttlMs);
  const composite = buildKey(source, key);
  readMemory.set(composite, { payload, expiraEm });

  if (!db) return;
  const now = nowIso();
  await db
    .prepare(
      [
        "INSERT INTO cotacoes_ativos_cache (id, fonte, chave_ativo, payload_json, atualizado_em, expira_em)",
        "VALUES (?, ?, ?, ?, ?, ?)",
        "ON CONFLICT(fonte, chave_ativo) DO UPDATE SET",
        "payload_json = excluded.payload_json, atualizado_em = excluded.atualizado_em, expira_em = excluded.expira_em, erro = NULL",
      ].join(" "),
    )
    .bind(crypto.randomUUID(), source, key, JSON.stringify(payload), now, expiraEm)
    .run();
};
