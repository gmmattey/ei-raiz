import type { Env } from '../../infra/bd';
import { criarBd } from '../../infra/bd';
import { erro, lerJson, metodoNaoPermitido, naoEncontrado, type ServiceResponse } from '../../infra/http';
import type { ContextoSessao } from '../../infra/sessao';
import { servicoPerfil } from './perfil.servico';

export async function rotearPerfil(
  caminho: string,
  request: Request,
  env: Env,
  sessao: ContextoSessao | null,
): Promise<ServiceResponse<unknown>> {
  if (!sessao) return erro('nao_autenticado', 'Sessão não encontrada', 401);
  const servico = servicoPerfil(criarBd(env));
  const metodo = request.method.toUpperCase();

  if (caminho === '/api/perfil' && metodo === 'GET') return servico.obter(sessao.usuarioId);
  if (caminho === '/api/perfil' && metodo === 'PUT') {
    return servico.salvar(sessao.usuarioId, await lerJson(request) as never);
  }

  return caminho.startsWith('/api/perfil') ? naoEncontrado() : metodoNaoPermitido(metodo);
}
