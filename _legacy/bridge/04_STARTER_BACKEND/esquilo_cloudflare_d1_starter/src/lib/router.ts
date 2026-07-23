import { fail } from './http';

export type RouteHandler = (request: Request, env: any, params: Record<string, string>) => Promise<Response> | Response;

interface Route {
  method: string;
  pattern: RegExp;
  keys: string[];
  handler: RouteHandler;
}

export class Router {
  private routes: Route[] = [];

  register(method: string, path: string, handler: RouteHandler) {
    const keys: string[] = [];
    const pattern = new RegExp(
      '^' +
        path.replace(/\//g, '\\/').replace(/:([A-Za-z0-9_]+)/g, (_, key) => {
          keys.push(key);
          return '([^/]+)';
        }) +
        '$'
    );
    this.routes.push({ method: method.toUpperCase(), pattern, keys, handler });
  }

  async handle(request: Request, env: any): Promise<Response | null> {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const pathname = url.pathname;
    const allowedMethods = new Set<string>();

    for (const route of this.routes) {
      const match = pathname.match(route.pattern);
      if (!match) continue;

      if (route.method === method) {
        const params: Record<string, string> = {};
        route.keys.forEach((key, index) => {
          params[key] = match[index + 1];
        });
        return await route.handler(request, env, params);
      }

      allowedMethods.add(route.method);
    }

    if (allowedMethods.size) {
      const allow = Array.from(allowedMethods).sort();
      const response = fail(env?.API_VERSION || 'v1', 'method_not_allowed', 'Método não permitido para esta rota.', 405, {
        allowedMethods: allow
      });
      response.headers.set('Allow', allow.join(', '));
      return response;
    }

    return null;
  }
}
