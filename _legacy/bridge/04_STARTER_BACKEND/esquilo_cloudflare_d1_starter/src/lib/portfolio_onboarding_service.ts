import type { Env } from '../types/env';
import { ok, fail } from './http';
import { hashToken } from './auth_crypto';
import { findSessionStateByTokenHash } from '../repositories/auth_session_repository';

const AUTH_COOKIE_NAME = 'esquilo_session';

export async function getPortfolioEntryOnboarding(request: Request, env: Env): Promise<Response> {
  const session = await requireActiveSession(request, env);
  if (session instanceof Response) return session;

  if (!session.hasContext) {
    return ok(env.API_VERSION, {
      screenState: 'profile_context_required',
      redirectTo: '/profile/context',
      title: 'Antes de montar a carteira, precisamos do seu contexto',
      body: 'Complete seu objetivo financeiro e perfil de risco para liberar a entrada guiada da carteira.',
      primaryAction: {
        code: 'complete_profile_context',
        title: 'Completar contexto financeiro',
        target: '/profile/context'
      },
      methods: []
    });
  }

  const metrics = await loadPortfolioEntryMetrics(env, session.userId, session.portfolioId);
  const recommendation = buildRecommendation(metrics);
  const methods = buildEntryMethods(recommendation.methodCode, metrics);

  if (metrics.pendingImports > 0) {
    return ok(env.API_VERSION, {
      screenState: 'resume_pending_import',
      portfolioId: session.portfolioId,
      title: 'Você já tem uma importação em andamento',
      body: 'Retome o que já começou antes de abrir uma nova entrada. Isso evita retrabalho e duplicidade desnecessária.',
      primaryAction: {
        code: 'resume_pending_import',
        title: 'Retomar importação pendente',
        target: '/imports'
      },
      recommendation,
      methods,
      metrics
    });
  }

  if (metrics.activePositions > 0) {
    return ok(env.API_VERSION, {
      screenState: 'portfolio_already_started',
      portfolioId: session.portfolioId,
      title: 'Sua carteira já foi iniciada',
      body: 'Você pode complementar a carteira com uma nova importação ou revisar o que já entrou.',
      primaryAction: {
        code: 'review_portfolio',
        title: 'Revisar carteira atual',
        target: '/portfolio'
      },
      secondaryAction: {
        code: 'open_import_entry',
        title: 'Importar novos ativos',
        target: '/imports/entry'
      },
      recommendation,
      methods,
      metrics
    });
  }

  return ok(env.API_VERSION, {
    screenState: 'entry_ready',
    portfolioId: session.portfolioId,
    title: 'Escolha como quer começar sua carteira',
    body: 'Você pode digitar manualmente, usar um template próprio, importar um CSV da B3 ou subir um documento para pré-preenchimento assistido.',
    primaryAction: {
      code: recommendation.methodCode,
      title: recommendation.title,
      target: recommendation.target
    },
    recommendation,
    methods,
    metrics
  });
}

async function requireActiveSession(request: Request, env: Env): Promise<{ userId: string; portfolioId: string; hasContext: boolean } | Response> {
  const token = readCookie(request.headers.get('cookie') || '', AUTH_COOKIE_NAME);
  if (!token) return fail(env.API_VERSION, 'unauthorized', 'Sessao nao encontrada.', 401);
  const tokenHash = await hashToken(token);
  const session = await findSessionStateByTokenHash(env, tokenHash);
  if (!session || session.revoked_at || Date.parse(session.expires_at) <= Date.now()) {
    return fail(env.API_VERSION, 'unauthorized', 'Sessao invalida.', 401);
  }
  return { userId: session.user_id, portfolioId: session.portfolio_id || '', hasContext: session.has_context === 1 };
}

async function loadPortfolioEntryMetrics(env: Env, userId: string, portfolioId: string) {
  const positions = await env.DB.prepare(`SELECT COUNT(*) AS total FROM portfolio_positions WHERE portfolio_id = ? AND status = 'active'`).bind(portfolioId).first<{ total: number }>();
  const pendingImports = await env.DB.prepare(`SELECT COUNT(*) AS total FROM imports WHERE user_id = ? AND status IN ('PROCESSING', 'PREVIEW_READY')`).bind(userId).first<{ total: number }>();
  const completedImports = await env.DB.prepare(`SELECT COUNT(*) AS total FROM imports WHERE user_id = ? AND status = 'COMMITTED'`).bind(userId).first<{ total: number }>();
  const platforms = await env.DB.prepare(`SELECT platforms_used_json FROM user_financial_context WHERE user_id = ? LIMIT 1`).bind(userId).first<{ platforms_used_json: string | null }>();
  const parsedPlatforms = parseJson(platforms?.platforms_used_json, { platformIds: [], otherPlatforms: [] });
  const platformCount = Array.isArray(parsedPlatforms.platformIds) ? parsedPlatforms.platformIds.length : 0;
  const otherPlatformCount = Array.isArray(parsedPlatforms.otherPlatforms) ? parsedPlatforms.otherPlatforms.length : 0;
  return {
    activePositions: Number(positions?.total || 0),
    pendingImports: Number(pendingImports?.total || 0),
    completedImports: Number(completedImports?.total || 0),
    declaredPlatforms: platformCount + otherPlatformCount,
    hasKnownBrokerContext: platformCount > 0
  };
}

function buildRecommendation(metrics: { activePositions: number; pendingImports: number; completedImports: number; declaredPlatforms: number; hasKnownBrokerContext: boolean }) {
  if (metrics.pendingImports > 0) {
    return {
      methodCode: 'resume_import',
      title: 'Retomar importação pendente',
      reason: 'Você já começou uma entrada e o melhor próximo passo é concluir o que ficou pendente.',
      target: '/imports'
    };
  }
  if (metrics.hasKnownBrokerContext) {
    return {
      methodCode: 'b3_csv',
      title: 'Importar por CSV da B3',
      reason: 'Como você já indicou uso de plataforma, o CSV da B3 tende a ser a entrada mais rápida e mais aderente ao mercado.',
      target: '/imports/entry/b3-csv'
    };
  }
  if (metrics.declaredPlatforms > 0) {
    return {
      methodCode: 'document_ai',
      title: 'Importar por documento',
      reason: 'Você indicou uso de plataforma, mas sem uma origem padrão clara. Documento assistido tende a reduzir atrito inicial.',
      target: '/imports/entry/document'
    };
  }
  return {
    methodCode: 'manual_entry',
    title: 'Começar pela importação manual',
    reason: 'Para uma carteira inicial pequena ou ainda não organizada, a entrada manual é o caminho mais simples e controlado.',
    target: '/imports/entry/manual'
  };
}

function buildEntryMethods(recommendedCode: string, metrics: { activePositions: number; pendingImports: number; completedImports: number; declaredPlatforms: number; hasKnownBrokerContext: boolean }) {
  const methods = [
    {
      code: 'manual_entry',
      title: 'Preencher manualmente',
      body: 'Melhor para quem tem poucos ativos ou quer total controle da entrada.',
      target: '/imports/entry/manual'
    },
    {
      code: 'custom_template',
      title: 'Usar template próprio',
      body: 'Melhor para quem já organizou a carteira em um layout padronizado do produto.',
      target: '/imports/entry/custom-template'
    },
    {
      code: 'b3_csv',
      title: 'Importar CSV da B3',
      body: 'Melhor para quem já possui posição consolidada em arquivo conhecido de mercado.',
      target: '/imports/entry/b3-csv'
    },
    {
      code: 'document_ai',
      title: 'Subir documento',
      body: 'Melhor para PDF, imagem ou DOCX quando a carteira ainda não está em formato estruturado.',
      target: '/imports/entry/document'
    }
  ];

  return methods.map((method) => ({
    ...method,
    recommended: method.code === recommendedCode,
    availability: 'available'
  }));
}

function parseJson(value: unknown, fallback: any) {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function readCookie(cookieHeader: string, cookieName: string): string {
  const prefix = `${cookieName}=`;
  const match = cookieHeader.split(';').map((item) => item.trim()).find((item) => item.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : '';
}
