import type { TipoAtivo } from '@ei/contratos';
import type { Env } from '../../infra/bd';
import { criarBd } from '../../infra/bd';
import { metodoNaoPermitido, naoEncontrado, type ServiceResponse } from '../../infra/http';
import type { ContextoSessao } from '../../infra/sessao';
import { servicoMercado } from './mercado.servico';

export async function rotearMercado(
  caminho: string,
  request: Request,
  env: Env,
  _sessao: ContextoSessao | null,
): Promise<ServiceResponse<unknown>> {
  const servico = servicoMercado(criarBd(env));
  const metodo = request.method.toUpperCase();
  const url = new URL(request.url);

  if (caminho === '/api/mercado/ativos' && metodo === 'GET') {
    const q = url.searchParams.get('q') ?? '';
    const tipo = (url.searchParams.get('tipo') as TipoAtivo | null) ?? undefined;
    const limite = Number.parseInt(url.searchParams.get('limite') ?? '20', 10);
    return servico.buscar({ q, tipo, limite });
  }

  const mAtivo = caminho.match(/^\/api\/mercado\/ativos\/([^/]+)$/);
  if (mAtivo && metodo === 'GET') return servico.obterPorTicker(mAtivo[1]);

  const mHist = caminho.match(/^\/api\/mercado\/ativos\/([^/]+)\/historico$/);
  if (mHist && metodo === 'GET') return servico.historico(mHist[1]);

  const mFundo = caminho.match(/^\/api\/mercado\/fundos-cvm\/([^/]+)$/);
  if (mFundo && metodo === 'GET') return servico.obterFundo(mFundo[1]);

  if (caminho.startsWith('/api/mercado/')) return naoEncontrado();
  return metodoNaoPermitido(metodo);
}
