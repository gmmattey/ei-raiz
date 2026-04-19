import { z } from "zod";
import type { SessaoUsuarioSaida } from "@ei/contratos";
import type { Env, ServiceResponse } from "../types/gateway";
import { parseJsonBody, sucesso } from "../types/gateway";

const aporteSchema = z.object({
  ativoId: z.string().uuid().nullable().optional(),
  valor: z.number().positive(),
  dataAporte: z.string().min(10),
  origem: z.enum(["manual", "importacao", "integracao"]).optional(),
  observacao: z.string().max(500).optional(),
});

type AporteRow = {
  id: string;
  usuario_id: string;
  ativo_id: string | null;
  valor: number;
  data_aporte: string;
  origem: string;
  observacao: string | null;
  criado_em: string;
};

const serializar = (row: AporteRow) => ({
  id: row.id,
  usuarioId: row.usuario_id,
  ativoId: row.ativo_id,
  valor: Number(row.valor),
  dataAporte: row.data_aporte,
  origem: row.origem,
  observacao: row.observacao,
  criadoEm: row.criado_em,
});

export async function handleAportesRoutes(
  pathname: string,
  request: Request,
  env: Env,
  sessao: SessaoUsuarioSaida | null,
): Promise<ServiceResponse<unknown> | null> {
  if (!sessao) return null;
  if (!pathname.startsWith("/api/aportes")) return null;

  const userId = sessao.usuario.id;

  if (pathname === "/api/aportes" && request.method === "GET") {
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 500);
    const rows = await env.DB
      .prepare(
        "SELECT id, usuario_id, ativo_id, valor, data_aporte, origem, observacao, criado_em FROM aportes WHERE usuario_id = ? ORDER BY data_aporte DESC LIMIT ?",
      )
      .bind(userId, limit)
      .all<AporteRow>();
    return sucesso((rows.results ?? []).map(serializar));
  }

  if (pathname === "/api/aportes/resumo" && request.method === "GET") {
    const rows = await env.DB
      .prepare(
        "SELECT COUNT(*) AS total, COUNT(DISTINCT substr(data_aporte, 1, 7)) AS meses_distintos_6m, COALESCE(SUM(valor), 0) AS valor_total_6m FROM aportes WHERE usuario_id = ? AND date(data_aporte) >= date('now', '-6 months')",
      )
      .bind(userId)
      .first<{ total: number; meses_distintos_6m: number; valor_total_6m: number }>();
    return sucesso({
      total: Number(rows?.total ?? 0),
      mesesDistintos6m: Number(rows?.meses_distintos_6m ?? 0),
      valorTotal6m: Number(rows?.valor_total_6m ?? 0),
    });
  }

  if (pathname === "/api/aportes" && request.method === "POST") {
    const body = aporteSchema.parse(await parseJsonBody(request));
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await env.DB
      .prepare(
        "INSERT INTO aportes (id, usuario_id, ativo_id, valor, data_aporte, origem, observacao, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        id,
        userId,
        body.ativoId ?? null,
        body.valor,
        body.dataAporte,
        body.origem ?? "manual",
        body.observacao ?? null,
        now,
      )
      .run();
    return sucesso({
      id,
      usuarioId: userId,
      ativoId: body.ativoId ?? null,
      valor: body.valor,
      dataAporte: body.dataAporte,
      origem: body.origem ?? "manual",
      observacao: body.observacao ?? null,
      criadoEm: now,
    });
  }

  if (pathname.startsWith("/api/aportes/") && request.method === "DELETE") {
    const id = pathname.replace("/api/aportes/", "");
    const result = await env.DB
      .prepare("DELETE FROM aportes WHERE id = ? AND usuario_id = ?")
      .bind(id, userId)
      .run();
    return sucesso({ removido: (result.meta?.changes ?? 0) > 0 });
  }

  return null;
}
