import type { Env } from '../../infra/bd';
import { criarBd } from '../../infra/bd';
import { erro, lerJson, metodoNaoPermitido, naoEncontrado, type ServiceResponse } from '../../infra/http';
import type { ContextoSessao } from '../../infra/sessao';
import { servicoPatrimonio } from './patrimonio.servico';

export async function rotearPatrimonio(
  caminho: string,
  request: Request,
  env: Env,
  sessao: ContextoSessao | null,
): Promise<ServiceResponse<unknown>> {
  if (!sessao) return erro('nao_autenticado', 'Sessão não encontrada', 401);
  const servico = servicoPatrimonio(criarBd(env));
  const metodo = request.method.toUpperCase();

  if (caminho === '/api/patrimonio/resumo' && metodo === 'GET') return servico.resumo(sessao.usuarioId);
  if (caminho === '/api/patrimonio/itens' && metodo === 'GET') return servico.listarItens(sessao.usuarioId);
  if (caminho === '/api/patrimonio/itens' && metodo === 'POST') {
    return servico.criarItem(sessao.usuarioId, await lerJson(request) as never);
  }

  const mItem = caminho.match(/^\/api\/patrimonio\/itens\/([^/]+)$/);
  if (mItem) {
    const id = mItem[1];
    if (metodo === 'GET') return servico.obterItem(sessao.usuarioId, id);
    if (metodo === 'PATCH') return servico.atualizarItem(sessao.usuarioId, id, await lerJson(request) as never);
    if (metodo === 'DELETE') return servico.removerItem(sessao.usuarioId, id);
    return metodoNaoPermitido(metodo);
  }

  if (caminho === '/api/patrimonio/aportes' && metodo === 'GET') return servico.listarAportes(sessao.usuarioId);
  if (caminho === '/api/patrimonio/aportes' && metodo === 'POST') {
    return servico.criarAporte(sessao.usuarioId, await lerJson(request) as never);
  }

  const mAporte = caminho.match(/^\/api\/patrimonio\/aportes\/([^/]+)$/);
  if (mAporte && metodo === 'DELETE') return servico.removerAporte(sessao.usuarioId, mAporte[1]);

  if (caminho === '/api/patrimonio/historico' && metodo === 'GET') return servico.historico(sessao.usuarioId);
  if (caminho === '/api/patrimonio/score' && metodo === 'GET') return servico.score(sessao.usuarioId);

  if (caminho === '/api/patrimonio/importacoes' && metodo === 'POST') {
    return servico.criarImportacao(sessao.usuarioId, await lerJson(request) as never);
  }
  const mImp = caminho.match(/^\/api\/patrimonio\/importacoes\/([^/]+)$/);
  if (mImp && metodo === 'GET') return servico.obterImportacao(sessao.usuarioId, mImp[1]);

  return caminho.startsWith('/api/patrimonio') ? naoEncontrado() : metodoNaoPermitido(metodo);
}
