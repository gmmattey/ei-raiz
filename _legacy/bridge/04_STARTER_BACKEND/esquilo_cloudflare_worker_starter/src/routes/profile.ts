import type { Env } from "../lib/env";
import { json, fail, methodNotAllowed, parseJson } from "../lib/http";
import { ProfileRepository } from "../repositories/profile_repository";
import type { UserContextPayload } from "../contracts/common";

export async function handleProfile(request: Request, env: Env): Promise<Response> {
  const repo = new ProfileRepository(env);

  if (request.method === "GET") {
    const userId = new URL(request.url).searchParams.get("userId");
    if (!userId) {
      return fail(env.API_VERSION, 400, "missing_user_id", "userId is required.");
    }
    return json(env.API_VERSION, await repo.getContext(userId));
  }

  if (request.method === "PUT") {
    const payload = await parseJson<UserContextPayload>(request);
    if (!payload.userId) {
      return fail(env.API_VERSION, 400, "missing_user_id", "userId is required.");
    }
    return json(env.API_VERSION, await repo.upsertContext(payload));
  }

  return methodNotAllowed(env.API_VERSION);
}
