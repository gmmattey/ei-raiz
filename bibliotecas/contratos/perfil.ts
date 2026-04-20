// Contratos do domínio perfil — perfil financeiro do usuário (1:1).

export type ToleranciaRisco = 'conservador' | 'moderado' | 'arrojado';

export interface PerfilSaida {
  usuarioId: string;
  rendaMensalBrl: number | null;
  aporteMensalBrl: number | null;
  horizonteMeses: number | null;
  toleranciaRisco: ToleranciaRisco | null;
  objetivos: string[];
  atualizadoEm: string;
}

export interface PerfilAtualizarEntrada {
  rendaMensalBrl?: number | null;
  aporteMensalBrl?: number | null;
  horizonteMeses?: number | null;
  toleranciaRisco?: ToleranciaRisco | null;
  objetivos?: string[];
}
