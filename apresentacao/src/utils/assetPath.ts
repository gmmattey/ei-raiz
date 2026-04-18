export function assetPath(path: string): string {
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  const base = (import.meta as any).env?.BASE_URL || '/';
  return `${base}${normalized}`;
}