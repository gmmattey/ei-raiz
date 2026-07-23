import type { Env } from "../lib/env";
import { json, fail, methodNotAllowed } from "../lib/http";
import { PortfolioRepository } from "../repositories/portfolio_repository";

export async function handlePortfolio(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET") {
    return methodNotAllowed(env.API_VERSION);
  }

  const userId = new URL(request.url).searchParams.get("userId");
  if (!userId) {
    return fail(env.API_VERSION, 400, "missing_user_id", "userId is required.");
  }

  const repo = new PortfolioRepository(env);
  const payload = await repo.getPortfolio(userId);
  return json(env.API_VERSION, payload);
}
