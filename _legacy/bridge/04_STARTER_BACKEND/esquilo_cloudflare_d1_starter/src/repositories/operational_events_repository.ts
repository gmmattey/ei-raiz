import type { Env } from '../types/env';
import { d1 } from '../lib/d1';

export interface OperationalEventRow {
  id: string;
  user_id: string | null;
  portfolio_id: string | null;
  event_type: string;
  event_status: string;
  message: string | null;
  details_json: string | null;
  occurred_at: string;
}

export interface InsertOperationalEventInput {
  eventId: string;
  userId: string | null;
  portfolioId: string | null;
  eventType: string;
  eventStatus: string;
  message: string | null;
  detailsJson: string | null;
}

export async function insertOperationalEvent(env: Env, input: InsertOperationalEventInput): Promise<void> {
  await d1(env).run(
    `INSERT INTO operational_events (
      id,
      user_id,
      portfolio_id,
      event_type,
      event_status,
      message,
      details_json,
      occurred_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [
      input.eventId,
      input.userId,
      input.portfolioId,
      input.eventType,
      input.eventStatus,
      input.message,
      input.detailsJson
    ]
  );
}

export async function listOperationalEventsByUserId(env: Env, input: {
  userId: string;
  portfolioId?: string | null;
  limit: number;
}): Promise<OperationalEventRow[]> {
  const limit = Math.max(1, Math.min(200, input.limit));

  if (input.portfolioId) {
    return await d1(env).all<OperationalEventRow>(
      `SELECT
         id,
         user_id,
         portfolio_id,
         event_type,
         event_status,
         message,
         details_json,
         occurred_at
       FROM operational_events
       WHERE user_id = ?
         AND portfolio_id = ?
       ORDER BY occurred_at DESC
       LIMIT ?`,
      [input.userId, input.portfolioId, limit]
    );
  }

  return await d1(env).all<OperationalEventRow>(
    `SELECT
       id,
       user_id,
       portfolio_id,
       event_type,
       event_status,
       message,
       details_json,
       occurred_at
     FROM operational_events
     WHERE user_id = ?
     ORDER BY occurred_at DESC
     LIMIT ?`,
    [input.userId, limit]
  );
}

