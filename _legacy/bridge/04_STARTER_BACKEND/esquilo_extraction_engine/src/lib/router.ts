export type RouteHandler = (request: Request, env: any, params: Record<string, string>) => Promise<Response> | Response;

interface Route { method: string; pattern: RegExp; keys: string[]; handler: RouteHandler; }

export class Router {
  private routes: Route[] = [];
  register(method: string, path: string, handler: RouteHandler) {
    const keys: string[] = [];
    const pattern = new RegExp('^' + path.replace(/\//g, '\\/').replace(/:([A-Za-z0-9_]+)/g, (_, key) => { keys.push(key); return '([^/]+)'; }) + '$');
    this.routes.push({ method: method.toUpperCase(), pattern, keys, handler });
  }
  async handle(request: Request, env: any): Promise<Response | null> {
    const url = new URL(request.url); const method = request.method.toUpperCase();
    for (const route of this.routes) {
      if (route.method !== method) continue;
      const match = url.pathname.match(route.pattern); if (!match) continue;
      const params: Record<string, string> = {}; route.keys.forEach((key, index) => { params[key] = match[index + 1]; });
      return await route.handler(request, env, params);
    }
    return null;
  }
}
