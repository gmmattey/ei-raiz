import type { Env } from '../../infra/bd';
import { criarBd } from '../../infra/bd';
import { erro, lerJson, metodoNaoPermitido, naoEncontrado, type ServiceResponse } from '../../infra/http';
import type { ContextoSessao } from '../../infra/sessao';
import { servicoDecisoes } from './decisoes.servico';

export async function rotearDecisoes(
  caminho: string,
  request: Request,
  env: Env,
  sessao: ContextoSessao | null,
): Promise<ServiceResponse<unknown>> {
  if (!sessao) return erro('nao_autenticado', 'Sessão não encontrada', 401);
  const servico = servicoDecisoes(criarBd(env), env);
  const metodo = request.method.toUpperCase();

  if (caminho === '/api/decisoes/simulacoes' && metodo === 'GET') return servico.listar(sessao.usuarioId);
  if (caminho === '/api/decisoes/simulacoes' && metodo === 'POST') {
    return servico.criar(sessao.usuarioId, await lerJson(request) as never);
  }
  const mSim = caminho.match(/^\/api\/decisoes\/simulacoes\/([^/]+)$/);
  if (mSim && metodo === 'GET') return servico.obter(sessao.usuarioId, mSim[1]);

  if (caminho === '/api/decisoes/vera/mensagens' && metodo === 'POST') {
    return servico.veraEnviarMensagem(sessao.usuarioId, await lerJson(request) as never);
  }

  return caminho.startsWith('/api/decisoes') ? naoEncontrado() : metodoNaoPermitido(metodo);
}
