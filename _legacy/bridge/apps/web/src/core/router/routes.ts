export type RouteId =
  | 'splash'
  | 'auth_login'
  | 'onboarding'
  | 'home'
  | 'portfolio'
  | 'holding_detail'
  | 'imports'
  | 'imports_entry'
  | 'imports_preview'
  | 'profile'
  | 'history'
  | 'radar';

export type AppRoute =
  | { id: 'splash' }
  | { id: 'auth_login' }
  | { id: 'onboarding' }
  | { id: 'home' }
  | { id: 'portfolio' }
  | { id: 'holding_detail'; params: { portfolioId: string; holdingId: string } }
  | { id: 'imports' }
  | { id: 'imports_entry' }
  | { id: 'imports_preview'; params: { importId: string } }
  | { id: 'profile' }
  | { id: 'history' }
  | { id: 'radar' };

export const ROUTE_PATHS: Record<RouteId, string> = {
  splash: '/',
  auth_login: '/auth/login',
  onboarding: '/onboarding',
  home: '/home',
  portfolio: '/portfolio',
  holding_detail: '/portfolio/:portfolioId/holdings/:holdingId',
  imports: '/imports',
  imports_entry: '/imports/entry',
  imports_preview: '/imports/:importId/preview',
  profile: '/profile',
  history: '/history',
  radar: '/radar'
};

