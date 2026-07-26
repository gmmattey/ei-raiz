import type {
  SimulacaoSaida, SimulacaoCriarEntrada, TipoSimulacao,
  VeraMensagemEntrada, VeraMensagemSaida, ConfiancaContextoFinanceiro,
} from '@ei/contratos';
import type { Bd, Env } from '../../infra/bd';
import { gerarId } from '../../infra/bd';
import { erro, sucesso, type ServiceResponse } from '../../infra/http';
import { repositorioDecisoes, type LinhaSimulacao } from './decisoes.repositorio';
import { servicoPatrimonio, type ContextoFinanceiroSaida } from '../patrimonio/patrimonio.servico';

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

// Busca o contexto financeiro canônico (patrimonio) de forma resiliente:
// falha de leitura (D1 fora do ar, etc.) nunca deve derrubar Vera ou
// simulações — só degrada a confiança para 'indisponivel'.
async function obterContextoFinanceiro(bd: Bd, usuarioId: string): Promise<ContextoFinanceiroSaida | null> {
  try {
    const resposta = await servicoPatrimonio(bd).contextoFinanceiro(usuarioId);
    return resposta.ok ? resposta.dados : null;
  } catch {
    return null;
  }
}

const moeda = (valor: number): string =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Prompt injeta apenas números já calculados pelo domínio patrimonio.
// A IA é instruída a nunca calcular ou estimar valores financeiros novos —
// ela interpreta e explica, não calcula (regra invioável da consolidação).
function montarPromptSistema(contexto: ContextoFinanceiroSaida | null): string {
  const base = 'Você é Vera, assistente financeira objetiva em PT-BR. '
    + 'Nunca calcule, estime ou invente valores financeiros: use exclusivamente os números fornecidos abaixo. '
    + 'Se a pergunta exigir um número que não está nos dados fornecidos, diga que essa informação não está disponível.';

  if (!contexto) {
    return `${base}\n\nDados financeiros do usuário indisponíveis no momento. Não afirme nenhum valor específico.`;
  }

  const { resumo, confianca } = contexto;
  const linhas = [
    `Patrimônio líquido: ${moeda(resumo.patrimonioLiquidoBrl)}`,
    `Patrimônio bruto: ${moeda(resumo.patrimonioBrutoBrl)}`,
    `Dívida: ${moeda(resumo.dividaBrl)}`,
    `Itens no patrimônio: ${resumo.quantidadeItens}`,
    `Score: ${resumo.scoreTotal ?? 'não calculado'}${resumo.scoreFaixa ? ` (${resumo.scoreFaixa})` : ''}`,
    `Confiança destes dados: ${confianca}`,
  ];

  return `${base}\n\nDados financeiros canônicos do usuário:\n${linhas.join('\n')}`;
}

// Resposta usada quando a IA falha, está indisponível ou não retorna texto.
// Continua grounded nos dados reais — nunca é um "erro genérico" que some
// com o acesso ao diagnóstico determinístico do usuário.
function respostaDeterministica(contexto: ContextoFinanceiroSaida | null): string {
  if (!contexto) {
    return 'Não consegui acessar seus dados financeiros agora. Seus números continuam disponíveis nas telas de Início e Carteira — tente novamente em instantes.';
  }
  if (contexto.confianca === 'sem_dados') {
    return 'Você ainda não tem itens no patrimônio. Importe seu extrato ou cadastre um item para receber uma análise.';
  }
  const { resumo, confianca } = contexto;
  const partes = [
    `Seu patrimônio líquido atual é ${moeda(resumo.patrimonioLiquidoBrl)}, com ${resumo.quantidadeItens} itens cadastrados.`,
    resumo.scoreTotal !== null
      ? `Score atual: ${resumo.scoreTotal}${resumo.scoreFaixa ? ` (${resumo.scoreFaixa})` : ''}.`
      : 'Seu score ainda não foi calculado.',
  ];
  if (confianca === 'parcial') partes.push('O score ainda está sendo processado — os números podem mudar em breve.');
  if (confianca === 'defasada') partes.push('Esses dados estão defasados: o score não é recalculado há mais de 35 dias.');
  return partes.join(' ');
}

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
      // Toda simulação é ancorada na versão do resumo patrimonial usada no
      // momento da criação — nunca em totais recalculados pelo cliente.
      const contexto = await obterContextoFinanceiro(bd, usuarioId);
      const resultadoJson = {
        ...(e.resultadoJson ?? {}),
        contextoFinanceiro: {
          versao: contexto?.versao ?? null,
          confianca: (contexto?.confianca ?? 'indisponivel') satisfies ConfiancaContextoFinanceiro,
        },
      };
      await repo.inserir(
        id, usuarioId, e.tipo,
        JSON.stringify(e.premissasJson),
        JSON.stringify(resultadoJson),
      );
      return this.obter(usuarioId, id);
    },

    async veraEnviarMensagem(usuarioId: string, e: VeraMensagemEntrada): Promise<ServiceResponse<VeraMensagemSaida>> {
      if (!e.mensagem?.trim()) return erro('mensagem_vazia', 'Mensagem vazia', 400);
      const conversaId = e.conversaId ?? gerarId();
      const contexto = await obterContextoFinanceiro(bd, usuarioId);
      const promptSistema = montarPromptSistema(contexto);

      let resposta = '';
      let baseadoEm: VeraMensagemSaida['baseadoEm'] = 'deterministico';
      // Só aciona a IA quando o contexto financeiro foi lido com sucesso
      // (mesmo que vazio). Se a leitura do patrimônio falhou, não há como
      // garantir que a IA não vai citar números velhos/errados — degrada
      // direto para a resposta determinística.
      if (env.AI && contexto) {
        try {
          const r = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [
              { role: 'system', content: promptSistema },
              { role: 'user', content: e.mensagem },
            ],
          }) as { response?: string };
          if (r.response?.trim()) {
            resposta = r.response.trim();
            baseadoEm = 'ia';
          }
        } catch {
          // IA indisponível não bloqueia a resposta — cai no fallback determinístico.
        }
      }
      if (!resposta) resposta = respostaDeterministica(contexto);

      return sucesso({
        conversaId,
        resposta,
        sugeridos: [],
        tokensEntrada: e.mensagem.length,
        tokensSaida: resposta.length,
        geradoEm: new Date().toISOString(),
        baseadoEm,
        confiancaDados: contexto?.confianca ?? 'indisponivel',
        contextoFinanceiroVersao: contexto?.versao ?? null,
      });
    },
  };
};
