import type {
  AcaoPrioritaria,
  CalcularSimulacaoEntrada,
  CategoriaAtivo,
  CriarPosicaoFinanceiraEntrada,
  PerfilFinanceiro,
  PosicaoFinanceira,
  RiscoPrincipal,
  SessaoUsuarioSaida,
} from "@ei/contratos";
import { ErroAutenticacao, RepositorioAutenticacaoD1, ServicoAutenticacaoPadrao } from "@ei/servico-autenticacao";
import { RepositorioCarteiraD1, ServicoCarteiraPadrao } from "@ei/servico-carteira";
import { RepositorioHistoricoD1, ServicoHistoricoPadrao } from "@ei/servico-historico";
import { ErroImportacao, ParserCsvGenerico, RepositorioImportacaoD1, ServicoImportacaoPadrao } from "@ei/servico-importacao";
import { RepositorioInsightsD1, ServicoInsightsPadrao } from "@ei/servico-insights";
import { RepositorioDecisoesD1, ServicoDecisoesPadrao } from "@ei/servico-decisoes";
import { RepositorioPerfilD1, ServicoPerfilPadrao } from "@ei/servico-perfil";
import { ZodError, z } from "zod";
import {
  atualizarConteudoApp,
  atualizarCorretorasSuportadas,
  atualizarFeatureFlags,
  atualizarMenus,
  atualizarScoreConfig,
  definirAdmin,
  listarAdmins,
  obterAppConfig,
  obterConteudoApp,
  obterCorretorasSuportadas,
  obterLogsAuditoriaAdmin,
  usuarioEhAdmin,
} from "./configuracao-produto";

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  ADMIN_TOKEN?: string;
  ADMIN_EMAILS?: string;
};

type ServiceError = { ok: false; status: number; codigo: string; mensagem: string; detalhes?: unknown };
type ServiceSuccess<T> = { ok: true; dados: T };
type ServiceResponse<T> = ServiceSuccess<T> | ServiceError;

const routePrefixes = ["/api/auth", "/api/carteira", "/api/importacao", "/api/perfil", "/api/insights", "/api/historico", "/api/decisoes", "/api/posicoes", "/api/app", "/api/admin"];
const categoriasPermitidas: CategoriaAtivo[] = ["acao", "fundo", "previdencia", "renda_fixa"];

const salvarPerfilSchema = z.object({
  rendaMensal: z.number().nonnegative(),
  aporteMensal: z.number().nonnegative(),
  horizonte: z.string().min(2).max(100),
  perfilRisco: z.string().min(2).max(50),
  objetivo: z.string().min(2).max(120),
  maturidade: z.number().int().min(1).max(5),
});

const uploadImportacaoSchema = z.object({
  nomeArquivo: z.string().min(1),
  conteudo: z.string().min(1),
  tipoArquivo: z.literal("csv"),
});

const confirmarImportacaoSchema = z.object({
  itensValidos: z.array(z.number().int().positive()),
});

const atualizarScoreConfigSchema = z.object({
  score: z.record(z.unknown()),
});

const atualizarFlagsSchema = z.object({
  flags: z.record(z.boolean()),
});

const atualizarMenusSchema = z.object({
  menus: z.array(
    z.object({
      chave: z.string().min(1),
      label: z.string().min(1),
      path: z.string().min(1),
      ordem: z.number().int().nonnegative(),
      visivel: z.boolean(),
    }),
  ),
});

const blocoConteudoSchema = z.object({
  chave: z.string().min(2),
  modulo: z.string().min(2),
  tipo: z.enum(["texto", "markdown", "json", "boolean"]),
  valor: z.string(),
  visivel: z.boolean(),
  ordem: z.number().int().nonnegative(),
});

const atualizarConteudoSchema = z.object({
  blocos: z.array(blocoConteudoSchema),
});

const corretoraSchema = z.object({
  codigo: z.string().min(2),
  nome: z.string().min(2),
  status: z.enum(["ativo", "beta", "planejado"]),
  mensagemAjuda: z.string().min(2),
});

const atualizarCorretorasSchema = z.object({
  corretoras: z.array(corretoraSchema),
});

const atualizarAdminSchema = z.object({
  email: z.string().email(),
  ativo: z.boolean(),
});

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

const simulacaoCalculoSchema = z.object({
  tipo: z.enum(["imovel", "carro", "reserva_ou_financiar", "gastar_ou_investir", "livre"]),
  nome: z.string().min(2).optional(),
  premissas: z.record(z.unknown()),
});

const atualizarParametrosSimulacaoSchema = z.object({
  parametros: z.array(
    z.object({
      chave: z.string().min(2),
      valor: z.record(z.unknown()),
      descricao: z.string().optional(),
      ativo: z.boolean().default(true),
    }),
  ),
});

const corsHeaders = (): Record<string, string> => ({
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
  "access-control-allow-headers": "authorization,content-type,x-admin-token",
});

const json = (payload: unknown, status = 200): Response =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders(),
      "content-type": "application/json; charset=utf-8",
    },
  });

const isPublicRoute = (pathname: string): boolean =>
  pathname === "/api/auth/registrar" ||
  pathname === "/api/auth/registro" ||
  pathname === "/api/auth/entrar" ||
  pathname === "/api/auth/login" ||
  pathname === "/api/auth/verificar-cadastro" ||
  pathname === "/api/auth/recuperar-senha" ||
  pathname === "/api/auth/recuperar-acesso" ||
  pathname === "/api/auth/redefinir-senha" ||
  pathname === "/api/app/content" ||
  pathname === "/api/app/corretoras" ||
  pathname === "/api/app/simulacoes/parametros";

const extrairToken = (request: Request): string | null => {
  const auth = request.headers.get("authorization");
  if (!auth) return null;
  const [tipo, token] = auth.split(" ");
  if (!tipo || !token || tipo.toLowerCase() !== "bearer") return null;
  return token;
};

const getAuthService = (env: Env): ServicoAutenticacaoPadrao =>
  new ServicoAutenticacaoPadrao({
    repositorio: new RepositorioAutenticacaoD1(env.DB),
    segredoJWT: env.JWT_SECRET || "dev-secret",
  });

const getPerfilService = (env: Env): ServicoPerfilPadrao => new ServicoPerfilPadrao(new RepositorioPerfilD1(env.DB));
const getHistoricoService = (env: Env): ServicoHistoricoPadrao => new ServicoHistoricoPadrao(new RepositorioHistoricoD1(env.DB));
const getInsightsService = (env: Env): ServicoInsightsPadrao => new ServicoInsightsPadrao(new RepositorioInsightsD1(env.DB));
const getCarteiraService = (env: Env): ServicoCarteiraPadrao => new ServicoCarteiraPadrao({ repositorio: new RepositorioCarteiraD1(env.DB) });
const getDecisoesService = (env: Env): ServicoDecisoesPadrao => new ServicoDecisoesPadrao(new RepositorioDecisoesD1(env.DB));
const getImportacaoService = (env: Env): ServicoImportacaoPadrao =>
  new ServicoImportacaoPadrao({
    db: env.DB,
    repositorio: new RepositorioImportacaoD1(env.DB),
    parsers: [new ParserCsvGenerico()],
  });

async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function dispatch(pathname: string, request: Request, env: Env, sessao: SessaoUsuarioSaida | null): Promise<ServiceResponse<unknown>> {
  const authService = getAuthService(env);
  const carteiraService = getCarteiraService(env);
  const perfilService = getPerfilService(env);
  const historicoService = getHistoricoService(env);
  const insightsService = getInsightsService(env);
  const decisoesService = getDecisoesService(env);
  const importacaoService = getImportacaoService(env);

  if ((pathname === "/api/auth/registrar" || pathname === "/api/auth/registro") && request.method === "POST") {
    const body = await parseJsonBody(request);
    return { ok: true, dados: await authService.registrar(body as never) };
  }

  if ((pathname === "/api/auth/entrar" || pathname === "/api/auth/login") && request.method === "POST") {
    const body = await parseJsonBody(request);
    return { ok: true, dados: await authService.entrar(body as never) };
  }

  if (pathname === "/api/auth/verificar-cadastro" && request.method === "POST") {
    const body = await parseJsonBody(request);
    return { ok: true, dados: await authService.verificarCadastro(body as never) };
  }

  if (pathname === "/api/auth/recuperar-senha" && request.method === "POST") {
    const body = await parseJsonBody(request);
    return { ok: true, dados: await authService.solicitarRecuperacaoPorEmail(body as never) };
  }

  if (pathname === "/api/auth/recuperar-acesso" && request.method === "POST") {
    const body = await parseJsonBody(request);
    return { ok: true, dados: await authService.solicitarRecuperacaoPorCpf(body as never) };
  }

  if (pathname === "/api/auth/redefinir-senha" && request.method === "POST") {
    const body = await parseJsonBody(request);
    return { ok: true, dados: await authService.redefinirSenha(body as never) };
  }

  if (pathname === "/api/auth/eu" && request.method === "GET") {
    if (!sessao) return { ok: false, status: 401, codigo: "NAO_AUTORIZADO", mensagem: "Token ausente" };
    return { ok: true, dados: sessao };
  }

  if (pathname === "/api/app/content" && request.method === "GET") {
    return { ok: true, dados: await obterConteudoApp(env.DB) };
  }

  if (pathname === "/api/app/corretoras" && request.method === "GET") {
    return { ok: true, dados: await obterCorretorasSuportadas(env.DB) };
  }

  if (pathname === "/api/app/simulacoes/parametros" && request.method === "GET") {
    const rows = await env.DB
      .prepare("SELECT chave, valor_json, descricao, ativo, atualizado_em FROM simulacoes_parametros WHERE ativo = 1 ORDER BY chave ASC")
      .all<{ chave: string; valor_json: string; descricao: string | null; ativo: number; atualizado_em: string }>();
    return {
      ok: true,
      dados: (rows.results ?? []).map((row) => ({
        chave: row.chave,
        valor: row.valor_json ? JSON.parse(row.valor_json) : {},
        descricao: row.descricao ?? "",
        ativo: row.ativo === 1,
        atualizadoEm: row.atualizado_em,
      })),
    };
  }

  if (!sessao) return { ok: false, status: 401, codigo: "NAO_AUTORIZADO", mensagem: "Token ausente" };

  const validarAdmin = async (): Promise<ServiceError | null> => {
    const autorizado = await usuarioEhAdmin(env.DB, sessao.usuario.email, {
      adminTokenHeader: request.headers.get("x-admin-token"),
      adminTokenEnv: env.ADMIN_TOKEN,
      adminEmailsEnv: env.ADMIN_EMAILS,
    });
    if (!autorizado) return { ok: false, status: 403, codigo: "ACESSO_NEGADO", mensagem: "Acesso administrativo negado" };
    return null;
  };

  if (pathname === "/api/app/config" && request.method === "GET") {
    return { ok: true, dados: await obterAppConfig(env.DB) };
  }

  if (pathname === "/api/carteira/resumo" && request.method === "GET") {
    return { ok: true, dados: await carteiraService.obterResumo(sessao.usuario.id) };
  }

  if (pathname === "/api/carteira/ativos" && request.method === "GET") {
    return { ok: true, dados: await carteiraService.listarAtivos(sessao.usuario.id) };
  }

  if (pathname.startsWith("/api/carteira/categoria/") && request.method === "GET") {
    const categoria = pathname.replace("/api/carteira/categoria/", "") as CategoriaAtivo;
    if (!categoriasPermitidas.includes(categoria)) {
      return { ok: false, status: 400, codigo: "CATEGORIA_INVALIDA", mensagem: "Categoria inválida" };
    }
    return { ok: true, dados: await carteiraService.obterDetalhePorCategoria(sessao.usuario.id, categoria) };
  }

  if (pathname === "/api/perfil" && request.method === "GET") {
    return { ok: true, dados: await perfilService.obterPerfil(sessao.usuario.id) };
  }

  if (pathname === "/api/perfil" && request.method === "PUT") {
    const body = salvarPerfilSchema.parse(await parseJsonBody(request));
    const existente = await perfilService.obterPerfil(sessao.usuario.id);
    const payload: PerfilFinanceiro = {
      id: existente?.id ?? `perf_${sessao.usuario.id}`,
      usuarioId: sessao.usuario.id,
      rendaMensal: body.rendaMensal,
      aporteMensal: body.aporteMensal,
      horizonte: body.horizonte,
      perfilRisco: body.perfilRisco,
      objetivo: body.objetivo,
      maturidade: body.maturidade,
    };
    return { ok: true, dados: await perfilService.salvarPerfil(payload) };
  }

  if (pathname === "/api/perfil/plataformas" && request.method === "GET") {
    return { ok: true, dados: await perfilService.listarPlataformas(sessao.usuario.id) };
  }

  if (pathname === "/api/historico/snapshots" && request.method === "GET") {
    const url = new URL(request.url);
    const limite = Number.parseInt(url.searchParams.get("limite") ?? "12", 10);
    return { ok: true, dados: await historicoService.listarSnapshots(sessao.usuario.id, Number.isNaN(limite) ? 12 : limite) };
  }

  if (pathname === "/api/historico/eventos" && request.method === "GET") {
    const url = new URL(request.url);
    const limite = Number.parseInt(url.searchParams.get("limite") ?? "12", 10);
    return { ok: true, dados: await historicoService.listarEventos(sessao.usuario.id, Number.isNaN(limite) ? 12 : limite) };
  }

  if (pathname === "/api/posicoes" && request.method === "GET") {
    const rows = await env.DB
      .prepare(
        "SELECT id, usuario_id, tipo, nome, valor_atual, custo_aquisicao, liquidez, risco, categoria, metadata_json, criado_em, atualizado_em FROM posicoes_financeiras WHERE usuario_id = ? AND ativo = 1 ORDER BY atualizado_em DESC",
      )
      .bind(sessao.usuario.id)
      .all<any>();
    const dados: PosicaoFinanceira[] = (rows.results ?? []).map((row: any) => ({
      id: row.id,
      usuarioId: row.usuario_id,
      tipo: row.tipo,
      nome: row.nome,
      valorAtual: row.valor_atual ?? 0,
      custoAquisicao: typeof row.custo_aquisicao === "number" ? row.custo_aquisicao : undefined,
      liquidez: row.liquidez,
      risco: row.risco,
      categoria: row.categoria,
      metadata: row.metadata_json ? JSON.parse(row.metadata_json) : {},
      criadoEm: row.criado_em,
      atualizadoEm: row.atualizado_em,
    }));
    return { ok: true, dados };
  }

  if (pathname === "/api/posicoes" && request.method === "POST") {
    const body = posicaoSchema.parse(await parseJsonBody(request)) as CriarPosicaoFinanceiraEntrada;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await env.DB
      .prepare(
        [
          "INSERT INTO posicoes_financeiras",
          "(id, usuario_id, tipo, nome, valor_atual, custo_aquisicao, liquidez, risco, categoria, metadata_json, ativo, criado_em, atualizado_em)",
          "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)",
        ].join(" "),
      )
      .bind(
        id,
        sessao.usuario.id,
        body.tipo,
        body.nome,
        body.valorAtual,
        body.custoAquisicao ?? null,
        body.liquidez,
        body.risco,
        body.categoria,
        JSON.stringify(body.metadata ?? {}),
        now,
        now,
      )
      .run();
    return { ok: true, dados: { id, usuarioId: sessao.usuario.id, ...body, criadoEm: now, atualizadoEm: now } };
  }

  if (pathname.startsWith("/api/posicoes/") && request.method === "PUT") {
    const id = pathname.replace("/api/posicoes/", "");
    const body = posicaoSchema.partial().parse(await parseJsonBody(request)) as Partial<CriarPosicaoFinanceiraEntrada>;
    const now = new Date().toISOString();
    await env.DB
      .prepare(
        [
          "UPDATE posicoes_financeiras SET",
          "tipo = COALESCE(?, tipo),",
          "nome = COALESCE(?, nome),",
          "valor_atual = COALESCE(?, valor_atual),",
          "custo_aquisicao = COALESCE(?, custo_aquisicao),",
          "liquidez = COALESCE(?, liquidez),",
          "risco = COALESCE(?, risco),",
          "categoria = COALESCE(?, categoria),",
          "metadata_json = COALESCE(?, metadata_json),",
          "atualizado_em = ?",
          "WHERE id = ? AND usuario_id = ? AND ativo = 1",
        ].join(" "),
      )
      .bind(
        body.tipo ?? null,
        body.nome ?? null,
        typeof body.valorAtual === "number" ? body.valorAtual : null,
        typeof body.custoAquisicao === "number" ? body.custoAquisicao : null,
        body.liquidez ?? null,
        body.risco ?? null,
        body.categoria ?? null,
        body.metadata ? JSON.stringify(body.metadata) : null,
        now,
        id,
        sessao.usuario.id,
      )
      .run();
    return { ok: true, dados: { atualizado: true } };
  }

  if (pathname.startsWith("/api/posicoes/") && request.method === "DELETE") {
    const id = pathname.replace("/api/posicoes/", "");
    await env.DB
      .prepare("UPDATE posicoes_financeiras SET ativo = 0, atualizado_em = ? WHERE id = ? AND usuario_id = ?")
      .bind(new Date().toISOString(), id, sessao.usuario.id)
      .run();
    return { ok: true, dados: { removido: true } };
  }

  if (pathname === "/api/decisoes/simulacoes/calcular" && request.method === "POST") {
    const body = simulacaoCalculoSchema.parse(await parseJsonBody(request)) as CalcularSimulacaoEntrada;
    return { ok: true, dados: await decisoesService.calcular(sessao.usuario.id, body) };
  }

  if (pathname === "/api/decisoes/simulacoes" && request.method === "POST") {
    const body = simulacaoCalculoSchema.parse(await parseJsonBody(request)) as CalcularSimulacaoEntrada;
    return { ok: true, dados: await decisoesService.salvar(sessao.usuario.id, body) };
  }

  if (pathname === "/api/decisoes/simulacoes" && request.method === "GET") {
    return { ok: true, dados: await decisoesService.listar(sessao.usuario.id) };
  }

  if (pathname.startsWith("/api/decisoes/simulacoes/") && pathname.endsWith("/recalcular") && request.method === "POST") {
    const id = pathname.replace("/api/decisoes/simulacoes/", "").replace("/recalcular", "");
    const recalculado = await decisoesService.recalcular(sessao.usuario.id, id);
    if (!recalculado) return { ok: false, status: 404, codigo: "SIMULACAO_NAO_ENCONTRADA", mensagem: "Simulação não encontrada" };
    return { ok: true, dados: recalculado };
  }

  if (pathname.startsWith("/api/decisoes/simulacoes/") && pathname.endsWith("/duplicar") && request.method === "POST") {
    const id = pathname.replace("/api/decisoes/simulacoes/", "").replace("/duplicar", "");
    const duplicada = await decisoesService.duplicar(sessao.usuario.id, id);
    if (!duplicada) return { ok: false, status: 404, codigo: "SIMULACAO_NAO_ENCONTRADA", mensagem: "Simulação não encontrada" };
    return { ok: true, dados: duplicada };
  }

  if (pathname.startsWith("/api/decisoes/simulacoes/") && pathname.endsWith("/historico") && request.method === "GET") {
    const id = pathname.replace("/api/decisoes/simulacoes/", "").replace("/historico", "");
    return { ok: true, dados: await decisoesService.listarHistorico(sessao.usuario.id, id) };
  }

  if (pathname.startsWith("/api/decisoes/simulacoes/") && request.method === "GET") {
    const id = pathname.replace("/api/decisoes/simulacoes/", "");
    const simulacao = await decisoesService.obter(sessao.usuario.id, id);
    if (!simulacao) return { ok: false, status: 404, codigo: "SIMULACAO_NAO_ENCONTRADA", mensagem: "Simulação não encontrada" };
    return { ok: true, dados: simulacao };
  }

  if (pathname === "/api/importacao/upload" && request.method === "POST") {
    const body = uploadImportacaoSchema.parse(await parseJsonBody(request));
    const preview = await importacaoService.gerarPreview({
      usuarioId: sessao.usuario.id,
      nomeArquivo: body.nomeArquivo,
      conteudo: body.conteudo,
      tipoArquivo: body.tipoArquivo,
    });
    return { ok: true, dados: preview };
  }

  if (pathname.startsWith("/api/importacao/") && pathname.endsWith("/preview") && request.method === "GET") {
    const importacaoId = pathname.replace("/api/importacao/", "").replace("/preview", "");
    return { ok: true, dados: await importacaoService.obterPreview(importacaoId) };
  }

  if (pathname.startsWith("/api/importacao/") && pathname.endsWith("/confirmar") && request.method === "POST") {
    const importacaoId = pathname.replace("/api/importacao/", "").replace("/confirmar", "");
    const body = confirmarImportacaoSchema.parse(await parseJsonBody(request));
    const confirmacao = await importacaoService.confirmarImportacao(importacaoId, body.itensValidos);
    return { ok: true, dados: confirmacao };
  }
  if (pathname === "/api/insights/score" && request.method === "GET") {
    const score = await insightsService.calcularScore(sessao.usuario.id);
    return { ok: true, dados: score };
  }

  if (pathname === "/api/insights/diagnostico" && request.method === "GET") {
    const diagnostico = await insightsService.gerarDiagnostico(sessao.usuario.id);
    return { ok: true, dados: diagnostico };
  }

  if (pathname === "/api/insights/resumo" && request.method === "GET") {
    const resumo = await insightsService.gerarResumo(sessao.usuario.id);
    return {
      ok: true,
      dados: {
        scoreGeral: resumo.scoreDetalhado.score,
        pilares: resumo.scoreDetalhado.pilares,
        score: resumo.scoreDetalhado,
        diagnostico: resumo.diagnosticoLegado,
        riscoPrincipal: (resumo.riscoPrincipal ?? null) as RiscoPrincipal | null,
        acaoPrioritaria: (resumo.acaoPrioritaria ?? null) as AcaoPrioritaria | null,
        retorno: resumo.retorno,
        classificacao: resumo.classificacao,
        diagnosticoFinal: resumo.diagnostico,
        insightPrincipal: resumo.diagnostico.insightPrincipal,
        penalidadesAplicadas: resumo.penalidadesAplicadas,
        impactoDecisoesRecentes: resumo.impactoDecisoesRecentes,
      },
    };
  }

  if (pathname === "/api/admin/config" && request.method === "GET") {
    const erro = await validarAdmin();
    if (erro) return erro;
    return { ok: true, dados: await obterAppConfig(env.DB, { incluirOcultos: true }) };
  }

  if (pathname === "/api/admin/me" && request.method === "GET") {
    return {
      ok: true,
      dados: {
        email: sessao.usuario.email,
        isAdmin: !(await validarAdmin()),
      },
    };
  }

  if (pathname === "/api/admin/content" && request.method === "GET") {
    const erro = await validarAdmin();
    if (erro) return erro;
    return { ok: true, dados: await obterConteudoApp(env.DB, { incluirOcultos: true }) };
  }

  if (pathname === "/api/admin/config/score" && request.method === "PUT") {
    const erro = await validarAdmin();
    if (erro) return erro;
    const body = atualizarScoreConfigSchema.parse(await parseJsonBody(request));
    await atualizarScoreConfig(env.DB, body.score, sessao.usuario.email);
    return { ok: true, dados: { atualizado: true } };
  }

  if (pathname === "/api/admin/config/flags" && request.method === "PUT") {
    const erro = await validarAdmin();
    if (erro) return erro;
    const body = atualizarFlagsSchema.parse(await parseJsonBody(request));
    await atualizarFeatureFlags(env.DB, body.flags, sessao.usuario.email);
    return { ok: true, dados: { atualizado: true } };
  }

  if (pathname === "/api/admin/config/menus" && request.method === "PUT") {
    const erro = await validarAdmin();
    if (erro) return erro;
    const body = atualizarMenusSchema.parse(await parseJsonBody(request));
    await atualizarMenus(env.DB, body.menus, sessao.usuario.email);
    return { ok: true, dados: { atualizado: true } };
  }

  if (pathname === "/api/admin/content" && request.method === "PUT") {
    const erro = await validarAdmin();
    if (erro) return erro;
    const body = atualizarConteudoSchema.parse(await parseJsonBody(request));
    await atualizarConteudoApp(env.DB, body.blocos, sessao.usuario.email);
    return { ok: true, dados: { atualizado: true } };
  }

  if (pathname === "/api/admin/corretoras" && request.method === "GET") {
    const erro = await validarAdmin();
    if (erro) return erro;
    return { ok: true, dados: await obterCorretorasSuportadas(env.DB) };
  }

  if (pathname === "/api/admin/corretoras" && request.method === "PUT") {
    const erro = await validarAdmin();
    if (erro) return erro;
    const body = atualizarCorretorasSchema.parse(await parseJsonBody(request));
    await atualizarCorretorasSuportadas(env.DB, body.corretoras, sessao.usuario.email);
    return { ok: true, dados: { atualizado: true } };
  }

  if (pathname === "/api/admin/simulacoes/parametros" && request.method === "GET") {
    const erro = await validarAdmin();
    if (erro) return erro;
    const rows = await env.DB
      .prepare("SELECT id, chave, valor_json, descricao, origem, ativo, atualizado_em FROM simulacoes_parametros ORDER BY chave ASC")
      .all<any>();
    return {
      ok: true,
      dados: (rows.results ?? []).map((row: any) => ({
        id: row.id,
        chave: row.chave,
        valor: row.valor_json ? JSON.parse(row.valor_json) : {},
        descricao: row.descricao ?? "",
        origem: row.origem ?? "admin",
        ativo: row.ativo === 1,
        atualizadoEm: row.atualizado_em,
      })),
    };
  }

  if (pathname === "/api/admin/simulacoes/parametros" && request.method === "PUT") {
    const erro = await validarAdmin();
    if (erro) return erro;
    const body = atualizarParametrosSimulacaoSchema.parse(await parseJsonBody(request));
    const now = new Date().toISOString();
    const stmts = body.parametros.map((item) =>
      env.DB
        .prepare(
          [
            "INSERT INTO simulacoes_parametros (id, chave, valor_json, descricao, origem, ativo, atualizado_em)",
            "VALUES (?, ?, ?, ?, 'admin', ?, ?)",
            "ON CONFLICT(chave) DO UPDATE SET",
            "valor_json = excluded.valor_json, descricao = excluded.descricao, origem = 'admin', ativo = excluded.ativo, atualizado_em = excluded.atualizado_em",
          ].join(" "),
        )
        .bind(crypto.randomUUID(), item.chave, JSON.stringify(item.valor ?? {}), item.descricao ?? "", item.ativo ? 1 : 0, now),
    );
    if (stmts.length > 0) await env.DB.batch(stmts);
    await env.DB
      .prepare("INSERT INTO admin_auditoria (id, acao, alvo, payload_json, autor_email, criado_em) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), "simulacoes.parametros.atualizar", "simulacoes_parametros", JSON.stringify({ quantidade: body.parametros.length }), sessao.usuario.email, now)
      .run();
    return { ok: true, dados: { atualizado: true } };
  }

  if (pathname === "/api/admin/usuarios" && request.method === "GET") {
    const erro = await validarAdmin();
    if (erro) return erro;
    return { ok: true, dados: await listarAdmins(env.DB) };
  }

  if (pathname === "/api/admin/usuarios" && request.method === "POST") {
    const erro = await validarAdmin();
    if (erro) return erro;
    const body = atualizarAdminSchema.parse(await parseJsonBody(request));
    await definirAdmin(env.DB, body.email, body.ativo, sessao.usuario.email);
    return { ok: true, dados: { atualizado: true } };
  }

  if (pathname === "/api/admin/auditoria" && request.method === "GET") {
    const erro = await validarAdmin();
    if (erro) return erro;
    const url = new URL(request.url);
    const limite = Number.parseInt(url.searchParams.get("limite") ?? "50", 10);
    return { ok: true, dados: await obterLogsAuditoriaAdmin(env.DB, Number.isNaN(limite) ? 50 : limite) };
  }

  if (pathname === "/api/admin/bootstrap" && request.method === "POST") {
    const tokenHeader = request.headers.get("x-admin-token");
    if (!env.ADMIN_TOKEN || !tokenHeader || tokenHeader !== env.ADMIN_TOKEN) {
      return { ok: false, status: 403, codigo: "ACESSO_NEGADO", mensagem: "Token administrativo inválido" };
    }
    await definirAdmin(env.DB, sessao.usuario.email, true, sessao.usuario.email);
    return { ok: true, dados: { atualizado: true } };
  }

  return { ok: false, status: 404, codigo: "ROTA_NAO_ENCONTRADA", mensagem: "Rota não encontrada" };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });
    if (!routePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      return json({ ok: false, erro: { codigo: "ROTA_INVALIDA", mensagem: "Prefixo de rota inválido" } }, 404);
    }

    try {
      let sessao: SessaoUsuarioSaida | null = null;
      if (!isPublicRoute(pathname)) {
        const token = extrairToken(request);
        if (!token) {
          return json({ ok: false, erro: { codigo: "NAO_AUTORIZADO", mensagem: "Token ausente" } }, 401);
        }
        sessao = await getAuthService(env).obterSessao(token);
      }

      const resultado = await dispatch(pathname, request, env, sessao);
      if (!resultado.ok) {
        return json(
          { ok: false, erro: { codigo: resultado.codigo, mensagem: resultado.mensagem, detalhes: resultado.detalhes } },
          resultado.status,
        );
      }
      return json({ ok: true, dados: resultado.dados }, 200);
    } catch (error) {
      if (error instanceof ZodError) {
        return json({ ok: false, erro: { codigo: "VALIDACAO", mensagem: "Payload inválido", detalhes: error.flatten() } }, 422);
      }

      if (error instanceof ErroAutenticacao) {
        return json({ ok: false, erro: { codigo: error.codigo, mensagem: error.message } }, error.status);
      }
      if (error instanceof ErroImportacao) {
        return json(
          { ok: false, erro: { codigo: error.codigo, mensagem: error.message, detalhes: error.detalhes } },
          error.status,
        );
      }

      return json({ ok: false, erro: { codigo: "ERRO_INTERNO", mensagem: "Falha interna no gateway" } }, 500);
    }
  },
};
