import type { AppEnv } from '../data';
import type { AppRoute } from '../router';

export type SessionStatus = 'unknown' | 'identified' | 'authenticated';

export interface Identity {
  userId: string;
}

export interface AppState {
  env: AppEnv;
  session: {
    status: SessionStatus;
    identity?: Identity;
  };
  route: AppRoute;
}

export function createInitialAppState(input: { env: AppEnv; route: AppRoute }): AppState {
  return {
    env: input.env,
    session: { status: 'unknown' },
    route: input.route
  };
}

