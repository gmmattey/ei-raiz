import type { SessaoUsuarioSaida } from "@ei/contratos";
import { z } from "zod";
import type { Env, ServiceResponse } from "../types/gateway";
import { parseJsonBody, sucesso, erro } from "../types/gateway";
import {
  obterAppConfig,
  obterConteudoApp,
  obterCorretorasSuportadas,
  atualizarScoreConfig,
  atualizarFeatureFlags,
  atualizarMenus,
  atualizarConteudoApp,
  atualizarCorretorasSuportadas,
  listarAdmins,
  definirAdmin,
  obterLogsAuditoriaAdmin,
  usuarioEhAdmin,
} from "../../configuracao-produto";
import { resetMassaTesteEiRaiz } from "./auth.routes";

const atualizarScoreConfigSchema = z.object({ score: z.record(z.unknown()) });
const atualizarFlagsSchema = z.object({ flags: z.record(z.boolean()) });
const atualizarMenusSchema = z.object({
  menus: z.array(z.object({ chave: z.string().min(1), label: z.string().min(1), path: z.string().min(1), ordem: z.number().int().nonnegative(), visivel: z.boolean() })),
});
const blocoConteudoSchema = z.object({ chave: z.string().min(2), modulo: z.string().min(2), tipo: z.enum(["texto", "markdown", "json", "boolean"]), valor: z.string(), visivel: z.boolean(), ordem: z.number().int().nonnegative() });
const atualizarConteudoSchema = z.object({ blocos: z.array(blocoConteudoSchema) });
const corretoraSchema = z.object({ codigo: z.string().min(2), nome: z.string().min(2), status: z.enum(["ativo", "beta", "planejado"]), mensagemAjuda: z.string().min(2) });
const atualizarCorretorasSchema = z.object({ corretoras: z.array(corretoraSchema) });
const atualizarAdminSchema = z.object({ email: z.string().email(), ativo: z.boolean() });
const atualizarParametrosSimulacaoSchema = z.object({
  parametros: z.array(z.object({ chave: z.string().min(2), valor: z.record(z.unknown()), descricao: z.string().optional(), ativo: z.boolean().default(true) })),
});

export async function handleAdminRoutes(
  pathname: string,
  request: Request,
  env: Env,
  sessao: SessaoUsuarioSaida | null,
): Promise<ServiceResponse<unknown> | null> {
  if (!pathname.startsWith("/api/admin")) return null;

  // Rota pública de reset de dados de teste
  if (pathname === "/api/admin/test-data/reset" && request.method === "POST") {
    const tokenHeader = request.headers.get("x-admin-token");
    if (!env.ADMIN_TOKEN || !tokenHeader || tokenHeader !== env.ADMIN_TOKEN) {
      return erro("ACESSO_NEGADO", "Token administrativo inválido", 403);
    }
    return sucesso(await resetMassaTesteEiRaiz(env));
  }

  if (!sessao) return { ok: false, status: 401, codigo: "NAO_AUTORIZADO", mensagem: "Token ausente" };

  const validarAdmin = async (): Promise<ServiceResponse<unknown> | null> => {
    const autorizado = await usuarioEhAdmin(env.DB, sessao.usuario.email, {
      adminTokenHeader: request.headers.get("x-admin-token"),
      adminTokenEnv: env.ADMIN_TOKEN,
      adminEmailsEnv: env.ADMIN_EMAILS,
    });
    if (!autorizado) return erro("ACESSO_NEGADO", "Acesso administrativo negado", 403);
    return null;
  };

  if (pathname === "/api/admin/me" && request.method === "GET") {
    return sucesso({ email: sessao.usuario.email, isAdmin: !(await validarAdmin()) });
  }

  if (pathname === "/api/admin/config" && request.method === "GET") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    return sucesso(await obterAppConfig(env.DB, { incluirOcultos: true }));
  }

  if (pathname === "/api/admin/content" && request.method === "GET") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    return sucesso(await obterConteudoApp(env.DB, { incluirOcultos: true }));
  }

  if (pathname === "/api/admin/config/score" && request.method === "PUT") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const body = atualizarScoreConfigSchema.parse(await parseJsonBody(request));
    await atualizarScoreConfig(env.DB, body.score, sessao.usuario.email);
    return sucesso({ atualizado: true });
  }

  if (pathname === "/api/admin/config/flags" && request.method === "PUT") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const body = atualizarFlagsSchema.parse(await parseJsonBody(request));
    await atualizarFeatureFlags(env.DB, body.flags, sessao.usuario.email);
    return sucesso({ atualizado: true });
  }

  if (pathname === "/api/admin/config/menus" && request.method === "PUT") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const body = atualizarMenusSchema.parse(await parseJsonBody(request));
    await atualizarMenus(env.DB, body.menus, sessao.usuario.email);
    return sucesso({ atualizado: true });
  }

  if (pathname === "/api/admin/content" && request.method === "PUT") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const body = atualizarConteudoSchema.parse(await parseJsonBody(request));
    await atualizarConteudoApp(env.DB, body.blocos, sessao.usuario.email);
    return sucesso({ atualizado: true });
  }

  if (pathname === "/api/admin/corretoras" && request.method === "GET") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    return sucesso(await obterCorretorasSuportadas(env.DB));
  }

  if (pathname === "/api/admin/corretoras" && request.method === "PUT") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const body = atualizarCorretorasSchema.parse(await parseJsonBody(request));
    await atualizarCorretorasSuportadas(env.DB, body.corretoras, sessao.usuario.email);
    return sucesso({ atualizado: true });
  }

  if (pathname === "/api/admin/simulacoes/parametros" && request.method === "GET") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const rows = await env.DB
      .prepare("SELECT id, chave, valor_json, descricao, origem, ativo, atualizado_em FROM simulacoes_parametros ORDER BY chave ASC")
      .all<Record<string, unknown>>();
    return sucesso(
      (rows.results ?? []).map((row) => ({
        id: row.id,
        chave: row.chave,
        valor: row.valor_json ? JSON.parse(String(row.valor_json)) : {},
        descricao: row.descricao ?? "",
        origem: row.origem ?? "admin",
        ativo: row.ativo === 1,
        atualizadoEm: row.atualizado_em,
      })),
    );
  }

  if (pathname === "/api/admin/simulacoes/parametros" && request.method === "PUT") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const body = atualizarParametrosSimulacaoSchema.parse(await parseJsonBody(request));
    const now = new Date().toISOString();
    const stmts = body.parametros.map((item) =>
      env.DB
        .prepare("INSERT INTO simulacoes_parametros (id, chave, valor_json, descricao, origem, ativo, atualizado_em) VALUES (?, ?, ?, ?, 'admin', ?, ?) ON CONFLICT(chave) DO UPDATE SET valor_json = excluded.valor_json, descricao = excluded.descricao, origem = 'admin', ativo = excluded.ativo, atualizado_em = excluded.atualizado_em")
        .bind(crypto.randomUUID(), item.chave, JSON.stringify(item.valor ?? {}), item.descricao ?? "", item.ativo ? 1 : 0, now),
    );
    if (stmts.length > 0) await env.DB.batch(stmts);
    await env.DB
      .prepare("INSERT INTO admin_auditoria (id, acao, alvo, payload_json, autor_email, criado_em) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), "simulacoes.parametros.atualizar", "simulacoes_parametros", JSON.stringify({ quantidade: body.parametros.length }), sessao.usuario.email, now)
      .run();
    return sucesso({ atualizado: true });
  }

  if (pathname === "/api/admin/usuarios" && request.method === "GET") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    return sucesso(await listarAdmins(env.DB));
  }

  if (pathname === "/api/admin/usuarios" && request.method === "POST") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const body = atualizarAdminSchema.parse(await parseJsonBody(request));
    await definirAdmin(env.DB, body.email, body.ativo, sessao.usuario.email);
    return sucesso({ atualizado: true });
  }

  if (pathname === "/api/admin/auditoria" && request.method === "GET") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const url = new URL(request.url);
    const limite = Number.parseInt(url.searchParams.get("limite") ?? "50", 10);
    return sucesso(await obterLogsAuditoriaAdmin(env.DB, Number.isNaN(limite) ? 50 : limite));
  }

  if (pathname === "/api/admin/auditoria/exclusoes" && request.method === "GET") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const url = new URL(request.url);
    const limite = Math.max(1, Math.min(500, Number.parseInt(url.searchParams.get("limite") ?? "100", 10) || 100));
    const autorEmail = (url.searchParams.get("autorEmail") ?? "").trim().toLowerCase();
    const ticker = (url.searchParams.get("ticker") ?? "").trim().toUpperCase();
    const dataInicio = (url.searchParams.get("dataInicio") ?? "").trim();
    const dataFim = (url.searchParams.get("dataFim") ?? "").trim();

    const filtros: string[] = ["acao = 'carteira.ativo.excluir'"];
    const valores: unknown[] = [];
    if (autorEmail) { filtros.push("LOWER(autor_email) = ?"); valores.push(autorEmail); }
    if (ticker) { filtros.push("UPPER(json_extract(payload_json, '$.ticker')) = ?"); valores.push(ticker); }
    if (dataInicio) { filtros.push("criado_em >= ?"); valores.push(dataInicio); }
    if (dataFim) { filtros.push("criado_em <= ?"); valores.push(dataFim); }

    valores.push(limite);
    const rows = await env.DB
      .prepare(`SELECT id, acao, alvo, payload_json, autor_email, criado_em FROM admin_auditoria WHERE ${filtros.join(" AND ")} ORDER BY criado_em DESC LIMIT ?`)
      .bind(...valores)
      .all<{ id: string; acao: string; alvo: string; payload_json: string; autor_email: string; criado_em: string }>();

    return sucesso(
      (rows.results ?? []).map((row) => {
        let payload: Record<string, unknown> = {};
        try { payload = row.payload_json ? JSON.parse(row.payload_json) : {}; } catch { payload = {}; }
        return {
          id: row.id, acao: row.acao, alvo: row.alvo, autorEmail: row.autor_email, criadoEm: row.criado_em,
          motivo: String(payload.motivo ?? ""), usuarioId: String(payload.usuarioId ?? ""),
          ativoId: String(payload.ativoId ?? ""), ticker: String(payload.ticker ?? ""),
          nome: String(payload.nome ?? ""), categoria: String(payload.categoria ?? ""),
          valorAtual: Number(payload.valorAtual ?? 0), quantidade: Number(payload.quantidade ?? 0),
          payloadJson: row.payload_json,
        };
      }),
    );
  }

  if (pathname === "/api/admin/mercado/saude" && request.method === "GET") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;
    const agora = new Date().toISOString();
    const rows = await env.DB
      .prepare([
        "SELECT fonte, COUNT(*) AS total,",
        "SUM(CASE WHEN erro IS NOT NULL AND erro <> '' THEN 1 ELSE 0 END) AS erros,",
        "SUM(CASE WHEN expira_em < ? THEN 1 ELSE 0 END) AS expirados,",
        "MAX(atualizado_em) AS ultima_atualizacao",
        "FROM cotacoes_ativos_cache GROUP BY fonte",
      ].join(" "))
      .bind(agora)
      .all<{ fonte: string; total: number; erros: number; expirados: number; ultima_atualizacao: string | null }>();

    const slaPorFonte: Record<string, number> = { brapi: 15, cvm: 1440 };
    const saudePorFonte = (rows.results ?? []).map((row) => {
      const total = Number(row.total ?? 0);
      const erros = Number(row.erros ?? 0);
      const expirados = Number(row.expirados ?? 0);
      const slaMinutos = slaPorFonte[row.fonte] ?? 60;
      const minutosDesdeUltima = row.ultima_atualizacao && !Number.isNaN(new Date(row.ultima_atualizacao).getTime())
        ? Math.max(0, Math.round((Date.now() - new Date(row.ultima_atualizacao).getTime()) / 60000))
        : null;
      const status = total === 0 ? "indisponivel" : erros > 0 || expirados > 0 || (minutosDesdeUltima !== null && minutosDesdeUltima > slaMinutos) ? "degradado" : "saudavel";
      return { fonte: row.fonte, total, erros, expirados, ultimaAtualizacao: row.ultima_atualizacao, minutosDesdeUltima, slaMinutos, coberturaAtualizada: total > 0 ? Number((((total - expirados) / total) * 100).toFixed(2)) : 0, status };
    });

    return sucesso({
      referencia: agora,
      sla: { acoesMinutos: 15, fundosMinutos: 1440 },
      fontes: saudePorFonte,
      statusGeral: saudePorFonte.some((i) => i.status === "degradado") ? "degradado" : saudePorFonte.some((i) => i.status === "indisponivel") ? "indisponivel" : "saudavel",
    });
  }

  if (pathname === "/api/admin/bootstrap" && request.method === "POST") {
    const tokenHeader = request.headers.get("x-admin-token");
    if (!env.ADMIN_TOKEN || !tokenHeader || tokenHeader !== env.ADMIN_TOKEN) {
      return erro("ACESSO_NEGADO", "Token administrativo inválido", 403);
    }
    await definirAdmin(env.DB, sessao.usuario.email, true, sessao.usuario.email);
    return sucesso({ atualizado: true });
  }

  return null;
}
