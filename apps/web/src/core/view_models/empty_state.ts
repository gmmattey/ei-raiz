import type { EmptyState } from '../data/contracts';
import { tryParseRoute, type AppRoute } from '../router';

export type EmptyStateViewModel = EmptyState & {
  targetRoute: AppRoute | null;
};

/**
 * Garante que o CTA de um estado vazio aponta para uma rota valida do app.
 * Nao muda o texto; apenas resolve/valida target.
 */
export function toEmptyStateViewModel(input: EmptyState): EmptyStateViewModel {
  return {
    ...input,
    targetRoute: input.target ? tryParseRoute({ pathname: input.target }) : null
  };
}

