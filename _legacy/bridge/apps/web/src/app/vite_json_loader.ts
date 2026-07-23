import type { JsonLoader } from '../core/data/types';

type JsonModule = unknown;

const JSON_MODULES: Record<string, () => Promise<JsonModule>> = import.meta.glob('/src/core/data/mock/**/*.json', {
  import: 'default'
});

function toViteKey(inputPath: string): string {
  const p = inputPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const withoutAppsWeb = p.startsWith('apps/web/') ? p.slice('apps/web/'.length) : p;
  return `/${withoutAppsWeb}`;
}

export function createViteJsonLoader(): JsonLoader {
  return {
    async load<T>(path: string): Promise<T> {
      const key = toViteKey(path);
      const importer = JSON_MODULES[key];
      if (!importer) {
        const known = Object.keys(JSON_MODULES).slice(0, 8).join(', ');
        throw new Error(`mock json not found for path=${path} (viteKey=${key}). Known examples: ${known}`);
      }
      return (await importer()) as T;
    }
  };
}

