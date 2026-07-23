import { Hono } from 'hono';
import type { ExportedHandler } from 'cloudflare:workers';

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
}

const app = new Hono<{ Bindings: Env }>();

// Simple debug endpoint
app.get('/debug', (c) => {
  return c.json({
    status: 'debug',
    env: {
      db: c.env.DB ? 'present' : 'missing',
      cache: c.env.CACHE ? 'present' : 'missing'
    }
  });
});

// Test D1 query
app.get('/debug/db', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT 1 as test').first();
    return c.json({ db_ok: true, result });
  } catch (e: any) {
    return c.json({ db_ok: false, error: e.message }, 500);
  }
});

// Test KV
app.get('/debug/kv', async (c) => {
  try {
    await c.env.CACHE.put('test', 'value');
    const value = await c.env.CACHE.get('test');
    return c.json({ kv_ok: true, value });
  } catch (e: any) {
    return c.json({ kv_ok: false, error: e.message }, 500);
  }
});

export default { fetch: app.fetch } satisfies ExportedHandler<Env>;
