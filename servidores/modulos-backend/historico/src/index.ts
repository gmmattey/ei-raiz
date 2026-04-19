export type { RepositorioHistorico } from "./repositorio";
export { RepositorioHistoricoD1 } from "./repositorio";
export { ServicoHistoricoPadrao } from "./servico";

export type { RepositorioHistoricoMensal } from "./historico-mensal";
export {
  ServicoHistoricoMensalPadrao,
  avaliarRentabilidadeMensal,
  calcularRetornosMensais,
  calcularUltimoDiaDoMes,
  extrairAnoMes,
  proximoAnoMes,
} from "./historico-mensal";
export { RepositorioHistoricoMensalD1 } from "./repositorio-historico-mensal";

export type {
  AtivoParaReconstrucao,
  ContextoReconstrucao,
  FonteDadosReconstrucao,
  RepositorioFilaReconstrucao,
} from "./reconstrucao";
export {
  ServicoReconstrucaoCarteiraPadrao,
  montarPayloadMesHistorico,
} from "./reconstrucao";
export { RepositorioFilaReconstrucaoD1 } from "./repositorio-reconstrucao";
export { FonteDadosReconstrucaoD1 } from "./fonte-dados-reconstrucao";
