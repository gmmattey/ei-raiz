import type { Env } from "./lib/env";
import { fail } from "./lib/http";
import { handleHealth } from "./routes/health";
import { handleDashboard } from "./routes/dashboard";
import { handlePortfolio } from "./routes/portfolio";
import { handleAnalysis } from "./routes/analysis";
import { handleProfile } from "./routes/profile";
import { handleHistory } from "./routes/history";
import { handleImportPreview, handleImportCommit } from "./routes/imports";

function notFound(version: string): Response {
  return fail(version, 404, "not_found", "Route not found.");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/health") return handleHealth(request, env);

    if (path === "/api/v1/dashboard") return handleDashboard(request, env);
    if (path === "/api/v1/portfolio") return handlePortfolio(request, env);
    if (path === "/api/v1/analysis") return handleAnalysis(request, env);
    if (path === "/api/v1/profile/context") return handleProfile(request, env);
    if (path === "/api/v1/history") return handleHistory(request, env);
    if (path === "/api/v1/imports/preview") return handleImportPreview(request, env);
    if (path === "/api/v1/imports/commit") return handleImportCommit(request, env);

    return notFound(env.API_VERSION || "v1");
  },
};
