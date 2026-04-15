/**
 * Utilitário de cache para a sessão do usuário.
 * Utiliza sessionStorage para persistência durante a aba aberta.
 */

const PREFIX = 'ei_cache_';

// Expiração padrão: 15 minutos
const DEFAULT_EXPIRATION_MS = 15 * 60 * 1000;

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export const cache = {
  /**
   * Salva um item no cache de sessão.
   */
  set: <T>(key: string, data: T): void => {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(`${PREFIX}${key}`, JSON.stringify(entry));
    } catch (e) {
      console.warn(`[Cache] Falha ao salvar no cache: ${key}`, e);
    }
  },

  /**
   * Obtém um item do cache de sessão.
   * @returns O dado ou null se não existir ou estiver expirado.
   */
  get: <T>(key: string, maxAgeMs: number = DEFAULT_EXPIRATION_MS): T | null => {
    try {
      const raw = sessionStorage.getItem(`${PREFIX}${key}`);
      if (!raw) return null;

      const entry: CacheEntry<T> = JSON.parse(raw);
      const age = Date.now() - entry.timestamp;

      if (age > maxAgeMs) {
        sessionStorage.removeItem(`${PREFIX}${key}`);
        return null;
      }

      return entry.data;
    } catch (e) {
      console.warn(`[Cache] Falha ao ler do cache: ${key}`, e);
      return null;
    }
  },

  /**
   * Remove um item específico do cache.
   */
  remove: (key: string): void => {
    sessionStorage.removeItem(`${PREFIX}${key}`);
  },

  /**
   * Limpa todo o cache relacionado ao Esquilo Invest.
   */
  clearAll: (): void => {
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(PREFIX)) {
        sessionStorage.removeItem(key);
      }
    });
  }
};
