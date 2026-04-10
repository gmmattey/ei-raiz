import type {
  AcaoPrioritaria,
  CategoriaAtivo,
  PerfilFinanceiro,
  RiscoPrincipal,
  SessaoUsuarioSaida,
} from "@ei/contratos";
import { ErroAutenticacao, RepositorioAutenticacaoD1, ServicoAutenticacaoPadrao } from "@ei/servico-autenticacao";
import { RepositorioCarteiraD1, ServicoCarteiraPadrao } from "@ei/servico-carteira";
import { RepositorioHistoricoD1, ServicoHistoricoPadrao } from "@ei/servico-historico";
import { ErroImportacao, ParserCsvGenerico, RepositorioImportacaoD1, ServicoImportacaoPadrao } from "@ei/servico-importacao";
import { RepositorioInsightsD1, ServicoInsightsPadrao } from "@ei/servico-insights";
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

const routePrefixes = ["/api/auth", "/api/carteira", "/api/importacao", "/api/perfil", "/api/insights", "/api/historico", "/api/app", "/api/admin"];
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
  pathname === "/api/app/corretoras";

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
        score: resumo.scoreDetalhado,
        diagnostico: resumo.diagnosticoLegado,
        riscoPrincipal: (resumo.riscoPrincipal ?? null) as RiscoPrincipal | null,
        acaoPrioritaria: (resumo.acaoPrioritaria ?? null) as AcaoPrioritaria | null,
        retorno: resumo.retorno,
        classificacao: resumo.classificacao,
        diagnosticoFinal: resumo.diagnostico,
        insightPrincipal: resumo.diagnostico.insightPrincipal,
        penalidadesAplicadas: resumo.penalidadesAplicadas,
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
