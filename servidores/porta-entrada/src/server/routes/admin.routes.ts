import type { SessaoUsuarioSaida } from "@ei/contratos";
import { z } from "zod";
import type { Env, ServiceResponse } from "../types/gateway";
import { parseJsonBody, sucesso, erro } from "../types/gateway";
import { construirServicoReconstrucao } from "../services/construir-servico-reconstrucao";
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

// ─── CVM fundos ────────────────────────────────────────────────────────────
const cotaCvmSchema = z.object({
  cnpj: z.string().min(11),               // aceita com ou sem pontuação
  dataRef: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  vlQuota: z.number().positive(),
  vlPatrimLiq: z.number().optional(),
  nrCotst: z.number().int().optional(),
});
const ingerirCotasCvmSchema = z.object({
  itens: z.array(cotaCvmSchema).min(1).max(5000),
});

const cadastroCvmSchema = z.object({
  cnpj: z.string().min(11),
  denominacaoSocial: z.string().min(2),
  classe: z.string().optional(),
  situacao: z.string().optional(),
});
const ingerirCadastroCvmSchema = z.object({
  itens: z.array(cadastroCvmSchema).min(1).max(5000),
});

const vincularCnpjFundoSchema = z.object({
  vinculos: z.array(z.object({
    ativoId: z.string().min(1),
    cnpj: z.string().min(11),
  })).min(1).max(500),
});

const normalizarCnpjDigitos = (cnpj: string): string | null => {
  const digitos = String(cnpj).replace(/\D/g, "");
  return digitos.length === 14 ? digitos : null;
};

const normalizarDenominacao = (nome: string): string =>
  nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();

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

  // ─── Reconstrução de histórico mensal em massa ─────────────────────────────
  // Idempotente: pode ser chamado várias vezes. Limitado por usuários com
  // ativos cadastrados. Cada chamada de "processar-todos" processa 1 lote
  // (N meses por usuário) — chame em loop até "status" reportar 0 pendentes.

  if (pathname === "/api/admin/historico/reconstruir/status" && request.method === "GET") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;

    const rows = await env.DB
      .prepare(
        "SELECT status, COUNT(*) AS total FROM fila_reconstrucao_carteira GROUP BY status",
      )
      .all<{ status: string; total: number }>();

    const totais: Record<string, number> = { pendente: 0, processando: 0, concluido: 0, erro: 0 };
    for (const row of rows.results ?? []) {
      totais[row.status] = Number(row.total ?? 0);
    }

    const usuariosComAtivos = await env.DB
      .prepare("SELECT COUNT(DISTINCT usuario_id) AS total FROM ativos")
      .first<{ total: number }>();

    return sucesso({
      totais,
      usuariosComAtivos: Number(usuariosComAtivos?.total ?? 0),
      faltamEnfileirar: Math.max(
        0,
        Number(usuariosComAtivos?.total ?? 0) -
          (totais.pendente + totais.processando + totais.concluido + totais.erro),
      ),
    });
  }

  if (pathname === "/api/admin/historico/reconstruir/enfileirar-todos" && request.method === "POST") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;

    const usuariosRows = await env.DB
      .prepare(
        [
          "SELECT DISTINCT a.usuario_id",
          "FROM ativos a",
          "LEFT JOIN fila_reconstrucao_carteira f ON f.usuario_id = a.usuario_id",
          "WHERE f.usuario_id IS NULL",
        ].join(" "),
      )
      .all<{ usuario_id: string }>();

    const usuarios = usuariosRows.results ?? [];
    const servico = construirServicoReconstrucao(env);

    let enfileirados = 0;
    const erros: Array<{ usuarioId: string; mensagem: string }> = [];
    for (const { usuario_id } of usuarios) {
      try {
        await servico.enfileirar(usuario_id);
        enfileirados += 1;
      } catch (err) {
        erros.push({
          usuarioId: usuario_id,
          mensagem: err instanceof Error ? err.message : "erro desconhecido",
        });
      }
    }

    return sucesso({ enfileirados, totalCandidatos: usuarios.length, erros });
  }

  if (pathname === "/api/admin/historico/reconstruir/processar-todos" && request.method === "POST") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;

    const body = await parseJsonBody(request).catch(() => ({}));
    const tamanhoLoteSchema = z.object({ tamanhoLote: z.number().int().min(1).max(12).optional() });
    const { tamanhoLote = 6 } = tamanhoLoteSchema.parse(body);

    const pendentesRows = await env.DB
      .prepare(
        "SELECT usuario_id FROM fila_reconstrucao_carteira WHERE status IN ('pendente', 'processando')",
      )
      .all<{ usuario_id: string }>();

    const pendentes = pendentesRows.results ?? [];
    const servico = construirServicoReconstrucao(env);

    let processados = 0;
    let concluidos = 0;
    const erros: Array<{ usuarioId: string; mensagem: string }> = [];
    for (const { usuario_id } of pendentes) {
      try {
        const estado = await servico.processarProximoLote(usuario_id, tamanhoLote);
        processados += 1;
        if (estado.status === "concluido") concluidos += 1;
      } catch (err) {
        erros.push({
          usuarioId: usuario_id,
          mensagem: err instanceof Error ? err.message : "erro desconhecido",
        });
      }
    }

    return sucesso({
      processados,
      concluidosAgora: concluidos,
      restantes: Math.max(0, pendentes.length - concluidos),
      erros,
    });
  }

  // ─── CVM: ingestão de cotas de fundos ──────────────────────────────────────
  // Recebe lotes vindos do script local `scripts/ingerir-cvm-cotas.mjs`, que
  // baixa o CSV mensal da CVM e filtra pelos CNPJs dos ativos. Upsert por PK
  // (cnpj, data_ref).
  if (pathname === "/api/admin/fundos/cvm/ingerir-cotas" && request.method === "POST") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;

    const body = ingerirCotasCvmSchema.parse(await parseJsonBody(request));
    let inseridos = 0;
    let invalidos = 0;
    const stmts: D1PreparedStatement[] = [];
    for (const item of body.itens) {
      const cnpj = normalizarCnpjDigitos(item.cnpj);
      if (!cnpj) { invalidos += 1; continue; }
      stmts.push(
        env.DB
          .prepare(
            "INSERT INTO cotas_fundos_cvm (cnpj, data_ref, vl_quota, vl_patrim_liq, nr_cotst, atualizado_em) VALUES (?, ?, ?, ?, ?, datetime('now')) ON CONFLICT(cnpj, data_ref) DO UPDATE SET vl_quota = excluded.vl_quota, vl_patrim_liq = excluded.vl_patrim_liq, nr_cotst = excluded.nr_cotst, atualizado_em = excluded.atualizado_em",
          )
          .bind(cnpj, item.dataRef, item.vlQuota, item.vlPatrimLiq ?? null, item.nrCotst ?? null),
      );
      inseridos += 1;
    }
    if (stmts.length > 0) await env.DB.batch(stmts);

    return sucesso({ inseridos, invalidos });
  }

  // ─── CVM: ingestão do catálogo de fundos (CAD_FI) ──────────────────────────
  if (pathname === "/api/admin/fundos/cvm/ingerir-cadastro" && request.method === "POST") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;

    const body = ingerirCadastroCvmSchema.parse(await parseJsonBody(request));
    let inseridos = 0;
    let invalidos = 0;
    const stmts: D1PreparedStatement[] = [];
    for (const item of body.itens) {
      const cnpj = normalizarCnpjDigitos(item.cnpj);
      if (!cnpj) { invalidos += 1; continue; }
      stmts.push(
        env.DB
          .prepare(
            "INSERT INTO fundos_cvm_cadastro (cnpj, denominacao_social, denominacao_norm, classe, situacao, atualizado_em) VALUES (?, ?, ?, ?, ?, datetime('now')) ON CONFLICT(cnpj) DO UPDATE SET denominacao_social = excluded.denominacao_social, denominacao_norm = excluded.denominacao_norm, classe = excluded.classe, situacao = excluded.situacao, atualizado_em = excluded.atualizado_em",
          )
          .bind(
            cnpj,
            item.denominacaoSocial,
            normalizarDenominacao(item.denominacaoSocial),
            item.classe ?? null,
            item.situacao ?? null,
          ),
      );
      inseridos += 1;
    }
    if (stmts.length > 0) await env.DB.batch(stmts);

    return sucesso({ inseridos, invalidos });
  }

  // ─── CVM: buscar CNPJ por termo (match fuzzy no catálogo) ──────────────────
  // Útil pro admin descobrir o CNPJ de um fundo usando apenas o nome exibido.
  // Exemplo: GET /api/admin/fundos/cvm/buscar-cnpj?q=verde%20am&limite=10
  if (pathname === "/api/admin/fundos/cvm/buscar-cnpj" && request.method === "GET") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;

    const url = new URL(request.url);
    const q = normalizarDenominacao(url.searchParams.get("q") ?? "");
    if (q.length < 2) return erro("TERMO_CURTO", "Informe ao menos 2 caracteres", 422);
    const limite = Math.min(50, Number.parseInt(url.searchParams.get("limite") ?? "20", 10) || 20);

    // LIKE sobre denominacao_norm; cada palavra precisa estar presente.
    const palavras = q.split(" ").filter(Boolean);
    const conds = palavras.map(() => "denominacao_norm LIKE ?").join(" AND ");
    const binds = palavras.map((p) => `%${p}%`);

    const rs = await env.DB
      .prepare(
        `SELECT cnpj, denominacao_social, classe, situacao FROM fundos_cvm_cadastro WHERE ${conds} ORDER BY CASE WHEN situacao = 'EM FUNCIONAMENTO NORMAL' THEN 0 ELSE 1 END, denominacao_social ASC LIMIT ?`,
      )
      .bind(...binds, limite)
      .all<{ cnpj: string; denominacao_social: string; classe: string | null; situacao: string | null }>();

    return sucesso({
      resultados: (rs.results ?? []).map((r) => ({
        cnpj: r.cnpj,
        denominacaoSocial: r.denominacao_social,
        classe: r.classe,
        situacao: r.situacao,
      })),
    });
  }

  // ─── CVM: vincular CNPJ aos ativos ─────────────────────────────────────────
  // Atualiza ativos.cnpj_fundo em lote a partir de vínculos explícitos
  // {ativoId, cnpj}. Passo manual após buscar-cnpj.
  if (pathname === "/api/admin/fundos/cvm/vincular-cnpj" && request.method === "POST") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;

    const body = vincularCnpjFundoSchema.parse(await parseJsonBody(request));
    let atualizados = 0;
    let invalidos = 0;
    const stmts: D1PreparedStatement[] = [];
    for (const v of body.vinculos) {
      const cnpj = normalizarCnpjDigitos(v.cnpj);
      if (!cnpj) { invalidos += 1; continue; }
      stmts.push(env.DB.prepare("UPDATE ativos SET cnpj_fundo = ? WHERE id = ?").bind(cnpj, v.ativoId));
      atualizados += 1;
    }
    if (stmts.length > 0) await env.DB.batch(stmts);

    return sucesso({ atualizados, invalidos });
  }

  // ─── CVM: listar fundos do usuário sem CNPJ vinculado ──────────────────────
  // Retorna ativos candidatos a receber vínculo manual de CNPJ. Facilita UI
  // futura e também diagnóstico operacional.
  if (pathname === "/api/admin/fundos/cvm/ativos-sem-cnpj" && request.method === "GET") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;

    const rs = await env.DB
      .prepare(
        "SELECT id, usuario_id, ticker, nome, categoria, quantidade, preco_medio FROM ativos WHERE categoria IN ('fundo','previdencia') AND (cnpj_fundo IS NULL OR cnpj_fundo = '') ORDER BY nome ASC LIMIT 500",
      )
      .all<{ id: string; usuario_id: string; ticker: string | null; nome: string; categoria: string; quantidade: number; preco_medio: number }>();

    return sucesso({
      ativos: (rs.results ?? []).map((r) => ({
        id: r.id,
        usuarioId: r.usuario_id,
        ticker: r.ticker,
        nome: r.nome,
        categoria: r.categoria,
        quantidade: Number(r.quantidade),
        precoMedio: Number(r.preco_medio),
      })),
    });
  }

  // ─── CVM: status da cobertura de cotas ─────────────────────────────────────
  if (pathname === "/api/admin/fundos/cvm/status" && request.method === "GET") {
    const erroAdmin = await validarAdmin();
    if (erroAdmin) return erroAdmin;

    const totais = await env.DB
      .prepare(
        "SELECT (SELECT COUNT(*) FROM cotas_fundos_cvm) AS total_cotas, (SELECT COUNT(*) FROM fundos_cvm_cadastro) AS total_cadastro, (SELECT COUNT(DISTINCT cnpj) FROM cotas_fundos_cvm) AS cnpjs_com_cota, (SELECT COUNT(*) FROM ativos WHERE categoria IN ('fundo','previdencia') AND cnpj_fundo IS NOT NULL AND cnpj_fundo != '') AS ativos_vinculados, (SELECT COUNT(*) FROM ativos WHERE categoria IN ('fundo','previdencia')) AS ativos_fundo_total",
      )
      .first<{ total_cotas: number; total_cadastro: number; cnpjs_com_cota: number; ativos_vinculados: number; ativos_fundo_total: number }>();

    return sucesso({
      totalCotas: Number(totais?.total_cotas ?? 0),
      totalCadastro: Number(totais?.total_cadastro ?? 0),
      cnpjsComCota: Number(totais?.cnpjs_com_cota ?? 0),
      ativosFundoVinculados: Number(totais?.ativos_vinculados ?? 0),
      ativosFundoTotal: Number(totais?.ativos_fundo_total ?? 0),
    });
  }

  return null;
}
