import { Router } from './lib/router';
import { fail, ok, readJson } from './lib/http';
import { runExtraction } from './lib/extraction_service';
import type { Env } from './types/env';

const router = new Router();

router.register('GET', '/v1/health', (_request, env: Env) => ok(env.API_VERSION, { status: 'ok', service: 'extraction-engine' }));
router.register('POST', '/v1/extraction/parse', async (request, env: Env) => {
  const payload = await readJson<Record<string, unknown>>(request).catch(() => ({}));
  const result = await runExtraction(env, {
    fileName: String(payload.fileName || ''),
    mimeType: String(payload.mimeType || ''),
    extractedText: typeof payload.extractedText === 'string' ? payload.extractedText : undefined,
    fileBase64: typeof payload.fileBase64 === 'string' ? payload.fileBase64 : undefined,
    documentId: typeof payload.documentId === 'string' ? payload.documentId : undefined
  });
  return ok(env.API_VERSION, result);
});

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const matched = await router.handle(request, env);
      if (matched) return matched;
      return fail(env.API_VERSION, 'route_not_found', 'Rota não encontrada.', 404);
    } catch (error) {
      return fail(env.API_VERSION, 'internal_error', 'Erro interno do motor de extração.', 500, { reason: String(error) });
    }
  }
};
