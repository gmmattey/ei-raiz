import * as React from "react";
import type { Store } from "@/core/state/store";
import { createStore } from "@/core/state/store";
import { createInitialAppState, type AppState } from "@/core/state/app_state";

const AppStoreContext = React.createContext<Store<AppState> | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = React.useRef<Store<AppState> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createStore(
      createInitialAppState({
        env: {
          apiBaseUrl: String(import.meta.env.VITE_API_BASE_URL ?? ""),
        },
        route: { path: window.location.pathname },
      }),
    );
  }

  return (
    <AppStoreContext.Provider value={storeRef.current}>
      {children}
    </AppStoreContext.Provider>
  );
}

export function useAppStore(): Store<AppState> {
  const store = React.useContext(AppStoreContext);
  if (!store) throw new Error("AppStoreProvider is missing");
  return store;
}

