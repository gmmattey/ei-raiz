import type { Env, Bd } from '../../infra/bd';
import { criarBd } from '../../infra/bd';
import { erro, lerJson, metodoNaoPermitido, naoEncontrado, sucesso, type ServiceResponse } from '../../infra/http';
import type { ContextoSessao } from '../../infra/sessao';
import { servicoAuth } from './auth.servico';

export async function rotearAuth(
  caminho: string,
  request: Request,
  env: Env,
  sessao: ContextoSessao | null,
): Promise<ServiceResponse<unknown>> {
  const bd: Bd = criarBd(env);
  const servico = servicoAuth(bd, env);
  const metodo = request.method.toUpperCase();

  if (caminho === '/api/auth/registrar' && metodo === 'POST') {
    return servico.registrar(await lerJson(request) as never);
  }
  if (caminho === '/api/auth/entrar' && metodo === 'POST') {
    return servico.entrar(await lerJson(request) as never);
  }
  if (caminho === '/api/auth/sair' && metodo === 'POST') {
    return sucesso({ saiu: true });
  }
  if (caminho === '/api/auth/sessao' && metodo === 'GET') {
    if (!sessao) return erro('nao_autenticado', 'Sessão não encontrada', 401);
    return servico.sessao(sessao.usuarioId);
  }
  if (caminho === '/api/auth/recuperar/iniciar' && metodo === 'POST') {
    return servico.recuperarIniciar(await lerJson(request) as never);
  }
  if (caminho === '/api/auth/recuperar/confirmar' && metodo === 'POST') {
    return servico.recuperarConfirmar(await lerJson(request) as never);
  }
  if (caminho === '/api/auth/recuperar/redefinir' && metodo === 'POST') {
    return servico.recuperarRedefinir(await lerJson(request) as never);
  }

  if (caminho.startsWith('/api/auth/')) {
    return metodo === 'OPTIONS' ? sucesso({}) : naoEncontrado();
  }
  return metodoNaoPermitido(metodo);
}
