export async function first<T>(
  stmt: D1PreparedStatement,
): Promise<T | null> {
  const result = await stmt.first<T>();
  return result ?? null;
}

export async function all<T>(
  stmt: D1PreparedStatement,
): Promise<T[]> {
  const result = await stmt.all<T>();
  return result.results ?? [];
}

export function nowIso(): string {
  return new Date().toISOString();
}
