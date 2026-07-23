import type { AppRoute, RouteId } from './routes';

export interface RouterLocationLike {
  pathname: string;
}

export interface Router {
  parse(location: RouterLocationLike): AppRoute;
  build(route: AppRoute): string;
}

export function createRouter(): Router {
  return {
    parse(location) {
      const path = normalizePath(location.pathname);

      if (path === '/') return { id: 'splash' };
      if (path === '/auth/login') return { id: 'auth_login' };
      if (path === '/onboarding') return { id: 'onboarding' };
      if (path === '/home') return { id: 'home' };
      if (path === '/portfolio') return { id: 'portfolio' };
      if (path === '/imports') return { id: 'imports' };
      if (path === '/imports/entry') return { id: 'imports_entry' };
      if (path === '/profile') return { id: 'profile' };
      if (path === '/history') return { id: 'history' };
      // Backend pode sugerir sub-rotas (ex: `/history/snapshots`) como nextStep; mapeamos para a tela unica por enquanto.
      if (path === '/history/snapshots') return { id: 'history' };
      if (path === '/history/timeline') return { id: 'history' };
      if (path === '/radar') return { id: 'radar' };

      const holding = matchHoldingDetail(path);
      if (holding) return holding;

      const preview = matchImportsPreview(path);
      if (preview) return preview;

      // fallback defensivo: se a rota nao for reconhecida, volta pro splash
      return { id: 'splash' };
    },
    build(route) {
      switch (route.id) {
        case 'splash':
          return '/';
        case 'auth_login':
          return '/auth/login';
        case 'onboarding':
          return '/onboarding';
        case 'home':
          return '/home';
        case 'portfolio':
          return '/portfolio';
        case 'holding_detail':
          return `/portfolio/${encodeURIComponent(route.params.portfolioId)}/holdings/${encodeURIComponent(route.params.holdingId)}`;
        case 'imports':
          return '/imports';
        case 'imports_entry':
          return '/imports/entry';
        case 'imports_preview':
          return `/imports/${encodeURIComponent(route.params.importId)}/preview`;
        case 'profile':
          return '/profile';
        case 'history':
          return '/history';
        case 'radar':
          return '/radar';
        default: {
          const _exhaustive: never = route;
          return _exhaustive;
        }
      }
    }
  };
}

export function isRouteId(id: string): id is RouteId {
  return (
    id === 'splash' ||
    id === 'auth_login' ||
    id === 'onboarding' ||
    id === 'home' ||
    id === 'portfolio' ||
    id === 'holding_detail' ||
    id === 'imports' ||
    id === 'imports_entry' ||
    id === 'imports_preview' ||
    id === 'profile' ||
    id === 'history' ||
    id === 'radar'
  );
}

function normalizePath(pathname: string): string {
  if (!pathname) return '/';
  const p = pathname.startsWith('/') ? pathname : `/${pathname}`;
  // remove trailing slash (exceto raiz)
  return p.length > 1 ? p.replace(/\/+$/, '') : p;
}

function matchHoldingDetail(path: string): AppRoute | null {
  const m = /^\/portfolio\/([^/]+)\/holdings\/([^/]+)$/.exec(path);
  if (!m) return null;
  const portfolioId = safeDecode(m[1]);
  const holdingId = safeDecode(m[2]);
  if (!portfolioId || !holdingId) return null;
  return { id: 'holding_detail', params: { portfolioId, holdingId } };
}

function matchImportsPreview(path: string): AppRoute | null {
  const m = /^\/imports\/([^/]+)\/preview$/.exec(path);
  if (!m) return null;
  const importId = safeDecode(m[1]);
  if (!importId) return null;
  return { id: 'imports_preview', params: { importId } };
}

function safeDecode(input: string): string | null {
  try {
    return decodeURIComponent(input);
  } catch {
    return null;
  }
}

