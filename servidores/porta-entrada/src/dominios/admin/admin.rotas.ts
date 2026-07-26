import type { Env } from '../../infra/bd';
import { criarBd } from '../../infra/bd';
import { erro, lerJson, metodoNaoPermitido, naoEncontrado, type ServiceResponse } from '../../infra/http';
import type { ContextoSessao } from '../../infra/sessao';
import { z } from 'zod';
import { servicoAdmin } from './admin.servico';
import { servicoCvmIngestao } from './cvm-ingestao.servico';

const execucaoSchema = z.object({
  referenciaAnoMes: z.string().regex(/^\d{4}-\d{2}$/),
  origemExecucao: z.enum(['manual', 'scheduled', 'github_action', 'trigger']),
});

const cotasSchema = z.object({
  execucaoId: z.string().min(1),
  itens: z.array(z.object({
    cnpj: z.string().min(1),
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    valorCota: z.number().positive(),
    patrimonioLiquidoBrl: z.number().finite().optional(),
  })).min(1).max(5000),
});

const finalizarSchema = z.object({
  status: z.enum(['concluido', 'falhou']).optional(),
  arquivosProcessados: z.number().int().nonnegative().optional(),
  registrosLidos: z.number().int().nonnegative().optional(),
  registrosValidos: z.number().int().nonnegative().optional(),
  registrosInvalidos: z.number().int().nonnegative().optional(),
  erroResumo: z.string().max(500).optional(),
});

export async function rotearAdmin(
  caminho: string,
  request: Request,
  env: Env,
  sessao: ContextoSessao | null,
): Promise<ServiceResponse<unknown>> {
  const servico = servicoAdmin(criarBd(env), env);
  const cvm = servicoCvmIngestao(criarBd(env));
  const metodo = request.method.toUpperCase();
  const tokenServicoCvm = caminho.startsWith('/api/admin/cvm/') && !!env.ADMIN_TOKEN && (
    request.headers.get('x-admin-token') === env.ADMIN_TOKEN
    || request.headers.get('authorization') === `Bearer ${env.ADMIN_TOKEN}`
  );

  if (caminho === '/api/admin/entrar' && metodo === 'POST') {
    return servico.entrar(await lerJson(request) as never);
  }

  if (tokenServicoCvm && caminho === '/api/admin/cvm/execucoes' && metodo === 'POST') {
    return cvm.abrirExecucao(execucaoSchema.parse(await lerJson(request)));
  }
  if (tokenServicoCvm && caminho === '/api/admin/cvm/cotas' && metodo === 'POST') {
    const entrada = cotasSchema.parse(await lerJson(request));
    return cvm.ingerirCotas(entrada.execucaoId, entrada.itens);
  }
  const execucao = caminho.match(/^\/api\/admin\/cvm\/execucoes\/([^/]+)$/);
  if (tokenServicoCvm && execucao && metodo === 'PATCH') {
    return cvm.finalizarExecucao(execucao[1], finalizarSchema.parse(await lerJson(request)));
  }

  if (!sessao) return erro('nao_autenticado', 'Sessão não encontrada', 401);

  if (caminho === '/api/admin/usuarios' && metodo === 'GET') return servico.listarUsuarios(sessao.email);
  if (caminho === '/api/admin/auditoria' && metodo === 'GET') return servico.auditoria(sessao.email);
  if (caminho === '/api/admin/cvm' && metodo === 'GET') return servico.ingestoesCvm(sessao.email);

  return caminho.startsWith('/api/admin') ? naoEncontrado() : metodoNaoPermitido(metodo);
}
