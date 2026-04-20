import type { Env } from '../../infra/bd';
import { criarBd } from '../../infra/bd';
import { erro, lerJson, metodoNaoPermitido, naoEncontrado, type ServiceResponse } from '../../infra/http';
import type { ContextoSessao } from '../../infra/sessao';
import { servicoAdmin } from './admin.servico';

export async function rotearAdmin(
  caminho: string,
  request: Request,
  env: Env,
  sessao: ContextoSessao | null,
): Promise<ServiceResponse<unknown>> {
  const servico = servicoAdmin(criarBd(env), env);
  const metodo = request.method.toUpperCase();

  if (caminho === '/api/admin/entrar' && metodo === 'POST') {
    return servico.entrar(await lerJson(request) as never);
  }

  if (!sessao) return erro('nao_autenticado', 'Sessão não encontrada', 401);

  if (caminho === '/api/admin/usuarios' && metodo === 'GET') return servico.listarUsuarios(sessao.email);
  if (caminho === '/api/admin/auditoria' && metodo === 'GET') return servico.auditoria(sessao.email);
  if (caminho === '/api/admin/cvm' && metodo === 'GET') return servico.ingestoesCvm(sessao.email);

  return caminho.startsWith('/api/admin') ? naoEncontrado() : metodoNaoPermitido(metodo);
}
