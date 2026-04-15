import { ErroImportacao, ParserCsvGenerico, RepositorioImportacaoD1, ServicoImportacaoPadrao } from "@ei/servico-importacao";
import type { ItemPatrimonioBruto, SessaoUsuarioSaida } from "@ei/contratos";
import { z } from "zod";
import type { Env, ServiceResponse } from "../types/gateway";
import { parseJsonBody, sucesso } from "../types/gateway";
import { orquestrarPosEscritaCarteira } from "../jobs/portfolio-orchestrator.job";

const uploadImportacaoCsvSchema = z.object({
  nomeArquivo: z.string().min(1),
  conteudo: z.string().min(1),
  tipoArquivo: z.literal("csv"),
});

const itemXlsxSchema = z.object({ aba: z.enum(["acoes", "fundos", "imoveis", "veiculos", "poupanca"]), linha: z.number().int().positive() }).passthrough();

const uploadImportacaoXlsxSchema = z.object({
  nomeArquivo: z.string().min(1),
  tipoArquivo: z.literal("xlsx"),
  itens: z.array(itemXlsxSchema).min(1),
});

const uploadImportacaoSchema = z.union([uploadImportacaoCsvSchema, uploadImportacaoXlsxSchema]);

const confirmarImportacaoSchema = z.object({
  itensValidos: z.array(z.number().int().positive()),
});

export async function handleImportacaoRoutes(
  pathname: string,
  request: Request,
  env: Env,
  sessao: SessaoUsuarioSaida | null,
  ctx: ExecutionContext,
): Promise<ServiceResponse<unknown> | null> {
  if (!sessao) return null;
  if (!pathname.startsWith("/api/importacao")) return null;

  const userId = sessao.usuario.id;
  const importacaoService = new ServicoImportacaoPadrao({
    db: env.DB,
    repositorio: new RepositorioImportacaoD1(env.DB),
    parsers: [new ParserCsvGenerico()],
  });

  if (pathname === "/api/importacao/upload" && request.method === "POST") {
    const body = uploadImportacaoSchema.parse(await parseJsonBody(request));
    if (body.tipoArquivo === "xlsx") {
      const preview = await importacaoService.gerarPreview({
        usuarioId: userId,
        nomeArquivo: body.nomeArquivo,
        tipoArquivo: "xlsx",
        itens: body.itens as ItemPatrimonioBruto[],
      });
      return sucesso(preview);
    }
    const preview = await importacaoService.gerarPreview({
      usuarioId: userId,
      nomeArquivo: body.nomeArquivo,
      conteudo: body.conteudo,
      tipoArquivo: "csv",
    });
    return sucesso(preview);
  }

  if (pathname.startsWith("/api/importacao/") && pathname.endsWith("/preview") && request.method === "GET") {
    const importacaoId = pathname.replace("/api/importacao/", "").replace("/preview", "");
    return sucesso(await importacaoService.obterPreview(importacaoId));
  }

  if (pathname.startsWith("/api/importacao/") && pathname.endsWith("/confirmar") && request.method === "POST") {
    const importacaoId = pathname.replace("/api/importacao/", "").replace("/confirmar", "");
    const body = confirmarImportacaoSchema.parse(await parseJsonBody(request));
    const confirmacao = await importacaoService.confirmarImportacao(importacaoId, body.itensValidos);
    // Após importação confirmada: orquestra refresh + snapshot (sequencial, sem duplicação)
    ctx.waitUntil(orquestrarPosEscritaCarteira(userId, env));
    return sucesso(confirmacao);
  }

  return null;
}
