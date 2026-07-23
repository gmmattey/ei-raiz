import { Router } from './lib/router';
import { fail } from './lib/http';
import { getHealth } from './routes/health';
import { getDashboardHome } from './routes/dashboard';
import { getPortfolio, getHoldingDetail } from './routes/portfolio';
import { getProfileContext, putProfileContext } from './routes/profile';
import { getAnalysis } from './routes/analysis';
import { getSnapshots, getTimeline, getImportsCenter } from './routes/history';
import { postImportStart, getImportPreview, patchImportRow, postImportRowDuplicateResolution, postImportCommit, getCustomTemplateDownload, getCsvV1TemplateDownload } from './routes/imports';
import { getPortfolioEntryOnboardingRoute } from './routes/onboarding';
import { getImportConflicts } from './routes/import_conflicts';
import { getImportDetail } from './routes/import_detail';
import { getImportEngineStatus } from './routes/import_engine_status';
import { postAuthRegister, postAuthLogin, getAuthSession, postAuthLogout, postAuthRecover } from './routes/auth';
import { getOperationalEvents } from './routes/ops';
import { logHttpRequest, logHttpUnhandledError } from './lib/logger';
import type { Env } from './types/env';

const router = new Router();

function resolveCorsOrigin(request: Request, env: Env): string | null {
  const origin = request.headers.get('Origin');
  if (!origin || !env.CORS_ALLOWED_ORIGINS) return null;
  const allowed = env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
  return allowed.includes(origin) ? origin : null;
}

function withCors(response: Response, allowedOrigin: string | null): Response {
  if (!allowedOrigin) return response;
  const next = new Response(response.body, response);
  next.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  next.headers.set('Access-Control-Allow-Credentials', 'true');
  next.headers.set('Vary', 'Origin');
  return next;
}

router.register('GET', '/v1/health', getHealth);
router.register('POST', '/v1/auth/register', postAuthRegister);
router.register('POST', '/v1/auth/login', postAuthLogin);
router.register('GET', '/v1/auth/session', getAuthSession);
router.register('POST', '/v1/auth/logout', postAuthLogout);
router.register('POST', '/v1/auth/recover', postAuthRecover);
router.register('GET', '/v1/dashboard/home', getDashboardHome);
router.register('GET', '/v1/portfolio', getPortfolio);
router.register('GET', '/v1/portfolio/:portfolioId/holdings/:holdingId', getHoldingDetail);
router.register('GET', '/v1/profile/context', getProfileContext);
router.register('PUT', '/v1/profile/context', putProfileContext);
router.register('GET', '/v1/onboarding/portfolio-entry', getPortfolioEntryOnboardingRoute);
router.register('GET', '/v1/analysis', getAnalysis);
router.register('GET', '/v1/history/snapshots', getSnapshots);
router.register('GET', '/v1/history/timeline', getTimeline);
router.register('GET', '/v1/history/imports', getImportsCenter);
router.register('POST', '/v1/imports/start', postImportStart);
router.register('GET', '/v1/imports/templates/custom', getCustomTemplateDownload);
// Alias oficial da Release 0.1 (CSV v1).
router.register('GET', '/v1/imports/templates/csv-v1', getCsvV1TemplateDownload);
router.register('GET', '/v1/imports/:importId/preview', getImportPreview);
router.register('GET', '/v1/imports/:importId/engine-status', getImportEngineStatus);
router.register('GET', '/v1/imports/:importId/conflicts', getImportConflicts);
router.register('GET', '/v1/imports/:importId/detail', getImportDetail);
router.register('PATCH', '/v1/imports/:importId/rows/:rowId', patchImportRow);
router.register('POST', '/v1/imports/:importId/rows/:rowId/duplicate-resolution', postImportRowDuplicateResolution);
router.register('POST', '/v1/imports/:importId/commit', postImportCommit);
router.register('GET', '/v1/ops/events', getOperationalEvents);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const startedAt = Date.now();
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();
    const cfRay = request.headers.get('cf-ray');
    const ip = request.headers.get('CF-Connecting-IP');

    // Preflight CORS — deve responder antes de qualquer outra lógica.
    if (method === 'OPTIONS') {
      const allowedOrigin = resolveCorsOrigin(request, env);
      const corsHeaders: Record<string, string> = allowedOrigin
        ? {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
            'Access-Control-Max-Age': '86400',
            'Vary': 'Origin',
          }
        : {};
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const corsOrigin = resolveCorsOrigin(request, env);

    try {
      const matched = await router.handle(request, env);
      // API -> sempre responde com envelope (nao confundir com SPA).
      if (matched) {
        const response = withCors(matched, corsOrigin);
        const requestId = response.headers.get('x-request-id');
        const errorCode = response.headers.get('x-error-code');
        logHttpRequest(env, {
          requestId,
          method,
          path,
          status: response.status,
          durationMs: Date.now() - startedAt,
          errorCode,
          cfRay,
          ip
        });
        return response;
      }

      // SPA/Assets: qualquer rota nao /v1/* cai aqui.
      if (method === 'GET' && !path.startsWith('/v1/')) {
        const assets = env.ASSETS;
        if (!assets) {
          const response = new Response('Static assets binding (ASSETS) não configurado.', { status: 500 });
          logHttpRequest(env, {
            requestId: null,
            method,
            path,
            status: response.status,
            durationMs: Date.now() - startedAt,
            errorCode: 'assets_binding_missing',
            cfRay,
            ip
          });
          return response;
        }

        // Rotas da SPA (React Router) nao devem depender do comportamento do assets.fetch
        // para caminhos sem extensao (ex: /login, /register, /app/home).
        // Alguns runtimes retornam redirect 307 para "/" nesses casos, quebrando a navegacao.
        const accept = request.headers.get('accept') || '';
        const looksLikeFile = path.includes('.') || path.startsWith('/assets/');
        // Importante: no binding `assets` do Workers, `GET /index.html` pode responder
        // com redirect 307 para `/`. Para evitar isso (e suportar deep-linking),
        // servimos a SPA sempre a partir de `/`.
        if (!looksLikeFile && accept.includes('text/html')) {
          const indexUrl = new URL(request.url);
          indexUrl.pathname = '/';
          const indexRes = await assets.fetch(new Request(indexUrl.toString(), request));
          logHttpRequest(env, {
            requestId: null,
            method,
            path,
            status: indexRes.status,
            durationMs: Date.now() - startedAt,
            errorCode: null,
            cfRay,
            ip
          });
          return indexRes;
        }

        const assetRes = await assets.fetch(request);
        if (assetRes.status !== 404) {
          // Ajuda performance percebida: cache agressivo em assets com hash.
          // index.html fica sem cache para permitir atualizacoes rapidas.
          if (assetRes.ok) {
            const isHashedAsset = path.startsWith('/assets/') && /\.[a-zA-Z0-9_-]{8,}\.(js|css|map)$/.test(path);
            if (isHashedAsset) {
              const next = new Response(assetRes.body, assetRes);
              next.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
              logHttpRequest(env, {
                requestId: null,
                method,
                path,
                status: next.status,
                durationMs: Date.now() - startedAt,
                errorCode: null,
                cfRay,
                ip
              });
              return next;
            }
          }
          logHttpRequest(env, {
            requestId: null,
            method,
            path,
            status: assetRes.status,
            durationMs: Date.now() - startedAt,
            errorCode: null,
            cfRay,
            ip
          });
          return assetRes;
        }

        // Fallback SPA: rotas do React Router devem servir index.html.
        if (accept.includes('text/html')) {
          const indexUrl = new URL(request.url);
          indexUrl.pathname = '/';
          const indexRes = await assets.fetch(new Request(indexUrl.toString(), request));
          logHttpRequest(env, {
            requestId: null,
            method,
            path,
            status: indexRes.status,
            durationMs: Date.now() - startedAt,
            errorCode: null,
            cfRay,
            ip
          });
          return indexRes;
        }

        logHttpRequest(env, {
          requestId: null,
          method,
          path,
          status: 404,
          durationMs: Date.now() - startedAt,
          errorCode: 'asset_not_found',
          cfRay,
          ip
        });
        return assetRes;
      }

      const response = withCors(fail(env.API_VERSION, 'route_not_found', 'Rota não encontrada.', 404), corsOrigin);
      const requestId = response.headers.get('x-request-id');
      const errorCode = response.headers.get('x-error-code');
      logHttpRequest(env, {
        requestId,
        method,
        path,
        status: response.status,
        durationMs: Date.now() - startedAt,
        errorCode,
        cfRay,
        ip
      });
      return response;
    } catch (error) {
      logHttpUnhandledError(env, {
        requestId: null,
        method,
        path,
        cfRay,
        ip,
        error
      });
      const response = withCors(
        fail(env.API_VERSION, 'internal_error', 'Erro interno da API.', 500, { reason: String(error) }),
        corsOrigin
      );
      logHttpRequest(env, {
        requestId: response.headers.get('x-request-id'),
        method,
        path,
        status: response.status,
        durationMs: Date.now() - startedAt,
        errorCode: response.headers.get('x-error-code'),
        cfRay,
        ip
      });
      return response;
    }
  }
};
