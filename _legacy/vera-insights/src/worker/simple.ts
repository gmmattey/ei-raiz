import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { ExportedHandler } from 'cloudflare:workers';

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
}

const app = new Hono<{ Bindings: Env }>();

app.use(cors());

// Health check
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '3.0.0'
  });
});

// Simple test endpoint
app.post('/api/test', async (c) => {
  const body = await c.req.json() as any;

  return c.json({
    received: body,
    timestamp: new Date().toISOString(),
    worker: 'vera-simple'
  });
});

// Test database
app.get('/api/db-test', async (c) => {
  try {
    const result = await c.env.DB.prepare('SELECT 1 as test').first();
    return c.json({ success: true, db: result });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Test KV
app.post('/api/kv-test', async (c) => {
  try {
    const body = await c.req.json() as any;
    const key = body.key || 'test-key';
    const value = body.value || 'test-value';

    await c.env.CACHE.put(key, value);
    const stored = await c.env.CACHE.get(key);

    return c.json({ success: true, key, stored });
  } catch (e: any) {
    return c.json({ success: false, error: e.message }, 500);
  }
});

export default { fetch: app.fetch } satisfies ExportedHandler<Env>;
