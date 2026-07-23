/*
  Esquilo Invest - API layer

  Objetivo:
  - desacoplar o front de google.script.run
  - suportar Cloudflare Pages consumindo o Web App do Apps Script por HTTP
  - manter compatibilidade com o runtime legado quando necessario
  - evitar endpoints inventados

  Contrato HTTP confirmado nesta fase:
  - format=json
  - resource=dashboard|ai-analysis|health
  - token opcional

  Observacao:
  - getDashboardActionsSnapshot() continua existindo na interface publica do client,
    mas no modo HTTP externo ele deriva esse snapshot a partir de `dashboard`,
    porque esse recurso especifico nao esta travado no contrato publicado.
*/

const DEFAULT_TIMEOUT_MS = 20000;
const DEFAULT_RESOURCE_PARAM = 'resource';
const DEFAULT_FORMAT_PARAM = 'format';
const DEFAULT_FORMAT_VALUE = 'json';

const HTTP_RESOURCES = {
  dashboard: 'dashboard',
  aiAnalysis: 'ai-analysis',
  health: 'health'
};

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isNonEmptyString(value) {
  return normalizeString(value).length > 0;
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function safeNowIso() {
  return new Date().toISOString();
}

function getMetaContent(name) {
  if (typeof document === 'undefined') return '';
  const node = document.querySelector(`meta[name="${name}"]`);
  return normalizeString(node?.content || '');
}

function getWindowConfig() {
  if (typeof window === 'undefined') return {};
  return isPlainObject(window.__ESQUILO_CONFIG__) ? window.__ESQUILO_CONFIG__ : {};
}

function resolveRuntimeConfig() {
  const windowConfig = getWindowConfig();

  return {
    baseUrl:
      normalizeString(windowConfig.baseUrl) ||
      normalizeString(windowConfig.apiBaseUrl) ||
      getMetaContent('esquilo-api-base-url'),
    token:
      normalizeString(windowConfig.apiToken) ||
      normalizeString(windowConfig.token) ||
      getMetaContent('esquilo-api-token'),
    useLegacyAppsScript:
      Boolean(windowConfig.useLegacyAppsScript) ||
      getMetaContent('esquilo-use-legacy-appsscript') === 'true',
    actionsSnapshotResource:
      normalizeString(windowConfig.actionsSnapshotResource) ||
      getMetaContent('esquilo-actions-snapshot-resource'),
    timeoutMs:
      Number(windowConfig.timeoutMs) ||
      Number(getMetaContent('esquilo-api-timeout-ms')) ||
      DEFAULT_TIMEOUT_MS
  };
}

function buildUrl(baseUrl, queryParams) {
  const normalizedBaseUrl = normalizeString(baseUrl);
  if (!normalizedBaseUrl) {
    throw new Error('APP_SCRIPT_BASE_URL nao configurada.');
  }

  const url = new URL(normalizedBaseUrl);
  Object.entries(queryParams || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

function isHtmlPayload(text, contentType) {
  const normalizedType = normalizeString(contentType).toLowerCase();
  const normalizedText = normalizeString(text).toLowerCase();

  if (normalizedType.includes('text/html')) return true;
  if (normalizedText.startsWith('<!doctype html')) return true;
  if (normalizedText.startsWith('<html')) return true;
  return false;
}

async function parseJsonResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const rawText = await response.text();

  if (isHtmlPayload(rawText, contentType)) {
    throw new Error(
      'O Web App respondeu HTML em vez de JSON. Verifique publicacao, acesso externo e URL /exec.'
    );
  }

  if (!normalizeString(rawText)) {
    throw new Error('Resposta vazia do backend.');
  }

  try {
    return JSON.parse(rawText);
  } catch (error) {
    throw new Error('Resposta JSON invalida do backend.');
  }
}

function unwrapEnvelope(payload, expectedResource) {
  if (!isPlainObject(payload)) {
    throw new Error('Envelope de resposta invalido.');
  }

  if (payload.ok !== true) {
    const backendMessage = normalizeString(payload.message) || normalizeString(payload.error);
    throw new Error(backendMessage || 'Backend retornou falha na chamada.');
  }

  if (isNonEmptyString(expectedResource) && payload.resource !== expectedResource) {
    throw new Error(
      `Recurso inesperado: esperado "${expectedResource}", recebido "${payload.resource || 'indefinido'}".`
    );
  }

  return {
    ok: true,
    resource: payload.resource || expectedResource || '',
    data: payload.data,
    updatedAt: normalizeString(payload.updatedAt) || safeNowIso(),
    raw: payload
  };
}

function createTimeoutController(timeoutMs) {
  const timeout = Number(timeoutMs) > 0 ? Number(timeoutMs) : DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timerId = window.setTimeout(() => controller.abort(), timeout);

  return {
    signal: controller.signal,
    cancel: () => window.clearTimeout(timerId)
  };
}

function createAppsScriptRunner() {
  const googleObject = typeof window !== 'undefined' ? window.google : undefined;
  if (!googleObject?.script?.run) return null;
  return googleObject.script.run;
}

function runAppsScriptMethod(methodName) {
  const runner = createAppsScriptRunner();
  if (!runner || typeof runner[methodName] !== 'function') {
    return Promise.reject(new Error(`Metodo Apps Script indisponivel: ${methodName}.`));
  }

  return new Promise((resolve, reject) => {
    runner
      .withSuccessHandler((result) => resolve(result))
      .withFailureHandler((error) => {
        const message = error?.message || String(error || 'Falha Apps Script.');
        reject(new Error(message));
      })[methodName]();
  });
}

function deriveActionsSnapshotFromDashboard(dashboardPayload) {
  const source = isPlainObject(dashboardPayload) ? dashboardPayload : {};

  return {
    actions: Array.isArray(source.actions) ? source.actions : [],
    orders: isPlainObject(source.orders) ? source.orders : {},
    assetRanking: isPlainObject(source.assetRanking) ? source.assetRanking : {},
    categories: isPlainObject(source.categories)
      ? { actions: source.categories.actions || {} }
      : {},
    summary: isPlainObject(source.summary)
      ? {
          acoes: source.summary.acoes,
          acoesRaw: source.summary.acoesRaw,
          totalRaw: source.summary.totalRaw
        }
      : {},
    dataSource: normalizeString(source.dataSource),
    sourceWarning: normalizeString(source.sourceWarning),
    updatedAt: normalizeString(source.updatedAt) || safeNowIso()
  };
}

async function fetchResource({
  baseUrl,
  token,
  resource,
  timeoutMs,
  extraQuery = {},
  fetchImpl = window.fetch.bind(window)
}) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch indisponivel neste ambiente.');
  }

  const url = buildUrl(baseUrl, {
    [DEFAULT_FORMAT_PARAM]: DEFAULT_FORMAT_VALUE,
    [DEFAULT_RESOURCE_PARAM]: resource,
    token: normalizeString(token) || undefined,
    ...extraQuery
  });

  const controller = createTimeoutController(timeoutMs);

  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      signal: controller.signal,
      credentials: 'omit'
    });

    if (!response.ok) {
      throw new Error(`Falha HTTP ${response.status} ao consultar ${resource}.`);
    }

    const parsed = await parseJsonResponse(response);
    return unwrapEnvelope(parsed, resource);
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`Timeout ao consultar ${resource}.`);
    }
    throw error;
  } finally {
    controller.cancel();
  }
}

function shouldUseLegacyAppsScript(options) {
  if (options.forceHttp === true) return false;
  if (options.useLegacyAppsScript === true) return true;
  if (options.useLegacyAppsScript === false) return false;

  const hasBaseUrl = isNonEmptyString(options.baseUrl);
  const hasAppsScriptRunner = !!createAppsScriptRunner();

  if (!hasBaseUrl && hasAppsScriptRunner) return true;
  return false;
}

function createEsquiloApi(userOptions = {}) {
  const runtimeConfig = resolveRuntimeConfig();
  const options = {
    ...runtimeConfig,
    ...userOptions
  };

  const baseUrl = normalizeString(options.baseUrl);
  const token = normalizeString(options.token);
  const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : DEFAULT_TIMEOUT_MS;
  const useLegacyAppsScript = shouldUseLegacyAppsScript(options);
  const actionsSnapshotResource = normalizeString(options.actionsSnapshotResource);
  const fetchImpl = typeof options.fetchImpl === 'function'
    ? options.fetchImpl
    : (typeof window !== 'undefined' && typeof window.fetch === 'function' ? window.fetch.bind(window) : null);

  async function getDashboardData() {
    if (useLegacyAppsScript) {
      return runAppsScriptMethod('getDashboardData');
    }

    const envelope = await fetchResource({
      baseUrl,
      token,
      resource: HTTP_RESOURCES.dashboard,
      timeoutMs,
      fetchImpl
    });

    return envelope.data;
  }

  async function getPortfolioAIAnalysis() {
    if (useLegacyAppsScript) {
      return runAppsScriptMethod('getPortfolioAIAnalysis');
    }

    const envelope = await fetchResource({
      baseUrl,
      token,
      resource: HTTP_RESOURCES.aiAnalysis,
      timeoutMs,
      fetchImpl
    });

    return envelope.data?.analysis || '';
  }

  async function getHealth() {
    if (useLegacyAppsScript) {
      return {
        releaseName: 'Apps Script Runtime',
        versionNumber: 'legacy',
        updatedAt: safeNowIso()
      };
    }

    const envelope = await fetchResource({
      baseUrl,
      token,
      resource: HTTP_RESOURCES.health,
      timeoutMs,
      fetchImpl
    });

    return envelope.data || {};
  }

  async function getDashboardActionsSnapshot() {
    if (useLegacyAppsScript) {
      const runner = createAppsScriptRunner();
      if (runner && typeof runner.getDashboardActionsSnapshot === 'function') {
        return runAppsScriptMethod('getDashboardActionsSnapshot');
      }

      const dashboardPayload = await runAppsScriptMethod('getDashboardData');
      return deriveActionsSnapshotFromDashboard(dashboardPayload);
    }

    if (isNonEmptyString(actionsSnapshotResource)) {
      const envelope = await fetchResource({
        baseUrl,
        token,
        resource: actionsSnapshotResource,
        timeoutMs,
        fetchImpl
      });
      return envelope.data;
    }

    const dashboardPayload = await getDashboardData();
    return deriveActionsSnapshotFromDashboard(dashboardPayload);
  }

  async function requestHttpResource(resource, extraQuery = {}) {
    if (useLegacyAppsScript) {
      throw new Error('requestHttpResource nao esta disponivel em modo Apps Script legado.');
    }

    const envelope = await fetchResource({
      baseUrl,
      token,
      resource,
      timeoutMs,
      extraQuery,
      fetchImpl
    });

    return envelope.data;
  }

  function getRuntime() {
    return {
      transport: useLegacyAppsScript ? 'appsscript' : 'http',
      baseUrl,
      hasToken: isNonEmptyString(token),
      timeoutMs,
      actionsSnapshotMode: isNonEmptyString(actionsSnapshotResource) ? 'resource' : 'dashboard-derived'
    };
  }

  return {
    getRuntime,
    getDashboardData,
    getPortfolioAIAnalysis,
    getDashboardActionsSnapshot,
    getHealth,
    requestHttpResource
  };
}

const esquiloApi = createEsquiloApi();

export {
  HTTP_RESOURCES,
  buildUrl,
  createEsquiloApi,
  deriveActionsSnapshotFromDashboard,
  esquiloApi
};
