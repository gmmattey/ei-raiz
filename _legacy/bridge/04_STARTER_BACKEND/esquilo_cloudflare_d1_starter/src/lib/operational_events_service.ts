import type { Env } from '../types/env';
import { buildEntityId } from './auth_crypto';
import { logEvent } from './logger';
import { insertOperationalEvent, listOperationalEventsByUserId, type OperationalEventRow } from '../repositories/operational_events_repository';

export type OperationalEventStatus = 'ok' | 'error';

export async function recordOperationalEvent(env: Env, input: {
  userId: string | null;
  portfolioId: string | null;
  eventType: string;
  status: OperationalEventStatus;
  message?: string | null;
  details?: Record<string, unknown> | null;
}): Promise<void> {
  logEvent(env, input.status === 'error' ? 'error' : 'info', 'operational_event', {
    type: input.eventType,
    status: input.status,
    userId: input.userId,
    portfolioId: input.portfolioId,
    message: input.message ?? null
  });

  try {
    await insertOperationalEvent(env, {
      eventId: buildEntityId('evt'),
      userId: input.userId ?? null,
      portfolioId: input.portfolioId ?? null,
      eventType: input.eventType,
      eventStatus: input.status,
      message: input.message ?? null,
      detailsJson: input.details ? safeJson(input.details) : null
    });
  } catch (error) {
    // Observabilidade nao pode quebrar fluxo de produto.
    console.warn('operational_event_insert_failed', String(error));
  }
}

export async function getOperationalEventsForUser(env: Env, input: {
  userId: string;
  portfolioId?: string | null;
  limit: number;
}): Promise<Array<{
  id: string;
  occurredAt: string;
  portfolioId: string | null;
  type: string;
  status: string;
  message: string | null;
  details: Record<string, unknown> | null;
}>> {
  const rows = await listOperationalEventsByUserId(env, input);
  return rows.map(mapRow);
}

function mapRow(row: OperationalEventRow) {
  return {
    id: row.id,
    occurredAt: row.occurred_at,
    portfolioId: row.portfolio_id,
    type: row.event_type,
    status: row.event_status,
    message: row.message,
    details: safeParseJson(row.details_json)
  };
}

function safeJson(value: Record<string, unknown>): string {
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ serialization: 'failed' });
  }
}

function safeParseJson(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}
