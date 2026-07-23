import type { Env } from '../types/env';
import { getProfileContextForOnboarding, putProfileContextForOnboarding } from '../lib/profile_context_service';

export async function getProfileContext(request: Request, env: Env): Promise<Response> {
  return await getProfileContextForOnboarding(request, env);
}

export async function putProfileContext(request: Request, env: Env): Promise<Response> {
  return await putProfileContextForOnboarding(request, env);
}
