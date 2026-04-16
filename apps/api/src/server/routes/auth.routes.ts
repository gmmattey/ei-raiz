import { ErroAutenticacao, RepositorioAutenticacaoD1, ServicoAutenticacaoPadrao } from "@ei/servico-autenticacao";
import {
  FonteDadosReconstrucaoD1,
  RepositorioFilaReconstrucaoD1,
  RepositorioHistoricoMensalD1,
  ServicoReconstrucaoCarteiraPadrao,
} from "@ei/servico-historico";
import type { SessaoUsuarioSaida } from "@ei/contratos";
import type { Env, ServiceResponse } from "../types/gateway";
import { parseJsonBody, sucesso } from "../types/gateway";
import { construirProvedorHistoricoCotacoes } from "../services/provedor-historico-cotacoes";

const TAMANHO_LOTE_AUTORECONSTRUCAO = 6;

/**
 * Dispara reconstrução retroativa em background após login — idempotente.
 * Se o usuário já tem fila concluída, `enfileirar()` retorna o estado existente
 * e `processarProximoLote()` vira no-op. Falhas são silenciadas (o cron D-1
 * segue gravando o ponto corrente de qualquer forma).
 */
async function autoReconstruirHistorico(env: Env, usuarioId: string): Promise<void> {
  try {
    const servico = new ServicoReconstrucaoCarteiraPadrao({
      fila: new RepositorioFilaReconstrucaoD1(env.DB),
      historicoMensal: new RepositorioHistoricoMensalD1(env.DB),
      fonte: new FonteDadosReconstrucaoD1(env.DB),
      provedorHistorico: construirProvedorHistoricoCotacoes(env),
    });
    await servico.enfileirar(usuarioId);
    await servico.processarProximoLote(usuarioId, TAMANHO_LOTE_AUTORECONSTRUCAO);
  } catch {
    // fail-silent: não impede o login
  }
}

const MASSA_TESTE_EI_RAIZ = {
  nome: "Teste EI Raiz",
  cpf: "12345678909",
  email: "teste.eiraiz+1@gmail.com",
  senha: "Teste@1234",
} as const;

export function buildAuthService(env: Env): ServicoAutenticacaoPadrao {
  return new ServicoAutenticacaoPadrao({
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
        body: JSON.stringify({ type: "password_reset", email, token, expiraEm }),
      });
    },
  });
}

export async function resetMassaTesteEiRaiz(env: Env): Promise<{ resetado: boolean; email: string; cpf: string }> {
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
      env.DB.prepare("DELETE FROM ativos WHERE usuario_id = ?").bind(usuarioId),
      env.DB.prepare("DELETE FROM usuarios WHERE id = ?").bind(usuarioId),
    ]);
  }

  const authService = buildAuthService(env);
  const { usuario } = await authService.registrar(MASSA_TESTE_EI_RAIZ);
  const usuarioId = usuario.id;

  const agora = new Date().toISOString();
  const umAnoAtras = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

  await env.DB
    .prepare("INSERT INTO perfil_contexto_financeiro (id, usuario_id, contexto_json, atualizado_em) VALUES (?, ?, ?, ?)")
    .bind(
      `ctx_${usuarioId}`,
      usuarioId,
      JSON.stringify({ patrimonioExterno: { poupanca: 5000, caixaDisponivel: 5000, imoveis: [], veiculos: [] }, dividas: [] }),
      agora,
    )
    .run();

  const ativos = [
    { id: `ativo_1_${usuarioId}`, ticker: "PETR4", nome: "Petrobras PN", categoria: "acao", plataforma: "Massa Teste", quantidade: 10, precoMedio: 30.5, valorAtual: 32.0 },
    { id: `ativo_2_${usuarioId}`, ticker: "VGIR11", nome: "Vanguard Índice", categoria: "fundo", plataforma: "Massa Teste", quantidade: 5, precoMedio: 90.0, valorAtual: 92.5 },
    { id: `ativo_3_${usuarioId}`, ticker: "BBSE3", nome: "BB Seguridade", categoria: "acao", plataforma: "Massa Teste", quantidade: 20, precoMedio: 15.0, valorAtual: 15.8 },
  ];

  for (const ativo of ativos) {
    const valorAtual = ativo.quantidade * ativo.valorAtual;
    const participacao = (valorAtual / (valorAtual + 462.5 + 5000)) * 100;
    const retorno12m = ((ativo.valorAtual - ativo.precoMedio) / ativo.precoMedio) * 100;
    await env.DB
      .prepare(
        "INSERT INTO ativos (id, usuario_id, ticker, nome, categoria, plataforma, quantidade, preco_medio, valor_atual, participacao, retorno_12m, data_cadastro, data_aquisicao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(ativo.id, usuarioId, ativo.ticker, ativo.nome, ativo.categoria, ativo.plataforma, ativo.quantidade, ativo.precoMedio, ativo.valorAtual, participacao, retorno12m, umAnoAtras, umAnoAtras)
      .run();
  }

  return { resetado: true, email: MASSA_TESTE_EI_RAIZ.email, cpf: MASSA_TESTE_EI_RAIZ.cpf };
}

export async function handleAuthRoutes(
  pathname: string,
  request: Request,
  env: Env,
  sessao: SessaoUsuarioSaida | null,
  ctx?: ExecutionContext,
): Promise<ServiceResponse<unknown> | null> {
  const authService = buildAuthService(env);

  if ((pathname === "/api/auth/registrar" || pathname === "/api/auth/registro") && request.method === "POST") {
    const body = await parseJsonBody(request);
    return sucesso(await authService.registrar(body as never));
  }

  if ((pathname === "/api/auth/entrar" || pathname === "/api/auth/login") && request.method === "POST") {
    const body = (await parseJsonBody(request)) as { email?: string; senha?: string };
    const disparaReconstrucao = (saida: SessaoUsuarioSaida): void => {
      const usuarioId = saida?.usuario?.id;
      if (!usuarioId || !ctx) return;
      ctx.waitUntil(autoReconstruirHistorico(env, usuarioId));
    };
    try {
      const saida = await authService.entrar(body as never);
      disparaReconstrucao(saida);
      return sucesso(saida);
    } catch (e) {
      if (body.email === MASSA_TESTE_EI_RAIZ.email && body.senha === MASSA_TESTE_EI_RAIZ.senha) {
        await resetMassaTesteEiRaiz(env);
        const saida = await authService.entrar(body as never);
        disparaReconstrucao(saida);
        return sucesso(saida);
      }
      throw e;
    }
  }

  if (pathname === "/api/auth/verificar-cadastro" && request.method === "POST") {
    const body = await parseJsonBody(request);
    return sucesso(await authService.verificarCadastro(body as never));
  }

  if (pathname === "/api/auth/recuperar-senha" && request.method === "POST") {
    const body = await parseJsonBody(request);
    return sucesso(await authService.solicitarRecuperacaoPorEmail(body as never));
  }

  if (pathname === "/api/auth/recuperar-acesso" && request.method === "POST") {
    const body = await parseJsonBody(request);
    return sucesso(await authService.solicitarRecuperacaoPorCpf(body as never));
  }

  if (pathname === "/api/auth/redefinir-senha" && request.method === "POST") {
    const body = await parseJsonBody(request);
    return sucesso(await authService.redefinirSenha(body as never));
  }

  if (pathname === "/api/auth/eu" && request.method === "GET") {
    if (!sessao) return { ok: false, status: 401, codigo: "NAO_AUTORIZADO", mensagem: "Token ausente" };
    return sucesso(sessao);
  }

  return null;
}
