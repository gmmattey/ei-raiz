import type { Env } from '../types/env';
import { ok, fail } from './http';
import { hashToken } from './auth_crypto';
import { findImportSessionStateByTokenHash, findOwnedImportById, findImportRows } from '../repositories/import_repository';
import { buildImportOperationalFacts, deriveImportEngineStatus } from './import_operational_helpers';

const AUTH_COOKIE_NAME = 'esquilo_session';

export async function getImportEngineStatusData(request: Request, env: Env, params: Record<string, string>): Promise<Response> {
  const session = await requireImportSession(request, env);
  if (session instanceof Response) return session;

  const importRecord = await findOwnedImportById(env, session.userId, params.importId);
  if (!importRecord) {
    return fail(env.API_VERSION, 'import_not_found', 'Importação não encontrada.', 404);
  }

  const rows = await findImportRows(env, params.importId);
  const facts = buildImportOperationalFacts(rows, importRecord.origin);
  const engineStatus = deriveImportEngineStatus(importRecord.status, facts);
  const hasReadyForReview = engineStatus.readyForReview;

  return ok(env.API_VERSION, {
    screenState: 'ready',
    importId: params.importId,
    origin: importRecord.origin,
    importStatus: importRecord.status,
    engineStatus,
    document: {
      parserMode: facts.parserMode,
      confidence: facts.documentConfidence,
      importable: facts.importable
    },
    summary: {
      totalRows: facts.totalRows,
      processedRows: facts.totalRows,
      validRows: Number(importRecord.valid_rows || 0),
      invalidRows: Number(importRecord.invalid_rows || 0),
      duplicateRows: Number(importRecord.duplicate_rows || 0),
      lowConfidenceRows: facts.lowConfidenceRows,
      blockedRows: facts.blockedRows,
      failedRows: facts.failedRows,
      fallbackRows: facts.fallbackRows,
      manualDecisionRows: facts.manualDecisionRows,
      aiAssistedRows: facts.aiAssistedRows
    },
    states: {
      received: facts.totalRows === 0 && importRecord.status !== 'COMMITTED',
      processing: importRecord.status === 'PROCESSING',
      completed: importRecord.status === 'COMMITTED',
      lowConfidence: facts.lowConfidenceRows > 0,
      fallback: facts.fallbackRows > 0,
      nonImportable: !facts.importable || facts.blockedRows > 0,
      readyForReview: hasReadyForReview
    },
    targets: {
      preview: `/v1/imports/${params.importId}/preview`,
      detail: `/v1/imports/${params.importId}/detail`,
      conflicts: facts.duplicateRows > 0 ? `/v1/imports/${params.importId}/conflicts` : null,
      commit: engineStatus.readyToCommit ? `/v1/imports/${params.importId}/commit` : null
    }
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

function readCookie(cookieHeader: string, cookieName: string): string {
  const prefix = `${cookieName}=`;
  const match = cookieHeader.split(';').map((item) => item.trim()).find((item) => item.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : '';
}
