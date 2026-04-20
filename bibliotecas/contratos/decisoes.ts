// Contratos do domínio decisoes — simulações e assistente Vera.

export type TipoSimulacao = 'aporte' | 'imovel' | 'veiculo' | 'aposentadoria' | 'outro';

export interface SimulacaoSaida {
  id: string;
  usuarioId: string;
  tipo: TipoSimulacao;
  premissasJson: Record<string, unknown>;
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
}
