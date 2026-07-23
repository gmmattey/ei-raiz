import type { Env } from '../types/env';
import { ok, fail } from './http';
import { hashToken } from './auth_crypto';
import { findImportsCenterSessionStateByTokenHash, findImportsCenterRows } from '../repositories/imports_center_repository';

const AUTH_COOKIE_NAME = 'esquilo_session';

export async function getImportsCenterData(request: Request, env: Env): Promise<Response> {
  const token = readCookie(request.headers.get('cookie') || '', AUTH_COOKIE_NAME);
  if (!token) return fail(env.API_VERSION, 'unauthorized', 'Sessao nao encontrada.', 401);

  const tokenHash = await hashToken(token);
  const session = await findImportsCenterSessionStateByTokenHash(env, tokenHash);
  if (!session) return fail(env.API_VERSION, 'unauthorized', 'Sessao invalida.', 401);
  if (!session.hasContext) {
    return ok(env.API_VERSION, { screenState: 'redirect_onboarding', redirectTo: '/onboarding' });
  }
  if (!session.portfolioId) {
    return fail(env.API_VERSION, 'portfolio_not_found', 'Carteira principal nao encontrada.', 404);
  }

  const rows = await findImportsCenterRows(env, session.userId);
  if (!rows.length) {
    return ok(env.API_VERSION, {
      screenState: 'empty',
      portfolioId: session.portfolioId,
      emptyState: {
        title: 'Você ainda não tem importações',
        body: 'Comece uma importação manual, por template, CSV da B3 ou documento para montar sua carteira.',
        ctaLabel: 'Iniciar importação',
        target: '/imports/entry'
      },
      summary: {
        totalImports: 0,
        pendingImports: 0,
        completedImports: 0,
        failedImports: 0
      },
      imports: []
    });
  }

  const summary = rows.reduce((acc, row) => {
    acc.totalImports += 1;
    if (row.status === 'COMMITTED') acc.completedImports += 1;
    else if (['PROCESSING', 'PREVIEW_READY'].includes(row.status)) acc.pendingImports += 1;
    else if (row.status === 'FAILED') acc.failedImports += 1;
    return acc;
  }, { totalImports: 0, pendingImports: 0, completedImports: 0, failedImports: 0 });

  return ok(env.API_VERSION, {
    screenState: 'ready',
    portfolioId: session.portfolioId,
    summary,
    imports: rows.map((row) => ({
      id: row.id,
      origin: row.origin,
      originLabel: mapOriginLabel(row.origin),
      status: row.status,
      statusLabel: mapStatusLabel(row.status),
      fileName: row.file_name || null,
      mimeType: row.mime_type || null,
      totals: {
        totalRows: Number(row.total_rows || 0),
        validRows: Number(row.valid_rows || 0),
        invalidRows: Number(row.invalid_rows || 0),
        duplicateRows: Number(row.duplicate_rows || 0)
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
      snapshot: row.snapshot_id ? {
        id: row.snapshot_id,
        referenceDate: row.reference_date || null,
        target: '/history/snapshots'
      } : null,
      primaryAction: buildPrimaryAction(row.status, row.id),
      secondaryAction: row.snapshot_id ? { code: 'open_snapshot', title: 'Ver snapshot', target: '/history/snapshots' } : null
    }))
  });
}

function buildPrimaryAction(status: string, importId: string) {
  if (status === 'COMMITTED') {
    return { code: 'open_preview', title: 'Ver importação', target: `/imports/${importId}/preview` };
  }
  if (['PROCESSING', 'PREVIEW_READY'].includes(status)) {
    return { code: 'resume_import', title: 'Retomar revisão', target: `/imports/${importId}/preview` };
  }
  return { code: 'open_preview', title: 'Abrir detalhes', target: `/imports/${importId}/preview` };
}

function mapOriginLabel(origin: string): string {
  if (origin === 'MANUAL_ENTRY') return 'Manual';
  if (origin === 'CUSTOM_TEMPLATE') return 'Template próprio';
  if (origin === 'B3_CSV') return 'CSV da B3';
  if (origin === 'DOCUMENT_AI_PARSE') return 'Documento assistido';
  return origin;
}

function mapStatusLabel(status: string): string {
  if (status === 'COMMITTED') return 'Concluída';
  if (status === 'PREVIEW_READY') return 'Pronta para commit';
  if (status === 'PROCESSING') return 'Em revisão';
  if (status === 'FAILED') return 'Falhou';
  return status;
}

function readCookie(cookieHeader: string, cookieName: string): string {
  const prefix = `${cookieName}=`;
  const match = cookieHeader.split(';').map((item) => item.trim()).find((item) => item.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : '';
}
