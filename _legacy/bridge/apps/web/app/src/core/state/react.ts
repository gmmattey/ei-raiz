import * as React from "react";
import type { Store } from "@/core/state/store";

export function useStoreSelector<TState, TSelected>(
  store: Store<TState>,
  selector: (s: TState) => TSelected,
): TSelected {
  return React.useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  );
}

