/**
 * Utilitário de cache persistente do usuário.
 * Utiliza localStorage para sobreviver ao fechamento da aba/navegador.
 * TTL padrão: 24 horas. Invalidado explicitamente após mutações de dados.
 */

const PREFIX = 'ei_cache_';

// Expiração padrão: 24 horas
const DEFAULT_EXPIRATION_MS = 24 * 60 * 60 * 1000;

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
      localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(entry));
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
      const raw = localStorage.getItem(`${PREFIX}${key}`);
      if (!raw) return null;

      const entry: CacheEntry<T> = JSON.parse(raw);
      const age = Date.now() - entry.timestamp;

      if (age > maxAgeMs) {
        localStorage.removeItem(`${PREFIX}${key}`);
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
    localStorage.removeItem(`${PREFIX}${key}`);
  },

  /**
   * Limpa todo o cache relacionado ao Esquilo Invest.
   */
  clearAll: (): void => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
};

/**
 * Invalida todo o cache de dados do usuário.
 * Deve ser chamado após qualquer mutação: importação, aporte, edição ou exclusão de ativo, atualização de perfil.
 */
export const invalidarCacheUsuario = (): void => cache.clearAll();
