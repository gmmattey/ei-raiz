export type SnapshotPatrimonio = {
  id: string;
  usuarioId: string;
  data: string;
  valorTotal: number;
  variacaoPercentual: number;
};

export type EventoRelevante = {
  id: string;
  usuarioId: string;
  data: string;
  tipo: "aporte" | "rebalanceamento" | "importacao" | "alerta";
  descricao: string;
};

export interface ServicoHistorico {
  listarSnapshots(usuarioId: string, limite?: number): Promise<SnapshotPatrimonio[]>;
  listarEventos(usuarioId: string, limite?: number): Promise<EventoRelevante[]>;
}
