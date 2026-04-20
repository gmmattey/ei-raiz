// Contratos do domínio admin (não público).

export interface AdminEntrarEntrada {
  email: string;
  senha: string;
}

export interface AdminUsuarioSaida {
  id: string;
  nome: string;
  email: string;
  cpf: string | null;
  criadoEm: string;
}

export interface AdminAuditoriaItem {
  id: string;
  autorEmail: string;
  acao: string;
  recurso: string | null;
  dadosJson: Record<string, unknown>;
  ocorridoEm: string;
}

export type IngestaoCvmModo = 'ingestao' | 'backfill';
export type IngestaoCvmStatus = 'pendente' | 'executando' | 'concluido' | 'falhou';

export interface AdminIngestaoCvmItem {
  id: string;
  modo: IngestaoCvmModo;
  status: IngestaoCvmStatus;
  iniciadoEm: string;
  concluidoEm: string | null;
  duracaoSegundos: number | null;
  parametrosJson: Record<string, unknown>;
  resultadoJson: Record<string, unknown>;
  erro: string | null;
}
