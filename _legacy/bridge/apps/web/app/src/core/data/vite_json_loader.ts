import type { JsonLoader } from "./types";

type JsonModule = unknown;

const JSON_MODULES: Record<string, () => Promise<JsonModule>> = import.meta.glob(
  "/src/core/data/mock/**/*.json",
  { import: "default" },
);

export function createViteJsonLoader(): JsonLoader {
  return {
    async load<T>(path: string): Promise<T> {
      const key = normalizeViteKey(path);
      const importer = JSON_MODULES[key];
      if (!importer) {
        const known = Object.keys(JSON_MODULES).slice(0, 8).join(", ");
        throw new Error(
          `mock json not found for path=${path} (viteKey=${key}). Known examples: ${known}`,
        );
      }
      return (await importer()) as T;
    },
  };
}

function normalizeViteKey(inputPath: string): string {
  // Aceita '/src/...' ou 'src/...'
  const p = inputPath.replace(/\\/g, "/");
  return p.startsWith("/") ? p : `/${p}`;
}

