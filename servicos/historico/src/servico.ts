import type { EventoRelevante, ServicoHistorico, SnapshotPatrimonio } from "@ei/contratos";
import type { RepositorioHistorico } from "./repositorio";

const LIMITE_PADRAO = 12;

export class ServicoHistoricoPadrao implements ServicoHistorico {
  constructor(private readonly repositorio: RepositorioHistorico) {}

  listarSnapshots(usuarioId: string, limite = LIMITE_PADRAO): Promise<SnapshotPatrimonio[]> {
    return this.repositorio.listarSnapshots(usuarioId, limite);
  }

  listarEventos(usuarioId: string, limite = LIMITE_PADRAO): Promise<EventoRelevante[]> {
    return this.repositorio.listarEventos(usuarioId, limite);
  }
}
