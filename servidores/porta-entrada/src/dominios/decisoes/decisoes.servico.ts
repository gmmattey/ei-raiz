import type {
  SimulacaoSaida, SimulacaoCriarEntrada, TipoSimulacao,
  VeraMensagemEntrada, VeraMensagemSaida,
} from '@ei/contratos';
import type { Bd, Env } from '../../infra/bd';
import { gerarId } from '../../infra/bd';
import { erro, sucesso, type ServiceResponse } from '../../infra/http';
import { repositorioDecisoes, type LinhaSimulacao } from './decisoes.repositorio';

const paraSaida = (l: LinhaSimulacao): SimulacaoSaida => {
  const lerJson = (s: string) => { try { return JSON.parse(s); } catch { return {}; } };
  return {
    id: l.id,
    usuarioId: l.usuario_id,
    tipo: l.tipo as TipoSimulacao,
    premissasJson: lerJson(l.premissas_json),
    resultadoJson: lerJson(l.resultado_json),
    criadoEm: l.criado_em,
  };
};

export const servicoDecisoes = (bd: Bd, env: Env) => {
  const repo = repositorioDecisoes(bd);

  return {
    async listar(usuarioId: string): Promise<ServiceResponse<{ itens: SimulacaoSaida[] }>> {
      const linhas = await repo.listar(usuarioId);
      return sucesso({ itens: linhas.map(paraSaida) });
    },

    async obter(usuarioId: string, id: string): Promise<ServiceResponse<SimulacaoSaida>> {
      const l = await repo.buscar(usuarioId, id);
      if (!l) return erro('simulacao_nao_encontrada', 'Simulação não encontrada', 404);
      return sucesso(paraSaida(l));
    },

    async criar(usuarioId: string, e: SimulacaoCriarEntrada): Promise<ServiceResponse<SimulacaoSaida>> {
      if (!e.tipo || !e.premissasJson) return erro('dados_incompletos', 'tipo e premissas são obrigatórios', 400);
      const id = gerarId();
      await repo.inserir(
        id, usuarioId, e.tipo,
        JSON.stringify(e.premissasJson),
        JSON.stringify(e.resultadoJson ?? {}),
      );
      return this.obter(usuarioId, id);
    },

    async veraEnviarMensagem(usuarioId: string, e: VeraMensagemEntrada): Promise<ServiceResponse<VeraMensagemSaida>> {
      if (!e.mensagem?.trim()) return erro('mensagem_vazia', 'Mensagem vazia', 400);
      const conversaId = e.conversaId ?? gerarId();
      // Provedor de IA: se env.AI existir usa Cloudflare Workers AI; senão devolve resposta padrão.
      const resposta = env.AI
        ? await (async () => {
            try {
              const r = await env.AI!.run('@cf/meta/llama-3.1-8b-instruct', {
                messages: [
                  { role: 'system', content: 'Você é Vera, assistente financeira objetiva em PT-BR.' },
                  { role: 'user', content: e.mensagem },
                ],
              }) as { response?: string };
              return r.response ?? 'Sem resposta disponível no momento.';
            } catch {
              return 'Sem resposta disponível no momento.';
            }
          })()
        : 'Sem resposta disponível no momento.';

      return sucesso({
        conversaId,
        resposta,
        sugeridos: [],
        tokensEntrada: e.mensagem.length,
        tokensSaida: resposta.length,
        geradoEm: new Date().toISOString(),
      });
    },
  };
};
