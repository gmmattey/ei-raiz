import type { Env } from '../types/env';
import { ok, fail } from './http';
import { hashToken } from './auth_crypto';
import { findImportSessionStateByTokenHash, findOwnedImportById, findImportRows } from '../repositories/import_repository';

const AUTH_COOKIE_NAME = 'esquilo_session';

export async function getImportConflictsData(request: Request, env: Env, params: Record<string, string>): Promise<Response> {
  const session = await requireImportSession(request, env);
  if (session instanceof Response) return session;

  const importRecord = await findOwnedImportById(env, session.userId, params.importId);
  if (!importRecord) {
    return fail(env.API_VERSION, 'import_not_found', 'Importação não encontrada.', 404);
  }

  const rows = await findImportRows(env, params.importId);
  const conflictRows = rows.filter((row) => row.resolution_status === 'PENDING');
  const resolvedRows = rows.filter((row) => ['RESOLVED_REPLACE', 'RESOLVED_CONSOLIDATE', 'IGNORED'].includes(row.resolution_status));

  if (!conflictRows.length) {
    return ok(env.API_VERSION, {
      screenState: 'empty',
      importId: params.importId,
      origin: importRecord.origin,
      summary: {
        totalConflicts: resolvedRows.length,
        unresolvedConflicts: 0,
        resolvedConflicts: resolvedRows.length
      },
      emptyState: {
        title: 'Essa importação não tem conflitos de duplicidade pendentes',
        body: 'Quando houver ativos conflitantes com a carteira atual, eles aparecerão aqui para decisão explícita.',
        ctaLabel: 'Voltar ao preview',
        target: `/imports/${params.importId}/preview`
      },
      conflicts: []
    });
  }

  return ok(env.API_VERSION, {
    screenState: 'ready',
    importId: params.importId,
    origin: importRecord.origin,
    summary: {
      totalConflicts: conflictRows.length + resolvedRows.length,
      unresolvedConflicts: conflictRows.length,
      resolvedConflicts: resolvedRows.length
    },
    conflicts: conflictRows.map((row) => {
      const normalized = parseJson(row.normalized_payload_json, {});
      const candidates = Array.isArray(normalized.duplicateCandidates) ? normalized.duplicateCandidates : [];
      return {
        rowId: row.id,
        rowNumber: row.row_number,
        resolutionStatus: row.resolution_status,
        errorMessage: row.error_message,
        incoming: {
          sourceKind: String(normalized.sourceKind || ''),
          code: String(normalized.code || ''),
          name: String(normalized.name || ''),
          quantity: Number(normalized.quantity || 0),
          investedAmount: Number(normalized.investedAmount || 0),
          currentAmount: Number(normalized.currentAmount || 0),
          categoryLabel: String(normalized.categoryLabel || '')
        },
        duplicateCandidates: candidates.map((candidate: any) => ({
          assetId: String(candidate.asset_id || ''),
          assetCode: String(candidate.asset_code || ''),
          assetName: String(candidate.asset_name || ''),
          quantity: Number(candidate.quantity || 0),
          investedAmount: Number(candidate.invested_amount || 0),
          currentAmount: Number(candidate.current_amount || 0)
        })),
        allowedActions: [
          { code: 'keep_current', label: 'Manter atual' },
          { code: 'replace_existing', label: 'Substituir existente' },
          { code: 'consolidate', label: 'Consolidar posições' },
          { code: 'ignore_import', label: 'Ignorar entrada' }
        ],
        target: {
          preview: `/imports/${params.importId}/preview`,
          resolve: `/v1/imports/${params.importId}/rows/${row.id}/duplicate-resolution`
        }
      };
    })
  });
}

async function requireImportSession(request: Request, env: Env): Promise<{ userId: string; portfolioId: string } | Response> {
  const token = readCookie(request.headers.get('cookie') || '', AUTH_COOKIE_NAME);
  if (!token) return fail(env.API_VERSION, 'unauthorized', 'Sessão não encontrada.', 401);
  const tokenHash = await hashToken(token);
  const session = await findImportSessionStateByTokenHash(env, tokenHash);
  if (!session) return fail(env.API_VERSION, 'unauthorized', 'Sessão inválida.', 401);
  if (!session.hasContext) return ok(env.API_VERSION, { screenState: 'redirect_onboarding', redirectTo: '/onboarding' });
  if (!session.portfolioId) return fail(env.API_VERSION, 'portfolio_not_found', 'Carteira principal não encontrada.', 404);
  return { userId: session.userId, portfolioId: session.portfolioId };
}

function parseJson(value: unknown, fallback: Record<string, any>) {
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
