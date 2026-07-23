import type { Env } from "../lib/env";
import { json, methodNotAllowed, parseJson } from "../lib/http";
import type { ImportCommitRequest, ImportPreviewRequest } from "../contracts/imports";
import { ImportRepository } from "../repositories/import_repository";

export async function handleImportPreview(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return methodNotAllowed(env.API_VERSION);
  }

  const payload = await parseJson<ImportPreviewRequest>(request);
  const repo = new ImportRepository(env);
  return json(env.API_VERSION, await repo.previewImport(payload));
}

export async function handleImportCommit(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return methodNotAllowed(env.API_VERSION);
  }

  const payload = await parseJson<ImportCommitRequest>(request);
  const repo = new ImportRepository(env);
  return json(env.API_VERSION, await repo.commitImport(payload));
}
