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
import { handleFinancialRoutes } from "./server/routes/financial.routes";
import { BrapiProvider } from "./server/providers/brapi.provider";
import { MarketDataService } from "./server/services/market-data.service";
import { SessionMarketService } from "./server/services/session-market.service";
import { UnifiedScoreService } from "./server/services/unified-score.service";
import { veraBridge } from "./server/services/vera-bridge";

type Env = {
  DB: D1Database;
  JWT_SECRET: string;
  ADMIN_TOKEN?: string;
  ADMIN_EMAILS?: string;
  BRAPI_TOKEN?: string;
  BRAPI_BASE_URL?: string;
  CVM_BASE_URL?: string;
  PASSWORD_RESET_WEBHOOK_URL?: string;
};

type ServiceError = { ok: false; status: number; codigo: string; mensagem: string; detalhes?: unknown };
type ServiceSuccess<T> = { ok: true; dados: T };
type ServiceResponse<T> = ServiceSuccess<T> | ServiceError;
const MASSA_TESTE_EI_RAIZ = {
  nome: "Teste EI Raiz",
  cpf: "12345678909",
  email: "teste.eiraiz+1@gmail.com",
  senha: "Teste@1234",
} as const;

const routePrefixes = ["/api/auth", "/api/carteira", "/api/importacao", "/api/perfil", "/api/insights", "/api/historico", "/api/decisoes", "/api/vera", "/api/posicoes", "/api/app", "/api/admin", "/api/telemetria", "/api/market", "/api/funds", "/api/portfolio", "/api/fipe", "/api/score"];
const forcedFinancialPrefixes = ["/api/market", "/api/funds", "/api/portfolio", "/api/fipe", "/api/score"];
const categoriasPermitidas: CategoriaAtivo[] = ["acao", "fundo", "previdencia", "renda_fixa"];

type StatusAtualizacaoMercado = "atualizado" | "atrasado" | "indisponivel";
type FonteMercado = "brapi" | "cvm" | "nenhuma";
type AtivoComMercado = {
  id: string;
  ticker: string;
  nome: string;
  categoria: CategoriaAtivo;
  plataforma: string;
  precoAtual?: number;
  variacaoPercentual?: number;
  ganhoPerda?: number;
  ganhoPerdaPercentual?: number;
  ultimaAtualizacao?: string;
  fontePreco?: FonteMercado;
  statusAtualizacao?: StatusAtualizacaoMercado;
  dataCadastro?: string;
  dataAquisicao?: string;
  valorAtual: number;
  participacao: number;
  retorno12m: number;
};

const serializarAtivoMercado = (ativo: AtivoComMercado): AtivoComMercado & {
  fonte_preco?: FonteMercado;
  status_atualizacao?: StatusAtualizacaoMercado;
  ultima_atualizacao?: string;
  data_cadastro?: string;
  data_aquisicao?: string;
} => ({
  ...ativo,
  fonte_preco: ativo.fontePreco,
  status_atualizacao: ativo.statusAtualizacao,
  ultima_atualizacao: ativo.ultimaAtualizacao,
  data_cadastro: ativo.dataCadastro,
  data_aquisicao: ativo.dataAquisicao || ativo.dataCadastro,
});

const resumirAtualizacaoMercado = (
  ativos: AtivoComMercado[],
): {
  cobertura: number;
  statusGeral: StatusAtualizacaoMercado;
  ultimaAtualizacao: string | null;
  fontes: Array<{ fonte: FonteMercado; quantidade: number }>;
  coberturaPorStatus: Record<StatusAtualizacaoMercado, number>;
  cobertura_por_status: Record<StatusAtualizacaoMercado, number>;
  status_geral: StatusAtualizacaoMercado;
  ultima_atualizacao: string | null;
} => {
  const total = ativos.length;
  const coberturaPorStatus: Record<StatusAtualizacaoMercado, number> = {
    atualizado: 0,
    atrasado: 0,
    indisponivel: 0,
  };
  const fontesMap = new Map<FonteMercado, number>();
  let ultimaAtualizacao: string | null = null;

  for (const ativo of ativos) {
    const status = ativo.statusAtualizacao ?? "indisponivel";
    coberturaPorStatus[status] += 1;
    const fonte = ativo.fontePreco ?? "nenhuma";
    fontesMap.set(fonte, (fontesMap.get(fonte) ?? 0) + 1);

    if (ativo.ultimaAtualizacao) {
      if (!ultimaAtualizacao || ativo.ultimaAtualizacao > ultimaAtualizacao) {
        ultimaAtualizacao = ativo.ultimaAtualizacao;
      }
    }
  }

  const cobertura = total > 0 ? Number(((coberturaPorStatus.atualizado / total) * 100).toFixed(2)) : 0;
  let statusGeral: StatusAtualizacaoMercado = "indisponivel";
  if (coberturaPorStatus.atualizado > 0) statusGeral = "atualizado";
  else if (coberturaPorStatus.atrasado > 0) statusGeral = "atrasado";

  const fontes = Array.from(fontesMap.entries()).map(([fonte, quantidade]) => ({ fonte, quantidade }));
  return {
    cobertura,
    statusGeral,
    ultimaAtualizacao,
    fontes,
    coberturaPorStatus,
    cobertura_por_status: coberturaPorStatus,
    status_geral: statusGeral,
    ultima_atualizacao: ultimaAtualizacao,
  };
};

const salvarPerfilSchema = z.object({
  rendaMensal: z.number().nonnegative(),
  gastoMensal: z.number().nonnegative().optional(),
  aporteMensal: z.number().nonnegative(),
  reservaCaixa: z.number().nonnegative().optional(),
  horizonte: z.string().min(2).max(100),
  perfilRisco: z.string().min(2).max(50),
  objetivo: z.string().min(2).max(120),
  frequenciaAporte: z.string().min(2).max(50).optional(),
  experienciaInvestimentos: z.string().min(2).max(80).optional(),
  toleranciaRiscoReal: z.string().min(2).max(80).optional(),
  maturidade: z.number().int().min(1).max(5),
});

const contextoFinanceiroSchema = z.object({
  objetivoPrincipal: z.string().optional(),
  objetivosSecundarios: z.array(z.string()).optional(),
  horizonte: z.enum(["curto", "medio", "longo"]).optional(),
  dependentes: z.boolean().optional(),
  faixaEtaria: z.string().optional(),
  rendaMensal: z.number().nonnegative().optional(),
  gastoMensal: z.number().nonnegative().optional(),
  aporteMensal: z.number().nonnegative().optional(),
  perfilRiscoDeclarado: z.string().optional(),
  maturidadeInvestidor: z.number().int().min(1).max(5).optional(),
  frequenciaAporte: z.string().optional(),
  experienciaInvestimentos: z.string().optional(),
  toleranciaRiscoReal: z.string().optional(),
  patrimonioExterno: z
    .object({
      imoveis: z
        .array(
          z.object({
            id: z.string().min(1),
            tipo: z.string().min(1),
            valorEstimado: z.number(),
            saldoFinanciamento: z.number().optional(),
            geraRenda: z.boolean().optional(),
          }),
        )
        .default([]),
      veiculos: z
        .array(
          z.object({
            id: z.string().min(1),
            tipo: z.string().min(1),
            valorEstimado: z.number(),
            quitado: z.boolean().optional(),
          }),
        )
        .default([]),
      poupanca: z.number().default(0),
      caixaDisponivel: z.number().default(0),
    })
    .default({ imoveis: [], veiculos: [], poupanca: 0, caixaDisponivel: 0 }),
  dividas: z
    .array(
      z.object({
        id: z.string().min(1),
        tipo: z.string().min(1),
        saldoDevedor: z.number(),
        parcelaMensal: z.number().optional(),
      }),
    )
    .default([]),
});

type ItemPatrimonioDashboard = {
  id: string;
  nome: string;
  categoria: "acao" | "fundo" | "previdencia" | "renda_fixa" | "poupanca" | "bens";
  valor: number;
  percentual: number;
};

const calcularPercentuais = (itensBase: Array<Omit<ItemPatrimonioDashboard, "percentual">>): ItemPatrimonioDashboard[] => {
  const total = itensBase.reduce((acc, item) => acc + item.valor, 0);
  return itensBase.map((item) => ({
    ...item,
    percentual: total > 0 ? Number(((item.valor / total) * 100).toFixed(4)) : 0,
  }));
};

// Schema legado CSV
const uploadImportacaoCsvSchema = z.object({
  nomeArquivo: z.string().min(1),
  conteudo: z.string().min(1),
  tipoArquivo: z.literal("csv"),
});

// Schema XLSX: itens pré-parseados no frontend por aba
const itemXlsxSchema = z.object({
  aba: z.enum(["acoes", "fundos", "imoveis", "veiculos", "poupanca"]),
  linha: z.number().int().positive(),
}).passthrough();

const uploadImportacaoXlsxSchema = z.object({
  nomeArquivo: z.string().min(1),
  tipoArquivo: z.literal("xlsx"),
  itens: z.array(itemXlsxSchema).min(1),
});

const uploadImportacaoSchema = z.union([uploadImportacaoCsvSchema, uploadImportacaoXlsxSchema]);

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

const atualizarDataAquisicaoSchema = z.object({
  dataAquisicao: z.string().min(8),
});

const vincularMovimentacaoSchema = z.object({
  ativoOrigemId: z.string().min(3),
  ativoDestinoId: z.string().min(3),
  valor: z.number().positive(),
  dataMovimentacao: z.string().min(8),
  observacao: z.string().optional(),
});

const registrarAporteSchema = z.object({
  valorAporte: z.number().positive(),
  quantidade: z.number().positive().optional(),
  precoUnitario: z.number().positive().optional(),
  dataOperacao: z.string().min(8).optional(),
  observacao: z.string().optional(),
});

const excluirAtivoSchema = z.object({
  motivo: z.string().min(5).max(280),
});

const telemetriaEventoSchema = z.object({
  nomeEvento: z.string().min(3).max(120),
  payload: z.record(z.unknown()).optional(),
  origem: z.string().min(2).max(40).optional(),
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
  pathname === "/api/admin/test-data/reset" ||
  pathname === "/api/telemetria/evento" ||
  pathname === "/api/app/content" ||
  pathname === "/api/app/corretoras" ||
  pathname === "/api/app/simulacoes/parametros" ||
  pathname.startsWith("/api/market/") ||
  pathname.startsWith("/api/funds/");

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
    notificarRecuperacaoSenha: async ({ email, token, expiraEm }) => {
      const webhook = env.PASSWORD_RESET_WEBHOOK_URL?.trim();
      if (!webhook) {
        console.log("----------------------------------------------------------");
        console.log(`[DEV] Recuperação de senha solicitada para: ${email}`);
        console.log(`[DEV] Token: ${token}`);
        console.log(`[DEV] Expira em: ${expiraEm}`);
        console.log("----------------------------------------------------------");
        return;
      }
      await fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "password_reset",
          email,
          token,
          expiraEm,
        }),
      });
    },
  });

const getPerfilService = (env: Env): ServicoPerfilPadrao => new ServicoPerfilPadrao(new RepositorioPerfilD1(env.DB));
const getHistoricoService = (env: Env): ServicoHistoricoPadrao => new ServicoHistoricoPadrao(new RepositorioHistoricoD1(env.DB));
const getInsightsService = (env: Env): ServicoInsightsPadrao => new ServicoInsightsPadrao(new RepositorioInsightsD1(env.DB));
const getCarteiraService = (env: Env): ServicoCarteiraPadrao =>
  new ServicoCarteiraPadrao({
    repositorio: new RepositorioCarteiraD1(env.DB),
    brapiToken: env.BRAPI_TOKEN,
    brapiBaseUrl: env.BRAPI_BASE_URL,
  });
const getDecisoesService = (env: Env): ServicoDecisoesPadrao => new ServicoDecisoesPadrao(new RepositorioDecisoesD1(env.DB));
const getImportacaoService = (env: Env): ServicoImportacaoPadrao =>
  new ServicoImportacaoPadrao({
    db: env.DB,
    repositorio: new RepositorioImportacaoD1(env.DB),
    parsers: [new ParserCsvGenerico()],
  });

const getMarketRefreshService = (env: Env): SessionMarketService | null => {
  const token = env.BRAPI_TOKEN?.trim();
  if (!token) return null;
  const market = new MarketDataService({
    db: env.DB,
    provider: new BrapiProvider({
      token,
      baseUrl: env.BRAPI_BASE_URL?.trim() || "https://brapi.dev/api",
    }),
  });
  return new SessionMarketService(env.DB, market);
};
const getUnifiedScoreService = (env: Env): UnifiedScoreService => new UnifiedScoreService(env.DB);

async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function resetMassaTesteEiRaiz(env: Env): Promise<{ resetado: boolean; email: string; cpf: string }> {
  const candidato = await env.DB
    .prepare("SELECT id FROM usuarios WHERE cpf = ? OR email = ? LIMIT 1")
    .bind(MASSA_TESTE_EI_RAIZ.cpf, MASSA_TESTE_EI_RAIZ.email)
    .first<{ id: string }>();

  if (candidato?.id) {
    const usuarioId = candidato.id;
    await env.DB.batch([
      env.DB.prepare("DELETE FROM telemetria_eventos WHERE usuario_id = ?").bind(usuarioId),
      env.DB.prepare("DELETE FROM simulacoes WHERE usuario_id = ?").bind(usuarioId),
      env.DB.prepare("DELETE FROM posicoes_financeiras WHERE usuario_id = ?").bind(usuarioId),
      env.DB.prepare("DELETE FROM perfil_contexto_financeiro WHERE usuario_id = ?").bind(usuarioId),
      env.DB.prepare("DELETE FROM recuperacoes_acesso WHERE usuario_id = ?").bind(usuarioId),
      env.DB.prepare("DELETE FROM usuarios WHERE id = ?").bind(usuarioId),
    ]);
  }

  await getAuthService(env).registrar(MASSA_TESTE_EI_RAIZ);
  return { resetado: true, email: MASSA_TESTE_EI_RAIZ.email, cpf: MASSA_TESTE_EI_RAIZ.cpf };
}

async function calcularRetornoCdiDesde(dataInicioIso: string): Promise<number> {
  const inicio = new Date(dataInicioIso);
  if (Number.isNaN(inicio.getTime())) return 0;
  const fim = new Date();
  const d1 = `${String(inicio.getDate()).padStart(2, "0")}/${String(inicio.getMonth() + 1).padStart(2, "0")}/${inicio.getFullYear()}`;
  const d2 = `${String(fim.getDate()).padStart(2, "0")}/${String(fim.getMonth() + 1).padStart(2, "0")}/${fim.getFullYear()}`;
  const response = await fetch(
    `https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados?formato=json&dataInicial=${encodeURIComponent(d1)}&dataFinal=${encodeURIComponent(d2)}`,
  );
  if (!response.ok) return 0;
  const series = (await response.json()) as Array<{ valor: string }>;
  if (!Array.isArray(series) || series.length === 0) return 0;
  let acumulado = 1;
  for (const ponto of series) {
    const taxa = Number.parseFloat(String(ponto.valor).replace(",", "."));
    if (Number.isFinite(taxa)) acumulado *= 1 + taxa / 100;
  }
  return Number(((acumulado - 1) * 100).toFixed(2));
}

async function dispatch(pathname: string, request: Request, env: Env, sessao: SessaoUsuarioSaida | null): Promise<ServiceResponse<unknown>> {
  const financialRoute = await handleFinancialRoutes(pathname, request, env);
  if (financialRoute) return financialRoute;

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

  if (pathname === "/api/telemetria/evento" && request.method === "POST") {
    const body = telemetriaEventoSchema.parse(await parseJsonBody(request));
    const usuarioId = sessao?.usuario?.id ?? null;
    await env.DB
      .prepare("INSERT INTO telemetria_eventos (id, usuario_id, nome_evento, payload_json, origem, criado_em) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(
        crypto.randomUUID(),
        usuarioId,
        body.nomeEvento,
        JSON.stringify(body.payload ?? {}),
        body.origem ?? "web",
        new Date().toISOString(),
      )
      .run();
    return { ok: true, dados: { registrado: true } };
  }

  if (pathname === "/api/admin/test-data/reset" && request.method === "POST") {
    const tokenHeader = request.headers.get("x-admin-token");
    if (!env.ADMIN_TOKEN || !tokenHeader || tokenHeader !== env.ADMIN_TOKEN) {
      return { ok: false, status: 403, codigo: "ACESSO_NEGADO", mensagem: "Token administrativo inválido" };
    }
    return { ok: true, dados: await resetMassaTesteEiRaiz(env) };
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
    const refresh = getMarketRefreshService(env);
    if (refresh) {
      try {
        await refresh.refreshUserListedAssets(sessao.usuario.id);
      } catch {
        // não bloqueia resposta da carteira
      }
    }
    const resumo = await carteiraService.obterResumo(sessao.usuario.id);
    const ativos = (await carteiraService.listarAtivos(sessao.usuario.id)) as AtivoComMercado[];
    const contexto = await perfilService.obterContextoFinanceiro(sessao.usuario.id);
    const patrimonioInvestimentos = ativos.reduce((acc, item) => acc + Number(item.valorAtual ?? 0), 0);
    const patrimonioImoveis = (contexto?.patrimonioExterno?.imoveis ?? []).reduce(
      (acc, item) => acc + Math.max(0, Number(item.valorEstimado ?? 0) - Number(item.saldoFinanciamento ?? 0)),
      0,
    );
    const patrimonioVeiculos = (contexto?.patrimonioExterno?.veiculos ?? []).reduce(
      (acc, item) => acc + Math.max(0, Number(item.valorEstimado ?? 0)),
      0,
    );
    const patrimonioBens = patrimonioImoveis + patrimonioVeiculos;
    const patrimonioPoupanca = Number(contexto?.patrimonioExterno?.poupanca ?? contexto?.patrimonioExterno?.caixaDisponivel ?? 0);
    const patrimonioTotalConsolidado = patrimonioInvestimentos + patrimonioBens + patrimonioPoupanca;
    const distribuicaoBase = [
      { id: "investimentos", label: "Investimentos", valor: patrimonioInvestimentos },
      { id: "bens", label: "Bens", valor: patrimonioBens },
      { id: "poupanca", label: "Poupança", valor: patrimonioPoupanca },
    ].filter((item) => item.valor > 0);
    const distribuicaoPatrimonio = distribuicaoBase.map((item) => ({
      ...item,
      percentual: patrimonioTotalConsolidado > 0 ? Number(((item.valor / patrimonioTotalConsolidado) * 100).toFixed(4)) : 0,
    }));

    const resumoConsolidado = {
      ...resumo,
      patrimonioTotal: Number(patrimonioTotalConsolidado.toFixed(2)),
      patrimonioInvestimentos: Number(patrimonioInvestimentos.toFixed(2)),
      patrimonioBens: Number(patrimonioBens.toFixed(2)),
      patrimonioPoupanca: Number(patrimonioPoupanca.toFixed(2)),
      distribuicaoPatrimonio,
    };
    try {
      const scoreInsights = await insightsService.calcularScore(sessao.usuario.id);
      return { ok: true, dados: { ...resumoConsolidado, score: scoreInsights.score } };
    } catch {
      return { ok: true, dados: resumoConsolidado };
    }
  }

  if (pathname === "/api/carteira/dashboard" && request.method === "GET") {
    const refresh = getMarketRefreshService(env);
    if (refresh) {
      try {
        await refresh.refreshUserListedAssets(sessao.usuario.id);
      } catch {
        // segue com cache
      }
    }

    const ativos = (await carteiraService.listarAtivos(sessao.usuario.id)) as AtivoComMercado[];
    const contexto = await perfilService.obterContextoFinanceiro(sessao.usuario.id);
    const itensInvestimento: Array<Omit<ItemPatrimonioDashboard, "percentual">> = ativos
      .filter((a) => Number(a.valorAtual ?? 0) > 0)
      .map((a) => ({
        id: a.id,
        nome: a.ticker || a.nome || "Ativo",
        categoria: a.categoria,
        valor: Number(a.valorAtual ?? 0),
      }));
    const itensBens: Array<Omit<ItemPatrimonioDashboard, "percentual">> = [
      ...(contexto?.patrimonioExterno?.imoveis ?? [])
        .map((item) => ({
          id: item.id,
          nome: item.tipo || "Imóvel",
          categoria: "bens" as const,
          valor: Math.max(0, Number(item.valorEstimado ?? 0) - Number(item.saldoFinanciamento ?? 0)),
        }))
        .filter((item) => item.valor > 0),
      ...(contexto?.patrimonioExterno?.veiculos ?? [])
        .map((item) => ({
          id: item.id,
          nome: item.tipo || "Veículo",
          categoria: "bens" as const,
          valor: Math.max(0, Number(item.valorEstimado ?? 0)),
        }))
        .filter((item) => item.valor > 0),
    ];
    const valorPoupanca = Number(contexto?.patrimonioExterno?.poupanca ?? contexto?.patrimonioExterno?.caixaDisponivel ?? 0);
    const itensPoupanca: Array<Omit<ItemPatrimonioDashboard, "percentual">> =
      valorPoupanca > 0 ? [{ id: "poupanca", nome: "Poupança", categoria: "poupanca", valor: valorPoupanca }] : [];
    const todosBase = [...itensInvestimento, ...itensBens, ...itensPoupanca];

    const filtros = { 
      todos: calcularPercentuais(todosBase),
      acao: calcularPercentuais(itensInvestimento.filter((item) => item.categoria === "acao")),
      fundo: calcularPercentuais(itensInvestimento.filter((item) => item.categoria === "fundo")),
      previdencia: calcularPercentuais(itensInvestimento.filter((item) => item.categoria === "previdencia")),
      renda_fixa: calcularPercentuais(itensInvestimento.filter((item) => item.categoria === "renda_fixa")),
      poupanca: calcularPercentuais(itensPoupanca),
      bens: calcularPercentuais(itensBens),
    };

    const totais = Object.fromEntries(
      Object.entries(filtros).map(([key, value]) => [key, Number(value.reduce((acc, item) => acc + item.valor, 0).toFixed(2))]),
    );

    return {
      ok: true,
      dados: {
        filtros,
        totais,
      },
    };
  }

  if (pathname === "/api/carteira/benchmark" && request.method === "GET") {
    const url = new URL(request.url);
    const meses = Number.parseInt(url.searchParams.get("meses") ?? "12", 10);
    const benchmark = await carteiraService.obterComparativoBenchmark(sessao.usuario.id, Number.isNaN(meses) ? 12 : meses);
    return {
      ok: true,
      dados: {
        ...benchmark,
        fonte_benchmark: benchmark.fonteBenchmark,
        status_atualizacao_benchmark: benchmark.statusAtualizacaoBenchmark,
        atualizado_em_benchmark: benchmark.atualizadoEmBenchmark,
      },
    };
  }

  if (pathname === "/api/carteira/ativos" && request.method === "GET") {
    const refresh = getMarketRefreshService(env);
    if (refresh) {
      try {
        await refresh.refreshUserListedAssets(sessao.usuario.id);
      } catch {
        // não bloqueia resposta da carteira
      }
    }
    const ativos = (await carteiraService.listarAtivos(sessao.usuario.id)) as AtivoComMercado[];
    return { ok: true, dados: ativos.map(serializarAtivoMercado) };
  }

  if (pathname.startsWith("/api/carteira/categoria/") && request.method === "GET") {
    const refresh = getMarketRefreshService(env);
    if (refresh) {
      try {
        await refresh.refreshUserListedAssets(sessao.usuario.id);
      } catch {
        // não bloqueia resposta da carteira
      }
    }
    const categoria = pathname.replace("/api/carteira/categoria/", "") as CategoriaAtivo;
    if (!categoriasPermitidas.includes(categoria)) {
      return { ok: false, status: 400, codigo: "CATEGORIA_INVALIDA", mensagem: "Categoria inválida" };
    }
    const detalhe = await carteiraService.obterDetalhePorCategoria(sessao.usuario.id, categoria);
    return {
      ok: true,
      dados: {
        ...detalhe,
        ativos: (detalhe.ativos as AtivoComMercado[]).map(serializarAtivoMercado),
      },
    };
  }

  if (pathname.startsWith("/api/carteira/ativo/") && request.method === "GET") {
    const ticker = decodeURIComponent(pathname.replace("/api/carteira/ativo/", ""));
    const ativos = (await carteiraService.listarAtivos(sessao.usuario.id)) as AtivoComMercado[];
    const ativo = ativos.find((item) => item.ticker === ticker);
    if (!ativo) return { ok: false, status: 404, codigo: "ATIVO_NAO_ENCONTRADO", mensagem: "Ativo não encontrado" };

    const baseComparacao = ativo.dataAquisicao || ativo.dataCadastro || new Date().toISOString().slice(0, 10);
    const inicio = new Date(baseComparacao);
    const hoje = new Date();
    const diffMeses = Math.max(1, (hoje.getFullYear() - inicio.getFullYear()) * 12 + (hoje.getMonth() - inicio.getMonth()) + 1);
    const benchmarkCarteira = await carteiraService.obterComparativoBenchmark(sessao.usuario.id, diffMeses);
    const cdiRetornoPeriodo = await calcularRetornoCdiDesde(baseComparacao);
    const ativoRetornoPeriodo =
      typeof ativo.ganhoPerdaPercentual === "number" && Number.isFinite(ativo.ganhoPerdaPercentual) ? Number(ativo.ganhoPerdaPercentual.toFixed(2)) : 0;
    const benchmark = {
      ...benchmarkCarteira,
      carteiraRetornoPeriodo: ativoRetornoPeriodo,
      cdiRetornoPeriodo,
      excessoRetorno: Number((ativoRetornoPeriodo - cdiRetornoPeriodo).toFixed(2)),
    };

    const movimentos = await env.DB
      .prepare(
        [
          "SELECT id, ativo_origem_id, ativo_destino_id, valor, data_movimentacao, observacao, criado_em",
          "FROM ativos_movimentacoes",
          "WHERE usuario_id = ? AND (ativo_origem_id = ? OR ativo_destino_id = ?)",
          "ORDER BY data_movimentacao DESC, criado_em DESC",
        ].join(" "),
      )
      .bind(sessao.usuario.id, ativo.id, ativo.id)
      .all<any>();

    const movimentosRows = movimentos.results ?? [];
    const serieTickerDesc: Array<{ data: string; valor: number }> = [
      { data: new Date().toISOString().slice(0, 10), valor: Number(ativo.valorAtual ?? 0) },
    ];
    let valorCorrente = Number(ativo.valorAtual ?? 0);
    for (const mov of movimentosRows) {
      const dataMov = String(mov.data_movimentacao ?? "").slice(0, 10);
      const valorMov = Number(mov.valor ?? 0);
      if (!dataMov || !Number.isFinite(valorMov) || valorMov <= 0) continue;
      if (mov.ativo_origem_id === ativo.id) {
        valorCorrente += valorMov;
      } else if (mov.ativo_destino_id === ativo.id) {
        valorCorrente = Math.max(0, valorCorrente - valorMov);
      }
      serieTickerDesc.push({ data: dataMov, valor: Number(valorCorrente.toFixed(2)) });
    }
    const serieTicker = [...serieTickerDesc]
      .sort((a, b) => (a.data < b.data ? -1 : 1))
      .filter((point, idx, arr) => idx === 0 || point.data !== arr[idx - 1].data);

    const importacoesAtivo = await env.DB
      .prepare(
        [
          "SELECT imp.id, imp.criado_em, imp.arquivo_nome, imp.validos",
          "FROM importacoes imp",
          "INNER JOIN itens_importacao item ON item.importacao_id = imp.id",
          "WHERE imp.usuario_id = ? AND item.ticker = ?",
          "ORDER BY imp.criado_em DESC",
          "LIMIT 20",
        ].join(" "),
      )
      .bind(sessao.usuario.id, ativo.ticker)
      .all<{ id: string; criado_em: string; arquivo_nome: string | null; validos: number | null }>();

    const eventosTicker = [
      ...(importacoesAtivo.results ?? []).map((imp) => ({
        id: `import_${imp.id}`,
        data: imp.criado_em,
        tipo: "importacao",
        descricao: `Importação ${imp.arquivo_nome ?? "manual"} impactou ${ativo.ticker}`,
      })),
      ...movimentosRows.map((mov: any) => ({
        id: `mov_${mov.id}`,
        data: mov.data_movimentacao,
        tipo: mov.ativo_origem_id === ativo.id ? "rebalanceamento_saida" : "rebalanceamento_entrada",
        descricao:
          mov.ativo_origem_id === ativo.id
            ? `Movimentação de saída vinculada (${Number(mov.valor ?? 0).toFixed(2)})`
            : `Movimentação de entrada vinculada (${Number(mov.valor ?? 0).toFixed(2)})`,
      })),
    ]
      .sort((a, b) => (a.data < b.data ? 1 : -1))
      .slice(0, 30);

    return {
      ok: true,
      dados: {
        ...serializarAtivoMercado(ativo),
        benchmarkDesdeAquisicao: benchmark,
        benchmark_desde_aquisicao: benchmark,
        dataBaseComparacao: baseComparacao,
        data_base_comparacao: baseComparacao,
        movimentacoes: movimentosRows,
        serieTicker,
        serie_ticker: serieTicker,
        eventosTicker,
        eventos_ticker: eventosTicker,
      },
    };
  }

  if (pathname.startsWith("/api/carteira/ativo/") && pathname.endsWith("/data-aquisicao") && request.method === "PUT") {
    const ativoId = decodeURIComponent(pathname.replace("/api/carteira/ativo/", "").replace("/data-aquisicao", ""));
    const body = atualizarDataAquisicaoSchema.parse(await parseJsonBody(request));
    await env.DB
      .prepare("UPDATE ativos SET data_aquisicao = ? WHERE id = ? AND usuario_id = ?")
      .bind(body.dataAquisicao, ativoId, sessao.usuario.id)
      .run();
    return {
      ok: true,
      dados: { atualizado: true, mensagem: "Data de aquisição atualizada com sucesso. Comparativos recalculados." },
    };
  }

  if (pathname === "/api/carteira/movimentacoes/vincular" && request.method === "POST") {
    const body = vincularMovimentacaoSchema.parse(await parseJsonBody(request));
    if (body.ativoOrigemId === body.ativoDestinoId) {
      return { ok: false, status: 400, codigo: "MOVIMENTACAO_INVALIDA", mensagem: "Origem e destino devem ser diferentes" };
    }

    const origem = await env.DB
      .prepare("SELECT id, ticker, quantidade, preco_medio, valor_atual FROM ativos WHERE id = ? AND usuario_id = ? LIMIT 1")
      .bind(body.ativoOrigemId, sessao.usuario.id)
      .first<{ id: string; ticker: string; quantidade: number | null; preco_medio: number | null; valor_atual: number | null }>();
    const destino = await env.DB
      .prepare("SELECT id, ticker, quantidade, preco_medio, valor_atual FROM ativos WHERE id = ? AND usuario_id = ? LIMIT 1")
      .bind(body.ativoDestinoId, sessao.usuario.id)
      .first<{ id: string; ticker: string; quantidade: number | null; preco_medio: number | null; valor_atual: number | null }>();
    if (!origem || !destino) {
      return { ok: false, status: 404, codigo: "ATIVO_NAO_ENCONTRADO", mensagem: "Origem ou destino não encontrado" };
    }

    const quantidadeOrigemAtual = Number(origem.quantidade ?? 0);
    const quantidadeDestinoAtual = Number(destino.quantidade ?? 0);
    const precoOrigem =
      (Number(origem.preco_medio ?? 0) > 0 ? Number(origem.preco_medio ?? 0) : undefined) ??
      (quantidadeOrigemAtual > 0 ? Number(origem.valor_atual ?? 0) / quantidadeOrigemAtual : undefined);
    const precoDestino =
      (Number(destino.preco_medio ?? 0) > 0 ? Number(destino.preco_medio ?? 0) : undefined) ??
      (quantidadeDestinoAtual > 0 ? Number(destino.valor_atual ?? 0) / quantidadeDestinoAtual : undefined);
    if (!precoOrigem || precoOrigem <= 0 || !precoDestino || precoDestino <= 0) {
      return {
        ok: false,
        status: 400,
        codigo: "PRECO_REFERENCIA_INVALIDO",
        mensagem: "Não foi possível calcular preço de referência para movimentação",
      };
    }

    const quantidadeOrigemMov = body.valor / precoOrigem;
    const quantidadeDestinoMov = body.valor / precoDestino;
    if (quantidadeOrigemMov > quantidadeOrigemAtual) {
      return {
        ok: false,
        status: 400,
        codigo: "SALDO_INSUFICIENTE",
        mensagem: `Saldo insuficiente em ${origem.ticker} para movimentar ${body.valor.toFixed(2)}`,
      };
    }

    const novaQuantidadeOrigem = Math.max(0, quantidadeOrigemAtual - quantidadeOrigemMov);
    const custoOrigemAtual = quantidadeOrigemAtual * Number(origem.preco_medio ?? precoOrigem);
    const novoCustoOrigem = Math.max(0, custoOrigemAtual - body.valor);
    const novoPrecoOrigem = novaQuantidadeOrigem > 0 ? novoCustoOrigem / novaQuantidadeOrigem : 0;
    const novoValorOrigem = novaQuantidadeOrigem * precoOrigem;
    const novoRetornoOrigem = novoCustoOrigem > 0 ? ((novoValorOrigem - novoCustoOrigem) / novoCustoOrigem) * 100 : 0;

    const novaQuantidadeDestino = quantidadeDestinoAtual + quantidadeDestinoMov;
    const custoDestinoAtual = quantidadeDestinoAtual * Number(destino.preco_medio ?? precoDestino);
    const novoCustoDestino = custoDestinoAtual + body.valor;
    const novoPrecoDestino = novaQuantidadeDestino > 0 ? novoCustoDestino / novaQuantidadeDestino : 0;
    const novoValorDestino = novaQuantidadeDestino * precoDestino;
    const novoRetornoDestino = novoCustoDestino > 0 ? ((novoValorDestino - novoCustoDestino) / novoCustoDestino) * 100 : 0;

    const id = crypto.randomUUID();
    const agora = new Date().toISOString();
    await env.DB.batch([
      env.DB
        .prepare("UPDATE ativos SET quantidade = ?, preco_medio = ?, valor_atual = ?, retorno_12m = ? WHERE id = ? AND usuario_id = ?")
        .bind(novaQuantidadeOrigem, novoPrecoOrigem, novoValorOrigem, novoRetornoOrigem, origem.id, sessao.usuario.id),
      env.DB
        .prepare("UPDATE ativos SET quantidade = ?, preco_medio = ?, valor_atual = ?, retorno_12m = ? WHERE id = ? AND usuario_id = ?")
        .bind(novaQuantidadeDestino, novoPrecoDestino, novoValorDestino, novoRetornoDestino, destino.id, sessao.usuario.id),
      env.DB
        .prepare(
          "INSERT INTO ativos_movimentacoes (id, usuario_id, ativo_origem_id, ativo_destino_id, valor, data_movimentacao, observacao, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(id, sessao.usuario.id, body.ativoOrigemId, body.ativoDestinoId, body.valor, body.dataMovimentacao, body.observacao ?? "", agora),
    ]);
    return {
      ok: true,
      dados: {
        id,
        mensagem: "Movimentação vinculada e aplicada nas posições com sucesso.",
        impacto: {
          origem: { ativoId: origem.id, ticker: origem.ticker, quantidadeAnterior: quantidadeOrigemAtual, quantidadeAtual: novaQuantidadeOrigem },
          destino: { ativoId: destino.id, ticker: destino.ticker, quantidadeAnterior: quantidadeDestinoAtual, quantidadeAtual: novaQuantidadeDestino },
        },
      },
    };
  }

  if (pathname.startsWith("/api/carteira/ativo/") && pathname.endsWith("/aporte") && request.method === "POST") {
    const ativoId = decodeURIComponent(pathname.replace("/api/carteira/ativo/", "").replace("/aporte", ""));
    const body = registrarAporteSchema.parse(await parseJsonBody(request));
    const atual = await env.DB
      .prepare("SELECT id, quantidade, preco_medio, valor_atual FROM ativos WHERE id = ? AND usuario_id = ? LIMIT 1")
      .bind(ativoId, sessao.usuario.id)
      .first<{ id: string; quantidade: number | null; preco_medio: number | null; valor_atual: number | null }>();
    if (!atual) {
      return { ok: false, status: 404, codigo: "ATIVO_NAO_ENCONTRADO", mensagem: "Ativo não encontrado para aporte" };
    }

    const ativosMercado = (await carteiraService.listarAtivos(sessao.usuario.id)) as AtivoComMercado[];
    const ativoMercado = ativosMercado.find((item) => item.id === ativoId);
    const quantidadeAtual = Number(atual.quantidade ?? 0);
    const precoMedioAtual = Number(atual.preco_medio ?? 0);
    const precoPorValor = quantidadeAtual > 0 ? Number(atual.valor_atual ?? 0) / quantidadeAtual : 0;
    const precoReferencia =
      body.precoUnitario ??
      ativoMercado?.precoAtual ??
      (precoMedioAtual > 0 ? precoMedioAtual : undefined) ??
      (precoPorValor > 0 ? precoPorValor : 0);
    if (!Number.isFinite(precoReferencia) || precoReferencia <= 0) {
      return { ok: false, status: 400, codigo: "PRECO_REFERENCIA_INVALIDO", mensagem: "Preço de referência inválido para aporte" };
    }

    const quantidadeAporte = body.quantidade ?? body.valorAporte / precoReferencia;
    const novaQuantidade = quantidadeAtual + quantidadeAporte;
    const custoAnterior = quantidadeAtual * Number(atual.preco_medio ?? 0);
    const novoCustoTotal = custoAnterior + body.valorAporte;
    const novoPrecoMedio = novaQuantidade > 0 ? novoCustoTotal / novaQuantidade : 0;
    const novoValorAtual = novaQuantidade * precoReferencia;
    const novoRetorno = novoCustoTotal > 0 ? ((novoValorAtual - novoCustoTotal) / novoCustoTotal) * 100 : 0;

    await env.DB
      .prepare("UPDATE ativos SET quantidade = ?, preco_medio = ?, valor_atual = ?, retorno_12m = ? WHERE id = ? AND usuario_id = ?")
      .bind(novaQuantidade, novoPrecoMedio, novoValorAtual, novoRetorno, ativoId, sessao.usuario.id)
      .run();

    return {
      ok: true,
      dados: {
        atualizado: true,
        mensagem: "Aporte registrado com sucesso.",
        data_operacao: body.dataOperacao ?? new Date().toISOString().slice(0, 10),
        observacao: body.observacao ?? "",
      },
    };
  }

  if (pathname.startsWith("/api/carteira/ativo/") && request.method === "DELETE") {
    const ativoId = decodeURIComponent(pathname.replace("/api/carteira/ativo/", ""));
    const body = excluirAtivoSchema.parse(await parseJsonBody(request));
    const existe = await env.DB
      .prepare("SELECT id, ticker, nome, categoria, valor_atual, quantidade FROM ativos WHERE id = ? AND usuario_id = ? LIMIT 1")
      .bind(ativoId, sessao.usuario.id)
      .first<{ id: string; ticker: string; nome: string; categoria: string; valor_atual: number | null; quantidade: number | null }>();
    if (!existe) {
      return { ok: false, status: 404, codigo: "ATIVO_NAO_ENCONTRADO", mensagem: "Ativo não encontrado para exclusão" };
    }
    await env.DB
      .prepare("DELETE FROM ativos WHERE id = ? AND usuario_id = ?")
      .bind(ativoId, sessao.usuario.id)
      .run();
    try {
      await env.DB
        .prepare("INSERT INTO admin_auditoria (id, acao, alvo, payload_json, autor_email, criado_em) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(
          crypto.randomUUID(),
          "carteira.ativo.excluir",
          "ativos",
          JSON.stringify({
            usuarioId: sessao.usuario.id,
            ativoId,
            ticker: existe.ticker,
            nome: existe.nome,
            categoria: existe.categoria,
            valorAtual: existe.valor_atual ?? 0,
            quantidade: existe.quantidade ?? 0,
            motivo: body.motivo,
          }),
          sessao.usuario.email,
          new Date().toISOString(),
        )
        .run();
    } catch {
      // não bloqueia exclusão se auditoria estiver indisponível
    }
    return { ok: true, dados: { removido: true, mensagem: "Ativo excluído com sucesso." } };
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
      gastoMensal: body.gastoMensal ?? existente?.gastoMensal ?? 0,
      aporteMensal: body.aporteMensal,
      reservaCaixa: body.reservaCaixa ?? existente?.reservaCaixa ?? 0,
      horizonte: body.horizonte,
      perfilRisco: body.perfilRisco,
      objetivo: body.objetivo,
      frequenciaAporte: body.frequenciaAporte ?? existente?.frequenciaAporte ?? "",
      experienciaInvestimentos: body.experienciaInvestimentos ?? existente?.experienciaInvestimentos ?? "",
      toleranciaRiscoReal: body.toleranciaRiscoReal ?? existente?.toleranciaRiscoReal ?? "",
      maturidade: body.maturidade,
    };
    return { ok: true, dados: await perfilService.salvarPerfil(payload) };
  }

  if (pathname === "/api/perfil/contexto" && request.method === "GET") {
    return { ok: true, dados: await perfilService.obterContextoFinanceiro(sessao.usuario.id) };
  }

  if (pathname === "/api/perfil/contexto" && request.method === "PUT") {
    const body = contextoFinanceiroSchema.parse(await parseJsonBody(request));
    const poupancaNormalizada = Number(body.patrimonioExterno?.poupanca ?? body.patrimonioExterno?.caixaDisponivel ?? 0);
    return {
      ok: true,
      dados: await perfilService.salvarContextoFinanceiro({
        usuarioId: sessao.usuario.id,
        ...body,
        patrimonioExterno: {
          ...body.patrimonioExterno,
          poupanca: poupancaNormalizada,
          caixaDisponivel: poupancaNormalizada,
        },
      }),
    };
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

  // Vera — Financial evaluation and insights
  if (pathname === "/api/vera/avaliar" && request.method === "POST") {
    const body = await parseJsonBody(request);
    const result = veraBridge.avaliar(body as any);
    return { ok: true, dados: result };
  }

  if (pathname === "/api/importacao/upload" && request.method === "POST") {
    const body = uploadImportacaoSchema.parse(await parseJsonBody(request));
    if (body.tipoArquivo === "xlsx") {
      const preview = await importacaoService.gerarPreview({
        usuarioId: sessao.usuario.id,
        nomeArquivo: body.nomeArquivo,
        tipoArquivo: "xlsx",
        itens: body.itens as import("@ei/contratos").ItemPatrimonioBruto[],
      });
      return { ok: true, dados: preview };
    }
    // CSV legado
    const preview = await importacaoService.gerarPreview({
      usuarioId: sessao.usuario.id,
      nomeArquivo: body.nomeArquivo,
      conteudo: body.conteudo,
      tipoArquivo: "csv",
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
    try {
      const refresh = getMarketRefreshService(env);
      if (refresh) {
        try {
          await refresh.refreshUserListedAssets(sessao.usuario.id);
        } catch {
          // refresh de mercado não pode derrubar leitura de insights
        }
      }
      const score = await insightsService.calcularScore(sessao.usuario.id);
      return { ok: true, dados: score };
    } catch (error) {
      return {
        ok: false,
        status: 500,
        codigo: "ERRO_INSIGHTS_SCORE",
        mensagem: "Falha ao calcular score de insights",
        detalhes: { message: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  if (pathname === "/api/insights/diagnostico" && request.method === "GET") {
    try {
      const refresh = getMarketRefreshService(env);
      if (refresh) {
        try {
          await refresh.refreshUserListedAssets(sessao.usuario.id);
        } catch {
          // refresh de mercado não pode derrubar leitura de insights
        }
      }
      const diagnostico = await insightsService.gerarDiagnostico(sessao.usuario.id);
      return { ok: true, dados: diagnostico };
    } catch (error) {
      return {
        ok: false,
        status: 500,
        codigo: "ERRO_INSIGHTS_DIAGNOSTICO",
        mensagem: "Falha ao gerar diagnóstico de insights",
        detalhes: { message: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  if (pathname === "/api/insights/resumo" && request.method === "GET") {
    try {
      const refresh = getMarketRefreshService(env);
      let refreshInfo: { refreshed: number; timestamp: string } | null = null;
      if (refresh) {
        try {
          refreshInfo = await refresh.refreshUserListedAssets(sessao.usuario.id);
        } catch {
          refreshInfo = null;
        }
      }
      const resumo = await insightsService.gerarResumo(sessao.usuario.id);
      let scoreUnificado: Awaited<ReturnType<UnifiedScoreService["calculateForUser"]>> | null = null;
      try {
        scoreUnificado = await getUnifiedScoreService(env).calculateForUser(sessao.usuario.id);
      } catch {
        scoreUnificado = null;
      }
      const ativosMercado = (await carteiraService.listarAtivos(sessao.usuario.id)) as AtivoComMercado[];
      const atualizacaoMercado = resumirAtualizacaoMercado(ativosMercado);
      const confiancaDiagnostico = atualizacaoMercado.statusGeral === "atualizado" ? "alta" : "limitada";
      const mensagemConfianca =
        confiancaDiagnostico === "alta"
          ? resumo.diagnostico.mensagem
          : `${resumo.diagnostico.mensagem} Atenção: parte das cotações está ${
              atualizacaoMercado.statusGeral === "atrasado" ? "atrasada" : "indisponível"
            }; revise antes de decisão crítica.`;

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
          diagnosticoFinal: {
            ...resumo.diagnostico,
            mensagem: mensagemConfianca,
          },
          insightPrincipal: resumo.diagnostico.insightPrincipal,
          penalidadesAplicadas: resumo.penalidadesAplicadas,
          impactoDecisoesRecentes: resumo.impactoDecisoesRecentes,
          patrimonioConsolidado: resumo.patrimonioConsolidado,
          patrimonio_consolidado: resumo.patrimonioConsolidado,
          pesosScoreProprietario: resumo.pesosProprietarios,
          pesos_score_proprietario: resumo.pesosProprietarios,
          scoreUnificado,
          score_unificado: scoreUnificado,
          confiancaDiagnostico,
          confianca_diagnostico: confiancaDiagnostico,
          atualizacaoMercado,
          atualizacao_mercado: atualizacaoMercado,
          dadosMercadoSessao: refreshInfo
            ? { status: "atualizado_nesta_sessao", timestamp: refreshInfo.timestamp, ativosAtualizados: refreshInfo.refreshed }
            : { status: "cache_ou_indisponivel", timestamp: null, ativosAtualizados: 0 },
          dados_mercado_sessao: refreshInfo
            ? { status: "atualizado_nesta_sessao", timestamp: refreshInfo.timestamp, ativosAtualizados: refreshInfo.refreshed }
            : { status: "cache_ou_indisponivel", timestamp: null, ativosAtualizados: 0 },
        },
      };
    } catch (error) {
      return {
        ok: false,
        status: 500,
        codigo: "ERRO_INSIGHTS_RESUMO",
        mensagem: "Falha ao gerar resumo de insights",
        detalhes: { message: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  if (pathname === "/api/score/unified/calculate" && request.method === "POST") {
    const service = getUnifiedScoreService(env);
    const body = (await parseJsonBody(request)) as Record<string, unknown>;
    const requestedUserId = String(body.userId ?? "").trim();
    const targetUserId = requestedUserId || sessao.usuario.id;
    if (targetUserId !== sessao.usuario.id) {
      const erro = await validarAdmin();
      if (erro) return erro;
    }
    return { ok: true, dados: await service.calculateForUser(targetUserId) };
  }

  if (pathname === "/api/score/unified/preview" && request.method === "POST") {
    const service = getUnifiedScoreService(env);
    const body = (await parseJsonBody(request)) as Record<string, unknown>;
    return { ok: true, dados: await service.preview(body) };
  }

  if (pathname.startsWith("/api/score/unified/") && pathname.endsWith("/history") && request.method === "GET") {
    const service = getUnifiedScoreService(env);
    const userId = pathname.replace("/api/score/unified/", "").replace("/history", "");
    const alvo = userId || sessao.usuario.id;
    if (alvo !== sessao.usuario.id) {
      const erro = await validarAdmin();
      if (erro) return erro;
    }
    return { ok: true, dados: await service.getHistory(alvo) };
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

  if (pathname === "/api/admin/auditoria/exclusoes" && request.method === "GET") {
    const erro = await validarAdmin();
    if (erro) return erro;
    const url = new URL(request.url);
    const limite = Math.max(1, Math.min(500, Number.parseInt(url.searchParams.get("limite") ?? "100", 10) || 100));
    const autorEmail = (url.searchParams.get("autorEmail") ?? "").trim().toLowerCase();
    const ticker = (url.searchParams.get("ticker") ?? "").trim().toUpperCase();
    const dataInicio = (url.searchParams.get("dataInicio") ?? "").trim();
    const dataFim = (url.searchParams.get("dataFim") ?? "").trim();

    const filtros: string[] = ["acao = 'carteira.ativo.excluir'"];
    const valores: unknown[] = [];
    if (autorEmail) {
      filtros.push("LOWER(autor_email) = ?");
      valores.push(autorEmail);
    }
    if (ticker) {
      filtros.push("UPPER(json_extract(payload_json, '$.ticker')) = ?");
      valores.push(ticker);
    }
    if (dataInicio) {
      filtros.push("criado_em >= ?");
      valores.push(dataInicio);
    }
    if (dataFim) {
      filtros.push("criado_em <= ?");
      valores.push(dataFim);
    }

    const sql = `SELECT id, acao, alvo, payload_json, autor_email, criado_em FROM admin_auditoria WHERE ${filtros.join(
      " AND ",
    )} ORDER BY criado_em DESC LIMIT ?`;
    valores.push(limite);
    const rows = await env.DB
      .prepare(sql)
      .bind(...valores)
      .all<{ id: string; acao: string; alvo: string; payload_json: string; autor_email: string; criado_em: string }>();

    return {
      ok: true,
      dados: (rows.results ?? []).map((row) => {
        let payload: Record<string, unknown> = {};
        try {
          payload = row.payload_json ? (JSON.parse(row.payload_json) as Record<string, unknown>) : {};
        } catch {
          payload = {};
        }
        return {
          id: row.id,
          acao: row.acao,
          alvo: row.alvo,
          autorEmail: row.autor_email,
          criadoEm: row.criado_em,
          motivo: String(payload.motivo ?? ""),
          usuarioId: String(payload.usuarioId ?? ""),
          ativoId: String(payload.ativoId ?? ""),
          ticker: String(payload.ticker ?? ""),
          nome: String(payload.nome ?? ""),
          categoria: String(payload.categoria ?? ""),
          valorAtual: Number(payload.valorAtual ?? 0),
          quantidade: Number(payload.quantidade ?? 0),
          payloadJson: row.payload_json,
        };
      }),
    };
  }

  if (pathname === "/api/admin/mercado/saude" && request.method === "GET") {
    const erro = await validarAdmin();
    if (erro) return erro;
    const agora = new Date().toISOString();
    const rows = await env.DB
      .prepare(
        [
          "SELECT fonte, COUNT(*) AS total,",
          "SUM(CASE WHEN erro IS NOT NULL AND erro <> '' THEN 1 ELSE 0 END) AS erros,",
          "SUM(CASE WHEN expira_em < ? THEN 1 ELSE 0 END) AS expirados,",
          "MAX(atualizado_em) AS ultima_atualizacao",
          "FROM cotacoes_ativos_cache",
          "GROUP BY fonte",
        ].join(" "),
      )
      .bind(agora)
      .all<{ fonte: string; total: number; erros: number; expirados: number; ultima_atualizacao: string | null }>();

    const slaPorFonte: Record<string, number> = { brapi: 15, cvm: 1440 };
    const saudePorFonte = (rows.results ?? []).map((row) => {
      const total = Number(row.total ?? 0);
      const erros = Number(row.erros ?? 0);
      const expirados = Number(row.expirados ?? 0);
      const slaMinutos = slaPorFonte[row.fonte] ?? 60;
      const minutosDesdeUltima =
        row.ultima_atualizacao && !Number.isNaN(new Date(row.ultima_atualizacao).getTime())
          ? Math.max(0, Math.round((Date.now() - new Date(row.ultima_atualizacao).getTime()) / 60000))
          : null;
      const status =
        total === 0 ? "indisponivel" : erros > 0 || expirados > 0 || (minutosDesdeUltima !== null && minutosDesdeUltima > slaMinutos) ? "degradado" : "saudavel";
      return {
        fonte: row.fonte,
        total,
        erros,
        expirados,
        ultimaAtualizacao: row.ultima_atualizacao,
        minutosDesdeUltima,
        slaMinutos,
        coberturaAtualizada: total > 0 ? Number((((total - expirados) / total) * 100).toFixed(2)) : 0,
        status,
      };
    });

    return {
      ok: true,
      dados: {
        referencia: agora,
        sla: { acoesMinutos: 15, fundosMinutos: 1440 },
        fontes: saudePorFonte,
        statusGeral: saudePorFonte.some((item) => item.status === "degradado")
          ? "degradado"
          : saudePorFonte.some((item) => item.status === "indisponivel")
            ? "indisponivel"
            : "saudavel",
      },
    };
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
    if (!pathname.startsWith("/api/")) {
      return json({ ok: false, erro: { codigo: "ROTA_INVALIDA", mensagem: "Prefixo de rota inválido" } }, 404);
    }
    const isAllowedPrefix = routePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
    const isForcedFinancialPrefix = forcedFinancialPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
    if (!isAllowedPrefix && !isForcedFinancialPrefix) {
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
