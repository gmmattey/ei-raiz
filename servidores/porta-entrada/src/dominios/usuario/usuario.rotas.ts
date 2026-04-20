import type { Env } from '../../infra/bd';
import { criarBd } from '../../infra/bd';
import { erro, lerJson, metodoNaoPermitido, naoEncontrado, type ServiceResponse } from '../../infra/http';
import type { ContextoSessao } from '../../infra/sessao';
import { servicoUsuario } from './usuario.servico';

export async function rotearUsuario(
  caminho: string,
  request: Request,
  env: Env,
  sessao: ContextoSessao | null,
): Promise<ServiceResponse<unknown>> {
  if (!sessao) return erro('nao_autenticado', 'Sessão não encontrada', 401);
  const servico = servicoUsuario(criarBd(env));
  const metodo = request.method.toUpperCase();

  if (caminho === '/api/usuario' && metodo === 'GET') return servico.obter(sessao.usuarioId);
  if (caminho === '/api/usuario' && metodo === 'PATCH') {
    return servico.atualizar(sessao.usuarioId, await lerJson(request) as never);
  }
  if (caminho === '/api/usuario/preferencias' && metodo === 'GET') return servico.obterPreferencias(sessao.usuarioId);
  if (caminho === '/api/usuario/preferencias' && metodo === 'PATCH') {
    return servico.atualizarPreferencias(sessao.usuarioId, await lerJson(request) as never);
  }
  if (caminho === '/api/usuario/plataformas' && metodo === 'GET') return servico.listarPlataformas(sessao.usuarioId);

  return caminho.startsWith('/api/usuario') ? naoEncontrado() : metodoNaoPermitido(metodo);
}
