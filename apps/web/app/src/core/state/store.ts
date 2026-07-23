export type Unsubscribe = () => void;

export interface Store<TState> {
  getState(): TState;
  setState(updater: (current: TState) => TState): void;
  subscribe(listener: (state: TState) => void): Unsubscribe;
}

export function createStore<TState>(initial: TState): Store<TState> {
  let state = initial;
  const listeners = new Set<(s: TState) => void>();

  return {
    getState() {
      return state;
    },
    setState(updater) {
      state = updater(state);
      for (const l of listeners) l(state);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

