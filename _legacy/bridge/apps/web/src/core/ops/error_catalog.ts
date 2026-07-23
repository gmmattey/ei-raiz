import type { ApiError } from '../data/types';
import type { OperationFeedback } from './load_state';
import { error as errorFeedback } from './load_state';

export type RetryHint =
  | { kind: 'retry'; label: string }
  | { kind: 'go_to'; label: string; pathname: string }
  | { kind: 'none' };

export type UserFacingError = {
  title: string;
  message: string;
  retry: RetryHint;
};

/**
 * Mapeia `error.code` para mensagens humanas e recuperaveis.
 * Regra: nunca vazar stacktrace nem mensagem crua como primeira opcao.
 */
export function toUserFacingError(err: ApiError, context: { area: 'home' | 'history' | 'imports' | 'profile' | 'portfolio' | 'analysis' | 'holding_detail' }): UserFacingError {
  switch (err.code) {
    case 'unauthorized':
      return {
        title: 'Sessao expirada',
        message: 'Sua sessao parece ter expirado. Entre novamente para continuar.',
        retry: { kind: 'go_to', label: 'Ir para login', pathname: '/auth/login' }
      };
    case 'redirect_onboarding':
      return {
        title: 'Falta completar o onboarding',
        message: 'Antes de continuar, precisamos completar seu contexto financeiro.',
        retry: { kind: 'go_to', label: 'Completar onboarding', pathname: '/onboarding' }
      };
    case 'preview_not_consistent':
      return {
        title: 'Preview com pendencias',
        message: 'Revise os itens invalidos ou em conflito antes de confirmar o commit.',
        retry: { kind: 'retry', label: 'Voltar ao preview' }
      };
    case 'holding_not_found':
      return {
        title: 'Ativo nao encontrado',
        message: 'Nao conseguimos abrir esse ativo. Ele pode ter sido removido ou alterado.',
        retry: { kind: 'go_to', label: 'Voltar para a carteira', pathname: '/portfolio' }
      };
    default:
      return {
        title: 'Algo falhou',
        message: defaultMessage(context.area),
        retry: { kind: 'retry', label: 'Tentar novamente' }
      };
  }
}

export function toErrorFeedback(err: ApiError, context: { area: 'home' | 'history' | 'imports' | 'profile' | 'portfolio' | 'analysis' | 'holding_detail' }): OperationFeedback {
  const user = toUserFacingError(err, context);
  return errorFeedback(user.title, user.message);
}

function defaultMessage(area: 'home' | 'history' | 'imports' | 'profile' | 'portfolio' | 'analysis' | 'holding_detail'): string {
  switch (area) {
    case 'home':
      return 'Nao conseguimos carregar sua Home agora. Tente novamente em instantes.';
    case 'history':
      return 'Nao conseguimos carregar seu historico agora. Tente novamente em instantes.';
    case 'imports':
      return 'Nao conseguimos processar sua importacao agora. Tente novamente em instantes.';
    case 'portfolio':
      return 'Nao conseguimos carregar sua carteira agora. Tente novamente em instantes.';
    case 'analysis':
      return 'Nao conseguimos carregar sua analise agora. Tente novamente em instantes.';
    case 'holding_detail':
      return 'Nao conseguimos carregar o detalhe agora. Tente novamente em instantes.';
    case 'profile':
      return 'Nao conseguimos carregar seu perfil agora. Tente novamente em instantes.';
    default:
      return 'Tente novamente em instantes.';
  }
}
