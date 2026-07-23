interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  updatedAt: Date;
}

export class CacheManager {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private db: any; // D1 database instance

  constructor(database?: any) {
    this.db = database;
  }

  async get<T>(type: string, key: string): Promise<T | null> {
    const cacheKey = `${type}:${key}`;

    // 1. Check memory cache first
    const cached = this.memoryCache.get(cacheKey);
    if (cached && !this.isExpired(cached)) {
      return cached.value as T;
    }

    // 2. Check D1 cache if database available
    if (this.db) {
      try {
        const result = await this.db.prepare(
          'SELECT value, expiresAt FROM vera_cache WHERE key = ? AND expiresAt > ?'
        )
          .bind(cacheKey, new Date().toISOString())
          .all();

        if (result.results && result.results.length > 0) {
          const entry = result.results[0];
          const value = JSON.parse(entry.value) as T;

          // Update memory cache
          this.memoryCache.set(cacheKey, {
            value,
            expiresAt: new Date(entry.expiresAt).getTime(),
            updatedAt: new Date(),
          });

          return value;
        }
      } catch (error) {
        console.warn(`Error reading from D1 cache for ${cacheKey}:`, error);
      }
    }

    return null;
  }

  async set<T>(type: string, key: string, value: T, ttlSeconds: number): Promise<void> {
    const cacheKey = `${type}:${key}`;
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    // 1. Update memory cache
    this.memoryCache.set(cacheKey, {
      value,
      expiresAt: expiresAt.getTime(),
      updatedAt: new Date(),
    });

    // 2. Update D1 cache if database available
    if (this.db) {
      try {
        await this.db.prepare(
          `INSERT OR REPLACE INTO vera_cache (key, type, value, expiresAt, updatedAt)
           VALUES (?, ?, ?, ?, ?)`
        )
          .bind(
            cacheKey,
            type,
            JSON.stringify(value),
            expiresAt.toISOString(),
            new Date().toISOString()
          )
          .run();
      } catch (error) {
        console.warn(`Error writing to D1 cache for ${cacheKey}:`, error);
      }
    }
  }

  async invalidate(type: string, pattern?: string): Promise<void> {
    // Delete from memory cache
    if (pattern) {
      for (const key of this.memoryCache.keys()) {
        if (key.startsWith(`${type}:`) && key.includes(pattern)) {
          this.memoryCache.delete(key);
        }
      }
    } else {
      // Delete all of this type
      for (const key of this.memoryCache.keys()) {
        if (key.startsWith(`${type}:`)) {
          this.memoryCache.delete(key);
        }
      }
    }

    // Delete from D1 cache
    if (this.db) {
      try {
        if (pattern) {
          await this.db.prepare(
            'DELETE FROM vera_cache WHERE type = ? AND key LIKE ?'
          )
            .bind(type, `${type}:${pattern}%`)
            .run();
        } else {
          await this.db.prepare('DELETE FROM vera_cache WHERE type = ?')
            .bind(type)
            .run();
        }
      } catch (error) {
        console.warn(`Error invalidating D1 cache for ${type}:`, error);
      }
    }
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expiresAt;
  }

  getMemoryCacheStats(): { size: number; expired: number } {
    let expired = 0;
    for (const entry of this.memoryCache.values()) {
      if (this.isExpired(entry)) {
        expired++;
      }
    }
    return { size: this.memoryCache.size, expired };
  }

  clearMemoryCache(): void {
    this.memoryCache.clear();
  }

  async cleanupExpiredEntries(): Promise<number> {
    // Clean memory cache
    let count = 0;
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
        count++;
      }
    }

    // Clean D1 cache
    if (this.db) {
      try {
        const result = await this.db.prepare(
          'DELETE FROM vera_cache WHERE expiresAt < ?'
        )
          .bind(new Date().toISOString())
          .run();
        count += result.meta?.changes || 0;
      } catch (error) {
        console.warn('Error cleaning up D1 cache:', error);
      }
    }

    return count;
  }
}
