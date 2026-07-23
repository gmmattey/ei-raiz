import type { Env } from "../lib/env";
import { json, fail, methodNotAllowed } from "../lib/http";
import type { HealthPayload } from "../contracts/common";

export async function handleHealth(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET") {
    return methodNotAllowed(env.API_VERSION);
  }

  try {
    await env.DB.prepare("SELECT 1 AS ok").first();
    const payload: HealthPayload = {
      service: "esquilo-invest-api",
      environment: env.APP_ENV,
      version: env.API_VERSION,
      database: "ok",
      timestamp: new Date().toISOString(),
    };
    return json(env.API_VERSION, payload);
  } catch (error) {
    return fail(env.API_VERSION, 503, "health_unavailable", "Health check failed.", {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
