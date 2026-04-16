import type { SessaoUsuarioSaida } from "@ei/contratos";
import { z } from "zod";
import type { Env, ServiceResponse } from "../types/gateway";
import { parseJsonBody, sucesso } from "../types/gateway";

const telemetriaEventoSchema = z.object({
  nomeEvento: z.string().min(3).max(120),
  payload: z.record(z.unknown()).optional(),
  origem: z.string().min(2).max(40).optional(),
});

export async function handleTelemetriaRoutes(
  pathname: string,
  request: Request,
  env: Env,
  sessao: SessaoUsuarioSaida | null,
): Promise<ServiceResponse<unknown> | null> {
  if (pathname === "/api/telemetria/evento" && request.method === "POST") {
    const body = telemetriaEventoSchema.parse(await parseJsonBody(request));
    const usuarioId = sessao?.usuario?.id ?? null;
    await env.DB
      .prepare("INSERT INTO telemetria_eventos (id, usuario_id, nome_evento, payload_json, origem, criado_em) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), usuarioId, body.nomeEvento, JSON.stringify(body.payload ?? {}), body.origem ?? "web", new Date().toISOString())
      .run();
    return sucesso({ registrado: true });
  }

  return null;
}
