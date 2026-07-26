// Contratos do domínio decisoes — simulações e assistente Vera.
// Vera e simulações não têm cálculo patrimonial próprio: todo total citado
// vem do resumo canônico do domínio patrimonio (ver ContextoFinanceiroSaida
// em patrimonio.servico). Os campos de confiança/versão abaixo existem para
// que a origem e a atualidade desses dados sejam sempre explícitas.

export type TipoSimulacao = 'aporte' | 'imovel' | 'veiculo' | 'aposentadoria' | 'outro';

// Confiança do resumo patrimonial usado como base: 'sem_dados' (nenhum item
// cadastrado), 'parcial' (score ainda não calculado), 'defasada' (score com
// mais de 35 dias) ou 'atual'. 'indisponivel' é exclusivo de Vera, quando o
// próprio resumo não pôde ser lido (falha de leitura, não falta de dados).
export type ConfiancaContextoFinanceiro = 'sem_dados' | 'parcial' | 'defasada' | 'atual' | 'indisponivel';

export interface SimulacaoSaida {
  id: string;
  usuarioId: string;
  tipo: TipoSimulacao;
  premissasJson: Record<string, unknown>;
  // resultadoJson sempre carrega `contextoFinanceiro: { versao, confianca }`,
  // preenchido pelo backend a partir do resumo canônico — nunca pelo cliente.
  // Embutido no JSON (não em coluna própria) para dispensar migration.
  resultadoJson: Record<string, unknown>;
  criadoEm: string;
}

export interface SimulacaoCriarEntrada {
  tipo: TipoSimulacao;
  premissasJson: Record<string, unknown>;
  resultadoJson?: Record<string, unknown>;
}

export interface VeraMensagemEntrada {
  conversaId: string | null;
  mensagem: string;
  contextoJson?: Record<string, unknown>;
}

export interface VeraMensagemSaida {
  conversaId: string;
  resposta: string;
  sugeridos: string[];
  tokensEntrada: number;
  tokensSaida: number;
  geradoEm: string;
  // 'ia' quando o modelo respondeu; 'deterministico' quando a IA falhou,
  // está indisponível ou não retornou texto — nunca bloqueia a resposta.
  baseadoEm: 'ia' | 'deterministico';
  confiancaDados: ConfiancaContextoFinanceiro;
  contextoFinanceiroVersao: string | null;
}
