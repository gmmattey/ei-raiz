import { RepositorioPerfilD1, ServicoPerfilPadrao } from "@ei/servico-perfil";
import type { PerfilFinanceiro, SessaoUsuarioSaida } from "@ei/contratos";
import { z } from "zod";
import type { Env, ServiceResponse } from "../types/gateway";
import { parseJsonBody, sucesso } from "../types/gateway";

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
      imoveis: z.array(z.object({ id: z.string().min(1), tipo: z.string().min(1), valorEstimado: z.number(), saldoFinanciamento: z.number().optional(), geraRenda: z.boolean().optional() })).default([]),
      veiculos: z.array(z.object({ id: z.string().min(1), tipo: z.string().min(1), valorEstimado: z.number(), quitado: z.boolean().optional() })).default([]),
      poupanca: z.number().default(0),
      caixaDisponivel: z.number().default(0),
    })
    .default({ imoveis: [], veiculos: [], poupanca: 0, caixaDisponivel: 0 }),
  dividas: z.array(z.object({ id: z.string().min(1), tipo: z.string().min(1), saldoDevedor: z.number(), parcelaMensal: z.number().optional() })).default([]),
});

export async function handlePerfilRoutes(
  pathname: string,
  request: Request,
  env: Env,
  sessao: SessaoUsuarioSaida | null,
): Promise<ServiceResponse<unknown> | null> {
  if (!sessao) return null;
  if (!pathname.startsWith("/api/perfil")) return null;

  const userId = sessao.usuario.id;
  const perfilService = new ServicoPerfilPadrao(new RepositorioPerfilD1(env.DB));

  if (pathname === "/api/perfil" && request.method === "GET") {
    return sucesso(await perfilService.obterPerfil(userId));
  }

  if (pathname === "/api/perfil" && request.method === "PUT") {
    const body = salvarPerfilSchema.parse(await parseJsonBody(request));
    const existente = await perfilService.obterPerfil(userId);
    const payload: PerfilFinanceiro = {
      id: existente?.id ?? `perf_${userId}`,
      usuarioId: userId,
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
    return sucesso(await perfilService.salvarPerfil(payload));
  }

  if (pathname === "/api/perfil/contexto" && request.method === "GET") {
    return sucesso(await perfilService.obterContextoFinanceiro(userId));
  }

  if (pathname === "/api/perfil/contexto" && request.method === "PUT") {
    const body = contextoFinanceiroSchema.parse(await parseJsonBody(request));
    const poupancaNormalizada = Number(body.patrimonioExterno?.poupanca ?? body.patrimonioExterno?.caixaDisponivel ?? 0);
    return sucesso(
      await perfilService.salvarContextoFinanceiro({
        usuarioId: userId,
        ...body,
        patrimonioExterno: { ...body.patrimonioExterno, poupanca: poupancaNormalizada, caixaDisponivel: poupancaNormalizada },
      }),
    );
  }

  if (pathname === "/api/perfil/plataformas" && request.method === "GET") {
    return sucesso(await perfilService.listarPlataformas(userId));
  }

  return null;
}
