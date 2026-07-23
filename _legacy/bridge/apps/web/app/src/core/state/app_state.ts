export type SessionStatus = "unknown" | "identified" | "authenticated";

export type AppRoute = {
  path: string;
};

export interface Identity {
  userId: string;
}

export interface AppEnv {
  apiBaseUrl: string;
}

export interface AppState {
  env: AppEnv;
  session: {
    status: SessionStatus;
    identity?: Identity;
  };
  route: AppRoute;
  ui: {
    errorModal: {
      isOpen: boolean;
      title?: string;
      body?: string;
      ctaLabel?: string;
      ctaTarget?: string;
    };
  };
}

export function createInitialAppState(input: {
  env: AppEnv;
  route: AppRoute;
}): AppState {
  return {
    env: input.env,
    session: { status: "unknown" },
    route: input.route,
    ui: {
      errorModal: { isOpen: false },
    },
  };
}

