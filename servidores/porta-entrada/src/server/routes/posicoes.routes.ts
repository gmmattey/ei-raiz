import type { CriarPosicaoFinanceiraEntrada, PosicaoFinanceira, SessaoUsuarioSaida } from "@ei/contratos";
import { z } from "zod";
import type { Env, ServiceResponse } from "../types/gateway";
import { parseJsonBody, sucesso } from "../types/gateway";

const posicaoSchema = z.object({
  tipo: z.enum(["investimento", "caixa", "poupanca", "cofrinho", "imovel", "veiculo", "divida"]),
  nome: z.string().min(2),
  valorAtual: z.number(),
  custoAquisicao: z.number().optional(),
  liquidez: z.enum(["imediata", "curto_prazo", "medio_prazo", "baixa"]),
  risco: z.enum(["baixo", "medio", "alto"]),
  categoria: z.string().min(2),
  metadata: z.record(z.unknown()).optional(),
});

export async function handlePosicoesRoutes(
  pathname: string,
  request: Request,
  env: Env,
  sessao: SessaoUsuarioSaida | null,
): Promise<ServiceResponse<unknown> | null> {
  if (!sessao) return null;
  if (!pathname.startsWith("/api/posicoes")) return null;

  const userId = sessao.usuario.id;

  if (pathname === "/api/posicoes" && request.method === "GET") {
    const rows = await env.DB
      .prepare("SELECT id, usuario_id, tipo, nome, valor_atual, custo_aquisicao, liquidez, risco, categoria, metadata_json, criado_em, atualizado_em FROM posicoes_financeiras WHERE usuario_id = ? AND ativo = 1 ORDER BY atualizado_em DESC")
      .bind(userId)
      .all<Record<string, unknown>>();
    const dados: PosicaoFinanceira[] = (rows.results ?? []).map((row) => ({
      id: String(row.id),
      usuarioId: String(row.usuario_id),
      tipo: row.tipo as PosicaoFinanceira["tipo"],
      nome: String(row.nome),
      valorAtual: Number(row.valor_atual ?? 0),
      custoAquisicao: typeof row.custo_aquisicao === "number" ? row.custo_aquisicao : undefined,
      liquidez: row.liquidez as PosicaoFinanceira["liquidez"],
      risco: row.risco as PosicaoFinanceira["risco"],
      categoria: String(row.categoria),
      metadata: row.metadata_json ? JSON.parse(String(row.metadata_json)) : {},
      criadoEm: String(row.criado_em),
      atualizadoEm: String(row.atualizado_em),
    }));
    return sucesso(dados);
  }

  if (pathname === "/api/posicoes" && request.method === "POST") {
    const body = posicaoSchema.parse(await parseJsonBody(request)) as CriarPosicaoFinanceiraEntrada;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await env.DB
      .prepare("INSERT INTO posicoes_financeiras (id, usuario_id, tipo, nome, valor_atual, custo_aquisicao, liquidez, risco, categoria, metadata_json, ativo, criado_em, atualizado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)")
      .bind(id, userId, body.tipo, body.nome, body.valorAtual, body.custoAquisicao ?? null, body.liquidez, body.risco, body.categoria, JSON.stringify(body.metadata ?? {}), now, now)
      .run();
    return sucesso({ id, usuarioId: userId, ...body, criadoEm: now, atualizadoEm: now });
  }

  if (pathname.startsWith("/api/posicoes/") && request.method === "PUT") {
    const id = pathname.replace("/api/posicoes/", "");
    const body = posicaoSchema.partial().parse(await parseJsonBody(request)) as Partial<CriarPosicaoFinanceiraEntrada>;
    const now = new Date().toISOString();
    await env.DB
      .prepare([
        "UPDATE posicoes_financeiras SET",
        "tipo = COALESCE(?, tipo), nome = COALESCE(?, nome), valor_atual = COALESCE(?, valor_atual),",
        "custo_aquisicao = COALESCE(?, custo_aquisicao), liquidez = COALESCE(?, liquidez),",
        "risco = COALESCE(?, risco), categoria = COALESCE(?, categoria), metadata_json = COALESCE(?, metadata_json), atualizado_em = ?",
        "WHERE id = ? AND usuario_id = ? AND ativo = 1",
      ].join(" "))
      .bind(
        body.tipo ?? null, body.nome ?? null,
        typeof body.valorAtual === "number" ? body.valorAtual : null,
        typeof body.custoAquisicao === "number" ? body.custoAquisicao : null,
        body.liquidez ?? null, body.risco ?? null, body.categoria ?? null,
        body.metadata ? JSON.stringify(body.metadata) : null,
        now, id, userId,
      )
      .run();
    return sucesso({ atualizado: true });
  }

  if (pathname.startsWith("/api/posicoes/") && request.method === "DELETE") {
    const id = pathname.replace("/api/posicoes/", "");
    await env.DB
      .prepare("UPDATE posicoes_financeiras SET ativo = 0, atualizado_em = ? WHERE id = ? AND usuario_id = ?")
      .bind(new Date().toISOString(), id, userId)
      .run();
    return sucesso({ removido: true });
  }

  return null;
}
