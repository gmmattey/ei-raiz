// Contratos do domínio usuario — conta, preferências, plataformas vinculadas.

export interface UsuarioSaida {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface UsuarioAtualizarEntrada {
  nome?: string;
  email?: string;
}

export interface PreferenciaItem {
  chave: string;
  valor: unknown;
  atualizadoEm: string;
}

export interface PreferenciasSaida {
  itens: PreferenciaItem[];
}

export interface PreferenciasAtualizarEntrada {
  itens: { chave: string; valor: unknown }[];
}

export interface PlataformaVinculadaSaida {
  id: string;
  corretoraId: string;
  corretoraNome: string;
  status: 'ativa' | 'inativa' | 'erro';
  vinculadaEm: string;
}
