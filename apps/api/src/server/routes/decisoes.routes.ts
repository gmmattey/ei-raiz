import { RepositorioDecisoesD1, ServicoDecisoesPadrao } from "@ei/servico-decisoes";
import type { CalcularSimulacaoEntrada, SessaoUsuarioSaida } from "@ei/contratos";
import { z } from "zod";
import type { Env, ServiceResponse } from "../types/gateway";
import { parseJsonBody, sucesso, erro } from "../types/gateway";

const simulacaoCalculoSchema = z.object({
  tipo: z.enum(["imovel", "carro", "reserva_ou_financiar", "gastar_ou_investir", "livre"]),
  nome: z.string().min(2).optional(),
  premissas: z.record(z.unknown()),
});

export async function handleDecisoesRoutes(
  pathname: string,
  request: Request,
  env: Env,
  sessao: SessaoUsuarioSaida | null,
): Promise<ServiceResponse<unknown> | null> {
  if (!sessao) return null;
  if (!pathname.startsWith("/api/decisoes")) return null;

  const userId = sessao.usuario.id;
  const decisoesService = new ServicoDecisoesPadrao(new RepositorioDecisoesD1(env.DB));

  if (pathname === "/api/decisoes/simulacoes/calcular" && request.method === "POST") {
    const body = simulacaoCalculoSchema.parse(await parseJsonBody(request)) as CalcularSimulacaoEntrada;
    return sucesso(await decisoesService.calcular(userId, body));
  }

  if (pathname === "/api/decisoes/simulacoes" && request.method === "POST") {
    const body = simulacaoCalculoSchema.parse(await parseJsonBody(request)) as CalcularSimulacaoEntrada;
    return sucesso(await decisoesService.salvar(userId, body));
  }

  if (pathname === "/api/decisoes/simulacoes" && request.method === "GET") {
    return sucesso(await decisoesService.listar(userId));
  }

  if (pathname.startsWith("/api/decisoes/simulacoes/") && pathname.endsWith("/recalcular") && request.method === "POST") {
    const id = pathname.replace("/api/decisoes/simulacoes/", "").replace("/recalcular", "");
    const recalculado = await decisoesService.recalcular(userId, id);
    if (!recalculado) return erro("SIMULACAO_NAO_ENCONTRADA", "Simulação não encontrada", 404);
    return sucesso(recalculado);
  }

  if (pathname.startsWith("/api/decisoes/simulacoes/") && pathname.endsWith("/duplicar") && request.method === "POST") {
    const id = pathname.replace("/api/decisoes/simulacoes/", "").replace("/duplicar", "");
    const duplicada = await decisoesService.duplicar(userId, id);
    if (!duplicada) return erro("SIMULACAO_NAO_ENCONTRADA", "Simulação não encontrada", 404);
    return sucesso(duplicada);
  }

  if (pathname.startsWith("/api/decisoes/simulacoes/") && pathname.endsWith("/historico") && request.method === "GET") {
    const id = pathname.replace("/api/decisoes/simulacoes/", "").replace("/historico", "");
    return sucesso(await decisoesService.listarHistorico(userId, id));
  }

  if (pathname.startsWith("/api/decisoes/simulacoes/") && request.method === "GET") {
    const id = pathname.replace("/api/decisoes/simulacoes/", "");
    const simulacao = await decisoesService.obter(userId, id);
    if (!simulacao) return erro("SIMULACAO_NAO_ENCONTRADA", "Simulação não encontrada", 404);
    return sucesso(simulacao);
  }

  return null;
}
